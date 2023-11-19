"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const GodownSchema = new mongoose_1.default.Schema({
    godownName: {
        type: String,
        unique: true,
    },
    godownCode: {
        type: String,
        unique: true,
    },
}, {
    timestamps: true,
});
exports.default = GodownSchema;
