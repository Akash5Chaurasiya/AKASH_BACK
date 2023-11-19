"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CNCProgramLogSchema = new mongoose_1.default.Schema({
    CNCProgramId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "CNCProgram",
    },
    logNumber: {
        type: String,
        unique: true,
        trim: true
    },
    processName: {
        type: String
    },
    processId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
    },
    weight: { type: Number },
    programName: { type: String },
    rawMaterialName: { type: String },
    rawMaterialCode: { type: String },
    nesting: {
        file: { type: String },
        description: { type: String }
    },
    DXF: {
        file: { type: String },
        description: { type: String },
    },
    drawing: {
        file: { type: String },
        description: { type: String },
    },
    startTime: {
        type: Date,
    },
    endTime: {
        type: Date,
    },
    sheetConsumed: {
        type: Number,
    },
    cycleTimeAsProgram: {
        type: Number,
    },
    currentCycleTime: {
        type: Number,
    },
    programLogNumber: {
        type: String,
    },
    employees: [
        {
            employeeId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Employee",
            },
            employeeName: {
                type: String,
            },
        },
    ],
    machines: [
        {
            machineId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "machine",
            },
            machineName: {
                type: String,
            },
        },
    ],
    productionSlipNumber: [String],
    by: {
        name: {
            type: String,
        },
        id: {
            type: mongoose_1.default.Schema.Types.ObjectId,
        },
    },
}, {
    timestamps: true,
});
exports.default = CNCProgramLogSchema;
