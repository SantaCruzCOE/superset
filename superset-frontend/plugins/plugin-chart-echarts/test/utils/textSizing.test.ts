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
import { applyTextScaling } from '../../src/utils/textSizing';

const options = {
  textStyle: { fontSize: 10 },
  title: [{ textStyle: { fontSize: 20 }, subtextStyle: {} }],
  legend: [
    { textStyle: { fontSize: 10 }, selectorLabel: {}, pageTextStyle: {} },
  ],
  xAxis: [{ axisLabel: { fontSize: 8 }, nameTextStyle: { fontSize: 16 } }],
  yAxis: { axisLabel: {}, nameTextStyle: {} },
};

test('keeps the original options when all controls are at their defaults', () => {
  expect(applyTextScaling(options, {})).toBe(options);
  expect(
    applyTextScaling(options, {
      textScale: 100,
      legendTextScale: 100,
      axisLabelScale: 100,
      axisTitleScale: 100,
    }),
  ).toBe(options);
});

test.each([
  [{ textScale: 150 }, [15, 15, 12, 24]],
  [{ legendTextScale: 150 }, [10, 15, 8, 16]],
  [{ axisLabelScale: 150 }, [10, 10, 12, 16]],
  [{ axisTitleScale: 150 }, [10, 10, 8, 24]],
  [
    {
      textScale: 150,
      legendTextScale: 150,
      axisLabelScale: 150,
      axisTitleScale: 150,
    },
    [15, 23, 18, 36],
  ],
])(
  'scales each control independently and in combination: %p',
  (formData, expected) => {
    const result = applyTextScaling(options, formData);
    expect([
      result.textStyle.fontSize,
      result.legend[0].textStyle.fontSize,
      result.xAxis[0].axisLabel.fontSize,
      result.xAxis[0].nameTextStyle.fontSize,
    ]).toEqual(expected);
    expect(result.title[0].textStyle.fontSize).toBe(
      'textScale' in formData && formData.textScale === 150 ? 30 : 20,
    );
    expect(options.textStyle.fontSize).toBe(10);
  },
);

test('uses the legacy 12px fallback and handles single-axis options', () => {
  const result = applyTextScaling(
    { legend: {}, xAxis: {}, yAxis: {}, title: {} },
    { textScale: '150', legendTextScale: 200, axisLabelScale: 50 },
  );
  expect(result.legend).toMatchObject({ textStyle: { fontSize: 36 } });
  expect(result.xAxis).toMatchObject({ axisLabel: { fontSize: 9 } });
  expect(result.yAxis).toMatchObject({ nameTextStyle: { fontSize: 18 } });
  expect(result.title).toMatchObject({ subtextStyle: { fontSize: 18 } });
});

test('ignores invalid input and clamps out-of-range saved values', () => {
  expect(applyTextScaling(options, { textScale: 'invalid' })).toBe(options);
  const result = applyTextScaling(
    { textStyle: { fontSize: 10 }, xAxis: { nameTextStyle: { fontSize: 12 } } },
    { textScale: 0, axisTitleScale: 1000 },
  );
  expect(result.textStyle.fontSize).toBe(1);
  expect(result.xAxis.nameTextStyle.fontSize).toBe(6);
});
