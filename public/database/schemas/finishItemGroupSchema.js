"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.finishItemGroupSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.finishItemGroupSchema = new mongoose_1.default.Schema({
    groupName: {
        type: String,
        unique: true,
        trim: true
    },
    groupDescription: {
        type: String
    }
}, {
    timestamps: true
});
