import { Request, Response, NextFunction } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import EmployeeModel from "../../database/models/employeeModel";
import v2AttendanceModel from "../../database/models/v2attendanceModel";
import ProductionSlipModel from "../../database/models/productionSlipModel";
import JobProfileModel from "../../database/models/jobProfileModel";
import EmployeeDocsModel from "../../database/models/employeeDocsModel";
import {
  getProductivityPerEmployee,
  gettingHours,
} from "./productionSlipController";
import ShopModel from "../../database/models/shopModel";
import ShopLogModel from "../../database/models/shopLogModel";
import groupModel from "../../database/models/groupModel";
import machineModel from "../../database/models/machineModel";
import globalProcessModel from "../../database/models/globalProcessModel";
import { ProductionSlipDocument } from "../../database/entities/productionSlipDocument";
import mongoose from "mongoose";


// Define the type of productionSlipStore
type ProductionSlipStore = Record<string, ProductionSlipDocument>;

// getting employee report
export const  getReportPerEmployee = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const {
      employeeIds,
      jobProfileNames,
      groupNames,
      shops,
      date,
      nextDate,
      shifts,
    } = req.body as {
      employeeIds: string[];
      shops: string[];
      jobProfileNames: string[];
      groupNames: string[];
      date: string;
      nextDate: string;
      shifts: string[];
    };
    
    let newDate;
    let newNextDate;

    if (date && nextDate) {
      newDate = new Date(date);
      newNextDate = new Date(nextDate);
      newNextDate.setDate(newNextDate.getDate() + 1);
    } else if (date) {
      newDate = new Date(date);
      newNextDate = new Date(newDate);
      newNextDate.setDate(newNextDate.getDate() + 1);
    } else {
      newDate = new Date(new Date());
      newNextDate = new Date(newDate);
      newNextDate.setDate(newNextDate.getDate() + 1);
    }

    const EmployeeIds: any = [];

    if (employeeIds && employeeIds.length > 0 && shops && shops.length == 0) {
      employeeIds.forEach((e) => {
        EmployeeIds.push(e);
      });
    } else if (shops && shops.length) {
      const selectedShops = await ShopModel.find({
        shopName: { $in: shops },
      }).lean();

      const shopIds = selectedShops.map((s) => s._id);
      if (employeeIds && employeeIds.length > 0) {
        const shopLogs = await ShopLogModel.find({
          shopId: shopIds,
          "employees.employeeId": { $in: employeeIds },
          date: {
            $gte: newDate,
            $lt: newNextDate,
          },
        });
        for (let s of shopLogs) {
          for (let e of s.employees) {
            if (employeeIds.includes(e.employeeId + "")) {
              const id = e.employeeId;
              EmployeeIds.push(id);
            }
          }
        }
      } else {
        const shopLogs = await ShopLogModel.find({
          shopId: shopIds,
          date: {
            $gte: newDate,
            $lt: newNextDate,
          },
        });

        for (let s of shopLogs) {
          for (let e of s.employees) {
            const id = e.employeeId;
            EmployeeIds.push(id);
          };
        };
      };
    };

    if (jobProfileNames && jobProfileNames.length > 0) {
      const jobProfileDetails = await JobProfileModel.find({
        jobProfileName: { $in: jobProfileNames },
      }).lean();
      const jobProfileIds = jobProfileDetails.map((j) => j._id);
      const employees = await EmployeeModel.find({
        jobProfileId: { $in: jobProfileIds },
      });
      employees.forEach((e) => {
        EmployeeIds.push(e._id);
      });
    }

    if (groupNames && groupNames.length > 0) {
      const Groups = await groupModel
        .find({ groupName: { $in: groupNames } })
        .lean();

      const groupIds = Groups.map((g) => g._id);

      const employees = await EmployeeModel.find({
        groupId: { $in: groupIds },
      }).lean();

      employees.forEach((e) => {
        const id = e._id;
        EmployeeIds.push(id);
      });
    }

    const allProductionSlips = await ProductionSlipModel.find()
      .select({ productionSlipNumber: 1, shop: 1, process: 1,working:1 })
      .lean();
    const productionSlipStore: ProductionSlipStore = {};

    allProductionSlips.forEach((p) => {
      const productionSlipNumber = p.productionSlipNumber + "";
      productionSlipStore[productionSlipNumber] = {
        ...p,
      };
    });

    const jobProfiles = await JobProfileModel.find().lean();
    const jobProfileStore: any = {};

    jobProfiles.forEach((j) => {
      const id = j._id + "";
      jobProfileStore[id] = {
        ...j,
      };
    });

    const employeeDocs = await EmployeeDocsModel.find({
      employeeId: { $in: EmployeeIds },
    }).lean();
    const docsStore: any = {};

    employeeDocs.forEach((e) => {
      const id = e.employeeId + "";
      docsStore[id] = {
        ...e,
      };
    });

    const employees = await EmployeeModel.find({
      _id: { $in: EmployeeIds },
    }).lean();
    const employeeStore: any = {};

    employees.forEach((e) => {
      const id = e._id + "";
      employeeStore[id] = { ...e };
    });
    const allAttendance: any = await v2AttendanceModel
      .find({
        employeeId: { $in: EmployeeIds },
        date: {
          $gte: newDate,
          $lte: newNextDate,
        },
        shift: { $in: shifts },
      })
      .lean();

    const result: any = [];
    let shopNewField = 0;
    let shopProductiveHours = 0;
    let shopTotalProductionSlipHours =0;

    for (let a of allAttendance) {
      const employeeId = a.employeeId + "";
      const employee = employeeStore[employeeId];
      const punchIn = new Date(a.punches[0].punchIn);
      const shift = a.shift;
      let punchOut;
      let totalhours = 0;
      if (a.punches[a.punches.length - 1].punchOut) {
        punchOut = new Date(a.punches[a.punches.length - 1].punchOut);
        totalhours =
          (punchOut.getTime() - punchIn.getTime()) / (60 * 60 * 1000);
      } else {
        const currentTime = new Date();
        currentTime.setTime(currentTime.getTime() + 330 * 60 * 1000);
        totalhours = (currentTime.getTime() - punchIn.getTime()) / (60 * 60 * 1000);
      }

      let totalProductiveHours;
      let slipNumbers: any = [];

      totalProductiveHours = a.productiveHours;
      slipNumbers = a.productionSlipNumbers;
      if(!slipNumbers.length){
        continue;
      }
      const productionSlips = [];
      if(slipNumbers){
      for(let p of slipNumbers){
        const productionSlip = productionSlipStore[p];
        if (productionSlip) {
          productionSlips.push(productionSlip);
        };
      };
    };
      
      let totalProductionSlipHours = 0;

      for (let p of productionSlips ){

        for(let w of  p.working){
          if(w.endTime && w.startTime){
            for(let e of w.employees){
              if(e.employeeId+"" ===employeeId+""){
                const startTime = new Date(w.startTime || new Date);
                const endTime = new Date(w.endTime || new Date);
                totalProductionSlipHours += (endTime.getTime() - startTime.getTime())/(1000*60*60);
              };
            };
          };
        };
      };

      const data = await SingleEmployeeReport({
        employeeId: employee._id + "",
        date,
        shift,
      });
      const newResult = data?.result?.newResult || [];

      let totalNewField = 0;

      if (newResult.length) {
        let index = 0;
        for (let n of newResult) {
          let totalProductiveTime = 0;
          let totalProduction = 0;
          let actualTime = 0;
          for (let d of n.data) {
            totalProductiveTime += d.actualTime || 0;
            totalProduction += d.actualPartPerHour * d.actualTime || 0;
          }

          const weightedAverage = totalProduction / totalProductiveTime;
          n.weightedAverage = weightedAverage;
          let productivityPercentage = 0;

          for (let d of n.data) {
            const percentage = (((d.actualPartPerHour || 0) - weightedAverage) / weightedAverage) * 100;
            d.percentage = percentage;

            if (slipNumbers[index] === d.productionSlipNumber) {
              productivityPercentage = d.percentage;
              actualTime = d.actualTime || 0;
            }
          }
          index++;
          n.productivityPercentage = productivityPercentage || 0;
          n.newField = productivityPercentage * actualTime;
          totalNewField += n.newField;
        }
      }

      totalNewField = totalNewField / totalProductiveHours;

      const obj = {
        date: a.date,
        shift: a?.shift,
        employeeName: employee.name,
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        jobProfileName: jobProfileStore[employee.jobProfileId + ""].jobProfileName,
        profilePicture: docsStore[employee._id + ""]?.profilePicture || "",
        productionSlips,
        totalhours,
        totalProductionSlipHours,
        totalNewField,
        totalProductiveHours,
        slipNumbers,
        newResult,
      };

      shopTotalProductionSlipHours += totalProductionSlipHours;
      shopNewField += totalNewField * totalProductiveHours;
      shopProductiveHours += totalProductiveHours;
      result.push(obj);
    }

    resp.status(200).json({
      success: true,
      message: `Getting report successfully.`,
      shopReport: {
        shopTotalProductionSlipHours,
        shopProductiveHours,
        shopNewField,
      },
      result,
    });
  }
);

