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
import { buildResponsiveAxisLabels } from '../../src/utils/responsiveAxisLabels';

const measureText = (text: string) => text.length * 8;
const longLabel = 'A long category label for testing responsive axis layout';

function layout(overrides: Record<string, unknown> = {}) {
  return buildResponsiveAxisLabels({
    labels: [longLabel, 'Short'],
    width: 320,
    height: 300,
    fontSize: 12,
    preference: 'balanced',
    measureText,
    ...overrides,
  });
}

test('keeps fitting labels on one line and wraps longer labels by words', () => {
  const result = layout();
  expect(result.format('Short')).toBe('Short');
  expect(result.format('A long category label')).toBe('A long category\nlabel');
  expect(result.format('')).toBe('');
});

test('ellipsizes whenever row density hides remaining lines', () => {
  const result = layout({ labels: Array(25).fill(longLabel), height: 200 });
  expect(result.maxLines).toBe(1);
  expect(result.format(longLabel)).toMatch(/…$/);
  expect(measureText(result.format(longLabel))).toBeLessThanOrEqual(
    result.width,
  );
});

test('splits a long word without exceeding the label lane', () => {
  const result = layout();
  const lines = result.format('Supercalifragilisticexpialidocious').split('\n');
  expect(lines.length).toBeLessThanOrEqual(2);
  lines.forEach(line =>
    expect(measureText(line)).toBeLessThanOrEqual(result.width),
  );
});

test('resizes the lane and preserves the requested plot/label balance', () => {
  const narrow = layout();
  const wide = layout({ width: 900 });
  expect(wide.width).toBeGreaterThan(narrow.width);
  expect(wide.format(longLabel).split('\n').length).toBeLessThanOrEqual(2);
  expect(layout({ preference: 'plot' }).width).toBeLessThan(narrow.width);
  expect(layout({ preference: 'labels' }).width).toBeGreaterThan(narrow.width);
});

test('never uses more than two lines as available row height changes', () => {
  expect(
    layout({ height: 200, labels: Array(20).fill(longLabel) }).maxLines,
  ).toBe(1);
  expect(layout({ height: 500 }).maxLines).toBe(2);
});
