"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeDocsSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.employeeDocsSchema = new mongoose_1.default.Schema({
    employeeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    profilePicture: {
        type: String,
    },
    proofPicture: [{ type: String }],
    document: [
        {
            docsName: String,
            docs: String,
            status: {
                type: String,
                default: "pending"
            }
        },
    ],
}, {
    timestamps: true,
});
