"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workingDaySchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.workingDaySchema = new mongoose_1.default.Schema({
    year: Number,
    month: [
        {
            monthName: {
                type: String,
                unique: true,
                trim: true,
            },
            workingDay: {
                type: Number,
                trim: true,
            },
            createdAt: Date,
            updatedAt: Date,
        },
    ],
});
