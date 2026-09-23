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
import { t } from '@apache-superset/core/translation';
import {
  ControlPanelsContainerProps,
  ControlSetRow,
  ControlSubSectionHeader,
} from '@superset-ui/chart-controls';

export const axisLabelLayoutSection: ControlSetRow[] = [
  [
    <ControlSubSectionHeader key="horizontal-category-labels">
      {t('Horizontal category labels')}
    </ControlSubSectionHeader>,
  ],
  [
    {
      name: 'axisLabelLayoutMode',
      config: {
        type: 'RadioButtonControl',
        label: t('Axis label layout'),
        renderTrigger: true,
        default: 'legacy',
        options: [
          ['legacy', t('Legacy')],
          ['responsive', t('Responsive')],
        ],
        description: t(
          'Legacy keeps default ECharts axis labels. Responsive enables automatic wrapping for long categorical labels.',
        ),
        visibility: ({ controls }: ControlPanelsContainerProps) =>
          controls?.orientation?.value === 'horizontal',
        resetOnHide: false,
      },
    },
  ],
  [
    {
      name: 'axisLabelLayoutPreference',
      config: {
        type: 'RadioButtonControl',
        label: t('Axis/plot balance'),
        renderTrigger: true,
        default: 'balanced',
        options: [
          ['plot', t('Plot priority')],
          ['balanced', t('Balanced')],
          ['labels', t('Label priority')],
        ],
        description: t(
          'In responsive mode, controls how much horizontal space is prioritized for labels versus bars.',
        ),
        visibility: ({ controls }: ControlPanelsContainerProps) =>
          controls?.orientation?.value === 'horizontal' &&
          controls?.axisLabelLayoutMode?.value === 'responsive',
        resetOnHide: false,
      },
    },
  ],
];
