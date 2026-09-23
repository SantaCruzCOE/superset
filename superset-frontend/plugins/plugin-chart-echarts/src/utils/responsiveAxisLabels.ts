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

export type AxisLabelLayoutPreference = 'plot' | 'balanced' | 'labels';

type LayoutOptions = {
  labels: string[];
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
  preference: AxisLabelLayoutPreference;
  measureText?: (text: string) => number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

function createTextMeasure(fontSize: number, fontFamily?: string) {
  let context: CanvasRenderingContext2D | null = null;
  if (typeof document !== 'undefined') {
    try {
      context = document.createElement('canvas').getContext('2d');
      if (context) context.font = `${fontSize}px ${fontFamily || 'sans-serif'}`;
    } catch {
      // A canvas is unavailable in server-side rendering and some test hosts.
    }
  }
  return (text: string) =>
    context?.measureText(text).width ?? text.length * fontSize * 0.52;
}

function splitWord(
  word: string,
  width: number,
  measure: (text: string) => number,
): string[] {
  const chunks: string[] = [];
  let remaining = word;
  while (remaining && measure(remaining) > width) {
    let low = 1;
    let high = remaining.length;
    let fit = 1;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (measure(remaining.slice(0, middle)) <= width) {
        fit = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    chunks.push(remaining.slice(0, fit));
    remaining = remaining.slice(fit);
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

function wrapLabel(
  label: string,
  width: number,
  measure: (text: string) => number,
): string[] {
  const lines: string[] = [];
  label.split('\n').forEach(sourceLine => {
    const words = sourceLine.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push('');
      return;
    }
    let line = '';
    words.forEach(word => {
      splitWord(word, width, measure).forEach(token => {
        const candidate = line ? `${line} ${token}` : token;
        if (line && measure(candidate) > width) {
          lines.push(line);
          line = token;
        } else {
          line = candidate;
        }
      });
    });
    lines.push(line);
  });
  return lines;
}

function ellipsize(
  line: string,
  width: number,
  measure: (text: string) => number,
): string {
  const trimmed = line.trimEnd();
  let low = 0;
  let high = trimmed.length;
  let fit = 0;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (measure(`${trimmed.slice(0, middle).trimEnd()}…`) <= width) {
      fit = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return `${trimmed.slice(0, fit).trimEnd()}…`;
}

/** Layout only the categorical labels of a responsive horizontal bar chart. */
export function buildResponsiveAxisLabels({
  labels,
  width,
  height,
  fontSize,
  fontFamily,
  preference,
  measureText,
}: LayoutOptions) {
  const safeWidth = Math.max(320, width);
  const safeHeight = Math.max(200, height);
  const safeFontSize = clamp(fontSize, 10, 18);
  const measure = measureText ?? createTextMeasure(safeFontSize, fontFamily);
  const laneRatio =
    preference === 'labels'
      ? 0.67
      : preference === 'balanced'
        ? 0.5
        : safeWidth < 960
          ? 0.3
          : 0.25;
  const maxLabelWidth = clamp(
    Math.floor(safeWidth * laneRatio),
    Math.ceil(safeFontSize * 8),
    Math.floor(safeWidth * 0.68),
  );
  const lineHeight = Math.round(safeFontSize * 1.25);
  const maxLines = clamp(
    Math.floor(((safeHeight / Math.max(1, labels.length)) * 0.9) / lineHeight),
    1,
    2,
  );
  const longestLine = labels.reduce(
    (longest, label) =>
      Math.max(longest, ...String(label).trim().split('\n').map(measure)),
    0,
  );
  const labelWidth = clamp(
    Math.ceil(longestLine + safeFontSize * 0.4),
    Math.ceil(safeFontSize * 2.5),
    maxLabelWidth,
  );
  const format = (rawLabel: string) => {
    const label = String(rawLabel).trim();
    if (!label) return rawLabel;
    if (!label.includes('\n') && measure(label) <= labelWidth) return label;
    const lines = wrapLabel(label, labelWidth, measure);
    if (lines.length <= maxLines) return lines.join('\n');
    const visible = lines.slice(0, maxLines);
    visible[maxLines - 1] = ellipsize(
      visible[maxLines - 1],
      labelWidth,
      measure,
    );
    return visible.join('\n');
  };

  return { width: labelWidth, lineHeight, maxLines, format };
}
