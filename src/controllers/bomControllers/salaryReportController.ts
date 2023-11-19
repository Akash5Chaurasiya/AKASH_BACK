import { NextFunction, Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import EmployeeModel from "../../database/models/employeeModel";
import ProductionSlipModel from "../../database/models/productionSlipModel";
import v2AttendanceModel from "../../database/models/v2attendanceModel";

export const getSalaryReport = catchErrorAsync(
    async (req: Request, resp: Response, next: NextFunction) => {
        const { date } = req.body;
        let startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        let endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        const attandenceEmployees = await v2AttendanceModel.find({
            date: {
                $gte: startDate,
                $lte: endDate,
            },
            productiveHours: {
                $gt: 0,
            }
        }).select({ employeeId: 1, date: 1, shift: 1, productionSlipNumbers: 1, productiveHours: 1, punches: 1 }).lean();
        const employeeIds: string[] = [];
        const productionSlipNumbers: string[] = [];
        const attandenceStore: any = {};
        attandenceEmployees.forEach((a: any) => {
            const startTime = new Date(a.punches[0].punchIn).getTime();
            let endTime;
            if (a.punches[a.punches.length - 1].punchOut) {
                endTime = new Date(a.punches[a.punches.length - 1].punchOut).getTime();
            } else {
                endTime = new Date().getTime();
            }
            attandenceStore[a.employeeId + ""] = {
                productionSlipNumbers: a.productionSlipNumbers,
                totalWorkingTime: (endTime - startTime) / (1000 * 60 * 60)
            };
            employeeIds.push(a.employeeId + "");
            a.productionSlipNumbers.forEach((p: any) => {
                !productionSlipNumbers.includes(p) && productionSlipNumbers.push(p);
            })
        })
        const productionSlips = await ProductionSlipModel.find({
            productionSlipNumber: {
                $in: productionSlipNumbers
            }
        }).lean();
        const productionSlipStore: any = {};
        productionSlips.forEach(p => {
            productionSlipStore[p.productionSlipNumber] = p;
        })
        const employees = await EmployeeModel.find({
            _id: {
                $in: employeeIds,
            }
        }).lean();
        const result: any = [];
        employees.forEach(e => {
            let totalTimeSpend = 0;
            const productionSlips: any = [];
            attandenceStore[e._id].productionSlipNumbers.forEach((p: any) => {
                if (productionSlipStore[p].status !== "cancel") {
                    let itemProduced = 0;
                    let timeSpend = 0;
                    const employeeIdsInThisSlip: any = [];
                    productionSlipStore[p].working.forEach((w: any) => {
                        w.employees.forEach((eId: any) => {
                            if (eId.employeeId + "" === e._id + "") {
                                w.employees.forEach((emp: any) => {
                                    !employeeIdsInThisSlip.includes(emp.employeeId + "") && employeeIdsInThisSlip.push(emp.employeeId + "");
                                })
                                const startTime = new Date(w.startTime).getTime();
                                const endTime = new Date(w.endTime).getTime();
                                totalTimeSpend += (endTime - startTime) / (1000 * 60 * 60);
                                timeSpend += (endTime - startTime) / (1000 * 60 * 60);
                                itemProduced += w.itemProduced / w.employees.length
                            }
                        })
                    })
                    productionSlips.push({
                        partName: productionSlipStore[p].part.partName,
                        partId: productionSlipStore[p].part._id,
                        productionSlipnumber: p,
                        timeSpend: timeSpend,
                        itemProduced: itemProduced
                    })
                }
            })

            // RATIO
            let totalActualTime = 0;
            productionSlips.forEach((p: any, i: number) => {
                productionSlips[i].ratio = p.timeSpend / totalTimeSpend;
                productionSlips[i].actualTime = (p.timeSpend / totalTimeSpend) * p.timeSpend;
                productionSlips[i].ppe = p.itemProduced / ((p.timeSpend / totalTimeSpend) * p.timeSpend);
                totalActualTime += (p.timeSpend / totalTimeSpend) * p.timeSpend;
            })

            // PER PEICE COST
            productionSlips.forEach((p: any, i: number) => {
                productionSlips[i].perPeiceCost = ((e.salary / 26) / totalActualTime) / productionSlips[i].ppe;
            });
            if (productionSlips.length > 0) {
                result.push({
                    employeeId: e._id,
                    employeeName: e.name,
                    monthlySalary: e.salary,
                    perDaySalary: e.salary / 26,
                    productionSlips: productionSlips,
                    totalTimeSpend: totalTimeSpend,
                    totalActualTime: totalActualTime,
                    totalWorkingTime: attandenceStore[e._id].totalWorkingTime,
                    salaryPerActualHour: (e.salary / 26) / totalActualTime
                })
            }
        })
        resp.status(200).json({
            success: true,
            message: "Salary Report fetch successfully",
            result
        })
    }
);

// SINGLE EMPLOYEE SALARY REPORT
export const getSinglePartCostReport = catchErrorAsync(
    async (req: Request, resp: Response, next: NextFunction) => {
        const { partId } = req.params;
        const allProductionSlips = await ProductionSlipModel.find({}).lean();
        const allEmployeeDetails = await EmployeeModel.find().lean();
        const employeeSalaryStore: any = {};

        allEmployeeDetails.forEach((e) => {
            const id = e._id + "";
            employeeSalaryStore[id] = {
                salary: e.salary,
                workingHours:e.workingHours
            }
        })
        const productionSlipStore: any = {};

        allProductionSlips.forEach((a) => {
            const number = a.productionSlipNumber + "";
            productionSlipStore[number] = { ...a };
        })

        const productionSlips = await ProductionSlipModel.find({ "part._id": partId, status: { $in: ["completed", "cnc"] }, itemProduced: { $gt: 0 } }).lean();
        const result: any = [];
        for (let p of productionSlips) {
            const date = p.durationFrom;
            const partId = p.part._id + "";
            for (let w of p.working) {
                for (let e of w.employees) {
                    const employeeId = e.employeeId + "";
                    const salary = employeeSalaryStore[employeeId].salary;
                    const workingHours = employeeSalaryStore[employeeId].workingHours;
                    const data = await employeeSalaryReport(employeeId, partId, date, productionSlipStore);
                    if (data) {
                        const totalWorkingHours = data.totalWorkingHours;
                        const perDaySalary = salary/26;
                        const perHourRate = (perDaySalary / workingHours);
                        const totalSalary = perHourRate * totalWorkingHours;
                        const perHourCost = (totalSalary / data.productiveTime);
                        const perPartCost = perHourCost / data.perHourProduction;
                        if (data.totalPartProduction > 0) {
                            result.push({ ...data, employeeName: e.employeeName, employeeId, perHourCost, perPartCost, perDaySalary ,monthlySalary:salary });
                        };
                    };
                };;
            };
        };
        
        resp.status(200).json({
            success: true,
            message: "getting data",
            result
        })
    }
);


const employeeSalaryReport = async (employeeId: string, partId: string, date: Date, productionSlipStore: any) => {

    try {

        const newDate = new Date(date);
        newDate.setUTCHours(0, 0, 0, 0);
        const nextDate = new Date(newDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const attendance:any = await v2AttendanceModel.findOne({
            employeeId, date: {
                $gte: newDate,
                $lt: nextDate
            }
        }).lean();

        if (!attendance) {
            return;
        };

        const firstPunchIn = new Date(attendance.punches[0].punchIn);
        const lastPunchOut = new Date(attendance.punches[attendance.punches.length-1]?.punchOut);
        const secondlastPunchOut = new Date(attendance.punches[attendance.punches.length-2]?.punchOut);

       let totalWorkingHours;
       if(lastPunchOut){
        totalWorkingHours = (lastPunchOut.getTime() - firstPunchIn.getTime())/(1000*60*60);
       }else if(secondlastPunchOut){
        totalWorkingHours = (secondlastPunchOut.getTime() - firstPunchIn.getTime())/(1000*60*60);
       }else{
        totalWorkingHours = 0;
       }
     

        const productiveTime = attendance.productiveHours;
        const productionSlipsNumbers = attendance.productionSlipNumbers;
        const productionSlips = [];
       if(!productionSlipsNumbers){
            return;
        }
        for (let p of productionSlipsNumbers) {
            const data = productionSlipStore[p + ""];
            if (data.status === "completed" || data.status === "cnc") productionSlips.push(data);
        };

        let totalTime = 0;
        let totalPartProduction = 0;
        let totalPartTime = 0;
        const productionSlipNumbers:string[] = []
        for (let p of productionSlips) {
            const PartId = p.part._id + "";
            for (let w of p.working) {
                const startTime = new Date(w.startTime);

                const endTime = new Date(w.endTime);
                const time = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
                const totalEmployee = w.employees.length;
                for (let e of w.employees) {
                    if ((e.employeeId + "" === employeeId) && PartId === partId + "") {
                        totalPartTime += time;
                        totalPartProduction += (w.itemProduced / totalEmployee);
                        productionSlipNumbers.push(p.productionSlipNumber);
                    }
                };
                totalTime += time;
            };
        };

        const ratio = totalPartTime / totalTime;
        const actualTime = ratio * productiveTime;
        const perHourProduction = totalPartProduction / actualTime;

        return {
            date: newDate,
            totalTime,
            totalPartProduction,
            totalPartTime,
            productiveTime,
            actualTime,
            ratio,
            productionSlipNumbers,
            totalWorkingHours,
            perHourProduction,
        }

    } catch (error) {
        console.log(error)
    }
}