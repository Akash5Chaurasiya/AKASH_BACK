"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const scanSlipSchema_1 = require("../schemas/scanSlipSchema");
const scannedSlipModel = mongoose_1.default.model("scanedSlip", scanSlipSchema_1.scanSlipSchema);
exports.default = scannedSlipModel;
