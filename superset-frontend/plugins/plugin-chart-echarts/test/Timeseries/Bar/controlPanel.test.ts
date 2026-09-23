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
import { ControlPanelsContainerProps } from '@superset-ui/chart-controls/types';
import { GenericDataType } from '@apache-superset/core/common';
import controlPanel from '../../../src/Timeseries/Regular/Bar/controlPanel';
import {
  StackControlOptionsWithoutStream,
  StackControlsValue,
} from '../../../src/constants';
import {
  OrientationType,
  ValueLabelPosition,
  ValueLabelType,
} from '../../../src/Timeseries/types';

const config = controlPanel;

const getControl = (controlName: string) => {
  for (const section of config.controlPanelSections) {
    if (section && section.controlSetRows) {
      for (const row of section.controlSetRows) {
        for (const control of row) {
          if (
            typeof control === 'object' &&
            control !== null &&
            'name' in control &&
            control.name === controlName
          ) {
            return control;
          }
        }
      }
    }
  }

  return null;
};

// Mock getStandardizedControls
jest.mock('@superset-ui/chart-controls', () => {
  const actual = jest.requireActual('@superset-ui/chart-controls');
  return {
    ...actual,
    getStandardizedControls: jest.fn(() => ({
      popAllMetrics: jest.fn(() => []),
      popAllColumns: jest.fn(() => []),
    })),
  };
});

test('should include x_axis_time_format control in the panel', () => {
  const timeFormatControl = getControl('x_axis_time_format');
  expect(timeFormatControl).toBeDefined();
});

test('should have correct default value for x_axis_time_format', () => {
  const timeFormatControl: any = getControl('x_axis_time_format');
  expect(timeFormatControl).toBeDefined();
  expect(timeFormatControl.config).toBeDefined();
  expect(timeFormatControl.config.default).toBe('smart_date');
});

test('should have visibility function for x_axis_time_format', () => {
  const timeFormatControl: any = getControl('x_axis_time_format');
  expect(timeFormatControl).toBeDefined();
  expect(timeFormatControl.config.visibility).toBeDefined();
  expect(typeof timeFormatControl.config.visibility).toBe('function');
});

test('should have proper control configuration for x_axis_time_format', () => {
  const timeFormatControl: any = getControl('x_axis_time_format');
  expect(timeFormatControl).toBeDefined();
  expect(timeFormatControl.config).toMatchObject({
    default: 'smart_date',
    disableStash: true,
    resetOnHide: false,
  });
  expect(timeFormatControl.config.description).toContain('D3');
});

test('should have Chart Orientation section', () => {
  const orientationSection = config.controlPanelSections.find(
    section => section && section.label === 'Chart Orientation',
  );
  expect(orientationSection).toBeDefined();
  expect(orientationSection!.expanded).toBe(true);
});

test('should have Chart Options section with X Axis controls', () => {
  const chartOptionsSection = config.controlPanelSections.find(
    section => section && section.label === 'Chart Options',
  );
  expect(chartOptionsSection).toBeDefined();
  expect(chartOptionsSection!.expanded).toBe(true);
  expect(chartOptionsSection!.controlSetRows).toBeDefined();
  expect(chartOptionsSection!.controlSetRows!.length).toBeGreaterThan(0);
});

test('should have proper form data overrides', () => {
  expect(config.formDataOverrides).toBeDefined();
  expect(typeof config.formDataOverrides).toBe('function');

  const mockFormData = {
    datasource: '1__table',
    viz_type: 'echarts_timeseries_bar',
    metrics: ['test_metric'],
    groupby: ['test_column'],
    other_field: 'test',
  };

  const result = config.formDataOverrides!(mockFormData);

  expect(result).toHaveProperty('metrics');
  expect(result).toHaveProperty('groupby');
  expect(result).toHaveProperty('other_field', 'test');
});

test('should include stack control in the panel', () => {
  const stackControl = getControl('stack');
  expect(stackControl).toBeDefined();
});

