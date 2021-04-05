"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flat = void 0;
const flat = (arr) => arr.reduce((flat, next) => flat.concat(next), []);
exports.flat = flat;
