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
import { xAxisCustomOrderControl } from '../src/categoryOrderControl';
import barPanel from '../src/Timeseries/Regular/Bar/controlPanel';
import linePanel from '../src/Timeseries/Regular/Line/controlPanel';

const control = xAxisCustomOrderControl as unknown as {
  name: string;
  config: {
    default: string;
    visibility: (props: ControlPanelsContainerProps) => boolean;
  };
};

test('retains the exact saved key, empty default, and X-axis visibility', () => {
  expect(control.name).toBe('x_axis_custom_order');
  expect(control.config.default).toBe('');
  const visible = control.config.visibility;
  expect(typeof visible).toBe('function');
  expect(
    visible?.({
      controls: { x_axis: { value: 'school' } },
    } as unknown as ControlPanelsContainerProps),
  ).toBe(true);
  expect(
    visible?.({
      controls: { x_axis: { value: null } },
    } as unknown as ControlPanelsContainerProps),
  ).toBe(false);
});

test.each([
  ['Bar', barPanel],
  ['Line', linePanel],
])(
  '%s keeps the control in its query section without an order-column control',
  (_name, panel) => {
    const query = panel.controlPanelSections?.find(
      section => section && section.label === 'Query',
    );
    const controls = query?.controlSetRows?.flatMap(row =>
      Array.isArray(row) ? row : [],
    );
    expect(controls).toContain(xAxisCustomOrderControl);
    expect(controls).not.toContainEqual(
      expect.objectContaining({ name: 'x_axis_custom_order_column' }),
    );
  },
);
