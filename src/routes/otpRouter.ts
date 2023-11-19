import { Router } from "express";
import { getOtp, verifyOtp } from "../controllers/employee/otpController";

const otpRouter = Router();

otpRouter.get("/getotp", getOtp);
otpRouter.get("/verifyotp", verifyOtp);

export default otpRouter;