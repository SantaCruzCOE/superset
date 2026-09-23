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
import transformProps from '../../src/Sunburst/transformProps';
import {
  DEFAULT_FORM_DATA,
  EchartsSunburstChartProps,
} from '../../src/Sunburst/types';
import { mergeEchartsThemeOverrides } from '../../src/utils/themeOverrides';

test('Sunburst labels have no outline at the series or filtered child level', () => {
  const props = new ChartProps({
    width: 500,
    height: 400,
    theme: supersetTheme,
    formData: {
      ...DEFAULT_FORM_DATA,
      viz_type: 'sunburst_v2',
      datasource: '3__table',
      columns: ['genre', 'platform'],
      metric: 'count',
      showLabels: true,
    },
    queriesData: [
      {
        data: [
          { genre: 'Adventure', platform: 'Wii', count: 10 },
          { genre: 'Adventure', platform: 'PS4', count: 20 },
          { genre: 'Strategy', platform: 'Wii', count: 30 },
        ],
        colnames: ['genre', 'platform', 'count'],
        coltypes: [1, 1, 0],
      },
    ],
    filterState: { selectedValues: ['Adventure,Wii'] },
  });
  const options = transformProps(props as unknown as EchartsSunburstChartProps)
    .echartOptions as {
    series: Array<{
      label: { textBorderWidth: number };
      data: Array<{
        children?: Array<{ label?: { textBorderWidth: number } }>;
      }>;
    }>;
  };
  expect(options.series[0].label.textBorderWidth).toBe(0);
  expect(options.series[0].data).toHaveLength(2);
  const filteredChild = options.series[0].data
    .flatMap(node => node.children ?? [])
    .find(node => node.label);
  expect(filteredChild?.label?.textBorderWidth).toBe(0);
  const styled = mergeEchartsThemeOverrides<{
    series: typeof options.series;
  }>(options, { series: { label: { textBorderWidth: 0 } } });
  expect(styled.series[0].data).toEqual(options.series[0].data);
  expect(styled.series[0].label.textBorderWidth).toBe(0);
});
