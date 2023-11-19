import { NextFunction, Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import EmployeeModel from "../../database/models/employeeModel";
import attendanceModel from "../../database/models/attendanceModel";
import v2AttendanceModel from "../../database/models/v2attendanceModel";
export const changeActiveStatus = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employees = await EmployeeModel.find({});
      
      if (employees && employees.length > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0)
        const twentyDaysAgo = new Date(currentDate.getTime());
        twentyDaysAgo.setDate(currentDate.getDate() - 20);
        twentyDaysAgo.setHours(0, 0, 0, 0);
        

        for (const emp of employees) {
          const attendanceRecords = await v2AttendanceModel.find({
            employeeId:emp._id,
            date: {
              $gt: twentyDaysAgo,
              $lt: currentDate,
            },
          });
          //console.log(emp.name,attendanceRecords.length )

          if (attendanceRecords.length === 0) {
            emp.BarCodeStatus = false;
            emp.active = false;
          }

          await emp.save();
          //console.log("Api called")
        }
        
        res.status(200).json({
          success: true,
          message: "Employee Active Status Changed.",
        });
      } else {
        res.status(200).json({
          success: true,
          message: "No employees found to update.",
        });
      }
    } catch (error) {
      // Handle any errors, for example, using 'next' middleware.
      next(error);
    }
  }
);
