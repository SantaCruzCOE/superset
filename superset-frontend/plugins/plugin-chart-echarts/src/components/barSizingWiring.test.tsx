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
import { render, cleanup } from '../../../../spec/helpers/testing-library';
import type { EchartsProps } from '../types';
import type { HistogramTransformedProps } from '../Histogram/types';
import type { WaterfallChartTransformedProps } from '../Waterfall/types';
import Histogram from '../Histogram/Histogram';
import EchartsWaterfall from '../Waterfall/EchartsWaterfall';

const mockEchart = jest.fn<void, [EchartsProps]>();

jest.mock('./Echart', () => ({
  __esModule: true,
  default: (props: EchartsProps) => {
    mockEchart(props);
    return null;
  },
}));

afterEach(() => {
  cleanup();
  mockEchart.mockClear();
});

test('Histogram passes saved sizing options to the shared ECharts renderer', () => {
  const formData = {
    vizType: 'histogram',
    barSizingMode: 'custom',
    barGap: 80,
  };
  const props = {
    formData,
    height: 400,
    width: 800,
    echartOptions: { series: [{ type: 'bar', data: [1, 2] }] },
    refs: {},
    onFocusedSeries: jest.fn(),
  } as unknown as HistogramTransformedProps;
  render(<Histogram {...props} />);
  expect(mockEchart).toHaveBeenCalledWith(
    expect.objectContaining({ formData }),
  );
});

test('Waterfall passes saved overlap options to the shared ECharts renderer', () => {
  const formData = {
    vizType: 'waterfall',
    barSizingMode: 'custom',
    barOverlapMode: true,
  };
  const props = {
    formData,
    height: 400,
    width: 800,
    echartOptions: { series: [{ type: 'bar', data: [1, 2] }] },
    refs: {},
  } as unknown as WaterfallChartTransformedProps;
  render(<EchartsWaterfall {...props} />);
  expect(mockEchart).toHaveBeenCalledWith(
    expect.objectContaining({ formData }),
  );
});
