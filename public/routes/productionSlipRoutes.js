"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const productionSlipController_1 = require("../controllers/bomControllers/productionSlipController");
const auth_1 = require("../middleware/auth");
const productionRouter = express_1.default.Router();
//add a completed ProductionSlip     // Manual
productionRouter
    .route("/addCompletedSlip")
    .post(auth_1.isAuthenticatedAdminOrHR, async (req, resp, next) => {
    if (req.employee || req.admin) {
        try {
            let name = "";
            let employeeId;
            let status = "manual";
            if (req.employee) {
                name = req.employee.name;
                employeeId = req.employee._id;
            }
            if (req.admin) {
                name = req.admin.name;
                employeeId = req.admin._id;
            }
            const data = await (0, productionSlipController_1.addCompletedSlip)({
                ...req.body,
                name,
                status,
                employeeId,
            });
            resp.status(200).json(data);
        }
        catch (error) {
            console.log(error);
            resp.sendStatus(400);
        }
    }
    else {
        return resp.status(403).json({
            success: false,
            message: "Not Authorised.",
        });
    }
});
// get productionSlip
productionRouter
    .route("/prd/:productionSlipNumber")
    .get(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.getProductionSlipData);
productionRouter
    .route("/add")
    .post(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.addProductionSlip);
// add multiple production slips
productionRouter
    .route("/addMultiple")
    .post(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.addMultipleProductionSlips);
productionRouter
    .route("/employeeSuggestion/:productionSlipNumber")
    .get(productionSlipController_1.employeeSuggestions);
productionRouter
    .route("/machineSuggestion/:productionSlipNumber")
    .get(productionSlipController_1.machineSuggestions);
// add machines and employees to a production slip
productionRouter
    .route("/addEmployeeMachine")
    .post(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.addEmployeeAndMachine);
// auto selected machines and employees
productionRouter
    .route("/autoSelect/:productionSlipNumber")
    .get(productionSlipController_1.getLastWorkingData);
// finishing a production Slip
// productionRouter.route("/editLog/:productionSlipNumber").patch(editLogProductionSlip);
// get active production slips  add query for getting logs and active ProductionSlip    status == active || completed
productionRouter
    .route("/getActive")
    .get(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.gettingAllActiveProductionSlip);
// get all production slips with filters
productionRouter
    .route("/getAll")
    .post(productionSlipController_1.gettingAllActiveProductionSlipAllWorkOrder);
productionRouter
    .route("/excel")
    .get(productionSlipController_1.productionSlipExcel2);
productionRouter
    .route("/workOrderexcel")
    .get(productionSlipController_1.productionSlipExcelPerWorkOrder);
// get active and idle machines
productionRouter
    .route("/getIdleActiveMachines")
    .post(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.activeIdleMachines);
// getting active and idle employees
productionRouter
    .route("/getIdleActiveEmployees") // added last productionSlip with employee details
    .get(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.activeIdleEmployees);
// get all childPart With production slip count
productionRouter
    .route("/getAllChildPartWithSlip/:workOrderId")
    .post(auth_1.isAuthenticatedAdminOrHR, productionSlipController_1.getChildPartWithProductionSlipCount);
// API for getting multiple productionSlips details by an Array of productionSlip
productionRouter.route("/multiProductionSlip").post(productionSlipController_1.multiProductionSlipEnglish);
productionRouter.route("/multiProductionSlipHindi").post(productionSlipController_1.multiProductionSlip);
// APi for counting Print Of production
productionRouter.route("/updatePdfCount").patch(productionSlipController_1.countPdfPrint);
// Edit Production In Completed ProductionSlip
productionRouter
    .route("/editProduction/:productionSlipNumber")
    .patch(productionSlipController_1.EditProduction);
// update status of production slip
productionRouter
    .route("/updateStatus/:productionSlipNumber")
    .patch(productionSlipController_1.updateProductionSlipStatus);
// STATUS CARDS
productionRouter
    .route("/statusCards")
    .get(productionSlipController_1.statusCards);
exports.default = productionRouter;
