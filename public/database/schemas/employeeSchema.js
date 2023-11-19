"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const employeeSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
    },
    active: {
        type: Boolean,
        default: true,
    },
    groupId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Group",
    },
    jobProfileId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "JobProfile",
    },
    role: {
        type: String,
        enum: [
            "admin",
            "dbManager",
            "attendanceManager",
            "employee",
            "manufacturing",
            "security",
            "supervisor",
            "attendanceViewer",
        ],
        default: "employee",
    },
    optionForRole: [String],
    employeeCode: {
        type: String,
        trim: true,
        unique: true,
    },
    email: {
        type: String,
    },
    contactNumber: {
        type: Number,
        unique: true,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
    },
    dateOfJoining: {
        type: Date,
    },
    lunchTime: {
        type: Number,
    },
    salary: {
        type: Number,
    },
    expactedSalary: {
        type: Number,
    },
    leaveTaken: {
        type: Number,
        default: 0,
    },
    currentBarCode: {
        type: String,
    },
    BarCodeStatus: {
        type: Boolean,
        default: true,
    },
    permanentBarCode: {
        type: String,
    },
    permanentBarCodeNumber: {
        type: String,
    },
    permanentQrCodeAssign: {
        type: Date,
    },
    assignedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Employee",
    },
    workingDays: {
        type: Number,
    },
    workingHours: {
        type: Number,
    },
    overTime: {
        type: Boolean,
    },
    overTimeRate: {
        type: Number,
    },
    trainingStatus: {
        type: String,
        default: "Not started",
    },
    // new details for Employee
    PF_UAN_Number: {
        type: String,
        trim: true,
    },
    ESI_ID: {
        type: String,
        trim: true,
    },
    PAN_Number: {
        type: String,
        trim: true,
        unique: true,
    },
    salaryMode: {
        type: String,
        enum: ["cash", "bank"],
    },
    bankDetails: {
        bankName: {
            type: String,
        },
        branch: {
            type: String,
        },
        accountNumber: {
            type: Number,
            trim: true,
        },
        IFSC_Code: {
            type: String,
            trim: true,
        },
    },
    aadharNumber: {
        type: String,
        trim: true,
        unique: true,
    },
    updateBy: {
        by: mongoose_1.default.Schema.Types.ObjectId,
        name: String
    },
    addedby: {
        by: mongoose_1.default.Schema.Types.ObjectId,
        name: String
    },
    marks: [
        {
            type: Number,
        },
    ],
    productionLogs: [
        {
            productionSlipId: {
                type: mongoose_1.default.Schema.Types.ObjectId
            },
            time: {
                type: Date
            },
        }
    ]
}, {
    timestamps: true,
});
exports.default = employeeSchema;
