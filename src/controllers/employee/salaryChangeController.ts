import { NextFunction, Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import EmployeeModel from "../../database/models/employeeModel";
import SalaryLogModel from "../../database/models/salaryLogModel";
export const changeSalary=catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try{
      const employees = await EmployeeModel.find({});
      
      if (employees && employees.length > 0) {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0)
        const month=currentDate.getMonth()+1;
        let year = currentDate .getUTCFullYear();
        const firstDate = new Date(year, month - 1, 1);
       


        

        for (const emp of employees) {
          
          const salaryRecords = await SalaryLogModel.find({
            employeeId: emp._id,
            applicableMonth: {
              $gte: firstDate,
              $lt: currentDate,
            },
          });
          
          if (salaryRecords.length > 0) {
            console.log("HII");
            emp.salary=salaryRecords[salaryRecords.length-1].salary
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
    }
    catch(error){
      next(error)
    }
  });