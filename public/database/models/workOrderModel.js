"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const workOrderSchema_1 = require("../schemas/workOrderSchema");
const workOrderModel = mongoose_1.default.model("workOrder", workOrderSchema_1.workOrderSchema);
exports.default = workOrderModel;
