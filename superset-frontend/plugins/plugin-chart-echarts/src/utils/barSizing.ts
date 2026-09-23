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
import { cloneDeep, isPlainObject } from 'lodash';

type OptionObject = Record<string, unknown>;

function isOptionObject(value: unknown): value is OptionObject {
  return isPlainObject(value);
}

function toPercent(
  value: unknown,
  minimum: number,
  maximum: number,
): number | undefined {
  const number =
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '')
      ? Number(value)
      : NaN;
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : undefined;
}

function isActiveDatum(value: unknown, horizontal: boolean): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'string') return Number.isFinite(Number(value));
  if (Array.isArray(value)) {
    // Timeseries bars encode [category, value], or [value, category] horizontally.
    // A numeric category alone must not make a null-valued bar active.
    return value.length === 2
      ? isActiveDatum(value[horizontal ? 0 : 1], horizontal)
      : value.some(item => isActiveDatum(item, horizontal));
  }
  if (isOptionObject(value) && 'value' in value) {
    return isActiveDatum(value.value, horizontal);
  }
  return false;
}

function isBarSeries(value: unknown): value is OptionObject {
  return isOptionObject(value) && value.type === 'bar';
}

function getBarSeries(series: unknown): OptionObject[] {
  const entries = Array.isArray(series) ? series : [series];
  return entries.filter(isBarSeries);
}

function getMaxActiveSeriesPerCategory(
  barSeries: OptionObject[],
  horizontal: boolean,
): number {
  const maximumLength = Math.max(
    0,
    ...barSeries.map(series =>
      Array.isArray(series.data) ? series.data.length : 0,
    ),
  );
  let maximumActive = 0;
  for (let index = 0; index < maximumLength; index += 1) {
    const activeCount = barSeries.filter(series =>
      isActiveDatum(
        Array.isArray(series.data) ? series.data[index] : undefined,
        horizontal,
      ),
    ).length;
    maximumActive = Math.max(maximumActive, activeCount);
  }
  return maximumActive;
}

function getBarWidthPercent(
  activeBarsPerCategory: number,
  categoryGapPercent: number,
  barGapPercent: number,
): number {
  const activeCount = Math.max(1, activeBarsPerCategory);
  const categoryFillPercent = Math.max(1, 100 - categoryGapPercent);
  const gapRatio = barGapPercent / 100;
  const denominator = activeCount + (activeCount - 1) * gapRatio;
  if (!Number.isFinite(denominator) || denominator <= 0) {
    return categoryFillPercent;
  }
  return Math.max(1, Math.min(100, categoryFillPercent / denominator));
}

/** Apply SCCOE's saved bar controls to the generated ECharts series. */
export function applyBarSizing<T extends object>(
  echartOptions: T,
  formData: object = {},
): T {
  const values = formData as Record<string, unknown>;
  if (String(values.barSizingMode ?? 'auto') !== 'custom') {
    return echartOptions;
  }

  const categoryGap = toPercent(values.barCategoryGap, 0, 90) ?? 20;
  // Keep the transform fallback in sync with the visible control's default.
  const barGap = toPercent(values.barGap, 0, 90) ?? 30;
  const overlap = Boolean(values.barOverlapMode);
  const overlapPercent = toPercent(values.barOverlapPercent, 1, 95) ?? 40;

  if (categoryGap === 20 && barGap === 30 && !overlap) {
    return echartOptions;
  }

  const originalSeries = getBarSeries(
    (echartOptions as Record<string, unknown>).series,
  );
  if (originalSeries.length === 0) {
    return echartOptions;
  }

  const activeCount = getMaxActiveSeriesPerCategory(
    originalSeries,
    values.orientation === 'horizontal',
  );
  const baseWidth = getBarWidthPercent(activeCount, categoryGap, barGap);
  const effectiveGap = overlap ? -Math.abs(overlapPercent) : barGap;
  const width = overlap ? baseWidth * (1 + overlapPercent / 100) : baseWidth;

  const next = cloneDeep(echartOptions);
  getBarSeries((next as Record<string, unknown>).series).forEach(series => {
    series.barGap = `${Math.round(effectiveGap)}%`;
    series.barWidth = `${Math.round(width)}%`;
  });
  return next;
}
