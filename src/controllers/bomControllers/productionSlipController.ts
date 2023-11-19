import EmployeeModel from "../../database/models/employeeModel";
import globalProcessModel from "../../database/models/globalProcessModel";
import JobProfileModel from "../../database/models/jobProfileModel";
import ProductionSlipModel from "../../database/models/productionSlipModel";
import ShopModel from "../../database/models/shopModel";
import workOrderModel from "../../database/models/workOrderModel";
import ErrorHandler from "../../middleware/errorHandler";
import catchErrorAsync from "../../utils/catchAsyncError";
import { Request, Response, NextFunction } from "express";
import * as QRCode from "qrcode";
// import { getIndianTime } from "../../middleware/dateTimeConverter";
import ShopLogModel from "../../database/models/shopLogModel";
import machineModel from "../../database/models/machineModel";
import mongoose from "mongoose";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import EmployeeDocsModel from "../../database/models/employeeDocsModel";
import FinishedItemModel from "../../database/models/finishedItemModel";
import PlanningModel from "../../database/models/planningModel";
import { translateEnglishToHindi } from "../../translate";

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

function formatNumberWithLeadingZeros(number: number, desiredLength: number) {
  // Convert the number to a string
  let numberStr = number.toString();

  // Calculate the number of zeros to add
  const zerosToAdd = desiredLength - numberStr.length;

  if (zerosToAdd > 0) {
    // Add leading zeros
    numberStr = "0".repeat(zerosToAdd) + numberStr;
  }
  return numberStr;
}

export const addCompletedSlip = async (data: {
  workOrderId: string;
  childPartId: string;
  employeeIds: string[];
  machineIds: string[];
  itemProduced: number;
  startTime?: string;
  endTime?: string;
  name: string;
  employeeId: any;
  status: string;
  remark?: string;
}) => {
  const {
    workOrderId,
    childPartId,
    employeeIds,
    machineIds,
    itemProduced,
    startTime,
    endTime,
    name,
    status,
    employeeId,
    remark
  } = data;

  const workOrder = await workOrderModel.findById({ _id: workOrderId });

  if (!workOrder) {
    return {
      success: false,
      message: "Work order not found.",
    };
  };
  const lastPartId = workOrder.masterBom[workOrder.masterBom.length - 1]._id;
  const finishedItem = await FinishedItemModel.findOne({
    MCode: workOrder.MCode,
  });

  if (!finishedItem) {
    return {
      success: false,
      message: `FinishedItem not found with MCODE ${workOrder.MCode}`,
    };
  }

  // if (employeeIds.length === 0) {
  //   return {
  //     success: false,
  //     message: "Employees array cannot be empty.",
  //   };
  // }

  // if (machineIds.length === 0) {
  //   return {
  //     success: false,
  //     message: "Machines array cannot be empty",
  //   };
  // }

  const employees = await EmployeeModel.find({ _id: { $in: employeeIds } });
  const employeeData: {
    employeeId: mongoose.Schema.Types.ObjectId;
    employeeName: string;
  }[] = [];

  if (employees.length > 0) {
    employees.forEach((e) => {
      const obj = {
        employeeId: e._id,
        employeeName: e.name,
      };
      employeeData.push(obj);
    });
  }

  const machines = await machineModel.find({ _id: { $in: machineIds } });

  const machineData: {
    machineId: mongoose.Schema.Types.ObjectId;
    machineName: string;
  }[] = [];

  machines.forEach((m) => {
    const obj = {
      machineId: m._id,
      machineName: m.machineName,
    };
    machineData.push(obj);
  });

  let partName;
  let totalNumberOfItem;
  let consumedItem;
  let process;
  let setindex = 0;
  workOrder.masterBom.forEach((w, index) => {
    const id = w._id + "";
    if (childPartId == id) {
      partName = w.partName;
      totalNumberOfItem = w.numberOfItem;
      consumedItem = w.newChild;
      process = w.processId;
      setindex = index;
    }
  });

  const part = {
    _id: childPartId,
    partName,
  };

  const processDetails = await globalProcessModel.findOne({
    _id: process,
  });

  if (!processDetails) {
    return {
      success: false,
      message: "Process not found. ",
    };
  }

  if (!processDetails.shop) {
    return {
      success: false,
      message: "Process does not have a Shop , Process added without Shop .",
    };
  }

  const shop = await ShopModel.findOne({ _id: processDetails.shop.shopId });

  if (!shop || !shop.shopCode) {
    return {
      success: false,
      message: `Shop not found with name ${processDetails.shop.shopName} or shopCode not available.`,
    };
  }

  const allProductionSlips = await ProductionSlipModel.find({
    "shop.shopId": shop._id,
  });

  let length = allProductionSlips.length;

  let number = formatNumberWithLeadingZeros(length + 1, 4);

  let productionSlipNumber = shop.shopCode + "-" + number;

  let qrCode;

  try {
    qrCode = await QRCode.toDataURL(productionSlipNumber);
  } catch (err) {
    return {
      success: false,
      message: `Error in QR generation.`,
    };
  }

  let quantityLeft = 0;

  const productionSlips = await ProductionSlipModel.find({
    workOrderId: workOrder._id,
    "process.processId": processDetails?._id,
    "part._id": part._id,
  }).lean();
  productionSlips.forEach((p) => {
    quantityLeft += p.itemProduced;
  });

  const productionSlip = await ProductionSlipModel.create({
    productionSlipNumber,
    workOrderId: workOrder._id,
    QRCode: qrCode,
    process: {
      processId: processDetails?._id,
      processName: processDetails?.processName,
    },
    shop: {
      shopName: shop?.shopName,
      shopId: shop?._id,
    },
    createdBy: {
      name,
      employeeId,
    },
    completedBy: {
      name,
      employeeId,
    },
    activatedBy: {
      name,
      employeeId,
    },
    part,
    numberOfItems: quantityLeft,
    itemPerWorkOrder: totalNumberOfItem,
    consumedItem,
  });

  if (machineIds && machineIds.length > 0) {
    for (let m of machineIds) {
      const machine = await machineModel.findById(m);
      if (machine) {
        machine.logs.push({
          productionSlipId: productionSlip._id,
          time: startTime ? new Date(startTime) : new Date(),
        });
        await machine.save();
      }
    }
  }
  if (employeeIds && employeeIds.length > 0) {
    for (let e of employeeIds) {
      const employee = await EmployeeModel.findById(e);
      if (employee) {
        employee.productionLogs.push({
          productionSlipId: productionSlip._id,
          time: startTime ? new Date(startTime) : new Date(),
        });
        await employee.save();
      }
    }
  }

  const obj = {
    updatedBy: {
      name,
      employeeId,
    },
    date: startTime ? new Date(startTime) : new Date(),
    startTime: startTime ? new Date(startTime) : new Date(),
    itemProduced: itemProduced,
    employees: employeeData,
    machines: machineData,
    endTime: endTime ? new Date(endTime) : new Date(),
  };

  productionSlip.working.push(obj);
  productionSlip.durationFrom = startTime ? new Date(startTime) : new Date();
  productionSlip.durationTo = endTime ? new Date(endTime) : new Date();
  productionSlip.itemProduced = itemProduced;
  productionSlip.status = status || "";
  productionSlip.manualRemark = remark || "";

  await productionSlip.save();

  const endDate = new Date(productionSlip.durationTo);
  endDate.setHours(0, 0, 0, 0);

  const month = new Date(productionSlip.durationTo);
  month.setUTCDate(1);
  month.setUTCHours(0, 0, 0, 0);

  let planning;

  if (productionSlip.part._id + "" === lastPartId + "") {
    planning = await PlanningModel.findOne({
      finishedItemId: finishedItem._id,
      month: month,
    });

    planning?.dates.forEach((p) => {
      const date = new Date(p.date);
      date.setHours(0, 0, 0, 0);

      if (date + "" === endDate + "") {
        if (!p.dispatchValue) {
          p.dispatchValue = 0;
        }
        p.dispatchValue += itemProduced;
      }
    });
    await planning?.save();
  };

  return {
    success: true,
    message: `Created a completed Production slip with number ${productionSlipNumber}.`,
    productionSlip,
    planning,
  };
};

export const addProductionSlip = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    const { workOrderId, childPartId } = req.body;
    if (req.employee || req.admin) {
      let name = "";
      let employeeId;
      if (req.employee) {
        name = req.employee.name;
        employeeId = req.employee._id;
      }
      if (req.admin) {
        name = req.admin.name;
        employeeId = req.admin._id;
      }

      const workOrder = await workOrderModel.findById({ _id: workOrderId });

      if (!workOrder) {
        return resp.status(404).json({
          success: false,
          message: "Work order not found.",
        });
      }

      if (workOrder.status == "completed") {
        return resp.status(404).json({
          success: false,
          message: "Work order already completed.",
        });
      }

      if (workOrder.status === "pending") {
        workOrder.status = "inProgress";
        await workOrder.save();
      }
      let partName;
      let totalNumberOfItem;
      let consumedItem;
      let process;
      let setindex = 0;
      workOrder.masterBom.forEach((w, index) => {
        const id = w._id + "";
        if (childPartId == id) {
          partName = w.partName;
          totalNumberOfItem = w.numberOfItem;
          consumedItem = w.newChild;
          process = w.process;
          setindex = index + 1;
        }
      });

      const part = {
        _id: childPartId,
        partName,
      };

      const processDetails = await globalProcessModel.findOne({
        processName: process,
      });

      if (!processDetails) {
        return resp.status(404).json({
          success: false,
          message: "Process not found. ",
        });
      }

      if (!processDetails.shop) {
        return resp.status(400).json({
          success: false,
          message:
            "Process does not have a Shop , Process added without Shop .",
        });
      }

      const shop = await ShopModel.findOne({ _id: processDetails.shop.shopId });

      if (!shop || !shop.shopCode) {
        return resp.status(404).json({
          success: false,
          message: `Shop not found with name ${processDetails.shop.shopName} or shopCode not available.`,
        });
      }

      const allProductionSlips = await ProductionSlipModel.find({
        "shop.shopId": shop._id,
      });

      let length = allProductionSlips.length;

      let number = formatNumberWithLeadingZeros(length + 1, 4);

      let productionSlipNumber = shop?.shopCode + "-" + number;

      let qrCode;
      try {
        qrCode = await QRCode.toDataURL(productionSlipNumber);
      } catch (err) {
        return next(new ErrorHandler("QR Code generation failed.", 500));
      }

      let quantityLeft = 0;
      const productionSlips = await ProductionSlipModel.find({
        workOrderId: workOrder._id,
        "process.processId": processDetails?._id,
        "part._id": part._id,
      });
      productionSlips.forEach((p) => {
        quantityLeft += p?.itemProduced;
      });

      const productionSlip = await ProductionSlipModel.create({
        productionSlipNumber,
        workOrderId: workOrder._id,
        QRCode: qrCode,
        process: {
          processId: processDetails?._id,
          processName: processDetails?.processName,
        },
        shop: {
          shopName: shop?.shopName,
          shopId: shop?._id,
        },
        createdBy: {
          name,
          employeeId,
        },
        part,
        numberOfItems: totalNumberOfItem ? totalNumberOfItem : 0 - quantityLeft,
        itemPerWorkOrder: totalNumberOfItem,
        consumedItem,
      });

      resp.status(201).json({
        success: true,
        message: "Production slip created.",
        productionSlip,
      });
    } else {
      return resp.status(403).json({
        success: false,
        message: "Not Authorised",
      });
    }
  }
);

