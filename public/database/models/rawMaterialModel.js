"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const rawMaterialSchema_1 = __importDefault(require("../schemas/rawMaterialSchema"));
const RawMaterialModel = mongoose_1.default.model("RawMaterial", rawMaterialSchema_1.default);
exports.default = RawMaterialModel;
