"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobProfileSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.JobProfileSchema = new mongoose_1.Schema({
    jobProfileName: {
        type: String,
    },
    parentJobProfileId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "JobProfile",
        default: null,
    },
    jobRank: {
        type: Number
    },
    jobDescription: {
        type: String
    },
    childProfileId: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "JobProfile",
        }],
    numberOfEmployees: {
        type: Number,
    },
    employmentType: {
        type: String
    },
    jobSkill: {
        type: String
    },
    department: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Department"
    },
    isSupervisor: {
        type: Boolean,
        default: false
    },
    newFields: [
        {
            fieldName: {
                type: String
            },
            fieldValue: {
                type: String,
                default: ""
            }
        }
    ]
}, {
    timestamps: true,
});
