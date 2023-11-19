import express from "express";
import { getSalaryReport, getSinglePartCostReport } from "../controllers/bomControllers/salaryReportController";

const salaryReportRouter = express.Router();

salaryReportRouter.route("/").post(getSalaryReport);
salaryReportRouter.route("/singlePartCostReport/:partId").get(getSinglePartCostReport);

export default salaryReportRouter;