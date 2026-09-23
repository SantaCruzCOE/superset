<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Santa Cruz COE Superset 6.1 patch stack

This branch starts at Apache Superset's lightweight `6.1.0` tag,
`c83fb2bb1dcfac41ac51bcebd82471f4a7180d18`. The tag is not an annotated
signed tag. Verify the base commit when rebuilding or rebasing this stack; do
not claim tag-signature provenance.

The owner for each patch is the Santa Cruz COE Superset maintainers. These
patches preserve saved chart form-data contracts; removing one requires evidence
from an isolated metadata clone, not just a passing unit test. Commit hashes
below identify local, unpublished commits on `sccoe/6.1`.

| Commit | User-facing purpose | Focused regression tests | Upstream replacement criterion |
| --- | --- | --- | --- |
| `b329d5a5ae` | Preserve bar value and percentage label modes, including the saved mode and `show_value` fallback. | `test/Timeseries/Bar/controlPanel.test.ts`, `test/Timeseries/transformProps.test.ts`, `test/Timeseries/transformers.test.ts` | Upstream supplies the same modes, fallback, and saved form-data behavior for ordinary, stacked, horizontal, negative, null, and filtered bars. |
| `428dab2d31` | Preserve centered and end-positioned bar value labels. | Same three Timeseries tests above. | Upstream exposes equivalent saved position controls and renders positive, negative, stacked, and horizontal labels identically. |
| `8e564c96bf` | Preserve `stack=Expand` bar charts, normalized labels and totals, and raw-count tooltips. | The three Timeseries tests above and `test/utils/series.test.ts`. | Upstream handles the exact `Expand` form value and all chart, label, total, and tooltip cases without a conversion that would alter saved charts. |
| `146b071c9f` | Preserve global, legend, axis-label, and axis-title text-scale controls across ECharts charts. | `src/Timeseries/EchartsTimeseries.test.tsx`, `src/components/textScalingWiring.test.tsx`, `test/utils/textSizing.test.ts`. | Upstream preserves all four camelCase form-data keys and equivalent rendering in Timeseries, Mixed Timeseries, and other affected ECharts plugins. |
| `d3395a9917` | Preserve data-driven bar width, category/bar gaps, and overlap controls. | `src/components/barSizingWiring.test.tsx`, `test/barSizingControls.test.tsx`, `test/utils/barSizing.test.ts`. | Upstream preserves the five saved sizing/overlap keys, active-series sizing, and enabled overlap, including the absent-`barGap` default. |
| `f3b897c7b8` | Preserve responsive horizontal category labels, wrapping, ellipsis, and plot balance. | `test/Timeseries/Bar/responsiveAxisLabels.test.ts`, `test/axisLabelLayoutControls.test.tsx`, `test/utils/responsiveAxisLabels.test.ts`. | Upstream preserves both saved layout keys and equivalent narrow/wide rendering without changing legacy mode. |
| `fd6ffff507` | Preserve explicit categorical ordering via `x_axis_custom_order`. | `test/Timeseries/categoryOrdering.test.ts`, `test/categoryOrderControl.test.ts`, `test/utils/categoryOrdering.test.ts`. | Upstream supports the exact saved order contract and handles unknown, repeated, and punctuated labels alongside its `x_axis_sort` fields. |
| `6f401096b3` | Remove Sunburst outlines from explicit filtered-node labels; retain Histogram and Sunburst theme-merge regression coverage. | `test/Sunburst/readability.test.ts`, `test/Histogram/readability.test.ts`. | Upstream renders filtered Sunburst labels without the outline and the configuration repository's light/dark chart-specific overrides remain effective. |

All relative test paths in the table begin at
`superset-frontend/plugins/plugin-chart-echarts/`. The corresponding light and
dark Sunburst/Histogram theme overrides live in the separate `superset-config`
repository's `superset_config.py` (`ba8d78a`). The unused category-order-column
control was intentionally not ported.

Before retiring any patch, run its focused tests, the full ECharts suite, and
the saved-chart parity checks against an isolated, access-restricted metadata
clone. Verify chart rendering, edit/save, and export/import in both themes where
applicable. A source commit or test pass alone is not production parity.

## Build status

This patch inventory is not an image release. The fork Dockerfile selects
Node `22.23.2` for the frontend stage (matching the declared `^22.22.0`
engine) and Python `3.12.14` for the lean runtime. Superset 6.1 declares Python
3.12 support, but the full source build, connector installation, `pip check`,
runtime imports, and non-root startup have not yet been verified for this
combination. The legacy configuration repository Dockerfile fetches a 6.0
archive and overlays source files; it must not be used to build this fork.

The credentials-free `SCCOE Superset 6.1 validation` workflow runs on pushes
to `sccoe/6.1`. It tests the ECharts patch stack and builds the fork's lean
`linux/amd64` image on a hosted runner. It neither publishes an image nor
deploys a release. Passing this early gate does not validate production
connectors, runtime configuration, or the metadata migration.
