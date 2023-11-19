"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const trainingSchema_1 = require("../schemas/trainingSchema");
const TrainingModel = mongoose_1.default.model("Training", trainingSchema_1.trainingSchema);
exports.default = TrainingModel;
