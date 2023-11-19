"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.AttendanceSchema = new mongoose_1.Schema({
    employeeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Employee",
    },
    date: {
        type: Date,
        default: Date.now,
    },
    punches: [
        {
            employeeId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Employee",
            },
            punchIn: {
                type: Date,
                default: null,
            },
            punchOut: {
                type: Date,
                default: null,
            },
            approvedImage: {
                type: String,
                // default: null,
            },
            punchInBy: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Employee",
                default: null,
            },
            punchOutBy: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Employee",
                default: null,
            },
            approvedBy: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Employee",
                default: null,
            },
            status: {
                type: String,
                default: "pending",
            },
        },
    ],
    workingHours: {
        type: Number,
        default: 0,
    },
    pendingHours: {
        type: Number,
        default: 0,
    },
    totalEarning: {
        type: Number,
        default: 0,
    },
    isPresent: {
        type: Boolean,
        default: false,
    },
});