// add multiple productionslips
export const addMultipleProductionSlips = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    const { workOrderId, childPartIds } = req.body;

    if (req.employee || req.admin) {
      let name = "";
      let employeeId: any;
      if (req.employee) {
        name = req.employee.name;
        employeeId = req.employee._id;
      }
      if (req.admin) {
        name = req.admin.name;
        employeeId = req.admin._id;
      }

      const workOrder = await workOrderModel.findById({ _id: workOrderId });

      if (!workOrder) {
        return resp.status(404).json({
          success: false,
          message: "Work order not found.",
        });
      }

      if (workOrder.status == "completed") {
        return resp.status(404).json({
          success: false,
          message: "Work order already completed.",
        });
      }

      if (workOrder.status === "pending") {
        workOrder.status = "inProgress";
        await workOrder.save();
      }

      const processes = await globalProcessModel.find().lean();
      const processStore: any = {};
      processes.forEach((p) => {
        const id = p._id + "";
        processStore[id] = { ...p };
      });
      const allShop = await ShopModel.find().lean();
      const shopStore: any = {};
      allShop.forEach((a) => {
        const id = a._id + "";
        shopStore[id] = { ...a };
      });

      for (let childPartId of childPartIds) {
        let partName;
        let totalNumberOfItem;
        let consumedItem;
        let process;
        let setindex = 0;

        workOrder.masterBom.forEach((w, index) => {
          const id = w._id + "";
          if (childPartId == id) {
            partName = w.partName;
            totalNumberOfItem = w.numberOfItem;
            consumedItem = w.newChild;
            process = w.processId;
            setindex = index + 1;
          }
        });

        const part = {
          _id: childPartId,
          partName,
        };

        const processDetails = processStore[process + ""];

        if (!processDetails) {
          return resp.status(404).json({
            success: false,
            message: "Process not found. ",
          });
        }

        if (!processDetails.shop) {
          return resp.status(400).json({
            success: false,
            message: `Process ${processDetails.processName} added without Shop .`,
          });
        }

        const shop = shopStore[processDetails.shop.shopId + ""];

        if (!shop || !shop.shopCode) {
          return resp.status(404).json({
            success: false,
            message: `childPartName ${partName} ,Shop not found with name ${processDetails.shop.shopName} or shopCode not available.`,
          });
        }

        const allProductionSlips = await ProductionSlipModel.find({
          "shop.shopId": shop._id,
        });

        let length = allProductionSlips.length;

        let number = formatNumberWithLeadingZeros(length + 1, 4);

        let productionSlipNumber = shop?.shopCode + "-" + number;

        let qrCode;
        try {
          qrCode = await QRCode.toDataURL(productionSlipNumber);
        } catch (err) {
          return next(new ErrorHandler("QR Code generation failed.", 500));
        }
        let quantityLeft = 0;
        const productionSlips = await ProductionSlipModel.find({
          workOrderId: workOrder._id,
          "process.processId": processDetails?._id,
          "part._id": part._id,
        }).lean();
        productionSlips.forEach((p) => {
          quantityLeft += p.itemProduced;
        });

        const productionSlip = await ProductionSlipModel.create({
          productionSlipNumber,
          workOrderId: workOrder._id,
          QRCode: qrCode,
          process: {
            processId: processDetails?._id,
            processName: processDetails?.processName,
          },
          shop: {
            shopName: shop?.shopName,
            shopId: shop?._id,
          },
          createdBy: {
            name,
            employeeId,
          },
          part,
          numberOfItems: totalNumberOfItem ? totalNumberOfItem : 0 - quantityLeft,
          itemPerWorkOrder: totalNumberOfItem,
          consumedItem,
        });
      }

      resp.status(201).json({
        success: true,
        message: "Production slip created.",
      });
    } else {
      return resp.status(403).json({
        success: false,
        message: "Not authorised.",
      });
    }
  }
);

export const employeeSuggestions = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { productionSlipNumber } = req.params;

    let date = new Date();
    let nextDay;
    date = new Date(date);
    date.setHours(0, 0, 0, 0);
    // date.setHours(date.getHours() - (11.5));
    date.setHours(date.getHours() - 6);

    nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 2);
    nextDay.setHours(0, 0, 0, 0);
    // nextDay.setHours(nextDay.getHours() - (11.5));
    nextDay.setHours(nextDay.getHours() - 6);

    const allEmployees = await EmployeeModel.find().lean();
    const employeeStore: any = {};

    allEmployees.forEach((a) => {
      const id = a._id + "";
      employeeStore[id] = {
        ...a,
      };
    });

    const productionSlip = await ProductionSlipModel.findOne({
      productionSlipNumber,
    });

    if (!productionSlip) {
      return resp.status(404).json({
        success: false,
        message: `Production Slip not found with number ${productionSlipNumber}.`,
      });
    }
    if (!productionSlip.shop.shopId) {
      return resp.status(404).json({
        success: false,
        message: "Production slip created without Shop details.",
      });
    }

    const shop = await ShopModel.findById({ _id: productionSlip.shop.shopId });

    if (!shop) {
      return resp.status(404).json({
        success: false,
        message: `"${productionSlip.shop.shopName}" Shop not found.`,
      });
    }

    const data = await ShopLogModel.findOne({
      date: {
        $gte: date,
        $lt: nextDay,
      },
      shopId: shop._id,
    });
    const result: any = [];

    data?.employees.forEach((d) => {
      const id = d.employeeId + "";
      const data = employeeStore[id];
      const obj = {
        employeeName: data.name,
        employeeId: d.employeeId,
        employeeCode: data.employeeCode,
      };
      result.push(obj);
    });

    resp.status(200).json({
      success: true,
      message: `getting all employee of shop ${shop.shopName}`,
      employee: result,
    });
  }
);

export const machineSuggestions = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { productionSlipNumber } = req.params;
    const productionSlip = await ProductionSlipModel.findOne({
      productionSlipNumber,
    });

    if (!productionSlip) {
      return resp.status(404).json({
        success: false,
        message: `Production Slip not found with number ${productionSlipNumber}.`,
      });
    }
    const process = await globalProcessModel.findById({
      _id: productionSlip.process.processId,
    });

    const processId = process?._id;
    // console.log(process);
    const machinesWithProcess = await machineModel.find({
      process: { $in: [processId] },
    });
    // console.log(machinesWithProcess);
    const data: any = [];
    machinesWithProcess.forEach((m) => {
      const obj = {
        machineName: m.machineName,
        machineId: m._id,
      };
      data.push(obj);
    });
    resp.status(200).json({
      success: true,
      message: `getting all machine which can process ${process?.processName}`,
      machines: data,
    });
  }
);

function convertTimeTo24HourFormat(timeString: string) {
  // Split the time string into components
  const [time, amOrPm] = timeString.split(" ");

  // Split the time into hours and minutes
  let [hours, minutes] = time.split(":").map(Number);

  // Convert to 24-hour format
  if (amOrPm.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  } else if (amOrPm.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }
  const obj = {
    hour: hours,
    min: minutes,
  };

  // Return the time in 24-hour format
  return obj;
}