// MACHINE REPORT
export const getReportPerMachine = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { date, shop, machinesArr } = req.body;
    let startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    let endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query: any = {};
    if (machinesArr && machinesArr.length > 0) {
      query["machineName"] = {
        $in: machinesArr,
      };
    }
    // SHOP FILTER
    if (shop && shop.length > 0) {
      let shopIds: string[] = [];
      const shops = await ShopModel.find({ shopName: { $in: shop } });
      shops.forEach((s) => {
        shopIds.push(s._id);
      });
      if (shopIds.length > 0) {
        let processIds: string[] = [];
        const processes = await globalProcessModel.find({
          "shop.shopId": { $in: shopIds },
        });
        processes.forEach((p) => {
          processIds.push(p._id);
        });
        if (processIds.length > 0) {
          query["process"] = {
            $in: processIds,
          };
        }
      }
    }

    const machines = await machineModel.find({
      ...query,
    });
    const machineStore: any = {};
    let machineIds: string[] = [];
    machines.forEach((m) => {
      machineStore[m._id] = {
        _id:m._id,
        machineName: m.machineName,
        productiveTimeArr: [],
        productiveHour: 0,
        totalWorkingHours: 0,
        productionSlips: [],
        process: [],
        shop: [],
        totalProductionSlipTime:0
      };
      machineIds.push(m._id);
    });

    const productionSlips = await ProductionSlipModel.find({
      durationFrom: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $nin: "cancel" },
      "working.machines.machineId": {
        $in: machineIds,
      },
    }).lean();

    productionSlips.forEach((p) => {
      p.working.forEach((w) => {
        w.machines.forEach((m) => {
          const startTime = w.startTime
            ? new Date(w.startTime).getTime()
            : new Date().getTime();
          const endTime = w.endTime
            ? new Date(w.endTime).getTime()
            : new Date().getTime();
          const workingTime = (endTime - startTime) / (1000 * 60 * 60);
          if (machineStore[m.machineId + ""]) {
            const obj = { 
              startTime: new Date(startTime),
              endTime: new Date(endTime),
            };
            machineStore[m.machineId + ""] = {
              ...machineStore[m.machineId + ""],
              totalWorkingHours:
                machineStore[m.machineId + ""].totalWorkingHours + workingTime,
              productionSlips: machineStore[m.machineId + ""].productionSlips.includes(p.productionSlipNumber) ? [...machineStore[m.machineId + ""].productionSlips]: [...machineStore[m.machineId + ""].productionSlips, p.productionSlipNumber, ],
              process: machineStore[m.machineId + ""].productionSlips.includes(
                p.productionSlipNumber
              )
                ? [...machineStore[m.machineId + ""].process]
                : [
                    ...machineStore[m.machineId + ""].process,
                    p.process.processName,
                  ],
              shop: machineStore[m.machineId + ""].productionSlips.includes(
                p.productionSlipNumber
              )
                ? [...machineStore[m.machineId + ""].shop]
                : [...machineStore[m.machineId + ""].shop, p.shop.shopName],
            };
            machineStore[m.machineId + ""].productiveTimeArr.push(obj);
            machineStore[m.machineId + ""].productiveHour = gettingHours(
              machineStore[m.machineId + ""].productiveTimeArr
            );
          }
        });
      });
    });
    const result: any = [];
    for (let m in machineStore) {
      const data = await MachineReport({machineId : machineStore[m]._id+"" , date });
      
      result.push({
        percentage:data.newData,
        machineId:machineStore[m]._id,
        machineName: machineStore[m].machineName,
        productiveHour: machineStore[m].productiveHour,
        totalWorkingHours: machineStore[m].totalWorkingHours,
        productionSlips: machineStore[m].productionSlips,
        process: machineStore[m].process,
        shop: machineStore[m].shop,
      });
    }

    resp.status(200).json({
      success: true,
      message: "Getting Machine Report Successfully",
      result,
    });
  }
);

