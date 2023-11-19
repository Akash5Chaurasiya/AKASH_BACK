"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ShopSchema = new mongoose_1.default.Schema({
    shopName: {
        type: String,
        unique: true,
        required: true,
    },
    jobProfile: {
        jobProfileId: { type: mongoose_1.default.Schema.Types.ObjectId },
        jobProfileName: {
            type: String
        }
    },
    shopCode: {
        type: String,
        unique: true,
        required: true
    }
}, {
    timestamps: true
});
exports.default = ShopSchema;
