"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const loginHistroy_1 = require("../schemas/loginHistroy");
const loginHistoryModel = mongoose_1.default.model("loginHistory", loginHistroy_1.loginHistorySchema);
exports.default = loginHistoryModel;
