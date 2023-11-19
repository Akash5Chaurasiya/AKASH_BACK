import express, {Request,Response, NextFunction } from "express";
import { EmployeeReport, MachineReport, SingleEmployeeReport, getNewReportPerMachine, getReportPerEmployee, getReportPerMachine, singleMachineReport } from "../controllers/bomControllers/productivityReportController";


const productivityReportRouter = express.Router();



productivityReportRouter.route("/getReport").post(getReportPerEmployee);

productivityReportRouter.route("/getMachineReport").post(getNewReportPerMachine);

productivityReportRouter.route("/getReportApp").post(EmployeeReport);

productivityReportRouter.route("/singleEmployeeReport").post(async (req,resp,next)=>{
try {
    const data = await SingleEmployeeReport(req.body);
   resp.status(200).json({...data});
} catch (error) {
    resp.sendStatus(400);
}
});

productivityReportRouter.route("/singleMachineReport").post(async (req:Request,resp:Response,next:NextFunction)=>{
   try { const { machineId, date } = req.body;
    const data = await MachineReport({ machineId, date });
    resp.status(200).json({...data })
    } catch (error) {
      console.log(error);
      resp.sendStatus(500);
    }
});

export default productivityReportRouter;