// MACHINE REPORT
export const getNewReportPerMachine = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { date, shop, machinesArr } = req.body;
    let startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    let endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let query: any = {};
    if (machinesArr && machinesArr.length > 0) {
      query["machineName"] = {
        $in: machinesArr,
      };
    }
    // SHOP FILTER
    if (shop && shop.length > 0) {
      let shopIds: string[] = [];
      const shops = await ShopModel.find({ shopName: { $in: shop } });
      shops.forEach((s) => {
        shopIds.push(s._id);
      });
      if (shopIds.length > 0) {
        let processIds: string[] = [];
        const processes = await globalProcessModel.find({
          "shop.shopId": { $in: shopIds },
        });
        processes.forEach((p) => {
          processIds.push(p._id);
        });
        if (processIds.length > 0) {
          query["process"] = {
            $in: processIds,
          };
        }
      }
    }

    const machines = await machineModel.find({
      ...query,
    }).lean();
    let machineIds: string[] = [];
    const machineDetailStore :any = {};
    machines.forEach((m) => {
      machineIds.push(m._id);
      machineDetailStore[m._id+""] = {...m}
    });

    const productionSlips = await ProductionSlipModel.find({
      durationFrom: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $nin: "cancel" },
      "working.machines.machineId": {
        $in: machineIds,
      },
    }).lean();
    const machineStore:any = {};
    for(let p of productionSlips){
      const newMachineArray = []
       for(let w of p.working){
         for(let m of w.machines){
          newMachineArray.push(m.machineId+"");
         }
       }
       const uniqueMachineArray = [...new Set(newMachineArray)];
       for(let u of uniqueMachineArray){
         if(!machineStore[u]){
          machineStore[u] = {
            slips :[]
          }
         }
         machineStore[u].slips.push({...p});
       }
    }
    const result:any = [];
    for(let m of machineIds){
      const slips:ProductionSlipDocument[] = machineStore[m+""]?.slips || [];
      const machineDetails = machineDetailStore[m+""];
       if(!slips.length){
        continue;
       };
       let totalHours = 0;
       let timeArray: { startTime: any; endTime: any }[] = [];
       const productionSlipNumbers:string[] = [];
       const shopNames:string[] = [];
       const processName :string[] = [];
       for(let s of slips){
          for(let w of s.working){
            if(w.startTime && w.endTime){
            for(let machine of w.machines){
                if(machine.machineId+"" === m+""){
                   const startTime = new Date(w.startTime);
                   const endTime   = new Date(w.endTime);
                   timeArray.push({startTime,endTime});
                   totalHours +=  (endTime.getTime() - startTime.getTime())/(1000*60*60);
                };
            };
           };
          };
          productionSlipNumbers.push(s.productionSlipNumber);
          processName.push(s.process.processName);
          shopNames.push(s.shop.shopName);
       };
       const data = await MachineReport({machineId : m+"" , date });

       const productiveHours = gettingHours(timeArray);
      
       const obj = {
        percentage:data.newData,
        machineId:machineDetails._id,
        machineName: machineDetails.machineName,
        productiveHour: productiveHours,
        totalWorkingHours:totalHours,
        productionSlips:productionSlipNumbers,
        process:processName,
        shop: shopNames,
       }
       result.push(obj);
    }

    resp.status(200).json({
      success: true,
      message: "Getting Machine Report Successfully",
      result
    });
  }
);

