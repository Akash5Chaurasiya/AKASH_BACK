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
exports.Attendance = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.Attendance = new mongoose_1.Schema({
    employeeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Employee",
    },
    date: {
        type: Date,
        default: Date.now,
    },
    approvedImage: {
        type: String,
    },
    approvedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
        default: null,
    },
    approvedTime: {
        type: Date,
        default: null,
    },
    status: {
        type: String,
        default: "pending",
    },
    shift: {
        type: String,
    },
    remarks: [
        {
            remark: String,
            by: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                // ref: "Employee",
            },
            createdAt: Date,
        },
    ],
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
        },
    ],
    totalWorking: {
        type: Number,
        default: 0
    },
    productiveHours: {
        type: Number
    },
    productionSlipNumbers: [{
            type: String
        }]
}, { timestamps: true });
