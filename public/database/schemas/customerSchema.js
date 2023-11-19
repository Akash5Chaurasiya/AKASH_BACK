"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.customerSchema = new mongoose_1.default.Schema({
    customerName: {
        type: String,
    },
    code: {
        type: String,
        unique: true,
    },
    date: {
        type: Date,
    },
}, {
    timestamps: true,
});
