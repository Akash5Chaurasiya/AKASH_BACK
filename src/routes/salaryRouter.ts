import express from "express";
//import { getEmployeesUnderMe } from "../controllers/employee/supervisorController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";
import { getMonthlySalary, month, newGetSalary } from "../controllers/employee/salaryController";

const salaryRouter = express.Router();


salaryRouter.route("/salary").post(newGetSalary);

salaryRouter.route("/month-salary").post(getMonthlySalary);

salaryRouter.route("/forAplicalbeMonth").get(month);




export default salaryRouter;