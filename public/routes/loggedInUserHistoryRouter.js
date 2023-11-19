"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loggInHistoryController_1 = require("../controllers/employee/loggInHistoryController");
const auth_1 = require("../middleware/auth");
const loggedInUserHistoryRouter = (0, express_1.Router)();
loggedInUserHistoryRouter.get("/", auth_1.isAuthenticatedAdminOrHR, loggInHistoryController_1.getLoggedInUserHistory);
loggedInUserHistoryRouter.delete("/:id", auth_1.isAuthenticatedAdminOrHR, loggInHistoryController_1.deleteLoginHistory);
exports.default = loggedInUserHistoryRouter;
