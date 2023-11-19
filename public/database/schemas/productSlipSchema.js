"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const productSlipSchema = new mongoose_1.default.Schema({
    EmployeeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    jobProfileId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "JobProfile",
    },
    fixed1: {
        type: String,
    },
    fixed2: {
        type: String,
    },
    newFields: [
        {
            fieldName: {
                type: String,
            },
            fieldValue: {
                type: String,
            },
        },
    ],
});
exports.default = productSlipSchema;
