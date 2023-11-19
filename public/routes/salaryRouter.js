"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const salaryController_1 = require("../controllers/employee/salaryController");
const salaryRouter = express_1.default.Router();
salaryRouter.route("/salary").post(salaryController_1.newGetSalary);
salaryRouter.route("/month-salary").post(salaryController_1.getMonthlySalary);
salaryRouter.route("/forAplicalbeMonth").get(salaryController_1.month);
exports.default = salaryRouter;
