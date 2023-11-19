"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const catchErrorAsync = (func) => (req, resp, next) => {
    Promise.resolve(func(req, resp, next)).catch(next);
};
exports.default = catchErrorAsync;
