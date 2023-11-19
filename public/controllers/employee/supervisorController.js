"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployeesUnderMe = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
exports.getEmployeesUnderMe = (0, catchAsyncError_1.default)(async (req, res) => {
    if (req.employee) {
        const loggedInEmployee = await employeeModel_1.default.findById(req.employee._id).select({
            name: 1,
            group: 1,
            jobProfileId: 1,
            employeeCode: 1,
        });
        if (loggedInEmployee) {
            const jobprofile = await jobProfileModel_1.default.findOne({
                _id: loggedInEmployee.jobProfileId,
            });
            const childJobProfile = jobprofile?.childProfileId;
            const underEmployeee = await employeeModel_1.default.find({
                jobProfileId: { $in: childJobProfile },
            })
                .populate({
                path: "jobProfileId",
                select: "jobProfileName",
            })
                .select({ name: 1, jobprofileId: 1, employeeCode: 1 });
            res.status(200).json({
                sucess: true,
                message: "getting employees under me",
                total: underEmployeee.length,
                underEmployeee,
            });
        }
    }
    else {
        res.status(404).json({
            sucess: false,
            message: "login as an employee",
        });
    }
});
