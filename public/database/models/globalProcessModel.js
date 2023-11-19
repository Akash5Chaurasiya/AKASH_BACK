"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const globalProcessSchema_1 = require("../schemas/globalProcessSchema");
const globalProcessModel = mongoose_1.default.model("GlobalProcess", globalProcessSchema_1.globalProcessSchema);
exports.default = globalProcessModel;
