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
  ControlSubSectionHeader,
} from '@superset-ui/chart-controls';

const barSizingModeControl: ControlSetItem = {
  name: 'barSizingMode',
  config: {
    type: 'RadioButtonControl',
    label: t('Bar sizing'),
    renderTrigger: true,
    default: 'auto',
    options: [
      ['auto', t('Auto')],
      ['custom', t('Custom')],
    ],
    description: t(
      'Use automatic bar sizing, or customize gaps to control bar thickness.',
    ),
  },
};

const barCategoryGapControl: ControlSetItem = {
  name: 'barCategoryGap',
  config: {
    type: 'SliderControl',
    label: t('Category gap (%)'),
    renderTrigger: true,
    min: 0,
    max: 90,
    step: 5,
    default: 20,
    description: t(
      'Gap between categories (bar groups). Lower values make bars thicker.',
    ),
    visibility: ({ controls }: ControlPanelsContainerProps) =>
      controls?.barSizingMode?.value === 'custom',
  },
};

const barGapControl: ControlSetItem = {
  name: 'barGap',
  config: {
    type: 'SliderControl',
    label: t('Series gap (%)'),
    renderTrigger: true,
    min: 0,
    max: 90,
    step: 1,
    default: 30,
    description: t(
      'Gap between bar series within the same category. Lower values make bars thicker.',
    ),
    visibility: ({ controls }: ControlPanelsContainerProps) =>
      controls?.barSizingMode?.value === 'custom' &&
      !controls?.barOverlapMode?.value,
  },
};

const barOverlapModeControl: ControlSetItem = {
  name: 'barOverlapMode',
  config: {
    type: 'CheckboxControl',
    label: t('Overlap mode'),
    renderTrigger: true,
    default: false,
    description: t(
      'Allow bar series in the same category to overlap for much thicker bars.',
    ),
    visibility: ({ controls }: ControlPanelsContainerProps) =>
      controls?.barSizingMode?.value === 'custom',
  },
};

const barOverlapPercentControl: ControlSetItem = {
  name: 'barOverlapPercent',
  config: {
    type: 'SliderControl',
    label: t('Overlap amount (%)'),
    renderTrigger: true,
    min: 1,
    max: 95,
    step: 1,
    default: 40,
    description: t(
      'How much bar series overlap. Higher values create thicker bars.',
    ),
    visibility: ({ controls }: ControlPanelsContainerProps) =>
      controls?.barSizingMode?.value === 'custom' &&
      Boolean(controls?.barOverlapMode?.value),
  },
};

export const barSizingSection: ControlSetRow[] = [
  [
    <ControlSubSectionHeader key="bar-sizing">
      {t('Bars')}
    </ControlSubSectionHeader>,
  ],
  [barSizingModeControl],
  [barCategoryGapControl],
  [barGapControl],
  [barOverlapModeControl],
  [barOverlapPercentControl],
];
