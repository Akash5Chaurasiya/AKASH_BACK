"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const customerSchema_1 = require("../schemas/customerSchema");
const customerModel = mongoose_1.default.model("customer", customerSchema_1.customerSchema);
exports.default = customerModel;
