"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CNCProgramSchema = new mongoose_1.default.Schema({
    programName: {
        type: String,
        unique: true,
        trim: true
    },
    programNumber: {
        type: String,
        unique: true,
        trim: true
    },
    rawMaterialName: {
        type: String,
    },
    rawMaterialCode: {
        type: String,
    },
    rawMaterialId: {
        type: mongoose_1.default.Schema.Types.ObjectId
    },
    weight: {
        type: Number,
    },
    processName: {
        type: String,
    },
    processId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
    },
    DXF: {
        file: { type: String },
        description: {
            type: String,
        },
    },
    drawing: {
        file: { type: String },
        description: {
            type: String,
        },
    },
    status: {
        type: String,
    },
    nesting: {
        file: {
            type: String,
        },
        description: {
            type: String,
        },
    },
    scrap: {
        quantity: {
            type: Number,
        },
        unit: {
            type: String,
        },
    },
    cycleTime: {
        type: Number,
    },
    childParts: [
        {
            childPart: {
                childPartName: { type: String },
                id: { type: mongoose_1.default.Schema.Types.ObjectId },
            },
            childPartProduced: {
                type: Number,
            },
            weightPerChildPart: {
                type: Number,
            },
            weightUnit: {
                type: String,
            },
        },
    ],
    isCompleted: {
        type: Boolean,
        default: false,
    },
});
exports.default = CNCProgramSchema;
