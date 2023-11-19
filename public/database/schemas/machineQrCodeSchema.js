"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const machineQrCodeSchema = new mongoose_1.default.Schema({
    machine: {
        machineName: {
            type: String,
        },
        id: {
            type: mongoose_1.default.Schema.Types.ObjectId,
        },
    },
    AssignBy: {
        type: mongoose_1.default.Schema.Types.ObjectId
    },
    QrCode: {
        type: String,
    },
    date: {
        type: Date,
    },
    proofPicture: {
        type: String,
        required: false, // Set 'required' to 'false' to make it optional
    },
});
exports.default = machineQrCodeSchema;
