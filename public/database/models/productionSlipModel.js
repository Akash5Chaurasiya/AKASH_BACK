"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const productionSilpSchema_1 = require("../schemas/productionSilpSchema");
const mongoose_1 = __importDefault(require("mongoose"));
const ProductionSlipModel = mongoose_1.default.model("ProductionSlip", productionSilpSchema_1.productionSlipSchema);
exports.default = ProductionSlipModel;
