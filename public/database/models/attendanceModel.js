"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const attendanceSchema_1 = require("../schemas/attendanceSchema");
const attendanceModel = (0, mongoose_1.model)("Attendance", attendanceSchema_1.AttendanceSchema);
exports.default = attendanceModel;
