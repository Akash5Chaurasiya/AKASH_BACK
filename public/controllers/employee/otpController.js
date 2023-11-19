"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOtp = exports.getOtp = void 0;
const axios_1 = __importDefault(require("axios"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const getOtp = async (req, res) => {
    let { phoneNumber } = req.query;
    phoneNumber = Number(phoneNumber);
    if (!phoneNumber) {
        return res.status(400).json({
            success: false,
            message: "Phone no. is not valid"
        });
    }
    else {
        const emp = await employeeModel_1.default.findOne({ contactNumber: phoneNumber });
        if (!emp) {
            return res.status(404).json({
                success: false,
                message: `Employee not Found by This ${phoneNumber}.`
            });
        }
        const { data } = await axios_1.default.get(`https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/${phoneNumber}/AUTOGEN/Temp1`);
        res.send({
            data: data,
            employee: emp
        });
    }
};
exports.getOtp = getOtp;
const verifyOtp = async (req, res) => {
    let { otp, phoneNumber } = req.query;
    phoneNumber = Number(phoneNumber);
    otp = Number(otp);
    const { data } = await axios_1.default.get(`https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/VERIFY3/${phoneNumber}/${otp}`);
    if (data.Status === "Success") {
        const emp = await employeeModel_1.default.findOne({ contactNumber: phoneNumber });
        if (!emp) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            });
        }
        else {
            emp.verified = true;
            const employee = await emp.save();
            res.send({
                success: "true",
                message: "OTP verify Successfully",
                data: data,
                employee
            });
        }
    }
    else {
        res.send({
            success: "false",
            message: "OTP Not verified",
            data: data
        });
    }
};
exports.verifyOtp = verifyOtp;
