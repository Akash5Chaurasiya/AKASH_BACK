"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const barCodeSchema_1 = require("../schemas/barCodeSchema");
const BarCode = mongoose_1.default.model('BarCode', barCodeSchema_1.barCodeSchema);
exports.default = BarCode;
