"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const shopLogSchema_1 = __importDefault(require("../schemas/shopLogSchema"));
const ShopLogModel = mongoose_1.default.model("ShopLog", shopLogSchema_1.default);
exports.default = ShopLogModel;
