import express from "express";
import {
  addEmployee,
  assignQrCode,
  assignedByMe,
  changePassword,
  deleteEmployee,
  employeeBarCode,
  getAllEmployee,
  getEmployeeByGroupAndJobProfile,
  getSingle,
  newPasswordGenerator,
  salaryLogPerEmployee,
  updateEmployee,
  updateEmployeeBarCodes,
} from "../controllers/employee/employeeController";

import { isAuthenticatedAdminOrDbManager, isAuthenticatedAdminOrHR } from "../middleware/auth";
import { getSalary } from "../controllers/employee/salaryController";
import { changePasswordAdmin } from "../controllers/admin/adminController";
// import { updateField } from "../controllers/employee/groupController";

const employeeRouter = express.Router();

employeeRouter.route("/add").post(isAuthenticatedAdminOrDbManager, addEmployee);
employeeRouter.route("/:id").patch(isAuthenticatedAdminOrHR, updateEmployee)
  .delete(isAuthenticatedAdminOrDbManager, deleteEmployee);
employeeRouter.route("/").post(getAllEmployee);
employeeRouter.route("/emp").get(getEmployeeByGroupAndJobProfile);
// some changes

// assign Qr code
employeeRouter.route("/assign-qr/:employeeId").patch(isAuthenticatedAdminOrHR, assignQrCode);
employeeRouter.route("/qrAssignedByMe").get(isAuthenticatedAdminOrHR, assignedByMe); // can get limit and page in query 


employeeRouter.route("/getSingle/:employeeId").get(isAuthenticatedAdminOrHR, getSingle);
employeeRouter.route("/changePassword").put(isAuthenticatedAdminOrHR, changePassword);
employeeRouter.route("/changePasswordAdmin").put(isAuthenticatedAdminOrHR, changePasswordAdmin);
employeeRouter.route("/newPassword/:employeeId").put(isAuthenticatedAdminOrHR, newPasswordGenerator);
employeeRouter.route("/salaryLog/:employeeId").get(isAuthenticatedAdminOrHR, salaryLogPerEmployee)
employeeRouter.route("/employeeBarCode").get(employeeBarCode)
employeeRouter.route("/getSalary").get(getSalary)


export default employeeRouter;