// add working in production slip
export const addEmployeeAndMachine = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    const {
      productionSlipNumber,
      durationFrom,
      durationTo,
      employeeIds,
      machineIds,
      itemProduced,
    }: {
      productionSlipNumber: string;
      durationFrom: string;
      durationTo: string;
      employeeIds: string[];
      machineIds: string[];
      itemProduced: number;
    } = req.body;
    //  console.log(itemProduced);
    if (req.employee || req.admin) {
      let name = "";
      let employeeId1: any;
      if (req.employee) {
        name = req.employee.name;
        employeeId1 = req.employee._id;
      }

      if (req.admin) {
        name = req.admin.name;
        employeeId1 = req.admin._id;
      }

      const productionSlip = await ProductionSlipModel.findOne({
        productionSlipNumber,
      });

      if (!productionSlip) {
        return resp.status(404).json({
          success: false,
          message: `Production Slip not found with number ${productionSlipNumber}.`,
        });
      }

      if (productionSlip.status == "completed") {
        return resp.status(400).json({
          success: false,
          message: `Production slip with number ${productionSlip.productionSlipNumber} already completed.`,
        });
      }

      if (durationFrom) {
        const timee = convertTimeTo24HourFormat(durationFrom);

        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setHours(timee.hour, timee.min);
        date.setTime(date.getTime() - (330 * 60 * 1000));

        if (employeeIds.length === 0) {
          return resp.status(400).json({
            success: false,
            message: "Employees array cannot be empty.",
          });
        }
        if (machineIds.length === 0) {
          return resp.status(400).json({
            success: false,
            message: "Machines array cannot be empty",
          });
        }

        // adding logs to machines
        for (let m of machineIds) {
          const machine = await machineModel.findById(m);
          if (machine) {
            machine.logs.push({
              productionSlipId: productionSlip._id,
              time: date,
            });
            await machine.save();
          }
        }

        for (let e of employeeIds) {
          const employee = await EmployeeModel.findById(e);
          if (employee) {
            employee.productionLogs.push({
              productionSlipId: productionSlip._id,
              time: date,
            });
            await employee.save();
          }
        }

        const employees = await EmployeeModel.find({
          _id: { $in: employeeIds },
        });

        const employeeData: {
          employeeId: mongoose.Schema.Types.ObjectId;
          employeeName: string;
        }[] = [];

        if (employees.length > 0) {
          employees.forEach((e) => {
            const obj = {
              employeeId: e._id,
              employeeName: e.name,
            };
            employeeData.push(obj);
          });
        }

        const machines = await machineModel.find({ _id: { $in: machineIds } });
        const machineData: {
          machineId: mongoose.Schema.Types.ObjectId;
          machineName: string;
        }[] = [];
        machines.forEach((m) => {
          const obj = {
            machineId: m._id,
            machineName: m.machineName,
          };
          machineData.push(obj);
        });

        const obj = {
          updatedBy: { name, employeeId: employeeId1 },
          date,
          startTime: date,
          employees: employeeData,
          machines: machineData,
        };

        productionSlip.working.push(obj);
        if (productionSlip.working.length == 1) {
          productionSlip.activatedBy = {
            name,
            employeeId: employeeId1,
          };
          productionSlip.durationFrom = date;
          productionSlip.status = "active";
        }
        if (
          productionSlip.working.length > 1 &&
          (itemProduced === undefined ||
            itemProduced === null ||
            isNaN(itemProduced))
        ) {
          return resp.status(400).json({
            success: false,
            message: "Item Produced field cannot be empty.",
          });
        };

        if (itemProduced) {
          productionSlip.working[
            productionSlip.working.length - 2
          ].itemProduced = itemProduced;
          productionSlip.working[productionSlip.working.length - 2].endTime =
            date;
        };

        let totalProduced = 0;
        productionSlip.working.forEach((w) => {
          if (w.itemProduced) {
            totalProduced += w.itemProduced;
          }
        });

        productionSlip.itemProduced = totalProduced;

        await productionSlip.save();

        resp.status(201).json({
          success: true,
          message: `Data added to production slip number ${productionSlip.productionSlipNumber}`,
          productionSlip,
        });
      } else if (durationTo) {
        let durationToDate = new Date();
        const toTime = convertTimeTo24HourFormat(durationTo);
        durationToDate.setHours(0, 0, 0, 0);
        durationToDate.setHours(toTime.hour, toTime.min);
        durationToDate.setTime(durationToDate.getTime() - (330 * 60 * 1000));

        productionSlip.durationTo = durationToDate;
        productionSlip.completedBy = { name, employeeId: employeeId1 };
        productionSlip.status = "completed";
        productionSlip.working[productionSlip.working.length - 1].updatedBy = {
          name,
          employeeId: employeeId1,
        };
        productionSlip.working[productionSlip.working.length - 1].itemProduced =
          itemProduced;
        productionSlip.working[productionSlip.working.length - 1].endTime =
          durationToDate;

        let totalProduced = 0;
        productionSlip.working.forEach((w) => {
          if (w.itemProduced) {
            totalProduced += w.itemProduced;
          }
        });

        const workOrder = await workOrderModel.findOne({
          _id: productionSlip.workOrderId,
        });
        const finishedItem = await FinishedItemModel.findOne({
          MCode: workOrder?.MCode,
        });
        const lastPartId = workOrder?.masterBom[workOrder.masterBom.length - 1]._id;

        productionSlip.itemProduced = totalProduced;

        await productionSlip.save();

        const month = new Date();
        month.setUTCDate(1);
        month.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(productionSlip.durationTo);
        endDate.setHours(0, 0, 0, 0);

        let planning;

        if (productionSlip.part._id + "" === lastPartId + "") {
          planning = await PlanningModel.findOne({
            finishedItemId: finishedItem?._id,
            month,
          });

          planning?.dates.forEach((p) => {
            const date = new Date(p.date);
            date.setHours(0, 0, 0, 0);

            if (date + "" === endDate + "") {
              if (!p.dispatchValue) {
                p.dispatchValue = 0;
              }
              p.dispatchValue += totalProduced;
            };
          });

          await planning?.save();
        };

        resp.status(201).json({
          success: true,
          message: `Data added to production slip number ${productionSlip.productionSlipNumber}`,
          productionSlip,
        });
      } else {
        return resp.status(400).json({
          success: false,
          message: "Start time or End time is required.",
        });
      }
    } else {
      return resp.status(403).json({
        success: false,
        messsage: "Not Authorised.",
      });
    }
  }
);

//get employees and machines for auto select
export const getLastWorkingData = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { productionSlipNumber } = req.params;

    const productionSlip = await ProductionSlipModel.findOne({
      productionSlipNumber,
    });

    if (!productionSlip) {
      return resp.status(404).json({
        success: false,
        message: `Production slip with this number ${productionSlip}.`,
      });
    }

    const employees =
      productionSlip.working[productionSlip.working.length - 1].employees;
    const machines =
      productionSlip.working[productionSlip.working.length - 1].machines;

    resp.status(200).json({
      success: true,
      message: "Getting machines and employees.",
      employees,
      machines,
    });
  }
);

//get employees and machines for auto select
export const getProductionSlipData = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee || req.admin) {
      const { productionSlipNumber } = req.params;

      const productionSlip = await ProductionSlipModel.findOne({
        productionSlipNumber,
      });

      if (!productionSlip) {
        return resp.status(404).json({
          success: false,
          message: `Production slip with this number ${productionSlip}.`,
        });
      }

      const process = productionSlip.process.processId;
      const processDetail = await globalProcessModel.findById(process);
      const shop1 = await ShopModel.findById(processDetail?.shop.shopId);
      let shop;
      if (req.employee) {
        const jobProfile = await JobProfileModel.findById(
          req.employee.jobProfileId
        );
        if (!jobProfile || jobProfile.isSupervisor === false) {
          return resp.status(403).json({
            success: false,
            message: "Not Authorized",
          });
        }
        shop = await ShopModel.findOne({
          "jobProfile.jobProfileId": jobProfile._id,
        });
        if (!shop) {
          return resp.status(404).json({
            success: false,
            message: `Supervisior with jobProfile ${jobProfile.jobProfileName} not found.`,
          });
        }
        //  console.log(shop?.shopName,processDetail?.shop.shopName);
        if (shop?.shopName !== shop1?.shopName) {
          return resp.status(403).json({
            success: false,
            message: `This is ${processDetail?.shop.shopName} shop slip.`,
          });
        }
      }

      const workOrder = await workOrderModel.findById({
        _id: productionSlip.workOrderId,
      });

      resp.status(200).json({
        success: true,
        message: "Getting machines and employees.",
        productionSlip,
        workOrder,
      });
    } else {
      return resp.status(403).json({
        success: false,
        message: "Not auth",
      });
    }
  }
);

// export const editLogProductionSlip = catchErrorAsync(
//   async (req: Request, resp: Response, next: NextFunction) => {
//     const { productionSlipNumber } = req.params;

//     const { itemProduced, endTime } = req.body;

//     const productionSlip = await ProductionSlipModel.findOne({
//       productionSlipNumber,
//     });

//     if (!productionSlip) {
//       return resp.status(404).json({
//         success: false,
//         message: `Production slip with this number ${productionSlip}.`,
//       });
//     }

//     productionSlip.itemProduced = itemProduced;

//     await productionSlip.save();

//     resp.status(200).json({
//       success: true,
//       message: "Getting machines and employees.",
//       productionSlip,
//     });
//   }
// );

// get All Active Production
export const gettingAllActiveProductionSlip = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    const { workOrderId, status, date } = req.query as {
      workOrderId: string;
      status: string;
      date: string;
    }; // date filter single date   // finished item name
    if (req.employee || req.admin) {
      const query: any = {};

      if (date) {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(newDate);
        nextDate.setDate(newDate.getDate() + 1);
        nextDate.setHours(0, 0, 0, 0);
        query.createdAt = {
          $gte: newDate,
          $lt: nextDate,
        };
      }

      const workOrders = await workOrderModel.find().lean();
      const workOrderStore: any = {};

      workOrders.forEach((w) => {
        const id = w._id + "";
        workOrderStore[id] = {
          finishedItemName: w.finishItemName,
        };
      });

      let jobProfile;
      if (req.employee) {
        jobProfile = await JobProfileModel.findById(req.employee.jobProfileId);
        if (!jobProfile || jobProfile.isSupervisor === false) {
          return resp.status(404).json({
            success: false,
            message: `${req.employee}'s jobprofile not found.`,
          });
        }
      }

      if (req.employee && jobProfile?.jobProfileName.toLowerCase() !== "hr") {
        const shop = await ShopModel.findOne({
          "jobProfile.jobProfileId": jobProfile?._id,
        });
        if (!shop) {
          return resp.status(404).json({
            success: false,
            message: `Shop not found for jobProfile ${jobProfile?.jobProfileName}.`,
          });
        }

        let data: any;
        if (workOrderId) {
          const workOrder = await workOrderModel.findOne({ _id: workOrderId });
          if (!workOrder) {
            return resp.status(404).json({
              success: false,
              message: `Work order with id ${workOrderId} not found.`,
            });
          }
          data = await ProductionSlipModel.find({
            workOrderId: workOrder._id,
            status: status,
            "shop.shopId": shop._id,
            ...query,
          }).lean();
        } else {
          if (status == "active") {
            data = await ProductionSlipModel.find({
              status: "active" || "inactive",
              "shop.shopId": shop._id,
              ...query,
            }).lean();
          } else if (status == "completed") {
            data = await ProductionSlipModel.find({
              status: "completed",
              "shop.shopId": shop._id,
              ...query,
            }).lean();
          } else {
            data = await ProductionSlipModel.find({
              "shop.shopId": shop._id,
              ...query,
            }).lean();
          }
        }

        data.forEach((d: any) => {
          const workOrderId = d.workOrderId + "";
          const finishedItemName =
            workOrderStore[workOrderId]?.finishedItemName;
          d.finishedItemName = finishedItemName;
        });

        resp.status(200).json({
          success: true,
          message: `Getting all ${status} production slips.`,
          data,
        });
      } else {
        let data: any;
        if (workOrderId) {
          const workOrder = await workOrderModel.findOne({ _id: workOrderId });
          if (!workOrder) {
            return resp.status(404).json({
              success: false,
              message: `Work order with id ${workOrderId} not found.`,
            });
          }
          data = await ProductionSlipModel.find({
            workOrderId: workOrder._id,
            status: status,
            ...query,
          }).lean();
        } else {
          if (status == "active") {
            data = await ProductionSlipModel.find({
              status: "active" || "inactive",
              ...query,
            }).lean();
          } else if (status == "completed") {
            data = await ProductionSlipModel.find({
              status: "completed",
              ...query,
            }).lean();
          } else {
            data = await ProductionSlipModel.find({ ...query }).lean();
          }
        }

        data.forEach((d: any) => {
          const workOrderId = d.workOrderId + "";
          const finishedItemName =
            workOrderStore[workOrderId]?.finishedItemName;
          d.finishedItemName = finishedItemName;
        });

        resp.status(200).json({
          success: true,
          message: `Getting all ${status} production slips.`,
          data,
        });
      }
    } else {
      return resp.status(403).json({
        success: false,
        message: `Not authorized.`,
      });
    }
  }
);

