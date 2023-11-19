import { EmployeeDocument } from "../../database/entities/employeeDocument";
import EmployeeModel from "../../database/models/employeeModel";
import loginHistoryModel from "../../database/models/loginHistoryModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import { Request, Response } from "express";

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

export const getLoggedInUserHistory = catchErrorAsync(
  async (req: CustomRequest<EmployeeDocument>, res: Response) => {
    if (req.admin) {
      let {
        limit = 20,
        page = 1,
        date,
        nextDate,
      } = req.query as {
        limit?: number;
        page?: number;
        date?: string;
        nextDate?: string;
      };
      limit = +limit;
      page = +page;
      let filterDate;
      let nextDay;
      if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
      } else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
      }
      if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 1);
      } else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
      }
      const skip = (page - 1) * limit;
      const forTotalNumber = await loginHistoryModel.find().exec();
      const logs = await loginHistoryModel
        .find()
        .limit(limit)
        .skip(skip)
        .sort({ logInTime: -1 })
        .exec();

      if (logs.length > 0) {
        res.status(200).json({
          status: true,
          message: "Successfully fetched login history",
          totalLogs: forTotalNumber.length,
          data: logs,
        });
      } else {
        res.status(200).json({
          status: false,
          message: "No login history found",
        });
      }
    } else {
      res.status(401).json({
        status: false,
        message: "You are not authorized to access this route",
      });
    }
  }
);

export const deleteLoginHistory = catchErrorAsync(
  async (req: CustomRequest<EmployeeDocument>, res: Response) => {
    if (req.admin) {
      const { id } = req.params;
      const log = await loginHistoryModel.findByIdAndDelete(id).exec();
      if (log) {
        res.status(200).json({
          succss: true,
          message: "Successfully deleted login history",
        });
      } else {
        res.status(200).json({
          succss: false,
          message: "Failed to delete login history",
        });
      }
    } else {
      res.status(401).json({
        status: false,
        message: "You are not authorized to access this route",
      });
    }
  }
);
