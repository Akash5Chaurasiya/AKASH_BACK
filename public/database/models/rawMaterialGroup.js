"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const rawMaterialGroupSchema_1 = __importDefault(require("../schemas/rawMaterialGroupSchema"));
const rawMaterialGroupModel = mongoose_1.default.model("RawMaterialGroup", rawMaterialGroupSchema_1.default);
exports.default = rawMaterialGroupModel;
