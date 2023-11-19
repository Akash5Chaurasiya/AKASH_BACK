"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const childPartSchema_1 = __importDefault(require("../schemas/childPartSchema"));
const ChildPartModel = mongoose_1.default.model("ChildPart", childPartSchema_1.default);
exports.default = ChildPartModel;
