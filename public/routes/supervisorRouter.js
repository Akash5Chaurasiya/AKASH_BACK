"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supervisorController_1 = require("../controllers/employee/supervisorController");
const auth_1 = require("../middleware/auth");
const supervisorRouter = express_1.default.Router();
supervisorRouter.route("/employees").get(auth_1.isAuthenticatedAdminOrHR, supervisorController_1.getEmployeesUnderMe);
exports.default = supervisorRouter;
