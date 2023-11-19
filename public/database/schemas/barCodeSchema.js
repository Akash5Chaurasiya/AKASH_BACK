"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.barCodeSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.barCodeSchema = new mongoose_1.default.Schema({
    employeeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee"
    },
    barCodeNumber: {
        type: String,
    },
    assignedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee"
    },
    proofPicture: {
        type: String
    }
}, {
    timestamps: true
});