describe('value label controls', () => {
  const valueLabelTypeControl: any = getControl('value_label_type');
  const valueLabelPositionControl: any = getControl('value_label_position');
  const onlyTotalControl: any = getControl('only_total');
  const percentageThresholdControl: any = getControl('percentage_threshold');

  test('replaces the legacy show value checkbox with all supported modes', () => {
    expect(getControl('show_value')).toBeNull();
    expect(valueLabelTypeControl).toBeDefined();
    expect(valueLabelTypeControl.config.default).toBe(ValueLabelType.None);
    expect(
      valueLabelTypeControl.config.choices.map(([value]: [string]) => value),
    ).toEqual([
      ValueLabelType.None,
      ValueLabelType.Value,
      ValueLabelType.Percentage,
      ValueLabelType.ValueAndPercentage,
    ]);
  });

  test.each([
    [{ show_value: true }, ValueLabelType.Value],
    [{ showValue: true }, ValueLabelType.Value],
    [{ show_value: false }, ValueLabelType.None],
    [{}, ValueLabelType.None],
  ])('maps legacy form data %p to %s', (formData, expected) => {
    expect(
      valueLabelTypeControl.config.mapStateToProps({ form_data: formData }),
    ).toEqual({ value: expected });
  });

  test.each([
    { value_label_type: ValueLabelType.Percentage, show_value: true },
    { valueLabelType: ValueLabelType.ValueAndPercentage, showValue: true },
  ])('does not overwrite an explicit value label mode', formData => {
    expect(
      valueLabelTypeControl.config.mapStateToProps({ form_data: formData }),
    ).toEqual({});
  });

  test('offers end and centered positions with end as the default', () => {
    expect(valueLabelPositionControl).toBeDefined();
    expect(valueLabelPositionControl.config.default).toBe(
      ValueLabelPosition.End,
    );
    expect(
      valueLabelPositionControl.config.choices.map(
        ([value]: [ValueLabelPosition]) => value,
      ),
    ).toEqual([ValueLabelPosition.End, ValueLabelPosition.Center]);
  });

  test('shows the position control only when value labels are enabled', () => {
    expect(
      valueLabelPositionControl.config.visibility({
        controls: {
          value_label_type: { value: ValueLabelType.None },
        },
      }),
    ).toBe(false);
    expect(
      valueLabelPositionControl.config.visibility({
        controls: {
          value_label_type: { value: ValueLabelType.Value },
        },
      }),
    ).toBe(true);
    expect(
      valueLabelPositionControl.config.visibility({ controls: {} }),
    ).toBe(false);
  });

  test('shows stacked-label controls only when labels are enabled', () => {
    const props = (valueLabelType: ValueLabelType, onlyTotal = false) =>
      ({
        controls: {
          value_label_type: { value: valueLabelType },
          stack: { value: StackControlsValue.Stack },
          only_total: { value: onlyTotal },
        },
      }) as unknown as ControlPanelsContainerProps;

    expect(onlyTotalControl.config.visibility(props(ValueLabelType.None))).toBe(
      false,
    );
    expect(
      onlyTotalControl.config.visibility({
        controls: { stack: { value: StackControlsValue.Stack } },
      }),
    ).toBe(false);
    expect(
      onlyTotalControl.config.visibility(props(ValueLabelType.Value)),
    ).toBe(true);
    expect(
      percentageThresholdControl.config.visibility(
        props(ValueLabelType.Percentage),
      ),
    ).toBe(true);
    expect(
      percentageThresholdControl.config.visibility(
        props(ValueLabelType.Percentage, true),
      ),
    ).toBe(false);
  });
});

test('should use StackControlOptionsWithoutStream for stack control', () => {
  const stackControl: any = getControl('stack');
  expect(stackControl).toBeDefined();
  expect(stackControl.config).toBeDefined();
  expect(stackControl.config.choices).toBe(StackControlOptionsWithoutStream);
});

test('should not include Stream option in stack control choices', () => {
  const stackControl: any = getControl('stack');
  expect(stackControl).toBeDefined();
  const { choices } = stackControl.config;
  const streamOption = choices.find(
    (choice: any[]) => choice[0] === StackControlsValue.Stream,
  );
  expect(streamOption).toBeUndefined();
});

