"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.leaveSchema = new mongoose_1.default.Schema({
    employeeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee"
    },
    appliedDate: {
        type: Date
    },
    appliedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee"
    },
    from: {
        type: Date
    },
    to: {
        type: Date
    },
    message: {
        type: String
    },
    status: {
        type: String
    },
    acceptedDate: {
        type: Date
    },
    acceptedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    rejectedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    rejectedDate: {
        type: Date
    },
    rejectedReason: {
        type: String
    },
    approvedDate: {
        type: Date
    },
    gatePassDate: {
        type: Date
    },
    gatePassTime: {
        type: String
    },
});
