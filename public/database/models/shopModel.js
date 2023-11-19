"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shopSchema_1 = __importDefault(require("../schemas/shopSchema"));
const mongoose_1 = __importDefault(require("mongoose"));
const ShopModel = mongoose_1.default.model("shop", shopSchema_1.default);
exports.default = ShopModel;
