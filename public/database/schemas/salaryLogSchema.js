"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.salaryLogSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.salaryLogSchema = new mongoose_1.default.Schema({
    employeeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    applicableMonth: {
        type: Date,
    },
    salary: {
        type: Number,
    },
    changedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
}, {
    timestamps: true,
});
