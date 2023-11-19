"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMonthData = exports.deleteMonth = exports.updateWorkingDay = exports.addWorkingDay = void 0;
const workingDayModel_1 = __importDefault(require("../../database/models/workingDayModel"));
const dateTimeConverter_1 = require("../../middleware/dateTimeConverter");
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
exports.addWorkingDay = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { year, monthName, workingDay } = req.body;
    const currentDate = (0, dateTimeConverter_1.getIndianTime)(new Date());
    if (!monthName || monthName.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Month name is required and must not be empty.",
        });
    }
    const existingYearData = await workingDayModel_1.default.findOne({ year });
    if (existingYearData) {
        const isMonthNameDuplicate = existingYearData.month.some((month) => month.monthName === monthName);
        if (isMonthNameDuplicate) {
            return res.status(400).json({
                success: false,
                message: `Month '${monthName}' already exists for the given year.`,
            });
        }
        existingYearData.month.push({
            monthName,
            workingDay,
            createdAt: currentDate,
        });
        await existingYearData.save();
        res.status(200).json({
            success: true,
            workingData: existingYearData,
            message: "Added working day successfully for the existing year.",
        });
    }
    else {
        const workingData = await workingDayModel_1.default.create({
            year: year,
            month: [
                {
                    monthName: monthName,
                    workingDay,
                    createdAt: currentDate,
                },
            ],
        });
        res.status(200).json({
            success: true,
            workingData,
            message: "Added working day successfully for the new year.",
        });
    }
});
exports.updateWorkingDay = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { year, monthName, workingDay } = req.body;
    if (!monthName || monthName.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Month name is required and must not be empty.",
        });
    }
    try {
        const existingYearData = await workingDayModel_1.default.findOne({ year });
        if (existingYearData) {
            const monthIndex = existingYearData.month.findIndex((month) => month.monthName === monthName);
            if (monthIndex !== -1) {
                existingYearData.month[monthIndex].workingDay = workingDay;
                existingYearData.month[monthIndex].updatedAt = (0, dateTimeConverter_1.getIndianTime)(new Date());
                await existingYearData.save();
                res.status(200).json({
                    success: true,
                    workingData: existingYearData,
                    message: `Updated working day for ${monthName} successfully.`,
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    message: `Month '${monthName}' not found for the given year.`,
                });
            }
        }
        else {
            res.status(404).json({
                success: false,
                message: `Year '${year}' not found.`,
            });
        }
    }
    catch (error) {
        return next(error);
    }
});
exports.deleteMonth = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { year, monthName } = req.body;
    if (!monthName || monthName.trim() === "") {
        return res.status(400).json({
            success: false,
            message: "Month name is required and must not be empty.",
        });
    }
    const existingYearData = await workingDayModel_1.default.findOne({ year });
    if (existingYearData) {
        // Use $pull operator to remove the specified month
        existingYearData.month = existingYearData.month.filter((month) => month.monthName !== monthName);
        await existingYearData.save();
        res.status(200).json({
            success: true,
            workingData: existingYearData,
            message: `Deleted month '${monthName}' successfully.`,
        });
    }
    else {
        res.status(404).json({
            success: false,
            message: `Year '${year}' not found.`,
        });
    }
});
exports.getMonthData = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { year } = req.query;
    const workingData = await workingDayModel_1.default.find({ year: year });
    if (workingData.length > 0) {
        res.status(200).json({
            success: true,
            message: "Working data fetched successfully.",
            workingData: workingData,
        });
    }
    else {
        res.status(404).json({
            success: false,
            message: `Year '${year}' not found.`,
        });
    }
});
