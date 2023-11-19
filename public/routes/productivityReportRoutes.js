"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productivityReportController_1 = require("../controllers/bomControllers/productivityReportController");
const productivityReportRouter = express_1.default.Router();
productivityReportRouter.route("/getReport").post(productivityReportController_1.getReportPerEmployee);
productivityReportRouter.route("/getMachineReport").post(productivityReportController_1.getNewReportPerMachine);
productivityReportRouter.route("/getReportApp").post(productivityReportController_1.EmployeeReport);
productivityReportRouter.route("/singleEmployeeReport").post(async (req, resp, next) => {
    try {
        const data = await (0, productivityReportController_1.SingleEmployeeReport)(req.body);
        resp.status(200).json({ ...data });
    }
    catch (error) {
        resp.sendStatus(400);
    }
});
productivityReportRouter.route("/singleMachineReport").post(async (req, resp, next) => {
    try {
        const { machineId, date } = req.body;
        const data = await (0, productivityReportController_1.MachineReport)({ machineId, date });
        resp.status(200).json({ ...data });
    }
    catch (error) {
        console.log(error);
        resp.sendStatus(500);
    }
});
exports.default = productivityReportRouter;
