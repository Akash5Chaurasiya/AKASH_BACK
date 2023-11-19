"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const otpController_1 = require("../controllers/employee/otpController");
const otpRouter = (0, express_1.Router)();
otpRouter.get("/getotp", otpController_1.getOtp);
otpRouter.get("/verifyotp", otpController_1.verifyOtp);
exports.default = otpRouter;
