"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const employeeSchema_1 = __importDefault(require("../schemas/employeeSchema"));
const EmployeeModel = mongoose_1.default.model("Employee", employeeSchema_1.default);
exports.default = EmployeeModel;
