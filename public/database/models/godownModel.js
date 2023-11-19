"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const GodownSchema_1 = __importDefault(require("../schemas/GodownSchema"));
const GodownModel = mongoose_1.default.model("Godown", GodownSchema_1.default);
exports.default = GodownModel;
