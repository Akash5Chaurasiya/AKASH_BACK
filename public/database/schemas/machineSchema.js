"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const machineSchema = new mongoose_1.default.Schema({
    machineName: {
        type: String,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        trim: true
    },
    process: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: "GlobalProcess" }],
    QrCode: {
        type: String
    },
    proofPicture: {
        type: String,
        required: false, // Set 'required' to 'false' to make it optional
    },
    picture: {
        type: String,
        required: false, // Set 'required' to 'false' to make it optional
    },
    logs: [{
            productionSlipId: {
                type: mongoose_1.default.Schema.Types.ObjectId
            },
            time: {
                type: Date
            }
        }]
}, {
    timestamps: true,
});
exports.default = machineSchema;
