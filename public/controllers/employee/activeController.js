"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeActiveStatus = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const v2attendanceModel_1 = __importDefault(require("../../database/models/v2attendanceModel"));
exports.changeActiveStatus = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const employees = await employeeModel_1.default.find({});
        if (employees && employees.length > 0) {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const twentyDaysAgo = new Date(currentDate.getTime());
            twentyDaysAgo.setDate(currentDate.getDate() - 20);
            twentyDaysAgo.setHours(0, 0, 0, 0);
            for (const emp of employees) {
                const attendanceRecords = await v2attendanceModel_1.default.find({
                    employeeId: emp._id,
                    date: {
                        $gt: twentyDaysAgo,
                        $lt: currentDate,
                    },
                });
                //console.log(emp.name,attendanceRecords.length )
                if (attendanceRecords.length === 0) {
                    emp.BarCodeStatus = false;
                    emp.active = false;
                }
                await emp.save();
                //console.log("Api called")
            }
            res.status(200).json({
                success: true,
                message: "Employee Active Status Changed.",
            });
        }
        else {
            res.status(200).json({
                success: true,
                message: "No employees found to update.",
            });
        }
    }
    catch (error) {
        // Handle any errors, for example, using 'next' middleware.
        next(error);
    }
});
