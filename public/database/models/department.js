"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const departmentSchema_1 = __importDefault(require("../schemas/departmentSchema"));
const departmentModel = mongoose_1.default.model("Department", departmentSchema_1.default);
exports.default = departmentModel;
