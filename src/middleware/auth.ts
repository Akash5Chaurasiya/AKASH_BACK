import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { ParamsDictionary, Query } from 'express-serve-static-core';
import { JwtPayload } from 'jsonwebtoken';
import { AdminDocument } from "../database/entities/adminDocument";
import AdminModel from "../database/models/adminModel";
import { EmployeeDocument } from "../database/entities/employeeDocument";
import EmployeeModel from "../database/models/employeeModel";
import JobProfileModel from "../database/models/jobProfileModel";


interface CustomRequest extends Request {
  admin?: AdminDocument;
  employee?: EmployeeDocument;
  attendanceManager?: EmployeeDocument;
  dbManager?: EmployeeDocument;
  supervisor?: EmployeeDocument;
}

export const isAuthenticatedAdminOrHR: RequestHandler<ParamsDictionary, any, any, Query> = async (
  req: CustomRequest,
  resp: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { token } = req.cookies;

  if (!token) {
    return resp.status(404).json({
      success: false,
      message: "Login first.",
    });
  }

  try {

    const decodedData: JwtPayload = jwt.verify(token, process.env.JWT_KEY as Secret) as JwtPayload;

    if (decodedData) {
      const admin = await AdminModel.findById({ _id: decodedData.user });
      if (admin) {
        req.admin = admin;
        return next()
      } else {
        const employee = await EmployeeModel.findById({ _id: decodedData.user });
        if (employee) {
          req.employee = employee;
          return next()
        } else {
          return resp.status(404).json({
            success: false,
            message: "Employee not found in middleware.",
          });
        }
      }
    } else {
      return resp.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
  } catch (error) {
    return resp.status(401).json({
      success: false,
      message: "Invalid token in catch.",
    });
  }
};
export const isAuthenticatedAdminOrAttendanceManager: RequestHandler<ParamsDictionary, any, any, Query> = async (
  req: CustomRequest,
  resp: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { token } = req.cookies;

  if (!token) {
    return resp.status(404).json({
      success: false,
      message: "Login first.",
    });
  }

  try {

    const decodedData: JwtPayload = jwt.verify(token, process.env.JWT_KEY as Secret) as JwtPayload;
    if (decodedData) {
      const admin = await AdminModel.findById({ _id: decodedData.user });
      if (admin) {
        req.admin = admin;
        return next()
      } else {
        const employee = await EmployeeModel.findById({ _id: decodedData.user });
        if (employee) {
          const role = employee.role;
          if (role === "attendanceManager") {
            req.attendanceManager = employee;
            return next()
          }
        } else {
          return resp.status(404).json({
            success: false,
            message: "Employee is not attendanceManager.",
          });
        }
      }
    } else {
      return resp.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
  } catch (error) {
    return resp.status(401).json({
      success: false,
      message: "Invalid token in catch.",
    });
  }
};
export const isAuthenticatedAdminOrDbManager: RequestHandler<ParamsDictionary, any, any, Query> = async (
  req: CustomRequest,
  resp: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { token } = req.cookies;

  if (!token) {
    return resp.status(404).json({
      success: false,
      message: "Login first.",
    });
  }

  try {
    const decodedData: JwtPayload = jwt.verify(token, process.env.JWT_KEY as Secret) as JwtPayload;
    if (decodedData) {
      const admin = await AdminModel.findById({ _id: decodedData.user });
      if (admin) {
        req.admin = admin;
        return next()
      } else {
        const employee = await EmployeeModel.findById({ _id: decodedData.user });
        if (employee) {
          const role = employee.role;
          if (role === "dbManager") {
            req.dbManager = employee;
            return next()
          } else {
            return resp.status(404).json({
              success: false,
              message: "Employee is not Database Manager.",
            });
          }
        } else {
          return resp.status(404).json({
            success: false,
            message: "Employee is not found.",
          });
        }
      }
    } else {
      return resp.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
  } catch (error) {
    return resp.status(401).json({
      success: false,
      message: "Invalid token in catch.",
    });
  }
};

export const isAuthenticatedSupervisor: RequestHandler<ParamsDictionary, any, any, Query> = async (
  req: CustomRequest,
  resp: Response,
  next: NextFunction
): Promise<void | Response> => {
  const { token } = req.cookies;

  if (!token) {
    return resp.status(404).json({
      success: false,
      message: "Login first.",
    });
  }

  try {

    const decodedData: JwtPayload = jwt.verify(token, process.env.JWT_KEY as Secret) as JwtPayload;
    if (decodedData) {
      const admin = await AdminModel.findById({ _id: decodedData.user });
      if (admin) {
        req.admin = admin;
        return next()
      } else {
        const employee = await EmployeeModel.findById({ _id: decodedData.user });
        if (employee) {
          const role = employee.role;
          const job = await JobProfileModel.findOne({ _id: employee.jobProfileId })

          if (role === "supervisor" && job?.isSupervisor) {
            req.supervisor = employee;
            return next()
          } else {
            return resp.status(404).json({
              success: false,
              message: "Employee is not supervisor.",
            });
          }
        } else {
          return resp.status(404).json({
            success: false,
            message: "Employee is not supervisor.",
          });
        }
      }
    } else {
      return resp.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
  } catch (error) {
    return resp.status(401).json({
      success: false,
      message: "Invalid token in catch.",
    });
  }
};