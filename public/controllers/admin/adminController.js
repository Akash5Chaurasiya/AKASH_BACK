"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordAdmin = exports.logout = exports.myProfile = exports.adminLogin = exports.getAllAdmin = exports.deleteAdmin = exports.updateAdmin = exports.addAdmin = void 0;
const adminModel_1 = __importDefault(require("../../database/models/adminModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const sendCookie_1 = require("../../utils/sendCookie");
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const employeeDocsModel_1 = __importDefault(require("../../database/models/employeeDocsModel"));
const loginHistoryModel_1 = __importDefault(require("../../database/models/loginHistoryModel"));
const dateTimeConverter_1 = require("../../middleware/dateTimeConverter");
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
// adding a admin
exports.addAdmin = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { name, email, password } = req.body;
    let admin = await adminModel_1.default.findOne({ email });
    if (admin) {
        return next(new errorHandler_1.default("Admin Already exist.", 400));
    }
    const hashedPassword = await bcrypt_1.default.hash(password, parseInt(process.env.SALT, 10));
    admin = await adminModel_1.default.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
    });
    resp.status(201).json({
        success: true,
        message: "Admin created successfully.",
        admin,
    });
});
// update an admin
exports.updateAdmin = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const id = req.params;
    const { userName, email, password } = req.body;
    let admin = await adminModel_1.default.findOne({ email });
    if (!admin) {
        return next(new errorHandler_1.default("Admin doesn't exist.", 400));
    }
    const hashedPassword = await bcrypt_1.default.hash(password, parseInt(process.env.SALT, 10));
    admin = await adminModel_1.default.findByIdAndUpdate({ _id: id }, {
        userName,
        email,
        password: hashedPassword,
    });
    resp.status(201).json({
        success: true,
        message: "Admin updated successfully.",
        admin,
    });
});
// delete an admin
exports.deleteAdmin = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const id = req.params;
    let admin = await adminModel_1.default.findByIdAndDelete({ _id: id });
    if (!admin) {
        return next(new errorHandler_1.default("admin doesn't exist.", 400));
    }
    resp.status(201).json({
        success: true,
        message: "admin created successfully.",
        admin,
    });
});
// get all admin
exports.getAllAdmin = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    let admin = await adminModel_1.default.find({});
    resp.status(201).json({
        success: true,
        message: "Getting All admin successfully.",
        admin,
    });
});
// admin Login
exports.adminLogin = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    let { email, phone, password, userAgent, platform, ipAddress } = req.body;
    if (email) {
        email = email.toLowerCase();
    }
    if (phone) {
        if (typeof phone === "string") {
            phone = parseInt(phone);
        }
    }
    let admin = await adminModel_1.default.findOne({
        $or: [
            { email: email || "abc@gmail.com" },
            { contactNumber: phone || 985953857 },
        ],
    }).select("+password");
    let user = await employeeModel_1.default.findOne({
        $or: [{ email: email || "xyz@gmail.com" }, { contactNumber: phone || 99999999999 }],
    })
        .populate("jobProfileId")
        .exec();
    const obj = {
        userAgent,
        platform,
    };
    if (admin) {
        const userInfo = {
            name: admin.name,
            role: "Admin",
            jobProfile: "Admin",
            employeeCode: "Admin",
        };
        if (admin._id + "" !== "64a3f3353d41be4135d71b31") {
            const userLog = await loginHistoryModel_1.default.create({
                user: admin._id,
                userInfo: userInfo,
                device: obj,
                ipAddress: ipAddress,
                logInTime: (0, dateTimeConverter_1.getIndianTime)(new Date()),
            });
        }
        ;
        const comparePassword = await bcrypt_1.default.compare(password, admin.password);
        if (!comparePassword) {
            return next(new errorHandler_1.default("admin or password doesn't match.", 400));
        }
        (0, sendCookie_1.sendCookieAdmin)(resp, admin, `Welcome back, ${admin.name}`, 200);
    }
    else if (user) {
        const comparePassword = await bcrypt_1.default.compare(password, user.password);
        const jobprofile = user.jobProfileId;
        const userInfo = {
            name: user.name,
            jobProfile: jobprofile.jobProfileName,
            role: user.role,
            employeeCode: user.employeeCode,
        };
        const userLog = await loginHistoryModel_1.default.create({
            user: user._id,
            userInfo: userInfo,
            device: obj,
            ipAddress: ipAddress,
            logInTime: (0, dateTimeConverter_1.getIndianTime)(new Date()),
        });
        if (!comparePassword) {
            return next(new errorHandler_1.default("user or password doesn't match.", 400));
        }
        if (user.active) {
            (0, sendCookie_1.sendCookieAdmin)(resp, user, `Welcome back, ${user.name}`, 200);
        }
        else {
            return next(new errorHandler_1.default("Sorry you are Inactive user !", 404));
        }
    }
    else {
        return next(new errorHandler_1.default("User not found", 404));
    }
});
exports.myProfile = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    if (req.admin) {
        const admin = req.admin;
        resp.status(200).json({
            success: true,
            message: "Getting admin details successfully.",
            admin,
        });
    }
    else if (req.employee) {
        const employee = await employeeModel_1.default.findById(req.employee._id)
            .populate("jobProfileId")
            .exec();
        const shop = await shopModel_1.default.findOne({ "jobProfile.jobProfileId": employee?.jobProfileId }).select("shopName shopCode");
        const userPicture = await employeeDocsModel_1.default.findOne({
            employeeId: employee?._id,
        });
        resp.status(200).json({
            success: true,
            message: "Getting employee details successfully.",
            profilePicture: userPicture?.profilePicture,
            employee,
            shop
        });
    }
    else {
        resp.status(400).json({
            success: false,
            message: "Login first User not found",
        });
    }
});
// logout
exports.logout = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    resp
        .status(200)
        .cookie("token", "", {
        expires: new Date(Date.now()),
    })
        .json({
        success: true,
        message: "User logged out successfully",
    });
});
const changePasswordAdmin = async (req, resp, next) => {
    if (req.admin) {
        const { oldPassword, newPassword } = req.body;
        const comparePassword = await bcrypt_1.default.compare(oldPassword, req.admin.password);
        if (comparePassword) {
            const hashedPassword = await bcrypt_1.default.hash(newPassword, parseInt(process.env.SALT, 10));
            const updatedEmployee = await adminModel_1.default.findOneAndUpdate({ _id: req.admin._id }, { password: hashedPassword }, { new: true });
            resp.status(200).json({
                success: true,
                message: "Password changed successfully.",
                employee: updatedEmployee,
            });
        }
        else {
            resp.status(200).json({
                success: false,
                message: "Old password is not correct.",
            });
        }
    }
    else {
        return next(new errorHandler_1.default("Something went wrong. Login with admin.", 400));
    }
};
exports.changePasswordAdmin = changePasswordAdmin;
