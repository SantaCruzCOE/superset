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
import { t } from '@apache-superset/core/translation';
import {
  ControlPanelsContainerProps,
  ControlSetItem,
  ControlSetRow,
  CustomControlItem,
} from '@superset-ui/chart-controls';
import {
  onlyTotalControl,
  percentageThresholdControl,
  stackControlWithoutStream,
} from '../../../controls';
import { StackControlsValue } from '../../../constants';
import { ValueLabelPosition, ValueLabelType } from '../../types';

const valueLabelTypeControl: ControlSetItem = {
  name: 'value_label_type',
  config: {
    type: 'SelectControl',
    label: t('Value label'),
    renderTrigger: true,
    clearable: false,
    default: ValueLabelType.None,
    description: t('What to display on the bars'),
    choices: [
      [ValueLabelType.None, t('None')],
      [ValueLabelType.Value, t('Value')],
      [ValueLabelType.Percentage, t('Percentage')],
      [ValueLabelType.ValueAndPercentage, t('Value and Percentage')],
    ],
    shouldMapStateToProps: () => true,
    mapStateToProps: state => {
      const formData = state.form_data as Record<string, unknown>;
      if (
        formData?.value_label_type !== undefined ||
        formData?.valueLabelType !== undefined
      ) {
        return {};
      }

      const showValueLegacy =
        Boolean(formData?.show_value) || Boolean(formData?.showValue);
      return {
        value: showValueLegacy ? ValueLabelType.Value : ValueLabelType.None,
      };
    },
  },
};

const valueLabelsAreEnabled = ({ controls }: ControlPanelsContainerProps) => {
  const valueLabelType = controls?.value_label_type?.value;
  return valueLabelType !== undefined && valueLabelType !== ValueLabelType.None;
};

const valueLabelPositionControl: ControlSetItem = {
  name: 'value_label_position',
  config: {
    type: 'SelectControl',
    label: t('Value label position'),
    renderTrigger: true,
    clearable: false,
    default: ValueLabelPosition.End,
    description: t('Where to place the value labels'),
    choices: [
      [ValueLabelPosition.End, t('End')],
      [ValueLabelPosition.Center, t('Centered')],
    ],
    visibility: valueLabelsAreEnabled,
  },
};

const baseStackControl = stackControlWithoutStream as CustomControlItem;
const stackControlWithExpand: ControlSetItem = {
  ...baseStackControl,
  config: {
    ...baseStackControl.config,
    choices: [
      ...(baseStackControl.config.choices ?? []),
      [StackControlsValue.Expand, t('Expand')],
    ],
    description: t(
      'Stack series on top of each other. Expand normalizes each x-axis value to 100%.',
    ),
  },
};

const baseOnlyTotalControl = onlyTotalControl as CustomControlItem;
const labelAwareOnlyTotalControl: ControlSetItem = {
  ...baseOnlyTotalControl,
  config: {
    ...baseOnlyTotalControl.config,
    visibility: props =>
      valueLabelsAreEnabled(props) && Boolean(props.controls?.stack?.value),
  },
};

const basePercentageThresholdControl =
  percentageThresholdControl as CustomControlItem;
const labelAwarePercentageThresholdControl: ControlSetItem = {
  ...basePercentageThresholdControl,
  config: {
    ...basePercentageThresholdControl.config,
    visibility: props =>
      valueLabelsAreEnabled(props) &&
      Boolean(props.controls?.stack?.value) &&
      !props.controls?.only_total?.value,
  },
};

export const valueLabelSection: ControlSetRow[] = [
  [valueLabelTypeControl],
  [valueLabelPositionControl],
  [stackControlWithExpand],
  [labelAwareOnlyTotalControl],
  [labelAwarePercentageThresholdControl],
];