// get All Active Production in all WorkOrder
export const gettingAllActiveProductionSlipAllWorkOrder = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let { status, shops, sort, name, date, nextDate, processes, MCodes, page = 1, limit = 500 } =
      req.body as {
        status: string[];
        shops: string[];
        sort: string;
        name: string;
        date: string;
        processes: string[];
        nextDate: string;
        MCodes: string[];
        page: number;
        limit: number;
      };
    const Page = parseInt(page + "");
    const Limit = parseInt(limit + "");

    const allJobProfile = await JobProfileModel.find().lean();

    const jobProfileStore: any = {};
    allJobProfile.forEach((a) => {
      const id = a._id + "";
      jobProfileStore[id] = {
        ...a,
      };
    });

    const allEmployee = await EmployeeModel.find().lean();
    const employeeStore: any = {};

    allEmployee.forEach((a) => {
      const id = a._id + "";
      employeeStore[id] = {
        ...a,
      };
    });

    const allEmployeeDocs = await EmployeeDocsModel.find().lean();
    const employeeDocStore: any = {};
    allEmployeeDocs.forEach((a) => {
      const id = a.employeeId + "";
      employeeDocStore[id] = {
        ...a,
      };
    });

    const query: any = {};

    // search by productionSlipNumber , partName, processName ,workOrder,, sort by date, filter by shop
    let shopIds = [];

    if (shops) {
      const shopDetails = await ShopModel.find({ shopName: { $in: shops } });
      shopIds = shopDetails.map((a) => a._id);
    }

    const allWorkOrders = await workOrderModel.find().lean();
    const workOrderStore: any = {};
    allWorkOrders.forEach((w) => {
      const id = w._id + "";
      workOrderStore[id] = {
        orderNumber: w.orderNumber,
        parCode: w.partCode,
        MCode: w.MCode,
        finishItemName: w.finishItemName,
        customer: w.customerName,
      };
    });

    let processIds = [];

    if (processes) {
      const process = await globalProcessModel.find({
        processName: { $in: processes },
      });
      processIds = process.map((p) => p._id);
    }

    if (processIds.length > 0) {
      query["process.processId"] = { $in: processIds };
    };

    if (MCodes) {
      const allWorkOrders = await workOrderModel.find({
        MCode: { $in: MCodes },
      });
      const orderIds = allWorkOrders.map((a) => a._id);
      if (orderIds.length > 0) {
        query.workOrderId = { $in: orderIds };
      }
    }

    if (name) {
      const workOrder = await workOrderModel
        .find({
          $or: [
            { orderNumber: { $regex: name, $options: "i" } },
            { finishItemName: { $regex: name, $options: "i" } },
            { partCode: { $regex: name, $options: "i" } },
            { MCode: { $regex: name, $options: "i" } },
          ],
        })
        .lean();

      const workOrderIds = workOrder.map((a) => a._id);

      query.$or = [
        {"part.partName":{$regex :name , $options :"i"}},
        { productionSlipNumber: { $regex: name, $options: "i" } },
        { workOrderId: { $in: workOrderIds } },
      ];
    }

    if (status?.length > 0) {
      query.status = { $in: status };
    }

    if (shopIds.length > 0) {
      query["shop.shopId"] = { $in: shopIds };
    }
    if (date || nextDate) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);

      let nextDate1;
      if (nextDate) {
        nextDate1 = new Date(nextDate);
        nextDate1.setHours(0, 0, 0, 0);
        nextDate1.setDate(nextDate1.getDate() + 1);
      } else {
        nextDate1 = new Date(newDate);
        nextDate1.setDate(nextDate1.getDate() + 1);
      }
      // console.log(newDate,nextDate1)
      query.createdAt = {
        $gte: newDate,
        $lt: nextDate1,
      };
    }

    let data;
    let count;
    if (sort) {
      if (sort === "newActive") {
        count = await ProductionSlipModel.countDocuments({ ...query })
        data = await ProductionSlipModel.find({
          ...query,
        }).select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1, printCount: 1 })
          .sort({ durationFrom: -1 })
          .skip((Page - 1) * Limit)
          .limit(Limit)
          .lean();
      } else if (sort === "oldActive") {
        count = await ProductionSlipModel.countDocuments({ ...query })
        data = await ProductionSlipModel.find({
          ...query,
        }).select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1, printCount: 1 })
          .sort({ durationFrom: 1 })
          .skip((Page - 1) * Limit)
          .limit(Limit)
          .lean();
      } else if (sort === "newCompleted") {
        count = await ProductionSlipModel.countDocuments({ ...query })
        data = await ProductionSlipModel.find({
          ...query,
        }).select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1, printCount: 1 })
          .sort({ durationTo: -1 })
          .skip((Page - 1) * Limit)
          .limit(Limit)
          .lean();
      } else if (sort === "oldCompleted") {
        count = await ProductionSlipModel.countDocuments({ ...query })
        data = await ProductionSlipModel.find({
          ...query,
        }).select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1, printCount: 1 })
          .sort({ durationTo: 1 })
          .skip((Page - 1) * Limit)
          .limit(Limit)
          .lean();
      } else if (sort === "newCreated") {
        count = await ProductionSlipModel.countDocuments({ ...query })
        data = await ProductionSlipModel.find({
          ...query,
        }).select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1, printCount: 1 })
          .sort({ createdAt: -1 })
          .skip((Page - 1) * Limit)
          .limit(Limit)
          .lean();
      } else if (sort === "oldCreated") {
        count = await ProductionSlipModel.countDocuments({ ...query })
        data = await ProductionSlipModel.find({
          ...query,
        }).select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1, printCount: 1 })
          .sort({ createdAt: 1 })
          .skip((Page - 1) * Limit)
          .limit(Limit)
          .lean();
      } else {
        count = await ProductionSlipModel.countDocuments({ ...query })
        data = await ProductionSlipModel.find({
          ...query,
        }).select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1, printCount: 1 })
          .sort({ createdAt: -1 })
          .skip((Page - 1) * Limit)
          .limit(Limit)
          .lean();
      }
    } else {
      count = await ProductionSlipModel.countDocuments({ ...query })
      data = await ProductionSlipModel.find({
        ...query,
      })
        .select({ productionSlipNumber: 1, workOrderId: 1, working: 1, durationFrom: 1, durationTo: 1, createdAt: 1, status: 1, part: 1, process: 1, itemProduced: 1, numberOfItems: 1 })
        .sort({ createdAt: -1 })
        .skip((Page - 1) * Limit)
        .limit(Limit)
        .lean();
    }

    const result: any = [];

    data.forEach((d) => {
      const id = d.workOrderId + "";
      const w = workOrderStore[id];
      const obj = {
        ...d,
        orderNumber: w.orderNumber,
        parCode: w.partCode,
        MCode: w.MCode,
        finishItemName: w.finishItemName,
        customer: w.customerName,
      };
      result.push(obj);
    });

    result.forEach((r: any) => {
      r.processName = r.process.processName;
      r.partName = r.part.partName;
      r.working.forEach((w: any) => {
        w.employees.forEach((e: any) => {
          const id = e.employeeId + "";
          const employeeDetails = employeeStore[id];
          const docs = employeeDocStore[id];
          const jobProfile =
            jobProfileStore[employeeDetails?.jobProfileId + ""];
          if (docs) {
            e.profilePicture = docs?.profilePicture;
          };
          e.employeeCode = employeeDetails.employeeCode;
          e.jobProfile = jobProfile.jobProfileName;
        });
      });
    });

    resp.status(200).json({
      success: true,
      message: `Getting all ${status} production slips.`,
      data: result,
      count
    });
  }
);


export const productionSlipExcel = async (req: Request, resp: Response, next: NextFunction) => {

  const allProductionSlips: any = await ProductionSlipModel.find({ status: { $nin: "cancel" }, itemProduced: { $gt: 0 } }).lean();

  const result: any = [];
  for (let p of allProductionSlips) {
    const partId = p.part._id
    const currentProduction = p.itemProduced;
    const itemPerWorkOrder = p.itemPerWorkOrder;
    const date = new Date(p.updatedAt);
    const productionSlips = await ProductionSlipModel.find({ "part._id": partId, updatedAt: { $lte: date }, status: { $nin: "cancel" }, itemProduced: { $gt: 0 } }).lean();

    let TotalProduction = 0;

    for (let s of productionSlips) {
      TotalProduction += s.itemProduced;
    };

    const consumedItemForSingle: any = {};

    for (let c of p.consumedItem) {
      const id = c._id + "";
      consumedItemForSingle[id] = {
        forSingleQuantity: c.numberOfItem / itemPerWorkOrder
      };
    };

    let previousProduction = TotalProduction - currentProduction;
    const childParts: any = [];
    for (let c of p.consumedItem) {
      const productionSlips = await ProductionSlipModel.find({ "part._id": c._id, updatedAt: { $lte: date }, status: { $nin: "cancel" }, itemProduced: { $gt: 0 } }).lean();

      let totalProduction = 0;
      for (let s of productionSlips) {
        totalProduction += s.itemProduced;
      };

      const singleRequired = consumedItemForSingle[c._id + ""].forSingleQuantity;
      const currentlyLeft = (totalProduction / singleRequired) - previousProduction;
      const obj = {
        currentlyLeft: currentlyLeft * singleRequired,
        inventory: currentlyLeft - TotalProduction,
        totalProduction,
        previousProduction: previousProduction * singleRequired,
        singleRequired,
        childPartName: c.partName,
      };
      childParts.push(obj);
    };

    const obj = {
      productionSlipNumber: p.productionSlipNumber,
      workOrderId: p.workOrderId,
      printCount: p.printCount,
      partName: p.part.partName,
      shopName: p.shop.shopName,
      processName: p.process.processName,
      numberOfItems: p.numberOfItems,
      itemPerWorkOrder: p.itemPerWorkOrder,
      itemProduced: p.itemProduced,
      status: p.status,
      consumedItem: p.consumedItem,
      createdBy: p?.createdBy?.name,
      activatedBy: p?.activatedBy?.name,
      completedBy: p?.completedBy?.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      durationFrom: p?.durationFrom,
      durationTo: p?.durationTo,
      childParts,
    }
    result.push(obj);
  };

  resp.status(200).json({
    success: true,
    message: "Getting slips for excel successfully.",
    result
  });
};


