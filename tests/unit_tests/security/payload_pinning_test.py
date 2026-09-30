# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
"""
SCCOE: embedded guests and anonymous users may only run the queries of saved
dashboard charts and of native filters within their filter configuration.
"""

# pylint: disable=invalid-name, unused-argument, redefined-outer-name

from types import SimpleNamespace
from typing import Any

import pytest
from flask_login import AnonymousUserMixin
from pytest_mock import MockerFixture

from superset.common.query_context_factory import QueryContextFactory
from superset.common.query_object import QueryObject
from superset.exceptions import SupersetSecurityException
from superset.extensions import appbuilder
from superset.security.manager import (
    legacy_viz_modified,
    native_filter_query_modified,
    query_context_modified,
    SupersetSecurityManager,
)
from superset.utils import json
from superset.utils.core import override_user

TARGET = "district_name"
SORT_METRIC = "sum_students"


@pytest.fixture
def dashboard() -> SimpleNamespace:
    """A dashboard with one select filter on `district_name`."""
    return SimpleNamespace(
        json_metadata=json.dumps(
            {
                "native_filter_configuration": [
                    {
                        "id": "NATIVE_FILTER-district",
                        "filterType": "filter_select",
                        "targets": [{"datasetId": 1, "column": {"name": TARGET}}],
                        "controlValues": {"sortMetric": SORT_METRIC},
                    }
                ]
            }
        )
    )


def native_filter_request(
    mocker: MockerFixture, **query: Any
) -> Any:  # a QueryContext test double
    query_context = mocker.MagicMock()
    query_context.slice_ = None
    query_context.form_data = {
        "type": "NATIVE_FILTER",
        "native_filter_id": "NATIVE_FILTER-district",
        "dashboardId": 7,
    }
    query_context.queries = [QueryObject(**query)]  # type: ignore
    return query_context


def minmax(aggregate: str, column: str) -> dict[str, Any]:
    return {
        "expressionType": "SIMPLE",
        "aggregate": aggregate,
        "column": {"column_name": column},
        "label": f"{aggregate.lower()}",
    }


def test_factory_finds_saved_chart_without_base_filter(mocker: MockerFixture) -> None:
    """The saved chart must be found for guests so the payload check runs."""
    find_by_id = mocker.patch(
        "superset.common.query_context_factory.ChartDAO.find_by_id"
    )
    QueryContextFactory()._get_slice(42)
    find_by_id.assert_called_once_with(42, skip_base_filter=True)


def test_request_without_saved_chart_is_modified(mocker: MockerFixture) -> None:
    """Drill-to-detail, drill-by, and ad hoc requests have no saved chart."""
    query_context = mocker.MagicMock()
    query_context.slice_ = None
    query_context.form_data = {"dashboardId": 7}
    assert query_context_modified(query_context)


def test_native_filter_without_dashboard_is_modified(
    mocker: MockerFixture,
) -> None:
    query_context = native_filter_request(mocker, columns=[TARGET])
    assert query_context_modified(query_context, None)


def test_native_filter_within_configuration(
    mocker: MockerFixture, dashboard: SimpleNamespace
) -> None:
    for query in (
        {"columns": [TARGET]},
        {
            "columns": [TARGET],
            "metrics": [SORT_METRIC],
            "orderby": [(SORT_METRIC, False)],
        },
        {"columns": [TARGET], "orderby": [(TARGET, True)]},
        {"columns": [], "metrics": [minmax("MIN", TARGET), minmax("MAX", TARGET)]},
        {"columns": [], "metrics": []},
    ):
        query_context = native_filter_request(mocker, **query)
        assert not query_context_modified(query_context, dashboard), query


