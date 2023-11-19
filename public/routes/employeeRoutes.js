"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employeeController_1 = require("../controllers/employee/employeeController");
const auth_1 = require("../middleware/auth");
const salaryController_1 = require("../controllers/employee/salaryController");
const adminController_1 = require("../controllers/admin/adminController");
// import { updateField } from "../controllers/employee/groupController";
const employeeRouter = express_1.default.Router();
employeeRouter.route("/add").post(auth_1.isAuthenticatedAdminOrDbManager, employeeController_1.addEmployee);
employeeRouter.route("/:id").patch(auth_1.isAuthenticatedAdminOrHR, employeeController_1.updateEmployee)
    .delete(auth_1.isAuthenticatedAdminOrDbManager, employeeController_1.deleteEmployee);
employeeRouter.route("/").post(employeeController_1.getAllEmployee);
employeeRouter.route("/emp").get(employeeController_1.getEmployeeByGroupAndJobProfile);
// some changes
// assign Qr code
employeeRouter.route("/assign-qr/:employeeId").patch(auth_1.isAuthenticatedAdminOrHR, employeeController_1.assignQrCode);
employeeRouter.route("/qrAssignedByMe").get(auth_1.isAuthenticatedAdminOrHR, employeeController_1.assignedByMe); // can get limit and page in query 
employeeRouter.route("/getSingle/:employeeId").get(auth_1.isAuthenticatedAdminOrHR, employeeController_1.getSingle);
employeeRouter.route("/changePassword").put(auth_1.isAuthenticatedAdminOrHR, employeeController_1.changePassword);
employeeRouter.route("/changePasswordAdmin").put(auth_1.isAuthenticatedAdminOrHR, adminController_1.changePasswordAdmin);
employeeRouter.route("/newPassword/:employeeId").put(auth_1.isAuthenticatedAdminOrHR, employeeController_1.newPasswordGenerator);
employeeRouter.route("/salaryLog/:employeeId").get(auth_1.isAuthenticatedAdminOrHR, employeeController_1.salaryLogPerEmployee);
employeeRouter.route("/employeeBarCode").get(employeeController_1.employeeBarCode);
employeeRouter.route("/getSalary").get(salaryController_1.getSalary);
exports.default = employeeRouter;