export const singleMachineReport = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  try {
    const { machineId } = req.body;

    const productionSlips = await ProductionSlipModel.find({
      "working.machines.machineId": machineId,
    }).lean();
    const result: any = [];
    for (let p of productionSlips) {
      const startDay = new Date(p.durationFrom);
      const data = await machineReport(machineId, startDay, productionSlips);
      result.push(data);
    }
    resp.status(200).json({
      success: true,
      message: "Getting data successfully.",
      result,
    });
  } catch (error) {
    console.log(error);
  }
};

const machineReport = async (
  machineId: string,
  date: Date,
  productionSlips: ProductionSlipDocument[]
) => {
  const newDate = new Date(date);
  newDate.setUTCHours(0, 0, 0, 0);
  const nextDate = new Date(newDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const productionSlipArray: ProductionSlipDocument[] = [];
  const timeArray: { startTime: any; endTime: any }[] = [];
  const productivityArray: any = [];

  for (let p of productionSlips) {
    const startDate = new Date(p.durationFrom);
    if (
      newDate.getTime() < startDate.getTime() &&
      nextDate.getTime() > startDate.getTime()
    ) {
      productionSlipArray.push(p);
    }
  }

  for (let p of productionSlipArray) {
    for (let t of p.working) {
      if (t.startTime && t.endTime) {
        for (let m of t.machines) {
          if (m.machineId + "" === machineId + "") {
            const startTime = new Date(t.startTime);
            const endTime = new Date(t.endTime);
            const obj = {
              startTime,
              endTime,
            };
            timeArray.push(obj);
          }
        }
      }
    }
    const totalHours =
      (new Date(p.durationTo).getTime() - new Date(p.durationFrom).getTime()) /
      (60 * 60 * 1000);

    const obj = {
      totalHours,
      date: newDate,
      nextDate,
      itemProduced: p.itemProduced,
      productiveTime: 0,
      productionSlipNumber: p.productionSlipNumber,
    };

    productivityArray.push(obj);
  }

  const productiveTime = gettingHours(timeArray) || 0;

  let totalHours = 0;
  let totalProduction = 0;
  for (let p of productivityArray) {
    totalHours += p.totalHours || 0;
    totalProduction += p.itemProduced || 0;
  }
  const perHourProduction = totalProduction / productiveTime;
  return {
    perHourProduction,
    productiveTime: productiveTime,
    productivityArray: productivityArray,
  };
};

// single employee report
export const SingleEmployeeReport = async (data: {
  employeeId: string;
  date: string;
  shift: string;
}) => {
  try {
    const { employeeId, date, shift } = data;
    let newDate;
    let newNextDate;
    newDate = new Date(date);
    newNextDate = new Date(newDate);
    newNextDate.setDate(newNextDate.getDate() + 1);
    const employeeDocs = await EmployeeDocsModel.find({
      employeeId: { $in: employeeId },
    }).lean();
    const docsStore: any = {};

    employeeDocs.forEach((e) => {
      const id = e.employeeId + "";
      docsStore[id] = {
        ...e,
      };
    });

    const allProductionSlips = await ProductionSlipModel.find({
      status: { $in: ["completed", "cnc"] },itemProduced:{$gt:0}
    }).lean();

    const productionSlipStore: any = {};
    const partSlipStore: any = {};

    allProductionSlips.forEach((p) => {
      const id = p.part._id + "";
      const productionSlipNumber = p.productionSlipNumber + "";
      if (!partSlipStore[id]) {
        partSlipStore[id] = { slips: [] };
      }

      partSlipStore[id].slips.push({ ...p });

      productionSlipStore[productionSlipNumber] = { ...p };
    });

    const employee = await EmployeeModel.findOne({
      _id: { $in: employeeId },
    }).lean();
    if (!employee) {
      return {
        success: false,
        message: `Employee with id ${employeeId} not found.`,
      };
    }

    const allAttendance: any = await v2AttendanceModel
      .find({
        employeeId: employee?._id,
        date: {
          $gte: newDate,
          $lte: newNextDate,
        },
        shift: { $in: shift },
      }).lean();

    let result: any = {};

    for (let a of allAttendance) {
      const punchIn = new Date(a.punches[0].punchIn);
      let punchOut;
      let totalhours = 0;
      if (a.punches[a.punches.length - 1].punchOut) {
        punchOut = new Date(a.punches[a.punches.length - 1].punchOut);
        totalhours = (punchOut.getTime() - punchIn.getTime()) / (60 * 60 * 1000);
      } else {
        const currentTime = new Date();
        currentTime.setTime(currentTime.getTime() + 330 * 60 * 1000);
        totalhours = (currentTime.getTime() - punchIn.getTime()) / (60 * 60 * 1000);
      }

      let totalProductiveHours;
      let slipNumbers: any = [];

      totalProductiveHours = a.productiveHours;
      slipNumbers = a.productionSlipNumbers;

      const productionSlips: any = [];
      if (slipNumbers) {
        for (let p of slipNumbers) {
          const productionSlip = productionSlipStore[p];
          if (productionSlip) {
            productionSlips.push(productionSlip);
          }
        }
      }
      const newResult: any = [];
      for (let p of productionSlips) {
        const partId = p.part._id + "";
        const partSlips = partSlipStore[partId];
        const data = await childPartReport(partSlips, productionSlipStore);
        let totalProduction = 0;
        let totalActualTime = 0;
        // --------------------------------- pending
        if(data){
        for(let d of data){
          totalProduction += (d.actualPartPerHour * d.actualTime);
          totalActualTime += d.actualTime;
        }
        }
        const obj = { data, partName: p.part.partName, partId };
        newResult.push(obj);
      }

      const obj = {
        date: a.date,
        shift: a?.shift,
        employeeName: employee.name,
        employeeId: employee._id,
        employeeCode: employee.employeeCode,
        profilePicture: docsStore[employee._id + ""]?.profilePicture || "",
        productionSlips,
        newResult,
        totalhours,
        totalProductiveHours,
        slipNumbers,
      };
      result = obj;
    }

    return {
      success: true,
      message: "Getting Per employee report successfully.",
      result,
    };
  } catch (error) {
    console.log(error);
  }
};

const childPartReport = async (
  partSlips: { slips: ProductionSlipDocument[] },
  productionSlipStore: any
) => {
  const productionSlips = partSlips.slips;
  const result = [];

  for (let p of productionSlips) {
    const partId = p.part._id + "";

    for (let w of p.working) {
      let startTime;
      let endTime;
      if (w.startTime) {
        startTime = new Date(w.startTime);
        startTime.setHours(0, 0, 0, 0);
      } else {
        return;
      }
      for (let e of w.employees) {
        const employeeId = e.employeeId + "";
        const data = await employeeReportPerPart(
          employeeId,
          partId,
          startTime,
          productionSlipStore
        );
        if(data && data.totalProductiveTime>0){
        result.push({ ...data, employeeName: e.employeeName, employeeId });
      }
      }
    }
  }
  return result;
};

const employeeReportPerPart = async (
  employeeId: string,
  partId: string,
  startTime: Date,
  productionSlipStore: any
) => {
  const attendance = await v2AttendanceModel.findOne({
    employeeId,
    date: {
      $gte: new Date(startTime),
    },
  });

  if (!attendance) {
    return;
  }
  const productionSlipNumbers = attendance.productionSlipNumbers;
  const totalProductiveTime = attendance.productiveHours || 0;
  let totalTime = 0;
  let childPartTime = 0;
  let totalProductionPerChildPart = 0;
  let totalNumberOfEmployee = 0;
  let productionSlipNumber = "";
  for (let p of productionSlipNumbers) {
    const productionSlip = productionSlipStore[p];
    if (!productionSlip) {
      return;
    }
    if (productionSlip.part._id + "" === partId + "") {
      productionSlipNumber = productionSlip.productionSlipNumber;
      for (let w of productionSlip.working) {
        totalNumberOfEmployee = w.employees.length;
        if (w.startTime && w.endTime) {
          for (let e of w.employees) {
            if (employeeId + "" === e.employeeId + "") {
              totalProductionPerChildPart +=
                w.itemProduced / totalNumberOfEmployee;
              childPartTime =
                (new Date(w.endTime).getTime() -
                  new Date(w.startTime).getTime()) /
                (60 * 60 * 1000);
            }
          }
        }
      }
    }

    for (let w of productionSlip.working) {
      if (w.startTime && w.endTime) {
        for (let e of w.employees) {
          if (employeeId + "" === e.employeeId + "") {
            totalTime +=
              (new Date(w.endTime).getTime() -
                new Date(w.startTime).getTime()) /
              (60 * 60 * 1000);
          }
        }
      }
    }
  }

  const ratio = childPartTime / totalTime || 0;
  const actualTime = ratio * totalProductiveTime || 0;
  const actualPartPerHour = totalProductionPerChildPart / actualTime || 0;

  return {
    totalTime,
    actualTime,
    actualPartPerHour,
    ratio,
    productionSlipNumber,
    date: attendance.date,
    totalProductiveTime,
  };
};

// employee report for APP

export const EmployeeReport = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { employeeIds, newDate } = req.body as {
      employeeIds: string[];
      newDate: string;
    };

    const employeeDetails = await EmployeeModel.find({
      _id: { $in: employeeIds },
    }).lean();
    const employeeStore: any = {};
    const ids: string[] = [];

    employeeDetails.forEach((e) => {
      const id = e._id + "";
      ids.push(id);
      employeeStore[id] = {
        ...e,
      };
    });

    let date;
    let nextDate;

    if (newDate) {
      date = new Date(newDate);
      date.setHours(0, 0, 0, 0);
      nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
    } else {
      date = new Date();
      date.setHours(0, 0, 0, 0);
      nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      nextDate.setHours(0, 0, 0, 0);
    }

    const attendanceDetails = await v2AttendanceModel
      .find({
        employeeId: { $in: ids },
        date: {
          $gte: date,
          $lt: nextDate,
        },
      })
      .lean();

    const result: any = {};

    for (let a of attendanceDetails) {
      const employeeId = a.employeeId + "";
      const firstPunchIn = new Date(a.punches[0].punchIn);
      firstPunchIn.setTime(firstPunchIn.getTime() - 330 * 60 * 1000);
      const date = new Date();
      date.setTime(date.getTime() + 330 * 60 * 1000);

      const lastPunchOut: any = a.punches[a.punches.length - 1]?.punchOut
        ? a.punches[a.punches.length - 1]?.punchOut
        : date;
      const newLastPunch = new Date(lastPunchOut);

      newLastPunch.setTime(newLastPunch.getTime() - 330 * 60 * 1000);

      const totalHours =
        (newLastPunch.getTime() - firstPunchIn.getTime()) / (60 * 60 * 1000);

      const data = await getProductivityPerEmployee(
        employeeId,
        firstPunchIn,
        newLastPunch
      );

      const obj = {
        productivity: data?.productiveHours || 0,
        totalHours,
        employeeId,
      };
      result[employeeId] = obj;
    }

    resp.status(200).json({
      success: true,
      message: "Getting productivity per employee.",
      result,
    });
  }
);