test('should include None and Stack options in stack control choices', () => {
  const stackControl: any = getControl('stack');
  expect(stackControl).toBeDefined();
  const { choices } = stackControl.config;
  const noneOption = choices.find((choice: any[]) => choice[0] === null);
  const stackOption = choices.find(
    (choice: any[]) => choice[0] === StackControlsValue.Stack,
  );
  expect(noneOption).toBeDefined();
  expect(stackOption).toBeDefined();
});

test('should have correct default value for stack control', () => {
  const stackControl: any = getControl('stack');
  expect(stackControl).toBeDefined();
  expect(stackControl.config.default).toBe(null);
});

test('should reset stack to null when formData has Stream value', () => {
  const mockFormData = {
    datasource: '1__table',
    viz_type: 'echarts_timeseries_bar',
    metrics: ['test_metric'],
    groupby: ['test_column'],
    stack: StackControlsValue.Stream,
  };

  const result = config.formDataOverrides!(mockFormData);

  expect(result.stack).toBe(null);
});

test('should preserve stack value when formData has Stack value', () => {
  const mockFormData = {
    datasource: '1__table',
    viz_type: 'echarts_timeseries_bar',
    metrics: ['test_metric'],
    groupby: ['test_column'],
    stack: StackControlsValue.Stack,
  };

  const result = config.formDataOverrides!(mockFormData);

  expect(result.stack).toBe(StackControlsValue.Stack);
});

test('should preserve stack value when formData has null value', () => {
  const mockFormData = {
    datasource: '1__table',
    viz_type: 'echarts_timeseries_bar',
    metrics: ['test_metric'],
    groupby: ['test_column'],
    stack: null,
  };

  const result = config.formDataOverrides!(mockFormData);

  expect(result.stack).toBe(null);
});

test('should preserve stack value when formData does not have stack property', () => {
  const mockFormData = {
    datasource: '1__table',
    viz_type: 'echarts_timeseries_bar',
    metrics: ['test_metric'],
    groupby: ['test_column'],
  };

  const result = config.formDataOverrides!(mockFormData);

  expect(result).not.toHaveProperty('stack');
});

// x_axis_number_format visibility tests

const mockBarControls = (
  xAxisColumn: string | null,
  typeGeneric: GenericDataType | null,
  orientation: string = OrientationType.Vertical,
): ControlPanelsContainerProps => {
  const columns =
    xAxisColumn && typeGeneric !== null
      ? [{ column_name: xAxisColumn, type_generic: typeGeneric }]
      : [];

  return {
    controls: {
      // @ts-expect-error
      x_axis: {
        value: xAxisColumn,
      },
      // @ts-expect-error
      orientation: {
        value: orientation,
      },
      // @ts-expect-error
      datasource: {
        datasource: { columns },
      },
    },
  };
};

const numberFormatControl: any = getControl('x_axis_number_format');
const timeFormatControl: any = getControl('x_axis_time_format');

test('should include x_axis_number_format control in the panel', () => {
  expect(numberFormatControl).toBeDefined();
});

test('x_axis_number_format should be visible for numeric columns in vertical orientation', () => {
  const visibilityFn = numberFormatControl?.config?.visibility;
  expect(visibilityFn(mockBarControls('year', GenericDataType.Numeric))).toBe(
    true,
  );
  expect(visibilityFn(mockBarControls('price', GenericDataType.Numeric))).toBe(
    true,
  );
});

test('x_axis_number_format should be hidden for time columns', () => {
  const visibilityFn = numberFormatControl?.config?.visibility;
  expect(visibilityFn(mockBarControls('date', GenericDataType.Temporal))).toBe(
    false,
  );
});

test('x_axis_number_format should be hidden for non-numeric columns', () => {
  const visibilityFn = numberFormatControl?.config?.visibility;
  expect(visibilityFn(mockBarControls('name', GenericDataType.String))).toBe(
    false,
  );
  expect(visibilityFn(mockBarControls('flag', GenericDataType.Boolean))).toBe(
    false,
  );
});

test('x_axis_time_format should be hidden for numeric columns', () => {
  const visibilityFn = timeFormatControl?.config?.visibility;
  expect(visibilityFn(mockBarControls('year', GenericDataType.Numeric))).toBe(
    false,
  );
});
