import { Router } from "express";
import {
  deleteLoginHistory,
  getLoggedInUserHistory,
} from "../controllers/employee/loggInHistoryController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const loggedInUserHistoryRouter = Router();

loggedInUserHistoryRouter.get("/",isAuthenticatedAdminOrHR, getLoggedInUserHistory);
loggedInUserHistoryRouter.delete("/:id",isAuthenticatedAdminOrHR, deleteLoginHistory);

export default loggedInUserHistoryRouter;
