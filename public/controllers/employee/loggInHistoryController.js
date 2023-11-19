"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLoginHistory = exports.getLoggedInUserHistory = void 0;
const loginHistoryModel_1 = __importDefault(require("../../database/models/loginHistoryModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
exports.getLoggedInUserHistory = (0, catchAsyncError_1.default)(async (req, res) => {
    if (req.admin) {
        let { limit = 20, page = 1, date, nextDate, } = req.query;
        limit = +limit;
        page = +page;
        let filterDate;
        let nextDay;
        if (typeof date === "string") {
            filterDate = new Date(date);
            filterDate.setHours(0, 0, 0, 0);
        }
        else {
            filterDate = new Date();
            filterDate.setHours(0, 0, 0, 0);
        }
        if (typeof nextDate === "string") {
            nextDay = new Date(nextDate);
            nextDay.setHours(0, 0, 0, 0);
            nextDay.setDate(nextDay.getDate() + 1);
        }
        else {
            nextDay = new Date(filterDate);
            nextDay.setDate(filterDate.getDate() + 1);
            nextDay.setHours(0, 0, 0, 0);
        }
        const skip = (page - 1) * limit;
        const forTotalNumber = await loginHistoryModel_1.default.find().exec();
        const logs = await loginHistoryModel_1.default
            .find()
            .limit(limit)
            .skip(skip)
            .sort({ logInTime: -1 })
            .exec();
        if (logs.length > 0) {
            res.status(200).json({
                status: true,
                message: "Successfully fetched login history",
                totalLogs: forTotalNumber.length,
                data: logs,
            });
        }
        else {
            res.status(200).json({
                status: false,
                message: "No login history found",
            });
        }
    }
    else {
        res.status(401).json({
            status: false,
            message: "You are not authorized to access this route",
        });
    }
});
exports.deleteLoginHistory = (0, catchAsyncError_1.default)(async (req, res) => {
    if (req.admin) {
        const { id } = req.params;
        const log = await loginHistoryModel_1.default.findByIdAndDelete(id).exec();
        if (log) {
            res.status(200).json({
                succss: true,
                message: "Successfully deleted login history",
            });
        }
        else {
            res.status(200).json({
                succss: false,
                message: "Failed to delete login history",
            });
        }
    }
    else {
        res.status(401).json({
            status: false,
            message: "You are not authorized to access this route",
        });
    }
});
