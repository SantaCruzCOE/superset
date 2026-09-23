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
import {
  orderCategoricalData,
  parseXAxisCustomOrder,
} from '../../src/utils/categoryOrdering';

test.each([
  [
    '["North, CA", "South / East", "A.B"]',
    ['North, CA', 'South / East', 'A.B'],
  ],
  ['North\nSouth\nEast', ['North', 'South', 'East']],
  ['North, South, East', ['North', 'South', 'East']],
  [
    ['North', 'South'],
    ['North', 'South'],
  ],
  ['  North, , South\n ', ['North', 'South']],
  ['', []],
  [null, []],
])('parses a saved explicit category order: %p', (input, expected) => {
  expect(parseXAxisCustomOrder(input)).toEqual(expected);
});

test('keeps the first duplicate preference and appends unknown labels stably', () => {
  const rows = [
    { category: 'Unknown 1', value: 1 },
    { category: 'B', value: 2 },
    { category: 'A', value: 3 },
    { category: 'Unknown 2', value: 4 },
    { category: 'B', value: 5 },
  ];
  const result = orderCategoricalData(
    rows,
    'category',
    parseXAxisCustomOrder('["B", "A", "B"]'),
  );
  expect(result.map(({ value }) => value)).toEqual([2, 5, 3, 1, 4]);
  expect(rows.map(({ value }) => value)).toEqual([1, 2, 3, 4, 5]);
});

test('matches saved labels with punctuation and hidden legacy sort prefixes', () => {
  const rows = [
    { category: 'South / East', value: 1 },
    { category: '\u200BNorth, CA', value: 2 },
  ];
  expect(
    orderCategoricalData(rows, 'category', ['North, CA', 'South / East']),
  ).toEqual([rows[1], rows[0]]);
});

test('empty input leaves data untouched', () => {
  const rows = [{ category: 'A' }];
  expect(orderCategoricalData(rows, 'category', [])).toBe(rows);
  expect(orderCategoricalData(rows, '', ['A'])).toBe(rows);
});
