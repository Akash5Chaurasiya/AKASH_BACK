"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CNCProgramLog_1 = __importDefault(require("../schemas/CNCProgramLog"));
const CNCProgramLogModel = mongoose_1.default.model("CNCProgramLog", CNCProgramLog_1.default);
exports.default = CNCProgramLogModel;
