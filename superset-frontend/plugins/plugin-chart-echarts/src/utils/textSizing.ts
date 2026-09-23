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

const DEFAULT_FONT_SIZE = 12;

function toScale(value: unknown): number {
  const percent =
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '')
      ? Number(value)
      : NaN;
  return Number.isFinite(percent)
    ? Math.min(500, Math.max(10, percent)) / 100
    : 1;
}

function scaleFontSize(value: unknown, scale: number): number {
  const parsed =
    typeof value === 'number' ||
    (typeof value === 'string' && value.trim() !== '')
      ? Number(value)
      : NaN;
  const current = Number.isFinite(parsed) ? parsed : DEFAULT_FONT_SIZE;
  return Math.max(1, Math.round(current * scale));
}

type OptionObject = Record<string, any>;

function isOptionObject(value: unknown): value is OptionObject {
  return isPlainObject(value);
}

function scaleStyle(option: OptionObject, key: string, scale: number): void {
  if (scale === 1) return;
  const style = isOptionObject(option[key]) ? option[key] : {};
  style.fontSize = scaleFontSize(style.fontSize, scale);
  option[key] = style;
}

function applyToOneOrMany(
  value: unknown,
  apply: (option: OptionObject) => void,
): void {
  const entries = Array.isArray(value) ? value : [value];
  entries.forEach(entry => {
    if (isOptionObject(entry)) apply(entry);
  });
}

/** Preserve the four SCCOE camelCase chart-form controls without mutating input. */
export function applyTextScaling<T extends object>(
  echartOptions: T,
  formData: object = {},
): T {
  const values = formData as Record<string, unknown>;
  const globalScale = toScale(values.textScale);
  const legendScale = globalScale * toScale(values.legendTextScale);
  const axisLabelScale = globalScale * toScale(values.axisLabelScale);
  const axisTitleScale = globalScale * toScale(values.axisTitleScale);

  if (
    globalScale === 1 &&
    legendScale === 1 &&
    axisLabelScale === 1 &&
    axisTitleScale === 1
  ) {
    return echartOptions;
  }

  const next = cloneDeep(echartOptions) as OptionObject;
  scaleStyle(next, 'textStyle', globalScale);
  applyToOneOrMany(next.title, title => {
    scaleStyle(title, 'textStyle', globalScale);
    scaleStyle(title, 'subtextStyle', globalScale);
  });
  applyToOneOrMany(next.legend, legend => {
    scaleStyle(legend, 'textStyle', legendScale);
    scaleStyle(legend, 'selectorLabel', legendScale);
    scaleStyle(legend, 'pageTextStyle', legendScale);
  });
  [next.xAxis, next.yAxis].forEach(axis =>
    applyToOneOrMany(axis, item => {
      scaleStyle(item, 'axisLabel', axisLabelScale);
      scaleStyle(item, 'nameTextStyle', axisTitleScale);
    }),
  );
  return next as T;
}
