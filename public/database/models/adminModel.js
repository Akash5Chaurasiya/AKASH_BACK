"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const adminSchema_1 = require("../schemas/adminSchema");
const AdminModel = mongoose_1.default.model("Admin", adminSchema_1.adminSchema);
exports.default = AdminModel;
