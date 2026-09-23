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
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { ControlPanelsContainerProps } from '@superset-ui/chart-controls';
import { barSizingSection } from '../src/barSizingControls';
import barPanel from '../src/Timeseries/Regular/Bar/controlPanel';
import mixedPanel from '../src/MixedTimeseries/controlPanel';
import histogramPanel from '../src/Histogram/controlPanel';
import waterfallPanel from '../src/Waterfall/controlPanel';

type BarControl = {
  name: string;
  config: {
    default: unknown;
    visibility?: (props: ControlPanelsContainerProps) => boolean;
  };
};

const items = barSizingSection
  .slice(1)
  .map(row => row[0] as unknown as BarControl);

function isVisible(index: number, mode: string, overlap: boolean): boolean {
  const visibility = items[index]?.config.visibility;
  if (!visibility) throw new Error(`Missing visibility for control ${index}`);
  return visibility({
    controls: {
      barSizingMode: { value: mode },
      barOverlapMode: { value: overlap },
    },
  } as unknown as ControlPanelsContainerProps);
}

test('preserves the five saved form-data keys and control defaults', () => {
  expect(items.map(item => item.name)).toEqual([
    'barSizingMode',
    'barCategoryGap',
    'barGap',
    'barOverlapMode',
    'barOverlapPercent',
  ]);
  expect(items.map(item => item.config.default)).toEqual([
    'auto',
    20,
    30,
    false,
    40,
  ]);
});

test('shows only the controls relevant to custom sizing and overlap', () => {
  expect([1, 2, 3, 4].map(index => isVisible(index, 'auto', false))).toEqual([
    false,
    false,
    false,
    false,
  ]);
  expect([1, 2, 3, 4].map(index => isVisible(index, 'custom', false))).toEqual([
    true,
    true,
    true,
    false,
  ]);
  expect([1, 2, 3, 4].map(index => isVisible(index, 'custom', true))).toEqual([
    true,
    false,
    true,
    true,
  ]);
});

test.each([
  ['Timeseries Bar', barPanel],
  ['Mixed Timeseries', mixedPanel],
  ['Histogram', histogramPanel],
  ['Waterfall', waterfallPanel],
])('%s includes the bar-sizing section', (_name, panel) => {
  const rows = panel.controlPanelSections?.flatMap(section =>
    typeof section === 'object' &&
    section !== null &&
    'controlSetRows' in section &&
    Array.isArray(section.controlSetRows)
      ? section.controlSetRows
      : [],
  );
  const panelItems = rows?.flatMap(row => (Array.isArray(row) ? row : []));
  items.forEach(item => expect(panelItems).toContain(item));
});
