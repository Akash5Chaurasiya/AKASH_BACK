"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeSalary = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const salaryLogModel_1 = __importDefault(require("../../database/models/salaryLogModel"));
exports.changeSalary = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const employees = await employeeModel_1.default.find({});
        if (employees && employees.length > 0) {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const month = currentDate.getMonth() + 1;
            let year = currentDate.getUTCFullYear();
            const firstDate = new Date(year, month - 1, 1);
            for (const emp of employees) {
                const salaryRecords = await salaryLogModel_1.default.find({
                    employeeId: emp._id,
                    applicableMonth: {
                        $gte: firstDate,
                        $lt: currentDate,
                    },
                });
                if (salaryRecords.length > 0) {
                    console.log("HII");
                    emp.salary = salaryRecords[salaryRecords.length - 1].salary;
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
        next(error);
    }
});