export const productionSlipExcel2 = async (req: Request, resp: Response, next: NextFunction) => {

  const workOrders = await workOrderModel.find().lean();

  const workOrderStore: any = {};

  workOrders.forEach((w) => {
    const id = w._id + "";
    workOrderStore[id] = {
      orderNumber: w.orderNumber,
      finishedItemName: w.finishItemName,
      MCode: w.MCode
    };
  });

  const allProductionSlips: any = await ProductionSlipModel.find({ status: { $nin: "cancel" } }).lean();

  const allProductionStore: any = {};
  allProductionSlips.forEach((a: any) => {
    const partId = a.part._id + "";
    if (!allProductionStore[partId]) {
      allProductionStore[partId] = {
        productionSlips: []
      };
    };
    allProductionStore[partId].productionSlips.push({ ...a });
  });

  const result: any = [];
  for (let p of allProductionSlips) {
    const partId = p.part._id;
    const workOrder = workOrderStore[p.workOrderId + ""];
    const currentProduction = p.itemProduced;
    const itemPerWorkOrder = p.itemPerWorkOrder;
    const date = new Date(p.durationTo || p.updatedAt);
    date.setTime(date.getTime() + (2 * 60 * 1000))
    const newProductionSlips: any = [];
    const slips = allProductionStore[partId + ""].productionSlips || [];
    let TotalProduction = 0;
    for (let s of slips) {
      if (new Date(s.durationTo || s.updatedAt).getTime() <= date.getTime()) {
        TotalProduction += s.itemProduced;
        newProductionSlips.push({ ...s });
      };
    };

    const consumedItemForSingle: any = {};

    for (let c of p.consumedItem) {
      const id = c._id + "";
      consumedItemForSingle[id] = {
        forSingleQuantity: c.numberOfItem / itemPerWorkOrder
      };
    };

    let previousProduction = TotalProduction - currentProduction;
    const childParts: any = [];
    for (let c of p.consumedItem) {

      const newProductionSlips: any = [];

      const slips = allProductionStore[c._id + ""]?.productionSlips || [];

      let totalProduction = 0;

      for (let s of slips) {
        if (new Date(s.durationTo || s.updatedAt).getTime() <= date.getTime()) {
          totalProduction += s.itemProduced;
          newProductionSlips.push({ ...s });
        };
      };

      const singleRequired = consumedItemForSingle[c._id + ""].forSingleQuantity;
      const currentlyLeft = (totalProduction / singleRequired) - previousProduction;
      const obj = {
        currentlyLeft: currentlyLeft * singleRequired,
        inventory: (currentlyLeft * singleRequired) - (currentProduction * singleRequired),
        totalProduction,
        previousProduction: previousProduction * singleRequired,
        singleRequired,
        childPartName: c.partName,
      };
      childParts.push(obj);
    };

    const obj = {
      workOrderNumber: workOrder.orderNumber,
      MCode: workOrder.MCode,
      FinishedItemName: workOrder.finishedItemName,
      productionSlipNumber: p.productionSlipNumber,
      workOrderId: p.workOrderId,
      printCount: p.printCount,
      partName: p.part.partName,
      shopName: p.shop.shopName,
      processName: p.process.processName,
      numberOfItems: p.numberOfItems,
      itemPerWorkOrder: p.itemPerWorkOrder,
      itemProduced: p.itemProduced,
      status: p.status,
      consumedItem: p.consumedItem,
      createdBy: p?.createdBy?.name,
      activatedBy: p?.activatedBy?.name,
      completedBy: p?.completedBy?.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      durationFrom: p?.durationFrom,
      durationTo: p?.durationTo,
      childParts,
    }
    result.push(obj);
  };

  resp.status(200).json({
    success: true,
    message: "getting excel data for productionSlips",
    result
  });
};

// excelReport as per workOrder in productionSLip
export const productionSlipExcelPerWorkOrder = async (req: Request, resp: Response, next: NextFunction) => {

  const workOrders = await workOrderModel.find().lean();

  const workOrderStore: any = {};

  workOrders.forEach((w) => {
    const id = w._id + "";
    workOrderStore[id] = {
      orderNumber: w.orderNumber,
      finishedItemName: w.finishItemName,
      MCode: w.MCode
    };
  });

  const allProductionSlips: any = await ProductionSlipModel.find({ status: { $nin: "cancel" }, itemProduced: { $gt: 0 } }).lean();

  const allProductionStore: any = {};
  allProductionSlips.forEach((a: any) => {
    const partId = a.part._id + "";
    if (!allProductionStore[partId]) {
      allProductionStore[partId] = {
        productionSlips: []
      };
    };
    allProductionStore[partId].productionSlips.push({ ...a });
  });

  const result: any = [];
  for (let p of allProductionSlips) {
    const partId = p.part._id;
    const workOrder = workOrderStore[p.workOrderId + ""];
    const currentProduction = p.itemProduced;
    const itemPerWorkOrder = p.itemPerWorkOrder;
    const date = new Date(p.durationTo || p.updatedAt);
    date.setTime(date.getTime() + (2 * 60 * 1000))
    const newProductionSlips: any = [];
    const slips = allProductionStore[partId + ""].productionSlips || [];
    let TotalProduction = 0;
    for (let s of slips) {
      if ((new Date(s.durationTo || s.updatedAt).getTime() <= date.getTime()) && (p.workOrderId + "" === s.workOrderId + "")) {
        TotalProduction += s.itemProduced;
        newProductionSlips.push({ ...s });
      };
    };

    const consumedItemForSingle: any = {};

    for (let c of p.consumedItem) {
      const id = c._id + "";
      consumedItemForSingle[id] = {
        forSingleQuantity: c.numberOfItem / itemPerWorkOrder
      };
    };

    let previousProduction = TotalProduction - currentProduction;
    const childParts: any = [];
    for (let c of p.consumedItem) {

      const newProductionSlips: any = [];

      const slips = allProductionStore[c._id + ""]?.productionSlips || [];

      let totalProduction = 0;

      for (let s of slips) {
        if ((new Date(s.durationTo || s.updatedAt).getTime() <= date.getTime()) && (p.workOrderId + "" === s.workOrderId + "")) {
          totalProduction += s.itemProduced;
          newProductionSlips.push({ ...s });
        };
      };

      const singleRequired = consumedItemForSingle[c._id + ""].forSingleQuantity; // 1
      const currentlyLeft = (totalProduction / singleRequired) - previousProduction; // 
      const obj = {
        currentlyLeft: currentlyLeft * singleRequired,
        inventory: (currentlyLeft * singleRequired) - (currentProduction * singleRequired),
        totalProduction,
        previousProduction: previousProduction * singleRequired,
        singleRequired,
        childPartName: c.partName,
      };
      childParts.push(obj);
    };

    const obj = {
      workOrderNumber: workOrder.orderNumber,
      MCode: workOrder.MCode,
      FinishedItemName: workOrder.finishedItemName,
      productionSlipNumber: p.productionSlipNumber,
      workOrderId: p.workOrderId,
      printCount: p.printCount,
      partName: p.part.partName,
      shopName: p.shop.shopName,
      processName: p.process.processName,
      numberOfItems: p.numberOfItems,
      itemPerWorkOrder: p.itemPerWorkOrder,
      itemProduced: p.itemProduced,
      status: p.status,
      consumedItem: p.consumedItem,
      createdBy: p?.createdBy?.name,
      activatedBy: p?.activatedBy?.name,
      completedBy: p?.completedBy?.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      durationFrom: p?.durationFrom,
      durationTo: p?.durationTo,
      childParts,
    }
    result.push(obj);
  };

  resp.status(200).json({
    success: true,
    message: "getting excel data for productionSlips",
    result
  });
};




// get active machines and ideal machines And Active Employees
export const activeIdleMachines = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let jobProfile;
    if (req.employee || req.admin) {
      const { processes, shop, name } = req.body as {
        processes: string[];
        shop: string;
        name: string;
      };
      const query: any = {};
      if (processes && processes.length > 0) {
        const Process = await globalProcessModel.find({
          processName: { $in: processes },
        });

        if (!query.process) {
          query.process = { $in: [] };
        }
        Process.forEach((p) => {
          query.process["$in"].push(p._id);
        });
      }
      if (name) {
        const process = await globalProcessModel
          .find({
            $or: [
              { processName: { $regex: name, $options: "i" } },
              { processCode: { $regex: name, $options: "i" } },
            ],
          })
          .lean();

        const processIds = process.map((p) => p._id);
        query.$or = [
          { machineName: { $regex: name, $options: "i" } },
          { code: { $regex: name, $options: "i" } },
          { process: { $in: processIds } },
        ];
      }

      if (shop) {
        if (!query.process) {
          query.process = { $in: [] };
        }
        const shopDetails = await ShopModel.findOne({ shopName: shop });
        if (shopDetails) {
          const processes = await globalProcessModel
            .find({ "shop.shopId": shopDetails._id })
            .lean();
          processes.forEach((p) => {
            query.process.$in.push(p._id);
          });
        }
      }

      if (req.employee) {
        jobProfile = await JobProfileModel.findById({
          _id: req.employee?.jobProfileId,
        });
      }

      if (jobProfile?.isSupervisor) {
        const shop = await ShopModel.findOne({
          "jobProfile.jobProfileId": jobProfile?._id,
        });

        const processes = await globalProcessModel
          .find({ "shop.shopId": shop?._id })
          .lean();

        const processIds = processes.map((p) => p._id);

        const machinesWithProcess = await machineModel
          .find({ ...query })
          .lean();

        const machinesWithProcessArray: any = [];

        processIds.forEach((p) => {
          const id = p + "";
          machinesWithProcess.forEach((m) => {
            let productionSlipId = "";
            if (m.logs) {
              productionSlipId =
                m.logs[m.logs.length - 1]?.productionSlipId + "" || "";
            }
            const obj = {
              id,
              _id: m._id,
              machineName: m.machineName,
              code: m.code,
              picture: m.picture || "",
              active: false,
              productionSlipId: productionSlipId,
            };
            m.process.forEach((n) => {
              if (n + "" == id) {
                machinesWithProcessArray.push(obj);
              }
            });
          });
        });

        const machinesStore: any = {};
        machinesWithProcessArray.forEach((m: any) => {
          const id = m.id;
          machinesStore[id] = {
            ...m,
          };
        });

        const newProductionSlips = await ProductionSlipModel.find({}).lean();

        const productionSlipStore: any = {};

        newProductionSlips.forEach((p) => {
          const id = p._id + "";
          productionSlipStore[id] = {
            ...p,
          };
        });

        newProductionSlips.forEach((p) => {
          if (p.status === "active") {
            if (p.working[p.working.length - 1]) {
              p.working[p.working.length - 1].machines.forEach((p) => {
                const id = p.machineId + "";
                if (machinesStore[id]) {
                  machinesStore[id].active = true;
                }
              });
            }
          }
        });

        const machineArray: any = [];
        for (const key in machinesStore) {
          if (machinesStore.hasOwnProperty(key)) {
            machineArray.push(machinesStore[key]);
          }
        }

        machineArray.forEach((m: any) => {
          const productionSlipId = m.productionSlipId + "";
          let productionSlip = {};
          if (productionSlipStore[productionSlipId]) {
            productionSlip = productionSlipStore[productionSlipId];
          }
          m.productionSlip = productionSlip;
        });

        resp.status(200).json({
          success: true,
          message: "Getting all active and inactive machines .",
          machineArray,
        });
      } else if (
        jobProfile?.jobProfileName.toLowerCase() === "hr" ||
        req.admin
      ) {
        // const allProductionSlip = await ProductionSlipModel.find({status:"completed"}).sort({createdAt:-1}).lean();
        // console.log(allProductionSlip)

        const allMachines = await machineModel.find({ ...query }).lean();
        const machineStore: any = {};

        allMachines.forEach((m) => {
          const id = m._id + "";
          let productionSlipId = "";
          if (m.logs) {
            productionSlipId =
              m.logs[m.logs.length - 1]?.productionSlipId + "" || "";
          }
          // console.log({...m})
          machineStore[id] = {
            id,
            _id: m._id,
            machineName: m.machineName,
            code: m.code,
            picture: m.picture || "",
            active: false,
            productionSlipId: productionSlipId,
          };
        });

        const productionSlips = await ProductionSlipModel.find({}).lean();
        const productionSlipStore: any = {};

        productionSlips.forEach((p) => {
          const id = p._id + "";
          productionSlipStore[id] = { ...p };
        });

        productionSlips.forEach((p) => {
          if (p.status === "active") {
            if (p.working[p.working.length - 1]) {
              p.working[p.working.length - 1].machines.forEach((p) => {
                const id = p.machineId + "";
                if (machineStore[id]) {
                  machineStore[id].active = true;
                }
              });
            }
          }
        });

        const machineArray: any = [];
        for (const key in machineStore) {
          if (machineStore.hasOwnProperty(key)) {
            machineArray.push(machineStore[key]);
          }
        }

        machineArray.forEach((m: any) => {
          const productionSlipId = m.productionSlipId + "";
          let productionSlip = {};
          if (productionSlipStore[productionSlipId]) {
            productionSlip = productionSlipStore[productionSlipId];
          }
          m.productionSlip = productionSlip;
        });

        resp.status(200).json({
          success: true,
          message: "Getting all active and inactive machines .",
          machineArray,
        });
      } else {
        return resp.status(403).json({
          success: false,
          message: "Not Authorized.",
        });
      }
    } else {
      return resp.status(400).json({
        success: false,
        message: "Login first",
      });
    }
  }
);

