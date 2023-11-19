"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalProcessSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.globalProcessSchema = new mongoose_1.default.Schema({
    processName: {
        type: String,
        unique: true,
    },
    processCode: {
        type: String,
        unique: true,
    },
    // departmentId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Department",
    // },
    shop: {
        shopId: {
            type: mongoose_1.default.Schema.Types.ObjectId
        },
        shopName: {
            type: String
        }
    }
}, { timestamps: true });
