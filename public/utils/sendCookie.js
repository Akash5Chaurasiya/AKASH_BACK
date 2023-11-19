"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCookieAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const employeeDocsModel_1 = __importDefault(require("../database/models/employeeDocsModel"));
const sendCookieAdmin = async (resp, user, message, statusCode = 200) => {
    const token = jsonwebtoken_1.default.sign({ user: user._id }, process.env.JWT_KEY);
    const userPicture = await employeeDocsModel_1.default.findOne({ employeeId: user._id });
    if (user?.email === "dev@gmail.com") {
        return resp
            .status(statusCode)
            .cookie("token", token, {
            maxAge: 500000 * 60 * 60 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: "none", // Set the appropriate SameSite policy based on your requirements
        })
            .json({
            success: true,
            profilePicture: userPicture?.profilePicture,
            user,
            message,
            cookie: "Cookie saved successfully."
        });
    }
    return resp
        .status(statusCode)
        .cookie("token", token, {
        maxAge: 5 * 60 * 60 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: "none", // Set the appropriate SameSite policy based on your requirements
    })
        .json({
        success: true,
        profilePicture: userPicture?.profilePicture,
        user,
        message,
        cookie: "Cookie saved successfully."
    });
};
exports.sendCookieAdmin = sendCookieAdmin;