// getting active and idle employees
export const activeIdleEmployees = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let jobProfile;

    let date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setHours(date.getHours() - (6 + 5.5));

    let nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 3);
    nextDay.setHours(0, 0, 0, 0);
    nextDay.setHours(nextDay.getHours() - (6 + 5.5));
    date = date;
    nextDay = nextDay;

    // checking the jobProfile Name
    if (req.employee || req.admin) {
      if (req.employee) {
        jobProfile = await JobProfileModel.findById({
          _id: req.employee.jobProfileId,
        });
      }

      if (jobProfile?.isSupervisor) {
        const shop = await ShopModel.findOne({
          "jobProfile.jobProfileId": jobProfile?._id,
        });
        if (!shop) {
          return resp.status(404).json({
            success: false,
            message: `Shop not found for jobProfile ${jobProfile.jobProfileName}`,
          });
        }

        const shopLog = await ShopLogModel.findOne({
          date: { $gte: date, $lt: nextDay },
          shopId: shop._id,
        }).lean();
        const allEmployees = await EmployeeModel.find().lean();
        const allEmployeePictures = await EmployeeDocsModel.find().lean();
        const allJobProfile = await JobProfileModel.find().lean();
        const allEmployeeStore: any = {};
        const allEmployeePicturesStore: any = {};
        const allJobProfileStore: any = {};

        allEmployees.forEach((a) => {
          const id = a._id + "";
          allEmployeeStore[id] = {
            ...a,
          };
        });
        allJobProfile.forEach((a) => {
          const id = a._id + "";
          allJobProfileStore[id] = {
            ...a,
          };
        });

        allEmployeePictures.forEach((a) => {
          const id = a.employeeId + "";
          allEmployeePicturesStore[id] = {
            profilePicture: a.profilePicture ? a.profilePicture : "",
          };
        });

        const employeeStore: any = {};

        shopLog?.employees.forEach((s) => {
          const id = s.employeeId + "";
          const lastProductionSlipId =
            allEmployeeStore[id].productionLogs[
              allEmployeeStore[id].productionLogs.length - 1
            ]?.productionSlipId;
          employeeStore[id] = {
            ...s,
            active: false,
            employeeCode: allEmployeeStore[id].employeeCode
              ? allEmployeeStore[id].employeeCode
              : "",
            jobProfile:
              allJobProfileStore[allEmployeeStore[id].jobProfileId + ""]
                .jobProfileName,
            profilePicture: allEmployeePicturesStore[id]?.profilePicture
              ? allEmployeePicturesStore[id].profilePicture
              : "",
            productionSlipId: lastProductionSlipId ? lastProductionSlipId : "",
          };
        });

        const productionSlips = await ProductionSlipModel.find({}).lean();

        const productionSlipStore: any = {};
        productionSlips.forEach((p) => {
          const id = p._id + "";
          productionSlipStore[id] = { ...p };
        });

        productionSlips.forEach((p) => {
          if (p.status === "active") {
            if (p.working) {
              p.working[p.working.length - 1].employees.forEach((w) => {
                const id = w.employeeId + "";
                if (employeeStore[id]) {
                  employeeStore[id].active = true;
                }
              });
            }
          }
        });

        const employeeArray: any = [];

        for (const key in employeeStore) {
          if (employeeStore.hasOwnProperty(key)) {
            employeeArray.push(employeeStore[key]);
          }
        }

        employeeArray.forEach((e: any) => {
          const productionId = e.productionSlipId;
          if (productionId) {
            const productionSlip = productionSlipStore[productionId];
            e.productionSlip = productionSlip || {};
          }
        });

        resp.status(200).json({
          success: true,
          message: `Getting all employee data under shop ${shop.shopName}`,
          employeeArray,
        });
      } else if (
        jobProfile?.jobProfileName === "HR" ||
        jobProfile?.jobProfileName === "hr" ||
        req.admin
      ) {
        const shopLogs = await ShopLogModel.find({
          date: { $gte: date, $lt: nextDay },
        }).lean();

        const allEmployees = await EmployeeModel.find().lean();
        const allEmployeePictures = await EmployeeDocsModel.find().lean();
        const allJobProfile = await JobProfileModel.find().lean();
        const allEmployeeStore: any = {};
        const allEmployeePicturesStore: any = {};
        const allJobProfileStore: any = {};

        allEmployees.forEach((a) => {
          const id = a._id + "";
          allEmployeeStore[id] = {
            ...a,
          };
        });

        allJobProfile.forEach((a) => {
          const id = a._id + "";
          allJobProfileStore[id] = {
            ...a,
          };
        });

        allEmployeePictures.forEach((a) => {
          const id = a.employeeId + "";
          allEmployeePicturesStore[id] = {
            profilePicture: a.profilePicture ? a.profilePicture : "",
          };
        });

        const employeeStore: any = {};
        shopLogs.forEach((s) => {
          s.employees.forEach((e) => {
            const id = e.employeeId + "";
            const lastProductionSlipId =
              allEmployeeStore[id].productionLogs[
                allEmployeeStore[id].productionLogs.length - 1
              ]?.productionSlipId;
            employeeStore[id] = {
              ...e,
              active: false,
              employeeCode: allEmployeeStore[id].employeeCode
                ? allEmployeeStore[id].employeeCode
                : "",
              jobProfile:
                allJobProfileStore[allEmployeeStore[id].jobProfileId + ""]
                  .jobProfileName,
              profilePicture: allEmployeePicturesStore[id]?.profilePicture
                ? allEmployeePicturesStore[id].profilePicture
                : "",
              productionSlipId: lastProductionSlipId
                ? lastProductionSlipId
                : "",
            };
          });
        });

        const productionSlips = await ProductionSlipModel.find({}).lean();

        const productionSlipStore: any = {};
        productionSlips.forEach((p) => {
          const id = p._id + "";
          productionSlipStore[id] = { ...p };
        });

        productionSlips.forEach((p) => {
          if (p.status === "active") {
            if (p.working) {
              p.working[p.working.length - 1].employees.forEach((w) => {
                const id = w.employeeId + "";
                if (employeeStore[id]) {
                  employeeStore[id].active = true;
                }
              });
            }
          }
        });

        const employeeArray: any = [];
        for (const key in employeeStore) {
          if (employeeStore.hasOwnProperty(key)) {
            employeeArray.push(employeeStore[key]);
          }
        }

        employeeArray.forEach((e: any) => {
          const productionId = e.productionSlipId;
          if (productionId) {
            const productionSlip = productionSlipStore[productionId];
            e.productionSlip = productionSlip || {};
          }
        });

        return resp.status(200).json({
          success: true,
          message: "Getting all the employee data ",
          employeeArray,
        });
      } else {
        return resp.status(403).json({
          success: false,
          message: "Not Authorized.",
        });
      }
    } else {
      return resp.status(400).json({
        success: false,
        message: "Login first",
      });
    }
  }
);

