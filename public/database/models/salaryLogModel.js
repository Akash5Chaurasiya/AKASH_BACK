"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const salaryLogSchema_1 = require("../schemas/salaryLogSchema");
const SalaryLogModel = mongoose_1.default.model('SalaryLog', salaryLogSchema_1.salaryLogSchema);
exports.default = SalaryLogModel;
