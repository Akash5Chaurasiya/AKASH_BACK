"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const v2AttendanceSchema_1 = require("../schemas/v2AttendanceSchema");
const v2AttendanceModel = mongoose_1.default.model("v2Attendance", v2AttendanceSchema_1.Attendance);
exports.default = v2AttendanceModel;
