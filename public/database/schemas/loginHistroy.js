"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHistorySchema = void 0;
const mongoose_1 = require("mongoose");
exports.loginHistorySchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
    },
    userInfo: {
        name: String,
        jobProfile: String,
        employeeCode: String,
        role: String,
    },
    logInTime: {
        type: Date,
    },
    ipAddress: {
        type: String,
    },
    device: {
        userAgent: {
            type: String,
        },
        platform: {
            type: String,
        },
    },
});
