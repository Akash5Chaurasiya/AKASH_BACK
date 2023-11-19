import { Router } from "express";
import {
  adminLogin,
  logout,
  myProfile,
} from "../controllers/admin/adminController";
import { changePassword, loginEmployee } from "../controllers/employee/employeeController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const authRouter = Router();

authRouter.route("/admin/login").post(adminLogin);
authRouter.route("/login").post(loginEmployee);
authRouter.route("/myprofile").get(isAuthenticatedAdminOrHR, myProfile);
authRouter.route("/logout").get(logout);
authRouter.route("/changePassword").post(isAuthenticatedAdminOrHR, changePassword);

export default authRouter;