// get all childPart With productionslip Count
export const getChildPartWithProductionSlipCount =
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    try {
      const { workOrderId } = req.params;
      const { processName } = req.body;

      const workOrder = await workOrderModel.findById(workOrderId);
      if (!workOrder) {
        return resp.status(404).json({
          success: false,
          message: `WorkOrder not found with id ${workOrderId}.`,
        });
      }
      const childParentStore: any = {};

      for (let w of workOrder.masterBom) {
        const partId = w._id + "";
        const numberOfItem = w.numberOfItem;
        for (let c of w.newChild) {
          const childQuantity = c.numberOfItem || 0;
          const childId = c._id + "";
          if (!childParentStore[childId]) {
            childParentStore[childId] = {
              parentId: partId,
              perOnePart: childQuantity / numberOfItem
            }
          };
        }
      }



      if (req.employee || req.admin) {
        let jobProfile;
        let shop;
        if (req.employee) {
          jobProfile = await JobProfileModel.findById(req.employee.jobProfileId);
          if (!jobProfile || !jobProfile.isSupervisor)
            return next(
              new ErrorHandler(
                `Job Profile not found or not Supervisor of employee ${req.employee.employeeCode}`,
                404
              )
            );
          shop = await ShopModel.findOne({
            "jobProfile.jobProfileId": jobProfile._id,
          });
          if (!shop)
            return next(
              new ErrorHandler(
                `Shop not found for jobProfile ${jobProfile.jobProfileName}`,
                404
              )
            );
        };

        if (req.employee && jobProfile?.jobProfileName.toLowerCase() !== "hr") {
          const allProdctionSlips = await ProductionSlipModel.find({
            workOrderId: workOrder._id,
            "shop.shopId": shop?._id,
          }).lean();

          // const childParentStore :any = {};


          const processes = await globalProcessModel.find({
            "shop.shopId": shop?._id,
          }).lean();

          const processStore: any = {};

          processes.forEach((p) => {
            const id = p._id + "";
            processStore[id] = { ...p };
          });

          const productionSlipStore: any = {};

          allProdctionSlips.forEach((a) => {
            const id = a.part._id + "";
            // const itemPerWorkOrder = a.itemPerWorkOrder;
            if (productionSlipStore[id]) {
              productionSlipStore[id].value.push({ ...a });
            } else {
              productionSlipStore[id] = {
                value: [{ ...a }],
              };
            }
            //  a.consumedItem.forEach((c)=>{
            //     const childId = c._id+"";
            //     if(!childParentStore[childId]){
            //       childParentStore[childId] = {
            //         parentId : id,
            //         perOnePart : c.numberOfItem/itemPerWorkOrder
            //       }
            //     };
            //  });
          });
          const result: any = [];
          let count = 0;
          workOrder.masterBom.forEach((w) => {
            const id = w._id + "";
            count++;
            const productionSlips = productionSlipStore[id];
            const parentId = childParentStore[id]?.parentId + "";
            // console.log(id,count)
            const perSingleItem = childParentStore[id]?.perOnePart || 0;

            const parentSlips = productionSlipStore[parentId];

            let itemProduced = 0;

            let itemPerWorkOrder = 0;

            if (productionSlips) {
              itemPerWorkOrder = productionSlips.value[0].itemPerWorkOrder || 0;
              productionSlips.value.forEach((p: any) => {
                itemProduced += p.itemProduced;
              });
            };

            let parentProduced = 0;

            if (parentSlips) {
              parentSlips.value.forEach((p: any) => {
                parentProduced += p.itemProduced;
              });
            };


            if (processStore[w.processId + ""]) {
              if (processName) {
                if (processName + "" === processStore[w.processId + ""].processName + "") {
                  const obj = {
                    itemPerWorkOrder,
                    partName: w.partName,
                    process: w.process,
                    numberOfProductionSlips: productionSlips?.value.length || 0,
                    productionSlips: productionSlips?.value,
                    numberOfItems: w.numberOfItem,
                    itemProduced,
                    inventory: itemProduced - (parentProduced * perSingleItem)
                  };
                  result.push(obj);
                } else {
                  return;
                }
              } else {
                const obj = {
                  itemPerWorkOrder,
                  partName: w.partName,
                  process: w.process,
                  numberOfProductionSlips: productionSlips?.value.length || 0,
                  productionSlips: productionSlips?.value,
                  numberOfItems: w.numberOfItem,
                  itemProduced,
                  inventory: itemProduced - (parentProduced * perSingleItem)
                };
                result.push(obj);
              }
            }
          });

          resp.status(200).json({
            success: true,
            message: "Getting all the data for workOrder.",
            result,
          });
        } else {
          const allProdctionSlips = await ProductionSlipModel.find({
            workOrderId: workOrder._id,
          }).lean();
          const allProcesses = await globalProcessModel.find().lean();

          const allProcessStore: any = {};
          const productionSlipStore: any = {};
          // const childParentStore :any = {};

          allProcesses.forEach((a) => {
            const id = a._id + "";
            allProcessStore[id] = { ...a }
          });

          allProdctionSlips.forEach((a) => {
            const id = a.part._id + "";
            const itemPerWorkOrder = a.itemPerWorkOrder;
            if (productionSlipStore[id]) {
              productionSlipStore[id].value.push({ ...a });
            } else {
              productionSlipStore[id] = {
                value: [{ ...a }],
              };
            }
            //  a.consumedItem.forEach((c)=>{
            //     const childId = c._id+"";
            //     if(!childParentStore[childId]){
            //       childParentStore[childId] = {
            //         parentId : id,
            //         perOnePart : c.numberOfItem/itemPerWorkOrder
            //       }
            //     };
            //  });
          });

          const result: any = [];

          workOrder.masterBom.forEach((w) => {
            const id = w._id + "";

            const productionSlips = productionSlipStore[id];
            const parentId = childParentStore[id]?.parentId + "";
            const perSingleItem = childParentStore[id]?.perOnePart || 0;

            const parentSlips = productionSlipStore[parentId];

            let itemProduced = 0;
            let itemPerWorkOrder = 0;
            if (productionSlips) {
              itemPerWorkOrder = productionSlips.value[0].itemPerWorkOrder || 0;
              productionSlips.value.forEach((p: any) => {
                itemProduced += p.itemProduced;
              });
            };

            let parentProduced = 0;

            if (parentSlips) {
              parentSlips.value.forEach((p: any) => {
                parentProduced += p.itemProduced;
              });
            };
            if (processName) {
              if (processName === allProcessStore[w.processId + ""].processName) {
                const obj = {
                  itemPerWorkOrder,
                  partName: w.partName,
                  process: w.process,
                  numberOfProductionSlips: productionSlips?.value.length || 0,
                  productionSlips: productionSlips?.value,
                  numberOfItems: w.numberOfItem,
                  itemProduced,
                  consumed: (parentProduced * perSingleItem),
                  inventory: itemProduced - (parentProduced * perSingleItem)
                };
                result.push(obj);
              } else {
                return;
              }
            } else {
              const obj = {
                itemPerWorkOrder,
                partName: w.partName,
                process: w.process,
                numberOfProductionSlips: productionSlips?.value.length || 0,
                productionSlips: productionSlips?.value,
                numberOfItems: w.numberOfItem,
                itemProduced,
                consumed: (parentProduced * perSingleItem),
                inventory: itemProduced - (parentProduced * perSingleItem)
              };
              result.push(obj);
            }
          });

          resp.status(200).json({
            success: true,
            message: "Getting all the data for workOrder.",
            result,
          });
        }
      } else {
        return next(new ErrorHandler(`Login First`, 403));
      }

    } catch (error) {
      console.log(error);
    }
  }

// get multiple ProductionSlips
export const multiProductionSlip = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { productionSlipNumbers } = req.body;

    const productionSlips = await ProductionSlipModel.find({
      productionSlipNumber: { $in: productionSlipNumbers },
    }).sort({ 'process.processName': 1 }).lean();

    for (let p of productionSlipNumbers) {
      const productionSlip = await ProductionSlipModel.findOne({
        productionSlipNumber: p,
      });
      if (productionSlip) {
        productionSlip.printCount += 1;
        await productionSlip.save();
      }
    }

    const allProcesses = await globalProcessModel.find().lean();
    const processStore: any = {};
    allProcesses.forEach((p) => {
      const Id = p._id + "";
      processStore[Id] = {
        ...p,
      };
    });

    const workOrderIds = productionSlips.map((p) => p.workOrderId);
    const workOrders = await workOrderModel
      .find({ _id: { $in: workOrderIds } })
      .lean();
    const workOrderStore: any = {};

    workOrders.forEach((w) => {
      const id = w._id + "";
      workOrderStore[id] = {
        ...w,
      };
    });

    const result: any = [];

    for (let p of productionSlips) {
      const workOrderId = p.workOrderId + "";
      const workOrder = workOrderStore[workOrderId];
      const workOrderNumber = workOrder.orderNumber;
      const finishItemName =
        (await translateEnglishToHindi(workOrder.finishItemName)) ||
        workOrder.finishItemName;
      const partCode = workOrder.partCode;
      const MCode = workOrder.MCode;
      const processName =
        (await translateEnglishToHindi(
          processStore[p.process.processId + ""].processName
        )) || processStore[p.process.processId + ""].processName;
      const processCode = processStore[p.process.processId + ""].processCode;
      const productionItem =
        (await translateEnglishToHindi(p.part.partName)) || p.part.partName;
      const shopName =
        (await translateEnglishToHindi(
          processStore[p.process.processId + ""].shop.shopName
        )) || processStore[p.process.processId + ""].shop.shopName;

      for (let i of p.consumedItem) {
        i.partName = (await translateEnglishToHindi(i.partName)) || i.partName;
      }

      const obj = {
        workOrderNumber,
        finishItemName,
        orderAt: workOrder.date,
        partCode,
        MCode,
        orderQuantity: workOrder.orderQuantity,
        QRCode: p.QRCode,
        processName,
        processCode,
        shopName,
        productionItem,
        itemPerWorkOrder: p.itemPerWorkOrder,
        productionSlipNumber: p.productionSlipNumber,
        numberOfItems: p.numberOfItems,
        consumptionItem: p.consumedItem,
        createdAt: p.createdAt,
      };
      result.push(obj);
    }

    resp.json({
      success: true,
      message: "Getting all productionSlip successfully.",
      result,
    });
  }
);

// for English
// get multiple ProductionSlips
export const multiProductionSlipEnglish = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { productionSlipNumbers } = req.body;

    const productionSlips = await ProductionSlipModel.find({
      productionSlipNumber: { $in: productionSlipNumbers },
    }).sort({ 'process.processName': 1 }).lean();

    for (let p of productionSlipNumbers) {
      const productionSlip = await ProductionSlipModel.findOne({
        productionSlipNumber: p,
      });
      if (productionSlip) {
        productionSlip.printCount += 1;
        await productionSlip.save();
      };
    };

    const allProcesses = await globalProcessModel.find().lean();
    const processStore: any = {};
    allProcesses.forEach((p) => {
      const Id = p._id + "";
      processStore[Id] = {
        ...p,
      };
    });

    const workOrderIds = productionSlips.map((p) => p.workOrderId);
    const workOrders = await workOrderModel
      .find({ _id: { $in: workOrderIds } })
      .lean();
    const workOrderStore: any = {};

    workOrders.forEach((w) => {
      const id = w._id + "";
      workOrderStore[id] = {
        ...w,
      };
    });

    const result: any = [];

    for (let p of productionSlips) {
      const workOrderId = p.workOrderId + "";
      const workOrder = workOrderStore[workOrderId];
      const workOrderNumber = workOrder.orderNumber;
      const finishItemName = workOrder.finishItemName;
      const partCode = workOrder.partCode;
      const MCode = workOrder.MCode;
      const processName = processStore[p.process.processId + ""]?.processName;
      const processCode = processStore[p.process.processId + ""]?.processCode;
      const productionItem = p.part.partName;
      const shopName = processStore[p.process.processId + ""]?.shop.shopName;

      const obj = {
        workOrderNumber,
        finishItemName,
        orderAt: workOrder.date,
        partCode,
        MCode,
        orderQuantity: workOrder.orderQuantity,
        QRCode: p.QRCode,
        processName,
        processCode,
        shopName,
        productionItem,
        itemPerWorkOrder: p.itemPerWorkOrder,
        productionSlipNumber: p.productionSlipNumber,
        numberOfItems: p.numberOfItems,
        consumptionItem: p.consumedItem,
        createdAt: p.createdAt,
      };
      result.push(obj);
    };

    resp.json({
      success: true,
      message: "Getting all productionSlip successfully.",
      result,
    });
  });

