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
import transformProps from '../../src/Histogram/transformProps';
import { HistogramChartProps } from '../../src/Histogram/types';
import { mergeEchartsThemeOverrides } from '../../src/utils/themeOverrides';

test('Histogram theme removes outlines without replacing generated bar series', () => {
  const props = new ChartProps({
    width: 500,
    height: 300,
    theme: supersetTheme,
    formData: {
      viz_type: 'histogram_v2',
      datasource: '3__table',
      column: 'amount',
      groupby: ['school'],
      normalize: false,
      showLegend: true,
      showValue: true,
      xAxisFormat: 'SMART_NUMBER',
      yAxisFormat: 'SMART_NUMBER',
    },
    queriesData: [
      {
        data: [
          { school: 'A', '0 - 10': 2, '10 - 20': 3 },
          { school: 'B', '0 - 10': 4, '10 - 20': 5 },
        ],
      },
    ],
  });
  const options = transformProps(
    props as unknown as HistogramChartProps,
  ).echartOptions;
  const styled = mergeEchartsThemeOverrides<{
    series: Array<{ data: number[]; label: { textBorderWidth: number } }>;
  }>(options, { series: { label: { textBorderWidth: 0 } } });

  expect(styled.series).toHaveLength(2);
  expect(styled.series.map(series => series.data)).toEqual([
    [2, 3],
    [4, 5],
  ]);
  styled.series.forEach(series => expect(series.label.textBorderWidth).toBe(0));
});
