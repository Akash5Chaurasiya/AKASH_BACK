"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanSlipSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.scanSlipSchema = new mongoose_1.default.Schema({
    date: String,
    shift: String,
    shop: [
        {
            shop: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'shop',
            },
            shopName: String,
            scannedSlip: [String],
            registered: {
                type: Number,
                default: 0
            },
            manual: {
                type: Number,
                default: 0
            },
        },
    ],
}, {
    timestamps: true,
});
