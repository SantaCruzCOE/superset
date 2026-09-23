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
import transformProps from '../../../src/Timeseries/transformProps';
import { DEFAULT_FORM_DATA } from '../../../src/Timeseries/constants';
import {
  EchartsTimeseriesChartProps,
  EchartsTimeseriesSeriesType,
  OrientationType,
} from '../../../src/Timeseries/types';

const category = 'A long category label for testing responsive axis layout';
const data = [
  { school: category, enrollment: 42 },
  { school: 'Short', enrollment: 20 },
];

function axisLabel(
  formData: Record<string, unknown> = {},
  width = 320,
  height = 300,
) {
  const chartProps = new ChartProps({
    width,
    height,
    theme: supersetTheme,
    formData: {
      ...DEFAULT_FORM_DATA,
      datasource: '3__table',
      viz_type: 'echarts_timeseries_bar',
      seriesType: EchartsTimeseriesSeriesType.Bar,
      orientation: OrientationType.Horizontal,
      x_axis: 'school',
      metrics: ['enrollment'],
      xAxisForceCategorical: true,
      ...formData,
    },
    queriesData: [
      {
        data,
        colnames: ['school', 'enrollment'],
        coltypes: ['STRING', 'BIGINT'],
      },
    ],
  });
  const options = transformProps(
    chartProps as unknown as EchartsTimeseriesChartProps,
  ).echartOptions;
  return (
    formData.orientation === OrientationType.Vertical
      ? options.xAxis
      : options.yAxis
  ) as any;
}

beforeAll(() => {
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterAll(() => {
  jest.restoreAllMocks();
});

test('legacy layout stays unchanged, including saved preference alone', () => {
  const original = axisLabel().axisLabel;
  expect(axisLabel({ axisLabelLayoutPreference: 'labels' }).axisLabel).toEqual(
    original,
  );
  expect(axisLabel({ axisLabelLayoutMode: 'legacy' }).axisLabel).toEqual(
    original,
  );
  expect(original).not.toHaveProperty('width');
});

test('responsive layout wraps and centers horizontal category labels', () => {
  const responsive = axisLabel({ axisLabelLayoutMode: 'responsive' }).axisLabel;
  expect(responsive.width).toBeGreaterThan(0);
  expect(responsive.lineHeight).toBeGreaterThan(0);
  expect(responsive.hideOverlap).toBe(false);
  expect(responsive.verticalAlign).toBe('middle');
  expect(responsive.formatter('Short')).toBe('Short');
  expect(responsive.formatter(category)).toContain('\n');
});

test('resize and preference change label lane width', () => {
  const formData = { axisLabelLayoutMode: 'responsive' };
  const narrow = axisLabel(formData, 320).axisLabel;
  const wide = axisLabel(formData, 900).axisLabel;
  expect(wide.width).toBeGreaterThan(narrow.width);
  expect(narrow.verticalAlign).toBe('middle');
  expect(wide.verticalAlign).toBe('middle');
  expect(
    axisLabel({ ...formData, axisLabelLayoutPreference: 'plot' }).axisLabel
      .width,
  ).toBeLessThan(narrow.width);
  expect(
    axisLabel({ ...formData, axisLabelLayoutPreference: 'labels' }).axisLabel
      .width,
  ).toBeGreaterThan(narrow.width);
});

test('responsive setting does not alter vertical or non-bar axes', () => {
  const vertical = axisLabel({
    axisLabelLayoutMode: 'responsive',
    orientation: OrientationType.Vertical,
  }).axisLabel;
  const line = axisLabel({
    axisLabelLayoutMode: 'responsive',
    seriesType: EchartsTimeseriesSeriesType.Line,
  }).axisLabel;
  expect(vertical).not.toHaveProperty('width');
  expect(line).not.toHaveProperty('width');
});
