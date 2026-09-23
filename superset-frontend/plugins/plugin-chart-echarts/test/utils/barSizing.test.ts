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
import { applyBarSizing } from '../../src/utils/barSizing';

const twoBars = {
  series: [
    { type: 'bar', data: [4, 0], name: 'A' },
    { type: 'bar', data: [-2, 3], name: 'B' },
  ],
};

test('keeps auto mode and custom defaults equivalent, including an absent gap', () => {
  expect(applyBarSizing(twoBars, {})).toBe(twoBars);
  expect(applyBarSizing(twoBars, { barSizingMode: 'auto' })).toBe(twoBars);
  expect(applyBarSizing(twoBars, { barSizingMode: 'custom' })).toBe(twoBars);
  expect(
    applyBarSizing(twoBars, {
      barSizingMode: 'custom',
      barCategoryGap: 20,
      barGap: 30,
      barOverlapMode: false,
    }),
  ).toBe(twoBars);
});

test('calculates responsive width from category and series gaps', () => {
  const result = applyBarSizing(twoBars, {
    barSizingMode: 'custom',
    barCategoryGap: 10,
    barGap: 80,
  });
  expect(result.series).toMatchObject([
    { barGap: '80%', barWidth: '32%' },
    { barGap: '80%', barWidth: '32%' },
  ]);
  expect(twoBars.series[0]).not.toHaveProperty('barWidth');
});

test('counts only active bars per category, including positive and negative values', () => {
  const sparse = {
    series: [
      { type: 'bar', data: [1, null, { value: -2 }] },
      { type: 'bar', data: [null, [1, 0], undefined] },
      { type: 'line', data: [5, 6, 7] },
    ],
  };
  const result = applyBarSizing(sparse, {
    barSizingMode: 'custom',
    barCategoryGap: 10,
    barGap: 30,
  });
  expect(result.series[0]).toMatchObject({ barGap: '30%', barWidth: '90%' });
  expect(result.series[1]).toMatchObject({ barGap: '30%', barWidth: '90%' });
  expect(result.series[2]).toEqual(sparse.series[2]);
});

test('uses the maximum concurrent active series, not the number of bar series', () => {
  const threeBars = {
    series: [
      { type: 'bar', data: [1, null] },
      { type: 'bar', data: [-1, 2] },
      { type: 'bar', data: [null, 3] },
    ],
  };
  const result = applyBarSizing(threeBars, {
    barSizingMode: 'custom',
    barCategoryGap: 20,
    barGap: 0,
  });
  expect(result.series).toMatchObject([
    { barGap: '0%', barWidth: '40%' },
    { barGap: '0%', barWidth: '40%' },
    { barGap: '0%', barWidth: '40%' },
  ]);
});

test.each([
  [
    'vertical',
    [
      [1000, 1],
      [2000, null],
    ],
    [
      [1000, null],
      [2000, -2],
    ],
  ],
  [
    'horizontal',
    [
      [1, 1000],
      [null, 2000],
    ],
    [
      [null, 1000],
      [-2, 2000],
    ],
  ],
])(
  'ignores null-valued %s Timeseries bar coordinates',
  (orientation, first, second) => {
    const result = applyBarSizing(
      {
        series: [
          { type: 'bar', data: first },
          { type: 'bar', data: second },
        ],
      },
      { barSizingMode: 'custom', barCategoryGap: 10, orientation },
    );
    expect(result.series).toMatchObject([
      { barWidth: '90%' },
      { barWidth: '90%' },
    ]);
  },
);

test('enables overlap with a negative ECharts gap and a wider bar', () => {
  const result = applyBarSizing(twoBars, {
    barSizingMode: 'custom',
    barOverlapMode: true,
  });
  expect(result.series).toMatchObject([
    { barGap: '-40%', barWidth: '49%' },
    { barGap: '-40%', barWidth: '49%' },
  ]);
});

test('honors an explicit overlap amount and numeric-string controls', () => {
  const result = applyBarSizing(twoBars, {
    barSizingMode: 'custom',
    barCategoryGap: '20',
    barGap: '30',
    barOverlapMode: true,
    barOverlapPercent: '70',
  });
  expect(result.series[0]).toMatchObject({ barGap: '-70%', barWidth: '59%' });
});

test('handles a single bar series and leaves non-bar options unchanged', () => {
  const single = { series: { type: 'bar', data: [1, 2] } };
  expect(
    applyBarSizing(single, { barSizingMode: 'custom', barCategoryGap: 0 }),
  ).toEqual({
    series: { type: 'bar', data: [1, 2], barGap: '30%', barWidth: '100%' },
  });
  const line = { series: [{ type: 'line', data: [1, 2] }] };
  expect(applyBarSizing(line, { barSizingMode: 'custom' })).toBe(line);
});
