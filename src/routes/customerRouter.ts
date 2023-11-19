import express from "express";

import {
  addCustomer,
  deleteCustomer,
  getAllCustomer,
  getCustomer,
  updateCoustomer,
} from "../controllers/bomControllers/customController";
const customerRouter = express.Router();

customerRouter.route("/").get(getAllCustomer);  // added search and filter with Customer COde , query is name and code;
customerRouter.route("/:id").get(getCustomer);
customerRouter.route("/add").post(addCustomer);
customerRouter.route("/:id").delete(deleteCustomer);
customerRouter.route("/:id").patch(updateCoustomer);

export default customerRouter;
