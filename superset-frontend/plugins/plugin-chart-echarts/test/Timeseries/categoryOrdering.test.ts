/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ChartProps } from '@superset-ui/core';
import { supersetTheme } from '@apache-superset/core/theme';
import { GenericDataType } from '@apache-superset/core/common';
import transformProps from '../../src/Timeseries/transformProps';
import { DEFAULT_FORM_DATA } from '../../src/Timeseries/constants';
import {
  EchartsTimeseriesChartProps,
  EchartsTimeseriesSeriesType,
  OrientationType,
} from '../../src/Timeseries/types';

const rows = [
  { school: 'Other', enrollment: 9, attendance: 10 },
  { school: 'North, CA', enrollment: 30, attendance: 50 },
  { school: 'South / East', enrollment: 20, attendance: 40 },
];

function seriesData(formData: Record<string, unknown> = {}) {
  const chartProps = new ChartProps({
    width: 600,
    height: 300,
    theme: supersetTheme,
    formData: {
      ...DEFAULT_FORM_DATA,
      datasource: '3__table',
      viz_type: 'echarts_timeseries_bar',
      seriesType: EchartsTimeseriesSeriesType.Bar,
      orientation: OrientationType.Vertical,
      x_axis: 'school',
      metrics: ['enrollment'],
      xAxisForceCategorical: true,
      ...formData,
    },
    queriesData: [
      {
        data: rows,
        colnames: ['school', 'enrollment', 'attendance'],
        coltypes: [
          GenericDataType.String,
          GenericDataType.Numeric,
          GenericDataType.Numeric,
        ],
      },
    ],
  });
  const result = transformProps(
    chartProps as unknown as EchartsTimeseriesChartProps,
  );
  return result.echartOptions.series as Array<{
    name: string;
    data: Array<[unknown, unknown]>;
  }>;
}

test('uses the saved snake-case key and leaves unspecified categories last', () => {
  const series = seriesData({
    x_axis_custom_order: '["South / East", "North, CA"]',
  });
  expect(series[0].data.map(point => point[0])).toEqual([
    'South / East',
    'North, CA',
    'Other',
  ]);
});

test('explicit order overrides 6.1 multi-series x_axis_sort without misaligning values', () => {
  const upstreamSort = seriesData({
    metrics: ['enrollment', 'attendance'],
    x_axis_sort: 'sum',
    x_axis_sort_asc: true,
  });
  expect(upstreamSort[0].data.map(point => point[0])).toEqual([
    'Other',
    'South / East',
    'North, CA',
  ]);
  const series = seriesData({
    metrics: ['enrollment', 'attendance'],
    x_axis_custom_order: '["South / East", "North, CA"]',
    x_axis_sort: 'sum',
    x_axis_sort_asc: true,
  });
  expect(series).toHaveLength(2);
  series.forEach(entry =>
    expect(entry.data.map(point => point[0])).toEqual([
      'South / East',
      'North, CA',
      'Other',
    ]),
  );
  const valuesBySeries = Object.fromEntries(
    series.map(entry => [entry.name, entry.data.map(point => point[1])]),
  );
  expect(valuesBySeries).toEqual({
    attendance: [40, 50, 10],
    enrollment: [20, 30, 9],
  });
});

test('works for horizontal bars and lines, but not non-categorical axes', () => {
  const horizontal = seriesData({
    x_axis_custom_order: '["South / East", "North, CA"]',
    orientation: OrientationType.Horizontal,
  });
  expect(horizontal[0].data.map(point => point[1])).toEqual([
    'South / East',
    'North, CA',
    'Other',
  ]);

  const line = seriesData({
    x_axis_custom_order: '["South / East", "North, CA"]',
    seriesType: EchartsTimeseriesSeriesType.Line,
  });
  expect(line[0].data.map(point => point[0])).toEqual([
    'South / East',
    'North, CA',
    'Other',
  ]);

  const numeric = seriesData({
    x_axis_custom_order: '20,9,30',
    x_axis: 'enrollment',
    metrics: ['attendance'],
    seriesType: EchartsTimeseriesSeriesType.Line,
    xAxisForceCategorical: false,
  });
  expect(numeric[0].data.map(point => point[0])).toEqual(
    rows.map(row => row.enrollment),
  );
});

test('empty order leaves the upstream series order unchanged', () => {
  const baseline = seriesData().map(series => series.data);
  expect(
    seriesData({ x_axis_custom_order: '' }).map(series => series.data),
  ).toEqual(baseline);
});
