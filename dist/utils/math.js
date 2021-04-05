"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jitter = exports.quartile = exports.median = exports.average = void 0;
const average = (values) => values.reduce((p, c) => p + c, 0) / values.length;
exports.average = average;
const median = (values) => {
    const half = Math.floor(values.length / 2);
    values.sort((a, b) => a - b);
    if (values.length % 2) {
        return values[half];
    }
    return (values[half - 1] + values[half]) / 2;
};
exports.median = median;
const quartile = (values, percentile) => {
    values.sort((a, b) => a - b);
    const pos = (values.length - 1) * percentile;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (values[base + 1] !== undefined) {
        return values[base] + rest * (values[base + 1] - values[base]);
    }
    return values[base];
};
exports.quartile = quartile;
const jitter = (values) => exports.average(values.map((value, i, arr) => Math.abs(value - arr[i + 1])));
exports.jitter = jitter;
