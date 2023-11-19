"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const masterBomSchema_1 = require("../schemas/masterBomSchema");
const bomModel = mongoose_1.default.model("Bom", masterBomSchema_1.bomSchema);
exports.default = bomModel;
