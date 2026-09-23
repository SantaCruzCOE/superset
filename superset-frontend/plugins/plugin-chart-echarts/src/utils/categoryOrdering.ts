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

const SORT_PREFIX =
  /^[\u00A0\u202F\u2000-\u200A\u3000\u200B-\u200F\u2060\uFEFF]+/;

function categoryKey(value: unknown): string {
  return String(value ?? '').replace(SORT_PREFIX, '');
}

/** Parse the existing saved text field without altering labels in the result. */
export function parseXAxisCustomOrder(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }
  if (typeof value !== 'string' || !value.trim()) return [];

  const trimmed = value.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Free-form newline and comma lists are also supported by saved charts.
  }
  return trimmed
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

/** Known categories follow the saved order; unknown categories retain input order. */
export function orderCategoricalData<T extends Record<string, unknown>>(
  data: T[],
  categoryColumn: string,
  requestedOrder: string[],
): T[] {
  if (!categoryColumn || requestedOrder.length === 0) return data;

  const positions = new Map<string, number>();
  requestedOrder.forEach(label => {
    const key = categoryKey(label);
    if (!positions.has(key)) positions.set(key, positions.size);
  });

  return data
    .map((row, index) => ({
      row,
      index,
      position: positions.get(categoryKey(row[categoryColumn])) ?? Infinity,
    }))
    .sort((left, right) =>
      left.position === right.position
        ? left.index - right.index
        : left.position - right.position,
    )
    .map(({ row }) => row);
}
