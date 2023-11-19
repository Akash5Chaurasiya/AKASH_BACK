"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const machineQrCodeSchema_1 = __importDefault(require("../schemas/machineQrCodeSchema"));
const MachineQrCodeModel = mongoose_1.default.model("machineQrLogs", machineQrCodeSchema_1.default);
exports.default = MachineQrCodeModel;