//
export const MachineReport = async (data:{machineId:string;date:string}) => {
  const { machineId, date } = data;

  const newDate = new Date(date);
  const nextDate = new Date(newDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const productionSlipsMachine = await ProductionSlipModel.find({
    "working.machines.machineId": machineId,
    durationFrom: {
      $gte: newDate,
      $lt: nextDate,
    },
    status: { $in: ["completed", "cnc"] },
  }).lean();

  const result: {
    data: {
      newDate: Date;
      totalProductiveTime: number;
      ratio: number;
      actualTimePart: number;
      partName: string;
      perHourProduction:number;
      percentage:number;
      totalPartProduction: number;
      productionSlipNumbers: string[];
      machineName: string;
      machineId:string;
    }[];
    perMachineProduction:number;
    partName: string;
    weightedAverage: number;
    singleMachinePerDay :{
      currentDayPercentage:number
      currentDayTime:number
    }
  }[] = [];
 
  for (let p of productionSlipsMachine) {
    const partId = p.part._id + "";
    const data: {
      newDate: Date;
      totalProductiveTime: number;
      ratio: number;
      actualTimePart: number;
      partName: string;
      perHourProduction:number;
      percentage:number;
      totalPartProduction: number;
      productionSlipNumbers: string[];
      machineName: string;
      machineId:string;}[] = await singleMachine(partId);
    
      let totalActualHours = 0;
      let totalProduction = 0;

    for (let d of data) {
      totalActualHours += d.actualTimePart || 0;
      totalProduction += d.totalPartProduction;
    }
    const weightedAverage = totalProduction / totalActualHours;
    let totalPercentage = 0;
    let currentDayPercentage = 0;
    let currentDayTime = 0;
    for (let d of data) {
      const percentage = ((d.perHourProduction - weightedAverage) / weightedAverage) * 100;
      if (isFinite(percentage)) {
        d.percentage = percentage;
      } else {
        d.percentage = 0;
      }
      if((d.newDate.getTime() === newDate.getTime()) && machineId+"" === d.machineId+""){
        currentDayPercentage += d.percentage * d.actualTimePart;
        currentDayTime += d.actualTimePart;
      }
      totalPercentage += (d.percentage * d.actualTimePart);
    }

    result.push({ partName: p.part.partName, weightedAverage,singleMachinePerDay :{
      currentDayPercentage,
      currentDayTime
    } ,perMachineProduction : totalPercentage/totalActualHours, data });
  }
  let newData = 0;
  let totalActualHours =0;
  for(let r of result){
    // console.log(r.singleMachinePerDay.currentDayPercentage ,r.singleMachinePerDay.currentDayTime)
    newData += r.singleMachinePerDay.currentDayPercentage ;
    totalActualHours += r.singleMachinePerDay.currentDayTime;
  }
  
  const newResult = newData/totalActualHours;

  return {
    success: true,
    message: "Getting machine report.",
    result,
    newData : newResult
  };
};

const singleMachine = async (partId: string) => {
  const productionSlips = await ProductionSlipModel.find({
    "part._id": partId,
    status: { $in: ["completed", "cnc"] },
  });

  const result: {
    newDate: Date;
    totalProductiveTime: number;
    ratio: number;
    actualTimePart: number;
    percentage:number;
    partName: string;
    perHourProduction:number;
    totalPartProduction: number;
    productionSlipNumbers: string[];
    machineName: string;
    machineId:string;
  }[] = [];
  for (let p of productionSlips) {
    for (let w of p.working) {
      for (let m of w.machines) {
        const date = new Date(p.durationFrom);
        date.setUTCHours(0, 0, 0, 0);
        const machineId = m.machineId + "";
        const data: {
          newDate: Date;
          totalProductiveTime: number;
          ratio: number;
          perHourProduction:number;
          percentage:number;
          actualTimePart: number;
          partName: string;
          totalPartProduction: number;
          productionSlipNumbers: string[];
        } = await lastResultMachine(machineId, partId, date);

        result.push({
          ...data,
          machineName: m.machineName,
          machineId
        });
      }
    }
  }
  return result;
};

const lastResultMachine = async (
  machineId: string,
  partId: string,
  date: Date
) => {
  const newDate = new Date(date);
  const nextDate = new Date(newDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const productionSlips = await ProductionSlipModel.find({
    durationFrom: { $gte: newDate, $lt: nextDate },
    "working.machines.machineId": machineId,
    status: { $in: ["completed", "cnc"] },
  }).lean();

  const timeArray: { startTime: any; endTime: any }[] = [];

  let totalTime = 0;
  let totalPartHours = 0;
  let totalPartProduction = 0;
  let partName = "";
  const productionSlipNumbers:string[] = []

  for (let p of productionSlips) {
    if (p.part._id + "" === partId + "") {
      partName = p.part.partName;
      productionSlipNumbers.push(p.productionSlipNumber);
      for (let w of p.working) {
        if (w.startTime && w.endTime) {
          const totalMachines = w.machines.length;
          const itemProduced = w.itemProduced || 0;
          const productionPerMachine = itemProduced / totalMachines;
          totalPartProduction += productionPerMachine;
          const startTime = new Date(w.startTime);
          const endTime = new Date(w.endTime);
          const hours = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
          totalPartHours += hours;
        };
      };
    };

    for (let w of p.working) {
      if (w.startTime && w.endTime) {
        const startTime = new Date(w.startTime);
        const endTime = new Date(w.endTime);
        timeArray.push({ startTime, endTime });
        const hours =
          (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);
        totalTime += hours;
      };
    };
  };

  const totalProductiveTime = gettingHours(timeArray);
  const ratio = totalPartHours / totalTime || 0;
  const actualTimePart = ratio * totalProductiveTime || 0;

  return {
    newDate,
    totalTime,
    totalProductiveTime,
    ratio,
    actualTimePart,
    percentage:0,
    perHourProduction: totalPartProduction / actualTimePart,
    totalPartProduction,
    productionSlipNumbers,
    partName,
  };
};