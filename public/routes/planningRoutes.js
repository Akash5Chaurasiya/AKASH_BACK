"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const planningController_1 = require("../controllers/bomControllers/planningController");
const auth_1 = require("../middleware/auth");
const planningRouter = express_1.default.Router();
// add empty planning sheet per month of each child Part
planningRouter.route("/addEmpty").post(planningController_1.addPlanningSheet);
planningRouter.route("/getAll").post(planningController_1.getAllPlanning);
planningRouter.route("/update/:planningId").patch(auth_1.isAuthenticatedAdminOrHR, planningController_1.updatePlanning);
// delete Planning personal use only
planningRouter.route("/delete").delete(planningController_1.deletePlanningPerMonth);
// planningRouter.route("/checking").post(checking);
exports.default = planningRouter;
