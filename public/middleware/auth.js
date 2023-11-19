"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticatedSupervisor = exports.isAuthenticatedAdminOrDbManager = exports.isAuthenticatedAdminOrAttendanceManager = exports.isAuthenticatedAdminOrHR = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adminModel_1 = __importDefault(require("../database/models/adminModel"));
const employeeModel_1 = __importDefault(require("../database/models/employeeModel"));
const jobProfileModel_1 = __importDefault(require("../database/models/jobProfileModel"));
const isAuthenticatedAdminOrHR = async (req, resp, next) => {
    const { token } = req.cookies;
    if (!token) {
        return resp.status(404).json({
            success: false,
            message: "Login first.",
        });
    }
    try {
        const decodedData = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
        if (decodedData) {
            const admin = await adminModel_1.default.findById({ _id: decodedData.user });
            if (admin) {
                req.admin = admin;
                return next();
            }
            else {
                const employee = await employeeModel_1.default.findById({ _id: decodedData.user });
                if (employee) {
                    req.employee = employee;
                    return next();
                }
                else {
                    return resp.status(404).json({
                        success: false,
                        message: "Employee not found in middleware.",
                    });
                }
            }
        }
        else {
            return resp.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
    }
    catch (error) {
        return resp.status(401).json({
            success: false,
            message: "Invalid token in catch.",
        });
    }
};
exports.isAuthenticatedAdminOrHR = isAuthenticatedAdminOrHR;
const isAuthenticatedAdminOrAttendanceManager = async (req, resp, next) => {
    const { token } = req.cookies;
    if (!token) {
        return resp.status(404).json({
            success: false,
            message: "Login first.",
        });
    }
    try {
        const decodedData = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
        if (decodedData) {
            const admin = await adminModel_1.default.findById({ _id: decodedData.user });
            if (admin) {
                req.admin = admin;
                return next();
            }
            else {
                const employee = await employeeModel_1.default.findById({ _id: decodedData.user });
                if (employee) {
                    const role = employee.role;
                    if (role === "attendanceManager") {
                        req.attendanceManager = employee;
                        return next();
                    }
                }
                else {
                    return resp.status(404).json({
                        success: false,
                        message: "Employee is not attendanceManager.",
                    });
                }
            }
        }
        else {
            return resp.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
    }
    catch (error) {
        return resp.status(401).json({
            success: false,
            message: "Invalid token in catch.",
        });
    }
};
exports.isAuthenticatedAdminOrAttendanceManager = isAuthenticatedAdminOrAttendanceManager;
const isAuthenticatedAdminOrDbManager = async (req, resp, next) => {
    const { token } = req.cookies;
    if (!token) {
        return resp.status(404).json({
            success: false,
            message: "Login first.",
        });
    }
    try {
        const decodedData = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
        if (decodedData) {
            const admin = await adminModel_1.default.findById({ _id: decodedData.user });
            if (admin) {
                req.admin = admin;
                return next();
            }
            else {
                const employee = await employeeModel_1.default.findById({ _id: decodedData.user });
                if (employee) {
                    const role = employee.role;
                    if (role === "dbManager") {
                        req.dbManager = employee;
                        return next();
                    }
                    else {
                        return resp.status(404).json({
                            success: false,
                            message: "Employee is not Database Manager.",
                        });
                    }
                }
                else {
                    return resp.status(404).json({
                        success: false,
                        message: "Employee is not found.",
                    });
                }
            }
        }
        else {
            return resp.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
    }
    catch (error) {
        return resp.status(401).json({
            success: false,
            message: "Invalid token in catch.",
        });
    }
};
exports.isAuthenticatedAdminOrDbManager = isAuthenticatedAdminOrDbManager;
const isAuthenticatedSupervisor = async (req, resp, next) => {
    const { token } = req.cookies;
    if (!token) {
        return resp.status(404).json({
            success: false,
            message: "Login first.",
        });
    }
    try {
        const decodedData = jsonwebtoken_1.default.verify(token, process.env.JWT_KEY);
        if (decodedData) {
            const admin = await adminModel_1.default.findById({ _id: decodedData.user });
            if (admin) {
                req.admin = admin;
                return next();
            }
            else {
                const employee = await employeeModel_1.default.findById({ _id: decodedData.user });
                if (employee) {
                    const role = employee.role;
                    const job = await jobProfileModel_1.default.findOne({ _id: employee.jobProfileId });
                    if (role === "supervisor" && job?.isSupervisor) {
                        req.supervisor = employee;
                        return next();
                    }
                    else {
                        return resp.status(404).json({
                            success: false,
                            message: "Employee is not supervisor.",
                        });
                    }
                }
                else {
                    return resp.status(404).json({
                        success: false,
                        message: "Employee is not supervisor.",
                    });
                }
            }
        }
        else {
            return resp.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
    }
    catch (error) {
        return resp.status(401).json({
            success: false,
            message: "Invalid token in catch.",
        });
    }
};
exports.isAuthenticatedSupervisor = isAuthenticatedSupervisor;
