"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const employeeDocsSchema_1 = require("../schemas/employeeDocsSchema");
const EmployeeDocsModel = mongoose_1.default.model("EmployeeDocs", employeeDocsSchema_1.employeeDocsSchema);
exports.default = EmployeeDocsModel;
