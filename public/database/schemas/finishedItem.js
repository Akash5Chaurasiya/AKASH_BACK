"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const FinishedItemSchema = new mongoose_1.default.Schema({
    itemName: {
        type: String,
        unique: true,
        trim: true,
    },
    MCode: {
        type: String,
        unique: true,
        trim: true,
    },
    partCode: {
        type: String,
        unique: true,
        trim: true,
    },
    status: {
        type: String,
    },
    bomCompleted: {
        type: Boolean,
        default: false,
    },
    finishItemGroups: [
        {
            groupId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
            },
            groupName: {
                type: String,
            },
        },
    ],
    masterBom: [
        {
            childPart: {
                id: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "ChildPart" },
                childPartName: { type: String },
            },
            process: {
                id: { type: mongoose_1.default.Schema.Types.ObjectId },
                processName: { type: String },
            },
            quantity: {
                type: Number,
                default: 1,
            },
        },
    ],
    customer: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "customer",
    },
    numberOfProcess: {
        type: Number,
    },
}, {
    timestamps: true
});
exports.default = FinishedItemSchema;
