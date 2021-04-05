export const average = (values: number[]) =>
  values.reduce((p, c) => p + c, 0) / values.length;

export const median = (values: number[]) => {
  const half = Math.floor(values.length / 2);

  values.sort((a, b) => a - b);

  if (values.length % 2) {
    return values[half];
  }

  return (values[half - 1] + values[half]) / 2;
};

export const quartile = (values: number[], percentile: number) => {
  values.sort((a, b) => a - b);

  const pos = (values.length - 1) * percentile;
  const base = Math.floor(pos);
  const rest = pos - base;

  if (values[base + 1] !== undefined) {
    return values[base] + rest * (values[base + 1] - values[base]);
  }

  return values[base];
};

export const jitter = (values: number[]) =>
  average(values.map((value, i, arr) => Math.abs(value - arr[i + 1])));
