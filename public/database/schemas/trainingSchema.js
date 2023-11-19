"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainingSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.trainingSchema = new mongoose_1.default.Schema({
    jobProfileId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "JobProfile",
    },
    groupId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Group",
    },
    trainingMaterial: [
        {
            resourceName: {
                type: String,
            },
            resourceUrl: {
                type: String,
            },
        },
    ],
    status: {
        type: String,
    },
    marks: {
        type: String,
    },
});
