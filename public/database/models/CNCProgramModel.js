"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CNCProgramSchema_1 = __importDefault(require("../schemas/CNCProgramSchema"));
const CNCProgramModel = mongoose_1.default.model("CNCProgram", CNCProgramSchema_1.default);
exports.default = CNCProgramModel;
