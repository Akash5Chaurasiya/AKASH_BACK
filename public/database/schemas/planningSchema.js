"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PlanningSchema = new mongoose_1.default.Schema({
    finishedItemId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "FinishedItem",
    },
    finishedItemName: {
        type: String
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
    },
    minimumInventory: {
        type: Number,
    },
    month: {
        type: Date,
    },
    dates: [
        {
            date: {
                type: Date,
            },
            day: {
                type: String,
            },
            orderValue: {
                type: Number,
                default: 0
            },
            dispatchValue: {
                type: Number,
                default: 0
            },
            by: [{
                    date: { type: Date },
                    employeeId: { type: mongoose_1.default.Schema.Types.ObjectId },
                    name: { type: String },
                    orderValue: {
                        type: Number
                    }
                }],
        },
    ],
}, {
    timestamps: true
});
exports.default = PlanningSchema;
