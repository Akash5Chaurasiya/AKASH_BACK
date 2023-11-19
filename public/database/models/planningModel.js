"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const planningSchema_1 = __importDefault(require("../schemas/planningSchema"));
const PlanningModel = mongoose_1.default.model("Planning", planningSchema_1.default);
exports.default = PlanningModel;
