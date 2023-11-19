import express, { Request, NextFunction, Response } from "express";
import {
  EditProduction,
  activeIdleEmployees,
  activeIdleMachines,
  addCompletedSlip,
  addEmployeeAndMachine,
  addMultipleProductionSlips,
  addProductionSlip,
  // addingOrderQuantity,
  countPdfPrint,
  employeeSuggestions,
  getChildPartWithProductionSlipCount,
  getLastWorkingData,
  getProductionSlipData,
  getProductivityPerEmployee,
  gettingAllActiveProductionSlip,
  gettingAllActiveProductionSlipAllWorkOrder,
  machineSuggestions,
  multiProductionSlip,
  multiProductionSlipEnglish,
  productionSlipExcel,
  productionSlipExcel2,
  productionSlipExcelPerWorkOrder,
  statusCards,
  updateProductionSlipStatus,
} from "../controllers/bomControllers/productionSlipController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";
import { EmployeeDocument } from "../database/entities/employeeDocument";

const productionRouter = express.Router();

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}
//add a completed ProductionSlip     // Manual
productionRouter
  .route("/addCompletedSlip")
  .post(
    isAuthenticatedAdminOrHR,
    async (
      req: CustomRequest<EmployeeDocument>,
      resp: Response,
      next: NextFunction
    ) => {
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

          const data = await addCompletedSlip({
            ...req.body,
            name,
            status,
            employeeId,
          });

          resp.status(200).json(data);
        } catch (error) {
          console.log(error);
          resp.sendStatus(400);
        }
      } else {
        return resp.status(403).json({
          success: false,
          message: "Not Authorised.",
        });
      }
    }
  );

// get productionSlip
productionRouter
  .route("/prd/:productionSlipNumber")
  .get(isAuthenticatedAdminOrHR, getProductionSlipData);

productionRouter
  .route("/add")
  .post(isAuthenticatedAdminOrHR, addProductionSlip);

// add multiple production slips
productionRouter
  .route("/addMultiple")
  .post(isAuthenticatedAdminOrHR, addMultipleProductionSlips);

productionRouter
  .route("/employeeSuggestion/:productionSlipNumber")
  .get(employeeSuggestions);

productionRouter
  .route("/machineSuggestion/:productionSlipNumber")
  .get(machineSuggestions);

// add machines and employees to a production slip
productionRouter
  .route("/addEmployeeMachine")
  .post(isAuthenticatedAdminOrHR, addEmployeeAndMachine);

// auto selected machines and employees
productionRouter
  .route("/autoSelect/:productionSlipNumber")
  .get(getLastWorkingData);

// finishing a production Slip
// productionRouter.route("/editLog/:productionSlipNumber").patch(editLogProductionSlip);

// get active production slips  add query for getting logs and active ProductionSlip    status == active || completed
productionRouter
  .route("/getActive")
  .get(isAuthenticatedAdminOrHR, gettingAllActiveProductionSlip);

// get all production slips with filters
productionRouter
  .route("/getAll")
  .post(gettingAllActiveProductionSlipAllWorkOrder);

productionRouter
  .route("/excel")
  .get(productionSlipExcel2);


productionRouter
  .route("/workOrderexcel")
  .get(productionSlipExcelPerWorkOrder);

// get active and idle machines
productionRouter
  .route("/getIdleActiveMachines")
  .post(isAuthenticatedAdminOrHR, activeIdleMachines);

// getting active and idle employees
productionRouter
  .route("/getIdleActiveEmployees")                // added last productionSlip with employee details
  .get(isAuthenticatedAdminOrHR, activeIdleEmployees);

// get all childPart With production slip count
productionRouter
  .route("/getAllChildPartWithSlip/:workOrderId")
  .post(isAuthenticatedAdminOrHR, getChildPartWithProductionSlipCount);

// API for getting multiple productionSlips details by an Array of productionSlip
productionRouter.route("/multiProductionSlip").post(multiProductionSlipEnglish);

productionRouter.route("/multiProductionSlipHindi").post(multiProductionSlip);

// APi for counting Print Of production
productionRouter.route("/updatePdfCount").patch(countPdfPrint);

// Edit Production In Completed ProductionSlip
productionRouter
  .route("/editProduction/:productionSlipNumber")
  .patch(EditProduction);

// update status of production slip
productionRouter
  .route("/updateStatus/:productionSlipNumber")
  .patch(updateProductionSlipStatus);

// STATUS CARDS
productionRouter
  .route("/statusCards")
  .get(statusCards);


export default productionRouter;
