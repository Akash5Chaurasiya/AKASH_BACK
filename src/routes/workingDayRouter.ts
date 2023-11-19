import express, { Router } from "express";
import {
  addWorkingDay,
  deleteMonth,
  getMonthData,
  updateWorkingDay,
} from "../controllers/employee/workingDayController";

export const workingDayRouter = Router();

workingDayRouter.route("/").get(getMonthData);
workingDayRouter.route("/add").post(addWorkingDay);
workingDayRouter.route("/update").patch(updateWorkingDay);
workingDayRouter.route("/delete").delete(deleteMonth);
