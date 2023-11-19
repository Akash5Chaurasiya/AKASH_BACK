"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const quizSchema = new mongoose_1.default.Schema({
    question: {
        type: String,
        required: true,
    },
    options: [
        {
            type: String,
            required: true,
        },
    ],
    correctAnswer: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        required: true,
    },
    jobProfileId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "JobProfile"
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee"
    }
}, {
    timestamps: true
});
exports.default = quizSchema;
