"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const workOrderController_1 = require("../controllers/bomControllers/workOrderController");
const auth_1 = require("../middleware/auth");
const workOrderRouter = express_1.default.Router();
// added filters and search and sorting by date    
workOrderRouter.route("/").get(auth_1.isAuthenticatedAdminOrHR, workOrderController_1.getAllWorkOrder);
workOrderRouter.route("/add/:finishedItemId").post(workOrderController_1.addWorkOrder);
// for testing 
workOrderRouter.route("/updateConsumption/:id").patch(workOrderController_1.updateConsumedItemInMasterBomb);
workOrderRouter.route("/homeApp/workOrders").get(workOrderController_1.getAllWorkOrderWithProductionSlip);
// update master bom in work order
// workOrderRouter.route("/updateConsumption/:id").patch(updateInMasterBom);
workOrderRouter.route("/addNewChild/:id").patch(workOrderController_1.addChildPartInMasterBom);
workOrderRouter.route("/:id").get(workOrderController_1.getWorkOrder);
// edit work order quantity
workOrderRouter.route("/:id").patch(workOrderController_1.updateWorkOrder).delete(workOrderController_1.deleteWorkOrder);
// change process in workOrder  
workOrderRouter.route("/updateProcess/:id").patch(workOrderController_1.updateProcessInWorkOrder);
// not for use 
workOrderRouter.route("/changeWorkOrder").post(workOrderController_1.changeWorkOrderInProductionSlip);
exports.default = workOrderRouter;