def test_native_filter_asking_for_more_is_modified(
    mocker: MockerFixture, dashboard: SimpleNamespace
) -> None:
    for query in (
        {"columns": [TARGET, "student_name"]},
        {"columns": ["student_name"]},
        {"columns": [TARGET], "metrics": ["count"]},
        {"columns": [], "metrics": [minmax("SUM", TARGET)]},
        {"columns": [], "metrics": [minmax("MAX", "gpa")]},
        {"columns": [TARGET], "orderby": [("gpa", False)]},
    ):
        query_context = native_filter_request(mocker, **query)
        assert query_context_modified(query_context, dashboard), query


def test_unknown_native_filter_is_modified(
    mocker: MockerFixture, dashboard: SimpleNamespace
) -> None:
    query_context = native_filter_request(mocker, columns=[TARGET])
    query_context.form_data["native_filter_id"] = "NATIVE_FILTER-other"
    assert native_filter_query_modified(query_context, dashboard)


def saved_chart_request(mocker: MockerFixture, columns: list[str]) -> Any:
    query_context = mocker.MagicMock()
    query_context.slice_.id = 42
    # Charts saved from Explore store the query context the frontend sends.
    query_context.slice_.query_context = json.dumps(
        {"queries": [{"columns": [TARGET], "metrics": [SORT_METRIC]}]}
    )
    query_context.slice_.params_dict = {"groupby": [TARGET], "metrics": [SORT_METRIC]}
    query_context.form_data = {"slice_id": 42, "groupby": columns}
    query_context.queries = [QueryObject(columns=columns)]  # type: ignore
    return query_context


def test_anonymous_user_cannot_modify_payload(
    mocker: MockerFixture, app_context: None
) -> None:
    sm = SupersetSecurityManager(appbuilder)
    mocker.patch.object(sm, "can_access", return_value=True)
    tampered = saved_chart_request(mocker, [TARGET, "student_name"])
    with override_user(AnonymousUserMixin()):
        assert sm.is_payload_restricted_user()
        with pytest.raises(SupersetSecurityException):
            sm.raise_for_access(query_context=tampered)


def test_anonymous_user_can_run_saved_payload(
    mocker: MockerFixture, app_context: None
) -> None:
    sm = SupersetSecurityManager(appbuilder)
    mocker.patch.object(sm, "can_access", return_value=True)
    mocker.patch.object(sm, "can_access_schema", return_value=True)
    unmodified = saved_chart_request(mocker, [TARGET])
    with override_user(AnonymousUserMixin()):
        sm.raise_for_access(query_context=unmodified)


def test_signed_in_user_is_not_payload_restricted(
    mocker: MockerFixture, app_context: None
) -> None:
    sm = SupersetSecurityManager(appbuilder)
    user = mocker.MagicMock(is_anonymous=False, is_guest_user=False)
    with override_user(user):
        assert not sm.is_payload_restricted_user()


def legacy_viz(mocker: MockerFixture, form_data: dict[str, Any], stored: Any) -> Any:
    query = mocker.patch("superset.db.session.query")
    query.return_value.filter.return_value.one_or_none.return_value = stored
    return SimpleNamespace(form_data=form_data, datasource=SimpleNamespace(id=1))


def test_legacy_viz_matching_saved_chart(mocker: MockerFixture) -> None:
    stored = SimpleNamespace(
        datasource_id=1,
        params_dict={"all_columns": ["lat", "lon"], "metric": "count"},
    )
    viz = legacy_viz(
        mocker, {"slice_id": 42, "all_columns": ["lat"], "metric": "count"}, stored
    )
    assert not legacy_viz_modified(viz)  # type: ignore


def test_legacy_viz_changing_columns_is_modified(mocker: MockerFixture) -> None:
    stored = SimpleNamespace(datasource_id=1, params_dict={"all_columns": ["lat"]})
    viz = legacy_viz(
        mocker, {"slice_id": 42, "all_columns": ["lat", "student_name"]}, stored
    )
    assert legacy_viz_modified(viz)  # type: ignore


def test_legacy_viz_without_saved_chart_is_modified(mocker: MockerFixture) -> None:
    viz = legacy_viz(mocker, {"all_columns": ["lat"]}, None)
    assert legacy_viz_modified(viz)  # type: ignore
