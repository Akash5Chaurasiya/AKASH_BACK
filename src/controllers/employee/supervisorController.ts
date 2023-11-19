import { Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import EmployeeModel from "../../database/models/employeeModel";
import JobProfileModel from "../../database/models/jobProfileModel";

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}
export const getEmployeesUnderMe = catchErrorAsync(
  async (req: CustomRequest<EmployeeDocument>, res: Response) => {
    if (req.employee) {
      const loggedInEmployee = await EmployeeModel.findById(
        req.employee._id
      ).select({
        name: 1,
        group: 1,
        jobProfileId: 1,
        employeeCode: 1,
      });
      if (loggedInEmployee) {
        const jobprofile = await JobProfileModel.findOne({
          _id: loggedInEmployee.jobProfileId,
        });
        const childJobProfile = jobprofile?.childProfileId;
        const underEmployeee = await EmployeeModel.find({
          jobProfileId: { $in: childJobProfile },
        })
          .populate({
            path: "jobProfileId",
            select: "jobProfileName",
          })
          .select({ name: 1, jobprofileId: 1, employeeCode: 1 });
        res.status(200).json({
          sucess: true,
          message: "getting employees under me",
          total: underEmployeee.length,
          underEmployeee,
        });
      }
    } else {
      res.status(404).json({
        sucess: false,
        message: "login as an employee",
      });
    }
  }
);
