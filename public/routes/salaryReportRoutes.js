"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const salaryReportController_1 = require("../controllers/bomControllers/salaryReportController");
const salaryReportRouter = express_1.default.Router();
salaryReportRouter.route("/").post(salaryReportController_1.getSalaryReport);
salaryReportRouter.route("/singlePartCostReport/:partId").get(salaryReportController_1.getSinglePartCostReport);
exports.default = salaryReportRouter;
