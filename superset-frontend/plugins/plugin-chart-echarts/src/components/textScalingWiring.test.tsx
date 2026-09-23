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
import type { EchartsMixedTimeseriesChartTransformedProps } from '../MixedTimeseries/types';
import type { PieChartTransformedProps } from '../Pie/types';
import EchartsMixedTimeseries from '../MixedTimeseries/EchartsMixedTimeseries';
import EchartsPie from '../Pie/EchartsPie';

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

test('Mixed Timeseries forwards its saved text scaling to ECharts', () => {
  const formData = { vizType: 'mixed_timeseries', textScale: 145 };
  const props = {
    formData,
    height: 400,
    width: 800,
    echartOptions: {},
    refs: {},
    selectedValues: {},
    groupby: [],
    groupbyB: [],
    labelMap: {},
    labelMapB: {},
    seriesBreakdown: 0,
  } as unknown as EchartsMixedTimeseriesChartTransformedProps;
  render(<EchartsMixedTimeseries {...props} />);
  expect(mockEchart).toHaveBeenCalledWith(
    expect.objectContaining({ formData }),
  );
});

test('Pie forwards its saved text scaling to ECharts', () => {
  const formData = { vizType: 'pie', legendTextScale: 120 };
  const props = {
    formData,
    height: 400,
    width: 800,
    echartOptions: {},
    refs: {},
    selectedValues: {},
    groupby: [],
    labelMap: {},
  } as unknown as PieChartTransformedProps;
  render(<EchartsPie {...props} />);
  expect(mockEchart).toHaveBeenCalledWith(
    expect.objectContaining({ formData }),
  );
});
