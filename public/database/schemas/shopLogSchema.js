"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ShopLogSchema = new mongoose_1.default.Schema({
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
    },
    date: {
        type: Date
    },
    employees: [{
            employeeId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
            },
            employeeName: {
                type: String,
            }
        }]
});
exports.default = ShopLogSchema;
