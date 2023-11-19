import express from "express";

import {
  addChildPartInMasterBom,
  addWorkOrder,
  changeWorkOrderInProductionSlip,
  deleteWorkOrder,
  getAllWorkOrder,
  getAllWorkOrderWithProductionSlip,
  getWorkOrder,
  updateConsumedItemInMasterBomb,
  updateProcessInWorkOrder,
  updateWorkOrder,
} from "../controllers/bomControllers/workOrderController";

import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const workOrderRouter = express.Router();

// added filters and search and sorting by date    
workOrderRouter.route("/").get(isAuthenticatedAdminOrHR , getAllWorkOrder);

workOrderRouter.route("/add/:finishedItemId").post(addWorkOrder);

// for testing 
workOrderRouter.route("/updateConsumption/:id").patch(updateConsumedItemInMasterBomb);


workOrderRouter.route("/homeApp/workOrders").get(getAllWorkOrderWithProductionSlip);

// update master bom in work order
// workOrderRouter.route("/updateConsumption/:id").patch(updateInMasterBom);

workOrderRouter.route("/addNewChild/:id").patch(addChildPartInMasterBom);

workOrderRouter.route("/:id").get(getWorkOrder);

// edit work order quantity
workOrderRouter.route("/:id").patch(updateWorkOrder).delete(deleteWorkOrder);

// change process in workOrder  
workOrderRouter.route("/updateProcess/:id").patch(updateProcessInWorkOrder);


// not for use 
workOrderRouter.route("/changeWorkOrder").post(changeWorkOrderInProductionSlip);

export default workOrderRouter;
