"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const workingDaySchema_1 = require("../schemas/workingDaySchema");
const workingDayModel = mongoose_1.default.model("workingDay", workingDaySchema_1.workingDaySchema);
exports.default = workingDayModel;