// Pdf print Count
export const countPdfPrint = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { productionSlipNumbers } = req.body as {
      productionSlipNumbers: string[];
    };
    const result: string[] = [];
    for (let p of productionSlipNumbers) {
      const productionSlip = await ProductionSlipModel.findOne({
        productionSlipNumber: p,
      });

      if (productionSlip) {
        productionSlip.printCount += 1;
        await productionSlip.save();
        result.push(productionSlip.productionSlipNumber);
      };
    };

    resp.json({
      success: true,
      message: `Pdf Count updated.`,
      slipNumber: result,
    });
  }
);

// edit Production
export const EditProduction = catchErrorAsync(async (req: Request, resp: Response, next: NextFunction) => {
  const { productionSlipNumber } = req.params;
  const { itemProduced, index } = req.body as {
    itemProduced: number;
    index: number;
  };

  const productionSlip = await ProductionSlipModel.findOne({
    productionSlipNumber,
  });
  if (!productionSlip) {
    return resp.status(404).json({
      success: false,
      message: `Production Slip not found with number ${productionSlip}.`,
    });
  };

  const workOrder = await workOrderModel.findById(productionSlip.workOrderId);
  if (!workOrder) {
    return resp.status(404).json({
      success: false,
      message: `Work order not found for slipNumber ${productionSlipNumber}.`
    })
  };
  const lastPartId = workOrder.masterBom[workOrder.masterBom.length - 1]._id;

  const finishedItem = await FinishedItemModel.findOne({ MCode: workOrder.MCode });

  if (!finishedItem) {
    return resp.status(404).json({
      success: false,
      message: `Finish Item not found with name ${workOrder.finishItemName}.`
    });
  };

  let count = 0;
  let oldProduction = 0;
  const completeOldProduction = productionSlip.itemProduced;
  productionSlip.working.forEach((p) => {
    if (count === index) {
      oldProduction = p.itemProduced || 0;
      p.itemProduced = itemProduced;
    };
    count++;
  });

  productionSlip.itemProduced = productionSlip.itemProduced - oldProduction + itemProduced;

  await productionSlip.save();

  const completeNewproduction = productionSlip.itemProduced;

  const endDate = new Date(productionSlip.durationTo);
  endDate.setHours(0, 0, 0, 0);

  const month = new Date(productionSlip.durationTo);
  month.setUTCDate(1);
  month.setUTCHours(0, 0, 0, 0);

  let planning;
  if (productionSlip.part._id + "" === lastPartId + "") {
    planning = await PlanningModel.findOne({
      finishedItemId: finishedItem._id,
      month: month,
    });

    planning?.dates.forEach((p) => {
      const date = new Date(p.date);
      date.setHours(0, 0, 0, 0);

      if (date + "" === endDate + "") {
        if (!p.dispatchValue) {
          p.dispatchValue = 0;
        };
        p.dispatchValue = p.dispatchValue - completeOldProduction + completeNewproduction;
      };
    });
    await planning?.save();
  };

  resp.status(200).json({
    success: true,
    message: "Production Slip updated successfully.",
    productionSlip,
  });
});

// update status of production slip
export const updateProductionSlipStatus = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { productionSlipNumber } = req.params;
    const { status } = req.body as {
      status: "cancel" | "active" | "inactive" | "completed";
    };

    const productionSlip = await ProductionSlipModel.findOne({
      productionSlipNumber,
    });

    if (!productionSlip) {
      return resp.status(404).json({
        success: false,
        message: `Production Slip with number ${productionSlipNumber} not found.`,
      });
    };

    productionSlip.status = status;
    await productionSlip.save();

    resp.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      productionSlip,
    });
  });

export const addingOrderQuantity = catchErrorAsync(async (req, resp, next) => {
  const allProductionSlips = await ProductionSlipModel.find();

  const allWorkOrders = await workOrderModel.find().lean();
  const workOrderStore: any = {};
  allWorkOrders.forEach((w) => {
    const id = w._id + "";
    workOrderStore[id] = {
      ...w,
    };
  });

  for (let i of allProductionSlips) {
    const workOrder = workOrderStore[i.workOrderId + ""];

    const partId = i.part._id + "";
    let totalNumberOfItems = 0;

    workOrder?.masterBom.forEach((w: any) => {
      const id = w._id + "";
      if (partId === id) {
        totalNumberOfItems = w.numberOfItem;
      }
    });
    const productionSlip = await ProductionSlipModel.findById(i._id);
    if (productionSlip) {
      productionSlip.itemPerWorkOrder = totalNumberOfItems;
      await productionSlip.save();
    }
  }

  resp.status(200).json({
    success: true,
    message: "All work done.",
  });
});

// function calculateTotalHours(timeIntervals:any) {
//   let totalHours = 0;

//   // Iterate through the time intervals
//   for (let i = 0; i < timeIntervals.length; i++) {
//       const interval = timeIntervals[i];
//       const startTime = new Date(interval.startTime);
//       const endTime = new Date(interval.endTime);

//       // Calculate the duration in milliseconds
//       const durationMs = endTime - startTime;

//       // Convert duration to hours
//       const durationHours = durationMs / (1000 * 60 * 60);

//       // Subtract common intervals (if not the first interval)
//       if (i > 0) {
//           const commonStart = Math.max(startTime, new Date(timeIntervals[i - 1].endTime));
//           const commonEnd = Math.min(endTime, new Date(timeIntervals[i - 1].endTime));
//           const commonDurationMs = commonEnd - commonStart;
//           const commonDurationHours = commonDurationMs / (1000 * 60 * 60);
//           durationHours -= commonDurationHours;
//       }

//       // Add the duration to the total
//       totalHours += durationHours;
//   }

//   return totalHours;
// }

function sortEventsByStartTime(events: any) {
  return events.slice().sort((a: any, b: any) => {
    const startTime: any = new Date(a.startTime);
    const endTime: any = new Date(b?.startTime);
    return startTime - endTime;
  });
}

export function gettingHours(timeArray: { startTime: any; endTime: any }[]) {
  let newArray;
  if (timeArray.length === 0) {
    return 0;
  }
  if (timeArray.length > 1) {
    newArray = sortEventsByStartTime(timeArray);
  } else {
    newArray = timeArray;
  };

  let startTime: any = new Date(newArray[0].startTime);
  let endTime: any = new Date(newArray[newArray.length - 1].endTime)
    ? new Date(newArray[newArray.length - 1].endTime)
    : new Date();

  const timeDifference = endTime - startTime;
  const totalHours = timeDifference / (1000 * 60 * 60);

  let idleHours = 0;

  let lastestEndTime: any = new Date(newArray[0].endTime);

  for (let i = 1; i < newArray.length - 1; i++) {
    const start: any = new Date(newArray[i].startTime);
    if (start > lastestEndTime) {
      const difference = start - lastestEndTime;
      idleHours += difference / (1000 * 60 * 60);
    };
    lastestEndTime = new Date(newArray[i].endTime);
  };

  return totalHours - idleHours;
};

// get employee productivity
export const getProductivityPerEmployee = async (
  employeeId: string,
  firstPunchIn: Date,
  lastPunchOut: Date
) => {
  try {
    // const { employeeId } = req.params;

    // const { date, nextDate } = req.query as { date: string; nextDate: string };
    // let newDate;
    // let newNextDate;
    // if (date) {
    //   newDate = new Date(date);
    //   newDate.setHours(0, 0, 0, 0);
    // } else {
    //   newDate = new Date("2023-10-16");
    //   newDate.setHours(0, 0, 0, 0);
    // }
    // if (nextDate) {
    //   newNextDate = new Date(nextDate);
    //   newNextDate.setHours(0, 0, 0, 0);
    // } else {
    //   newNextDate = new Date();
    //   newNextDate.setHours(0, 0, 0, 0);
    // }
    // const employeeDetails = await EmployeeModel.findById(employeeId);
    console.log(
      "First punchin ........................................",
      firstPunchIn
    );
    console.log(
      "current punch Out.....................................",
      lastPunchOut
    );
    // const EmployeeId = employeeDetails?._id + "";
    const productionSlips = await ProductionSlipModel.find({
      durationFrom: {
        $gte: new Date(firstPunchIn),
        $lte: new Date(lastPunchOut),
      },
      // "working.employees.employeeId": employeeId,
      status: { $nin: ["cancel"] },
    }).lean();
    // console.log("productionSlips",productionSlips)
    const allDetails: { startTime: any; endTime: any }[] = [];
    const productionSlipNumbers: string[] = [];
    productionSlips?.forEach((p) => {
      if (p.working && p.working.length > 0) {
        p.working.forEach((w) => {
          w?.employees.forEach((e) => {
            if (e.employeeId + "" === employeeId + "") {
              const obj = {
                startTime: w.startTime,
                endTime: w.endTime ? w.endTime : new Date(),
                // itemProduced : w.itemProduced,
                // productionSlipNumber : p.productionSlipNumber,
                // timeSpend : new Date(w.endTime) - new Date(w.startTime);
              };
              const productionSlipNumber = p.productionSlipNumber;
              productionSlipNumbers.push(productionSlipNumber);
              allDetails.push(obj);
            };
          });
        });
      };
    });

    // const data = [
    //   {
    //     startTime: "2023-10-16T09:00:00.000Z",
    //     endTime: "2023-10-16T12:22:00.000Z",
    //   },
    //   {
    //     startTime: "2023-10-16T08:00:00.000Z",
    //     endTime: "2023-10-16T10:48:00.000Z",
    //   },
    //   {
    //     startTime: "2023-10-16T14:00:00.000Z",
    //     endTime: "2023-10-16T14:32:00.000Z",
    //   },
    //   {
    //     startTime: "2023-10-16T16:58:00.000Z",
    //     endTime: "2023-10-16T20:00:00.000Z",
    //   },
    //   {
    //     startTime: "2023-10-16T15:32:00.000Z",
    //     endTime: "2023-10-16T18:28:00.000Z",
    //   },
    // ];

    return {
      productionSlipNumbers,
      productiveHours: gettingHours(allDetails),
    };
  } catch (error) {
    console.log(error);
  }
};


// STATUS CARDS
export const statusCards = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {

    const activeSlips = await ProductionSlipModel.countDocuments({ status: "active" });
    const inActiveSlips = await ProductionSlipModel.countDocuments({ status: "inactive" });
    const completedSlips = await ProductionSlipModel.countDocuments({ status: "completed" });
    const cancelledSlips = await ProductionSlipModel.countDocuments({ status: "cancel" });
    const manualSlips = await ProductionSlipModel.countDocuments({ status: "manual" });
    const cncSlips = await ProductionSlipModel.countDocuments({ status: "cnc" });
    resp.status(200).json({
      success: true,
      message: "Getting Status Successfully",
      data: {
        activeSlips,
        inActiveSlips,
        completedSlips,
        cancelledSlips,
        manualSlips,
        cncSlips
      }
    })
  });
