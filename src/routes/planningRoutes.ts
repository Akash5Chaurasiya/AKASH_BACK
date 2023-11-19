import express from "express";
import { addPlanningSheet, deletePlanningPerMonth, getAllPlanning, updatePlanning } from "../controllers/bomControllers/planningController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";


const planningRouter = express.Router();


// add empty planning sheet per month of each child Part
planningRouter.route("/addEmpty").post(addPlanningSheet);

planningRouter.route("/getAll").post(getAllPlanning);

planningRouter.route("/update/:planningId").patch(isAuthenticatedAdminOrHR,updatePlanning);

// delete Planning personal use only
planningRouter.route("/delete").delete(deletePlanningPerMonth);

// planningRouter.route("/checking").post(checking);

export default planningRouter;