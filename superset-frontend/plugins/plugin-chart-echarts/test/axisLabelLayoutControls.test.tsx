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
import { ControlPanelsContainerProps } from '@superset-ui/chart-controls';
import { axisLabelLayoutSection } from '../src/axisLabelLayoutControls';
import barPanel from '../src/Timeseries/Regular/Bar/controlPanel';

const controls = axisLabelLayoutSection.slice(1).map(row => row[0] as any);

test('preserves the saved keys and defaults in the Bar panel', () => {
  expect(controls.map(control => control.name)).toEqual([
    'axisLabelLayoutMode',
    'axisLabelLayoutPreference',
  ]);
  expect(controls.map(control => control.config.default)).toEqual([
    'legacy',
    'balanced',
  ]);
  const rows = barPanel.controlPanelSections?.flatMap(section =>
    typeof section === 'object' &&
    section !== null &&
    'controlSetRows' in section
      ? (section.controlSetRows ?? [])
      : [],
  );
  controls.forEach(control =>
    expect(rows?.flatMap(row => (Array.isArray(row) ? row : []))).toContain(
      control,
    ),
  );
});

test('shows balance only for responsive horizontal bars', () => {
  const visible = (orientation: string, mode: string) =>
    controls.map(control =>
      control.config.visibility({
        controls: {
          orientation: { value: orientation },
          axisLabelLayoutMode: { value: mode },
        },
      } as unknown as ControlPanelsContainerProps),
    );
  expect(visible('vertical', 'responsive')).toEqual([false, false]);
  expect(visible('horizontal', 'legacy')).toEqual([true, false]);
  expect(visible('horizontal', 'responsive')).toEqual([true, true]);
});
