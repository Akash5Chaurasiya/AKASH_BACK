import { Response, Request, NextFunction } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import ProductionSlipModel from "../../database/models/productionSlipModel";
import workOrderModel from "../../database/models/workOrderModel";
import globalProcessModel from "../../database/models/globalProcessModel";
import FinishedItemModel from "../../database/models/finishedItemModel";
import ChildPartModel from "../../database/models/childPartModel";
import PlanningSchema from "../../database/schemas/planningSchema";
import PlanningModel from "../../database/models/planningModel";
import { getBomItemWithQuantity } from "./finishedItemController";

export const getDataInventory = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  let {
    workOrderNumbers,
    name,
    MCodes,
    date,
    nextDate,
    status,
    customers,
    process,
    shop,
    startDate = new Date(),
    days = 7,
  } = req.body as {
    status: string[];
    workOrderNumbers: string[];
    name: string;
    MCodes: string[];
    date: string;
    customers: string[];
    nextDate: string;
    process: string;
    shop: string;
    startDate: any;
    days: any;
  };
  try {
    startDate = new Date(startDate);

    const month = new Date();
    month.setDate(1);
    month.setUTCHours(0, 0, 0, 0);

    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    const allFinishedItems = await FinishedItemModel.find().lean();
    const finishedItemStore: any = {};

    allFinishedItems.forEach((a) => {
      const id = a._id + "";
      finishedItemStore[id] = { ...a };
    });

    const allChildParts = await ChildPartModel.find().lean();
    const partStore: any = {};
    allChildParts.forEach((a) => {
      const id = a._id + "";
      partStore[id] = {
        ...a,
        neededQuantity: 0,
        totalProduced: 0,
      };
    });

    const allChildPartStore: any = {};
    allChildParts.forEach((a: any) => {
      if (a.consumedItem) {
        a.consumedItem.forEach((c: any) => {
          const id = c.itemId + "";
          allChildPartStore[id] = {
            parentId: a._id,
          };
        });
      }
    });

    const planning = await PlanningModel.find({ month }).lean();
    const planningStore: any = {};
    const maxDays = planning[0].dates.length;
    for (let plan of planning) {
      const finishedItem = finishedItemStore[plan.finishedItemId + ""];
      const minimumInventory = plan?.minimumInventory
        ? plan.minimumInventory
        : 0;
      const MCode = finishedItem?.MCode + "";
      const lastDay =
        new Date().getDate() + days < maxDays
          ? new Date().getDate() + days
          : maxDays;
      for (let i = 0; i < lastDay; i++) {
        const p = plan.dates[i];
        if (!planningStore[MCode]) {
          planningStore[MCode] = {
            orderValue: minimumInventory || 0,
            dispatchValue: 0,
          };
        }
        planningStore[MCode].orderValue += p.orderValue;
        planningStore[MCode].dispatchValue += p.dispatchValue;
      }

      // const data = await getBomItemWithQuantity(req,resp,plan.finishedItemId,1);
      // data?.newFinishItem.items.forEach((d:any)=>{
      //   const id = d._id+"";
      //   partStore[id] = {
      //     numberOfItem:d.numberOfItem
      //   };
      // });
    }

    name = name?.toLowerCase()?.trim();

    const productionSlipStore: any = {};

    const allProductionSlips = await ProductionSlipModel.find({}).lean();

    allProductionSlips.forEach((a) => {
      const id = a.workOrderId + "";

      if (!productionSlipStore[id]) {
        productionSlipStore[id] = {
          slips: [],
        };
      }

      productionSlipStore[id].slips.push({
        ...a,
      });
    });

    const query: any = {};

    if (workOrderNumbers && workOrderNumbers.length > 0) {
      query.orderNumber = { $in: workOrderNumbers };
    }

    if (MCodes && MCodes.length > 0) {
      query.MCode = { $in: MCodes };
    }

    if (date) {
      const newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);
      let newNextDate;
      if (nextDate) {
        newNextDate = new Date(nextDate);
        newNextDate.setHours(0, 0, 0, 0);
        newNextDate.setDate(newNextDate.getDate() + 1);
      } else {
        newNextDate = new Date(newDate);
        newNextDate.setDate(newDate.getDate() + 1);
      }
      query.date = {
        $gte: newDate,
        $lt: newNextDate,
      };
    }

    if (status && status.length > 0) {
      query.status = { $in: status };
    }

    if (customers && customers.length > 0) {
      query.customerName = { $in: customers };
    }

    const allProcesses = await globalProcessModel.find({}).lean();

    const processStore: any = {};
    allProcesses.forEach((a) => {
      const id = a._id + "";
      processStore[id] = {
        ...a,
      };
    });

    let workOrders = await workOrderModel
      .find({ ...query, status: { $nin: ["cancel"] } })
      .lean();

    const newStore: any = {};

    workOrders.forEach((w) => {
      const id = w._id + "";
      newStore[id] = {};
      const store = newStore[id];
      w.masterBom.forEach((w) => {
        const numberOfItems = w.numberOfItem;
        w.newChild.forEach((n) => {
          if (n.numberOfItem) {
            const singleConsumption = n.numberOfItem / numberOfItems;
            const id = n._id + "";
            store[id] = singleConsumption;
          }
        });
      });
    });

    const result: any = [];

    workOrders.forEach((w) => {
      const workOrderId = w._id + "";
      // const orderQuantity = w.orderQuantity;
      const productionSlips = productionSlipStore[workOrderId];
      // if (!productionSlips) {
      //   return;
      // }
      let count = 1;
      w.masterBom.forEach((m) => {
        const numberOfItems = m.numberOfItem;
        const childPartId = m._id + "";
        let itemProduced = 0;
        let itemConsumed = 0;
        let rawMaterial: any = [];
        let processId = m.processId + "";
        let processDetails = processStore[processId];
        let shopName = processDetails.shop.shopName;
        if (m.newChild) {
          m.newChild.forEach((c) => {
            if (c.unit) {
              if (c.numberOfItem) {
                const partId = c._id + "";
                const consumptionPerOneItem = newStore[workOrderId][partId];
                const obj = {
                  consumptionPerOneItem,
                  childPartName: c.partName,
                  unit: c.unit,
                  materialCode: c.materialCode,
                  consumptionGodown: c.consumptionGodownName,
                };
                rawMaterial.push(obj);
              }
            }
          });
        }

        let numberOfSlips = 0;
        let activeSlips = 0;
        let completedSlips = 0;
        let cancelledSlips = 0;
        let cncSlips = 0;
        let manualSlips = 0;
        let manualProduced = 0;

        productionSlips?.slips.forEach((p: any) => {
          if (p.consumedItem) {
            p.consumedItem.forEach((c: any) => {
              const id = c._id + "";

              if (id === childPartId) {
                const consumptionPerOneItem = newStore[workOrderId][id];
                itemConsumed += p.itemProduced * consumptionPerOneItem;
              }
            });
          }

          if (p.part._id + "" === childPartId) {
            numberOfSlips++;
            if (p.status === "cancel") {
              cancelledSlips++;
              return;
            } else if (p.status === "active") {
              activeSlips++;
            } else if (p.status === "completed") {
              completedSlips++;
            } else if (p.status === "manual") {
              manualProduced += p.itemProduced;
              manualSlips++;
            } else if (p.status === "cnc") {
              cncSlips++;
            }

            // shopName = p.shop.shopName;

            itemProduced += p.itemProduced;
          }
        });
        if (name) {
          if (
            w.orderNumber?.toLowerCase().includes(name) ||
            w.partCode?.toLowerCase().includes(name) ||
            w.finishItemName?.toLowerCase().includes(name) ||
            w.MCode?.toLowerCase().includes(name) ||
            m.partName?.toLowerCase().includes(name) ||
            processStore[m.processId + ""]?.processName
              ?.toLowerCase()
              .includes(name) ||
            shopName?.toLowerCase().includes(name)
          ) {
            if (process || shop) {
              if (process && shop) {
                if (
                  processStore[m.processId + ""]?.processName === process &&
                  shopName === shop
                ) {
                  const obj = {
                    partName: m.partName,
                    shopName,
                    partId: m._id,
                    MCode: w.MCode,
                    processName: processStore[m.processId + ""]?.processName,
                    itemConsumed,
                    itemProduced,
                    manualProduced,
                    numberOfItems,
                    inventory: itemProduced - itemConsumed,
                    rawMaterial,
                    numberOfSlips,
                    activeSlips,
                    cancelledSlips,
                    completedSlips,
                    cncSlips,
                    manualSlips,
                    serialNumber: count,
                  };
                  result.push(obj);
                } else {
                  return;
                }
              } else if (
                processStore[m.processId + ""]?.processName === process
              ) {
                const obj = {
                  partName: m.partName,
                  shopName,
                  partId: m._id,
                  MCode: w.MCode,
                  processName: processStore[m.processId + ""]?.processName,
                  itemConsumed,
                  itemProduced,
                  manualProduced,
                  numberOfItems,
                  inventory: itemProduced - itemConsumed,
                  rawMaterial,
                  numberOfSlips,
                  activeSlips,
                  cancelledSlips,
                  completedSlips,
                  cncSlips,
                  manualSlips,
                  serialNumber: count,
                };
                result.push(obj);
              } else if (shopName === shop) {
                const obj = {
                  partId: m._id,
                  MCode: w.MCode,
                  shopName,
                  partName: m.partName,
                  processName: processStore[m.processId + ""]?.processName,
                  itemConsumed,
                  itemProduced,
                  manualProduced,
                  numberOfItems,
                  inventory: itemProduced - itemConsumed,
                  rawMaterial,
                  numberOfSlips,
                  activeSlips,
                  cancelledSlips,
                  completedSlips,
                  cncSlips,
                  manualSlips,
                  serialNumber: count,
                };
                result.push(obj);
              } else {
                return;
              }
            } else {
              const obj = {
                partId: m._id,
                MCode: w.MCode,
                shopName,
                partName: m.partName,
                processName: processStore[m.processId + ""]?.processName,
                itemConsumed,
                itemProduced,
                manualProduced,
                numberOfItems,
                inventory: itemProduced - itemConsumed,
                rawMaterial,
                numberOfSlips,
                activeSlips,
                cancelledSlips,
                completedSlips,
                cncSlips,
                manualSlips,
                serialNumber: count,
              };
              result.push(obj);
            }
          } else {
            return;
          }
        } else {
          if (
            (process
              ? processStore[m.processId + ""]?.processName === process
              : true) &&
            (shop ? shopName === shop : true)
          ) {
            const obj = {
              numberOfSlips,
              MCode: w.MCode,
              shopName,
              partId: m._id,
              orderNumber: w.orderNumber,
              partName: m.partName,
              processName: processStore[m.processId + ""]?.processName,
              itemConsumed,
              itemProduced,
              manualProduced,
              numberOfItems,
              activeSlips,
              cancelledSlips,
              completedSlips,
              cncSlips,
              manualSlips,
              inventory: itemProduced - itemConsumed,
              rawMaterial,
              serialNumber: count,
            };
            result.push(obj);
          }
        }
        count++;
      });
    });

    const newCombineResult: any = {};
    result.forEach((r: any) => {
      const name = r.partName + "";
      if (!newCombineResult[name]) {
        newCombineResult[name] = {
          data: [],
        };
      }
      newCombineResult[name].data.push({ ...r });
    });

    const resultArray: any[] = [];

    for (const partName in newCombineResult) {
      if (newCombineResult.hasOwnProperty(partName)) {
        resultArray.push(newCombineResult[partName].data);
      }
    }

    const finalResultObj: any = {};

    // breakpoint ------------------- here we are setting the mCode with the complete bom
    resultArray.forEach((r) => {
      const MCode = r[0].MCode + "";
      if (!finalResultObj[MCode]) {
        finalResultObj[MCode] = {
          MCode: r[0].MCode,
          items: [],
        };
      }
      finalResultObj[MCode].items.push(r);
    });
    const resultArray1: any[] = [];

    for (const partName in finalResultObj) {
      if (finalResultObj.hasOwnProperty(partName)) {
        resultArray1.push(finalResultObj[partName]);
      }
    }

    const newResult: any = [];
    resultArray1.forEach((r) => {
      const finishedItemData: any = [];
      const MCode = r.MCode + "";
      const planning = planningStore[MCode];
      const orderValue = planning?.orderValue || 0;
      const dispatchValue = planning?.dispatchValue || 0;
      const requirement = orderValue - dispatchValue;

      let numberOfSlips = 0;
      let cancelledSlips = 0;
      let activeSlips = 0;
      let completedSlips = 0;
      let cncSlips = 0;
      let manualSlips = 0;
      let manualProduced = 0;

      let totalFinishedItem = 0;
      let numberOfSlips1 = 0;
      let cancelledSlips1 = 0;
      let activeSlips1 = 0;
      let completedSlips1 = 0;
      let cncSlips1 = 0;
      let manualSlips1 = 0;
      let manualProduced1 = 0;

      let numberOfFinishedItem = 0;
      let finishedItemConsumed = 0;
      let totalLoading = 0;
      let numberOfloading = 0;
      let finishedItemInventory = 0;
      // console.log(r.items);

      // for Loading
      r.items[r.items.length - 1].forEach((r: any) => {
        totalLoading += r.itemProduced;
        numberOfloading += r.numberOfItems;
        numberOfSlips += r.numberOfSlips;
        cancelledSlips += r.cancelledSlips;
        activeSlips += r.activeSlips;
        completedSlips += r.completedSlips;
        cncSlips += r.cncSlips;
        manualSlips += r.manualSlips;
        manualProduced += r.manualProduced;
      });

      const loading = {
        ...r.items[r.items.length - 1][0],
        itemProduced: totalLoading,
        numberOfItems: numberOfloading,
        planningRequirement: requirement,
        numberOfSlips,
        cancelledSlips,
        activeSlips,
        completedSlips,
        cncSlips,
        manualSlips,
        manualProduced,
      };
      console.log("loading is...", loading);

      finishedItemData.push(loading);

      // for finished Item
      const finishedItem = r.items[r.items.length - 2];
      r.items[r.items.length - 2]?.forEach((r: any) => {
        totalFinishedItem += r.itemProduced;
        numberOfFinishedItem += r.numberOfItems;
        finishedItemConsumed += r.itemConsumed;
        finishedItemInventory += r.inventory;
        numberOfSlips1 += r.numberOfSlips;
        cancelledSlips1 += r.cancelledSlips;
        activeSlips1 += r.activeSlips;
        completedSlips1 += r.completedSlips;
        manualProduced1 += r.manualProduced;
      });

      const currentProductionRequirement = requirement - finishedItemInventory;

      const partDetails = partStore[finishedItem[0].partId];

      if (!partDetails) {
        return;
      }

      partDetails.neededQuantity = currentProductionRequirement;
      partDetails.itemProduced = totalFinishedItem;
      const obj = {
        ...r.items[r.items.length - 2][0],
        parentName: r.items[r.items.length - 1][0].partName,
        parentProduced: totalLoading,
        numberOfItems: numberOfFinishedItem,
        finishedItemConsumed: finishedItemConsumed,
        inventory: finishedItemInventory,
        planningRequirement: currentProductionRequirement,
        numberOfSlips: numberOfSlips1,
        cancelledSlips: cancelledSlips1,
        activeSlips: activeSlips1,
        completedSlips: completedSlips1,
        cncSlips: cncSlips1,
        manualSlips: manualSlips1,
        singleQuantity: 1,
        manualProduced: manualProduced1,
      };

      finishedItemData.push(obj);

      for (let i = r.items.length - 3; i >= 0; i--) {
        /////////////////
        let numberOfSlips = 0;
        let cancelledSlips = 0;
        let activeSlips = 0;
        let completedSlips = 0;
        let itemConsumed = 0;
        let itemProduced = 0;
        let inventory = 0;
        let numberOfItems = 0;
        let cncSlips = 0;
        let manualSlips = 0;
        let manualProduced = 0;

        r.items[i].forEach((r: any) => {
          itemProduced += r.itemProduced;
          numberOfItems += r.numberOfItems;
          itemConsumed += r.itemConsumed;
          inventory += r.inventory;
          numberOfSlips += r.numberOfSlips;
          cancelledSlips += r.cancelledSlips;
          activeSlips += r.activeSlips;
          completedSlips += r.completedSlips;
          cncSlips += r.cncSlips;
          manualSlips += r.manualSlips;
          manualProduced += r.manualProduced;
        });
        /////////////////
        const partId = r.items[i][0].partId + "";
        if (!partStore[partId]) {
          return;
        }
        const parentId = allChildPartStore[partId]?.parentId + "";
        const parentDetails = partStore[parentId];
        const parentName = parentDetails?.partName || "";
        const parentProduced = parentDetails?.itemProduced;
        const parentNeededQuantity = parentDetails?.neededQuantity || 0;

        let childQuantityNeededPerSingle = 0;
        parentDetails?.consumedItem.forEach((p: any) => {
          if (p.itemId + "" === partId + "") {
            childQuantityNeededPerSingle = p.consumedItemQuantity;
          }
        });

        partStore[partId].neededQuantity =
          parentNeededQuantity * childQuantityNeededPerSingle - inventory;
        partStore[partId].itemProduced = itemProduced;

        const obj = {
          ...r.items[i][0],
          itemProduced,
          parentName,
          parentProduced,
          numberOfItems,
          itemConsumed,
          inventory,
          numberOfSlips,
          cancelledSlips,
          activeSlips,
          completedSlips,
          cncSlips,
          manualSlips,
          singleQuantity: childQuantityNeededPerSingle,
          manualProduced,
          planningRequirement:
            parentNeededQuantity * childQuantityNeededPerSingle - inventory,
          parentNeeded: parentNeededQuantity,
        };

        finishedItemData.push(obj);
      }
      newResult.push(finishedItemData);
    });

    resp.status(200).json({
      success: true,
      message: "Getting all the data for inventory.",
      // resultArray,
      // result,
      // resultArray: resultArray1,
      newResult,
      // partStore
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAllInventoryByWorkOrder = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  try {
    let {
      workOrderNumbers,
      name,
      MCodes,
      date,
      nextDate,
      status,
      customers,
      process,
      shop,
      days = 7,
      minInventory,
    } = req.body as {
      status: string[];
      workOrderNumbers: string[];
      name: string;
      MCodes: string[];
      date: string;
      customers: string[];
      nextDate: string;
      process: string;
      shop: string;
      days: any;
      minInventory: boolean;
    };

    let allProductionSlips;
    name = name?.toLowerCase()?.trim();
    const productionSlipStore: any = {};

    allProductionSlips = await ProductionSlipModel.find({}).lean();

    allProductionSlips.forEach((a) => {
      const id = a.workOrderId + "";
      if (!productionSlipStore[id]) {
        productionSlipStore[id] = {
          slips: [],
        };
      }
      productionSlipStore[id].slips.push({
        ...a,
      });
    });

    const month = new Date();
    month.setDate(1);
    month.setUTCHours(0, 0, 0, 0);

    const currentDate = new Date();
    currentDate.setUTCHours(0, 0, 0, 0);

    const allFinishedItems = await FinishedItemModel.find().lean();
    const finishedItemStore: any = {};

    allFinishedItems.forEach((a) => {
      const id = a._id + "";
      finishedItemStore[id] = { ...a };
    });

    const allChildParts = await ChildPartModel.find().lean();
    const partStore: any = {};
    allChildParts.forEach((a) => {
      const id = a._id + "";
      partStore[id] = {
        ...a,
        neededQuantity: 0,
        totalProduced: 0,
      };
    });

    const allChildPartStore: any = {};
    allChildParts.forEach((a: any) => {
      if (a.consumedItem) {
        a.consumedItem.forEach((c: any) => {
          const id = c.itemId + "";
          allChildPartStore[id] = {
            parentId: a._id,
          };
        });
      }
    });

    const planning = await PlanningModel.find({ month }).lean();
    const planningStore: any = {};
    const maxDays = planning[0]?.dates.length;
    for (let plan of planning) {
      const finishedItem = finishedItemStore[plan.finishedItemId + ""];

      const minimumInventory = plan?.minimumInventory
        ? plan.minimumInventory
        : 0;
      const MCode = finishedItem?.MCode + "";
      const lastDay =
        new Date().getDate() + days < maxDays
          ? new Date().getDate() + days
          : maxDays;

      for (let i = 0; i < lastDay; i++) {
        const p = plan?.dates[i];
        if (!planningStore[MCode]) {
          planningStore[MCode] = {
            orderValue: (minInventory ? minimumInventory : 0) || 0,
            dispatchValue: 0,
          };
        }
        planningStore[MCode].orderValue += p.orderValue;
        planningStore[MCode].dispatchValue += p.dispatchValue;
      }
    }

    const query: any = {};

    if (workOrderNumbers && workOrderNumbers.length > 0) {
      query.orderNumber = { $in: workOrderNumbers };
    }

    if (MCodes && MCodes.length > 0) {
      query.MCode = { $in: MCodes };
    }

    let newDate: any;
    let newNextDate: any;

    if (date) {
      newDate = new Date(date);
      newDate.setHours(0, 0, 0, 0);

      if (nextDate) {
        newNextDate = new Date(nextDate);
        newNextDate.setHours(0, 0, 0, 0);
        newNextDate.setDate(newNextDate.getDate() + 1);
      } else {
        newNextDate = new Date(newDate);
        newNextDate.setDate(newDate.getDate() + 1);
      }
      // query.date = {
      //   $gte: newDate,
      //   $lt: newNextDate,
      // };
    } else {
      newDate = new Date();
      newDate.setHours(0, 0, 0, 0);
      newNextDate = new Date(newDate);
      newNextDate.setDate(newDate.getDate() + 1);
    }

    if (status && status.length > 0) {
      query.status = { $in: status };
    }

    if (customers && customers.length > 0) {
      query.customerName = { $in: customers };
    }

    const allProcesses = await globalProcessModel.find({}).lean();
    const processStore: any = {};

    allProcesses.forEach((a) => {
      const id = a._id + "";
      processStore[id] = {
        ...a,
      };
    });

    let workOrders = await workOrderModel
      .find({ ...query, status: { $nin: ["cancel"] } })
      .lean();

    const finishedItemCountStore: any = {};

    const newStore: any = {};

    workOrders.forEach((w) => {
      const id = w._id + "";
      newStore[id] = {};
      const store = newStore[id];
      const MCode = w.MCode + "";
      if (!finishedItemCountStore[MCode]) {
        finishedItemCountStore[MCode] = { count: 1 };
      } else {
        finishedItemCountStore[MCode].count += 1;
      }
      w.masterBom.forEach((w) => {
        const numberOfItems = w.numberOfItem;
        w.newChild.forEach((n) => {
          if (n.numberOfItem) {
            const singleConsumption = n.numberOfItem / numberOfItems;
            const id = n._id + "";
            store[id] = singleConsumption;
          }
        });
      });
    });

    const workOrderStore: any = {};
    workOrders.forEach((w) => {
      const orderNumber = w.orderNumber + "";
      workOrderStore[orderNumber] = {
        orderQuantity: w.orderQuantity,
      };
    });

    const result: any = [];

    workOrders.forEach((w) => {
      const workOrderId = w._id + "";
      const workOrderArray: any = [];
      const productionSlips = productionSlipStore[workOrderId];
      let check = false;

      if (
        w.orderNumber?.toLowerCase().includes(name) ||
        w.partCode?.toLowerCase().includes(name) ||
        w.finishItemName?.toLowerCase().includes(name) ||
        w.MCode?.toLowerCase().includes(name)
      ) {
        check = true;
      }

      w.masterBom.forEach((m) => {
        const numberOfItems = m.numberOfItem;

        const childPartId = m._id + "";
        let itemProduced = 0;
        let itemConsumed = 0;
        let rawMaterial: any = [];

        if (m.newChild) {
          m.newChild.forEach((c) => {
            if (c.unit) {
              if (c.numberOfItem) {
                const partId = c._id + "";
                const consumptionPerOneItem = newStore[workOrderId][partId];
                const obj = {
                  consumptionPerOneItem,
                  childPartName: c.partName,
                  unit: c.unit,
                  materialCode: c.materialCode,
                  consumptionGodown: c.consumptionGodownName,
                };
                rawMaterial.push(obj);
              }
            }
          });
        }

        let numberOfSlips = 0;
        let activeSlips = 0;
        let inactiveSlips = 0;
        let shopName = "";
        let currentProduction = 0;

        productionSlips?.slips.forEach((p: any) => {
          if (p.consumedItem) {
            p.consumedItem.forEach((c: any) => {
              const id = c._id + "";

              if (id === childPartId) {
                const consumptionPerOneItem = newStore[workOrderId][id];

                itemConsumed += p.itemProduced * consumptionPerOneItem;
              }
            });
          }

          if (p.part._id + "" === childPartId) {
            if (p.status === "active") {
              activeSlips++;
            }
            if (p.status === "inactive") {
              inactiveSlips++;
            }
            shopName = p?.shop?.shopName;
            numberOfSlips++;
            itemProduced += p.itemProduced;

            if (
              new Date(p.updatedAt).getTime() >= new Date(newDate).getTime() &&
              new Date(p.updatedAt).getTime() <= new Date(newNextDate).getTime()
            ) {
              currentProduction += p.itemProduced;
            }
          }
        });

        if (name && check === false) {
          if (
            m.partName?.toLowerCase().includes(name) ||
            processStore[m.processId + ""]?.processName
              ?.toLowerCase()
              .includes(name) ||
            shopName?.toLowerCase().includes(name)
          ) {
            if (process || shop) {
              if (process && shop) {
                if (
                  processStore[m.processId + ""]?.processName === process &&
                  shopName === shop
                ) {
                  const obj = {
                    partId: m._id,
                    partName: m.partName,
                    processName: processStore[m.processId + ""]?.processName,
                    itemConsumed,
                    currentProduction,
                    itemProduced,
                    numberOfItems,
                    inventory: itemProduced - itemConsumed,
                    rawMaterial,
                    numberOfSlips,
                    activeSlips,
                    inactiveSlips,
                  };
                  workOrderArray.push(obj);
                } else {
                  return;
                }
              } else if (
                processStore[m.processId + ""]?.processName === process
              ) {
                const obj = {
                  partId: m._id,
                  partName: m.partName,
                  processName: processStore[m.processId + ""]?.processName,
                  itemConsumed,
                  itemProduced,
                  currentProduction,
                  numberOfItems,
                  inventory: itemProduced - itemConsumed,
                  rawMaterial,
                  numberOfSlips,
                  activeSlips,
                  inactiveSlips,
                };
                workOrderArray.push(obj);
              } else if (shopName === shop) {
                const obj = {
                  partId: m._id,
                  partName: m.partName,
                  processName: processStore[m.processId + ""]?.processName,
                  itemConsumed,
                  itemProduced,
                  currentProduction,
                  numberOfItems,
                  inventory: itemProduced - itemConsumed,
                  rawMaterial,
                  numberOfSlips,
                  activeSlips,
                  inactiveSlips,
                };
                workOrderArray.push(obj);
              } else {
                return;
              }
            } else {
              const obj = {
                partId: m._id,
                partName: m.partName,
                processName: processStore[m.processId + ""]?.processName,
                itemConsumed,
                itemProduced,
                numberOfItems,
                currentProduction,
                inventory: itemProduced - itemConsumed,
                rawMaterial,
                numberOfSlips,
                activeSlips,
                inactiveSlips,
              };
              workOrderArray.push(obj);
            }
          } else {
            return;
          }
        } else if (check === true) {
          if (process || shop) {
            if (process && shop) {
              if (
                processStore[m.processId + ""]?.processName === process &&
                shopName === shop
              ) {
                const obj = {
                  partId: m._id,
                  partName: m.partName,
                  processName: processStore[m.processId + ""]?.processName,
                  itemConsumed,
                  itemProduced,
                  currentProduction,
                  numberOfItems,
                  inventory: itemProduced - itemConsumed,
                  rawMaterial,
                  numberOfSlips,
                  activeSlips,
                  inactiveSlips,
                };
                workOrderArray.push(obj);
              } else {
                return;
              }
            } else if (
              processStore[m.processId + ""]?.processName === process
            ) {
              const obj = {
                partId: m._id,
                partName: m.partName,
                processName: processStore[m.processId + ""]?.processName,
                itemConsumed,
                itemProduced,
                currentProduction,
                numberOfItems,
                inventory: itemProduced - itemConsumed,
                rawMaterial,
                numberOfSlips,
                activeSlips,
                inactiveSlips,
              };
              workOrderArray.push(obj);
            } else if (shopName === shop) {
              const obj = {
                partId: m._id,
                partName: m.partName,
                processName: processStore[m.processId + ""]?.processName,
                itemConsumed,
                itemProduced,
                currentProduction,
                numberOfItems,
                inventory: itemProduced - itemConsumed,
                rawMaterial,
                numberOfSlips,
                activeSlips,
                inactiveSlips,
              };
              workOrderArray.push(obj);
            } else {
              return;
            }
          } else {
            const obj = {
              partId: m._id,
              partName: m.partName,
              processName: processStore[m.processId + ""]?.processName,
              itemConsumed,
              itemProduced,
              currentProduction,
              numberOfItems,
              inventory: itemProduced - itemConsumed,
              rawMaterial,
              numberOfSlips,
              activeSlips,
              inactiveSlips,
            };
            workOrderArray.push(obj);
          }
        } else {
          if (
            (process
              ? processStore[m.processId + ""]?.processName === process
              : true) &&
            (shop ? shopName === shop : true)
          ) {
            const obj = {
              partId: m._id,
              partName: m.partName,
              processName: processStore[m.processId + ""]?.processName,
              itemConsumed,
              itemProduced,
              currentProduction,
              numberOfItems,
              inventory: itemProduced - itemConsumed,
              rawMaterial,
              numberOfSlips,
              activeSlips,
              inactiveSlips,
            };
            workOrderArray.push(obj);
          } else {
            return;
          }
        }
      });
      if (workOrderArray.length > 0) {
        const obj = {
          MCode: w.MCode,
          status: w.status,
          orderNumber: w.orderNumber,
          childPart: workOrderArray,
          workOrderId:w._id
        };
        result.push(obj);
      }
    });

    //--------------------------------------------------------------------------------------------------

    const newResult: any = [];
    result.forEach((r: any) => {
      const finishedItemData: any = [];
      const MCode = r.MCode + "";
      const status = r.status;
      const workOrderId = r.workOrderId;
      const countWorkOrder = finishedItemCountStore[MCode].count;
      const orderNumber = r.orderNumber;
      const workOrderQuantity = workOrderStore[orderNumber + ""].orderQuantity;

      const planning = planningStore[MCode];
      const orderValue = planning?.orderValue || 0;
      const dispatchValue = planning?.dispatchValue || 0;
   
      const totalLoading = r.childPart[r.childPart.length - 1].itemProduced;
      const requiredLoading = orderValue - dispatchValue;
      let requirementWorkOrder;
      requirementWorkOrder = workOrderQuantity - totalLoading;
      if (countWorkOrder === 1 && requiredLoading > requirementWorkOrder) {
        requirementWorkOrder = requiredLoading;
      } else if (requiredLoading < requirementWorkOrder) {
        requirementWorkOrder = requiredLoading;
      } else {
        requirementWorkOrder = workOrderQuantity - totalLoading;
      }

      finishedItemCountStore[MCode].count -= 1;

      if (planningStore[MCode]) {
        planningStore[MCode].orderValue =
          requiredLoading - requirementWorkOrder;
      }

      const loading = {
        ...r.childPart[r.childPart.length - 1],
        singleQuantity: 0,
        planningRequirement: requirementWorkOrder,
        parentNeeded: 0,
      };
      finishedItemData.push(loading);

      // for finished Item
      const finishedItemInventory = r.childPart[r.childPart.length - 2].inventory;
      const totalFinishedItem = r.childPart[r.childPart.length - 2].itemProduced;
      const currentProductionRequirement = requirementWorkOrder - finishedItemInventory;
      const partDetails = partStore[r.childPart[r.childPart.length - 2].partId];

      if (!partDetails) {
        return;
      }

      partDetails.neededQuantity = currentProductionRequirement;
      partDetails.itemProduced = totalFinishedItem;

      const obj = {
        ...r.childPart[r.childPart.length - 2],
        singleQuantity: 1,
        planningRequirement: currentProductionRequirement,
        parentNeeded: 0,
      };

      finishedItemData.push(obj);

      //-----------------------------loop --------------------------//
      for (let i = r.childPart.length - 3; i >= 0; i--) {
        
        const partId = r.childPart[i].partId + "";
        if (!partStore[partId]) {
          return;
        }

        const itemProduced = r.childPart[i].itemProduced;
        const inventory = r.childPart[i].inventory;
        const parentId = allChildPartStore[partId]?.parentId + "";
        const parentDetails = partStore[parentId];
        const parentName = parentDetails?.partName || "";
        const parentProduced = parentDetails?.itemProduced;
        const parentNeededQuantity = parentDetails?.neededQuantity || 0;

        let childQuantityNeededPerSingle = 0;
        parentDetails?.consumedItem.forEach((p: any) => {
          if (p.itemId + "" === partId + "") {
            childQuantityNeededPerSingle = p.consumedItemQuantity;
          }
        });

        partStore[partId].neededQuantity =
          parentNeededQuantity * childQuantityNeededPerSingle - inventory;
        partStore[partId].itemProduced = itemProduced;

        const obj = {
          ...r.childPart[i],
          itemProduced,
          parentName,
          parentProduced,
          singleQuantity: childQuantityNeededPerSingle,
          planningRequirement:
            parentNeededQuantity * childQuantityNeededPerSingle - inventory,
          parentNeeded: parentNeededQuantity,
        };
        finishedItemData.push(obj);
      }

      const newObj = {
        MCode,
        workOrderId,
        status,
        orderNumber,
        childPart: finishedItemData,
      };
      newResult.push(newObj);
    });

    resp.status(200).json({
      success: true,
      message: "Getting all the data for inventory.",
      result,
      newResult,
    });
  } catch (error) {
    console.log(error);
  }
};

// // add process in childPart
// export const testing = catchErrorAsync( async(req,resp,next)=>{

//   const allFinishedItems = await FinishedItemModel.find({}).lean();
//   const allProcesses = await globalProcessModel.find({}).lean();
//   const processStore:any = {};
//   allProcesses.forEach((a)=>{
//     const id = a._id+"";
//     processStore[id] = {...a};
//   })

//   const result:any = [];
//   allFinishedItems.forEach(async (f)=>{
//     f.masterBom?.forEach(async(m)=>{
//      const childPartId = m.childPart?.id;
//      const process = processStore[m.process?.id+""];
//      const childPart = await ChildPartModel.findOne({_id:childPartId});
//      if(childPart){
//      childPart.processId = process._id;
//      childPart.processName = process.processName;
//     }
//     await childPart?.save();
//     });
//   });

//   resp.status(200).json({
//     success:true,
//     message:"getting all child",
//     result
//   });
// });
