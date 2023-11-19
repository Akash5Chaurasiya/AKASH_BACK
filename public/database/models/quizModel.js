"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const quizSchema_1 = __importDefault(require("../schemas/quizSchema"));
const QuizModel = mongoose_1.default.model("Quiz", quizSchema_1.default);
exports.default = QuizModel;
