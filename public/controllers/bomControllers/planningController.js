"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePlanningPerMonth = exports.updatePlanning = exports.getAllPlanning = exports.addPlanningSheet = void 0;
const finishedItemModel_1 = __importDefault(require("../../database/models/finishedItemModel"));
const planningModel_1 = __importDefault(require("../../database/models/planningModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
const globalProcessModel_1 = __importDefault(require("../../database/models/globalProcessModel"));
const workOrderModel_1 = __importDefault(require("../../database/models/workOrderModel"));
const productionSlipModel_1 = __importDefault(require("../../database/models/productionSlipModel"));
const finishItemGroupModel_1 = __importDefault(require("../../database/models/finishItemGroupModel"));
function getDayName(date) {
    const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    return days[date.getDay()];
}
exports.addPlanningSheet = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { month } = req.body;
    const selectedMonth = new Date(month);
    const nextDate = new Date(month);
    nextDate.setDate(nextDate.getDate() + 2);
    const lastDate = new Date(month);
    nextDate.setDate(nextDate.getDate() - 1);
    const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(month);
        date.setDate(i);
        const dayName = getDayName(date);
        days.push({ day: dayName, date });
    }
    const finishedItems = await finishedItemModel_1.default.find().lean();
    for (let item of finishedItems) {
        const Planning = await planningModel_1.default.findOne({
            finishedItemId: item._id,
            month: selectedMonth,
        });
        if (!Planning) {
            const planning = new planningModel_1.default({
                finishedItemId: item._id,
                finishedItemName: item.itemName,
                month: selectedMonth,
                dates: days,
            });
            await planning.save();
        }
    }
    resp.status(200).json({
        success: true,
        message: `Created planning for ${month}`,
        daysInMonth,
    });
});
const getAllPlanning = async (req, resp, next) => {
    const { month, status, finishedItemArray, MCodeArray, partCodes, shops, processes, name, groupNames, minInventory } = req.body;
    try {
        const query = {};
        const filter = {};
        if (month) {
            const newDate = new Date(month);
            query.month = newDate;
        }
        if (status) {
            query.status = status;
        }
        if (shops && shops.length > 0) {
            const shopDetails = await shopModel_1.default.find({
                shopName: { $in: shops },
            }).lean();
            const ids = shopDetails.map((s) => s._id);
            const processes = await globalProcessModel_1.default
                .find({ "shop.shopId": { $in: ids } })
                .lean();
            const processIds = processes.map((p) => p._id);
            filter["masterBom.process.id"] = { $in: processIds };
        }
        if (groupNames && groupNames.length) {
            const group = await finishItemGroupModel_1.default.find({ groupName: { $in: groupNames } });
            const groupIds = group.map((g) => g._id);
            filter.finishItemGroupId = { $in: groupIds };
        }
        ;
        if (processes && processes.length > 0) {
            const Processes = await globalProcessModel_1.default
                .find({ processName: { $in: processes } })
                .lean();
            if (!filter["masterBom.process.id"]) {
                filter["masterBom.process.id"] = { $in: [] };
            }
            Processes.forEach((p) => {
                filter["masterBom.process.id"].$in.push(p._id);
            });
        }
        if (MCodeArray && MCodeArray.length > 0) {
            filter.MCode = { $in: MCodeArray };
        }
        if (partCodes && partCodes.length > 0) {
            filter.partCode = { $in: partCodes };
        }
        if (finishedItemArray && finishedItemArray.length > 0) {
            filter.itemName = { $in: finishedItemArray };
        }
        ;
        if (name) {
            filter.$or = [
                { itemName: { $regex: name, $options: "i" } },
                { MCode: { $regex: name, $options: "i" } },
                { partCode: { $regex: name, $options: "i" } },
            ];
        }
        ;
        const finishedItems = await finishedItemModel_1.default.find({ ...filter }).lean();
        if (finishedItems && finishedItems.length) {
            const fIds = finishedItems.map((f) => f._id);
            query.finishedItemId = { $in: fIds };
        }
        const allWorkOrders = await workOrderModel_1.default.find({ status: { $nin: ["cancel"] } }).lean();
        const allProductionSlips = await productionSlipModel_1.default.find().lean();
        const allFinishedItems = await finishedItemModel_1.default.find().lean();
        const productionSlipWithWorkOrder = {};
        const mcodeStore = {};
        const finishedItemStore = {};
        allFinishedItems.forEach((a) => {
            const MCode = a.MCode + "";
            const id = a._id + "";
            finishedItemStore[id] = {
                MCode
            };
            mcodeStore[MCode] = {
                inventory: 0
            };
        });
        allProductionSlips.forEach((a) => {
            const workOrderId = a.workOrderId + "";
            if (!productionSlipWithWorkOrder[workOrderId]) {
                productionSlipWithWorkOrder[workOrderId] = {
                    productionSlips: []
                };
            }
            ;
            productionSlipWithWorkOrder[workOrderId].productionSlips.push({ ...a });
        });
        allWorkOrders.forEach((a) => {
            const workOrderId = a._id + "";
            // console.log(workOrderId);
            const MCode = a.MCode + "";
            const loadingId = a.masterBom[a.masterBom.length - 1]._id + "";
            const finishedItemId = a.masterBom[a.masterBom.length - 2]._id + "";
            const productionSlips = productionSlipWithWorkOrder[workOrderId]?.productionSlips || [];
            let totalLoading = 0;
            let totalFinishedItem = 0;
            // console.log(productionSlips.length);
            productionSlips?.forEach((p) => {
                // console.log("in productionSLip loop",p.part._id+"");
                if (p.part._id + "" === loadingId) {
                    // console.log("item produced.",p.itemProduced+"");
                    totalLoading += p.itemProduced;
                }
                else if (p.part._id + "" === finishedItemId + "") {
                    // console.log("item produced" , p.itemProduced);
                    totalFinishedItem += p.itemProduced;
                }
                ;
            });
            const totalInventory = totalFinishedItem - totalLoading;
            if (mcodeStore[MCode]) {
                mcodeStore[MCode].inventory += totalInventory;
            }
            ;
        });
        const getAllPlanning = await planningModel_1.default.find({ ...query }).lean();
        const result = [];
        getAllPlanning.forEach((g) => {
            let totalDispatchValue = 0;
            const finishedItemId = g.finishedItemId + "";
            const MCode = finishedItemStore[finishedItemId]?.MCode + "" || "";
            //  console.log(MCode)
            const inventory = mcodeStore[MCode]?.inventory || 0;
            //  console.log(inventory);
            let totalOrderValue = minInventory ? g.minimumInventory : 0;
            g.dates.forEach((d) => {
                totalDispatchValue += d.dispatchValue ? d.dispatchValue : 0;
                totalOrderValue += d.orderValue ? d.orderValue : 0;
            });
            const obj = {
                totalDispatchValue,
                totalOrderValue,
                MCode,
                currentInventory: inventory,
                ...g,
            };
            result.push(obj);
        });
        const endDate = new Date();
        endDate.setDate(1);
        resp.status(200).json({
            success: true,
            message: "Getting all Planning per month.",
            planningSheet: result,
            endDate
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.getAllPlanning = getAllPlanning;
// update planning
exports.updatePlanning = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { planningId } = req.params;
    const { status, inventory, days } = req.body;
    console.log(inventory);
    // console.log(days);
    const daysStore = {};
    if (days) {
        days.forEach((d) => {
            const date = new Date(d.date);
            date.setHours(0, 0, 0, 0);
            daysStore[date + ""] = {
                ...d,
            };
        });
    }
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
        const planningDetails = await planningModel_1.default.findById(planningId);
        if (!planningDetails) {
            return resp.status(404).json({
                success: false,
                message: `Planning not found with Id ${planningId} .`,
            });
        }
        if (days) {
            planningDetails.dates.forEach((i) => {
                const date = new Date(i.date);
                date.setHours(0, 0, 0, 0);
                if (daysStore[date + ""]) {
                    const data = daysStore[date + ""];
                    i.orderValue = data.value;
                    if (!i.by) {
                        i.by = [];
                    }
                    i.by.push({
                        orderValue: data.value,
                        employeeId,
                        name,
                        date: new Date(),
                    });
                }
            });
        }
        ;
        if (inventory || inventory === 0) {
            planningDetails.minimumInventory = inventory;
        }
        ;
        if (status) {
            planningDetails.status = status;
        }
        ;
        await planningDetails.save();
        resp.status(200).json({
            success: true,
            message: "Updated planning sheet.",
            planningDetails,
        });
    }
    else {
        return resp.status(403).json({
            success: false,
            message: "Not Authorised.",
        });
    }
});
exports.deletePlanningPerMonth = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { month } = req.query;
    const record = await planningModel_1.default.deleteMany({ month });
    resp.status(200).json({
        success: false,
        message: `Deleted data of month ${month}`,
    });
});
// use this to destory planning.
// export const checking = async ( req :Request,resp:Response ,next : NextFunction)=>{
//       try {
//         const firstDate = new Date();
//         firstDate.setDate(1);
//         firstDate.setHours(0,0,0,0);
//      const productionSlips = await ProductionSlipModel.find({status:"completed",itemProduced:{$gt:0},createdAt:{
//       $gte:firstDate
//      }}).lean();
//      const workOrders = await workOrderModel.find().lean();
//      const finishedItems = await FinishedItemModel.find().lean();
//      const lastPartStore:any = {};
//      const finishedItemStore:any = {};
//      finishedItems.forEach((f)=>{
//         const MCode = f.MCode+"";
//         finishedItemStore[MCode] = {_id :f._id};
//      })
//      workOrders.forEach((w)=>{
//          const id = w._id+"";
//          const MCode = w.MCode+"";
//          lastPartStore[id] = { loadingId : w.masterBom[w.masterBom.length -1]._id, MCode};
//      });
//      for(let p of productionSlips){
//       console.log(p.productionSlipNumber);
//        const partId = p.part._id+"";
//        const loadingId = lastPartStore[p.workOrderId+""].loadingId+"";
//        if(partId === loadingId){
//           const MCode = lastPartStore[p.workOrderId+""].MCode||"";
//           const finishedItemId = finishedItemStore[MCode+""]?._id;
//           const month = new Date(p.durationFrom);
//           month.setUTCDate(1);
//           month.setUTCHours(0,0,0,0);
//           const date = new Date(p.durationTo);
//           date.setHours(0,0,0,0);
//           if(finishedItemId){
//           const planning = await PlanningModel.findOne({
//             month,
//             finishedItemId
//           });
//           if(!planning){
//             return;
//           }
//           for(let d of planning.dates){
//               const newDate = new Date(d.date);
//               newDate.setHours(0,0,0,0);
//               if(newDate+"" === date+""){
//                  if(!d.dispatchValue){
//                   d.dispatchValue = 0;
//                  }
//                  console.log("Inside loop",p.productionSlipNumber)
//                  d.dispatchValue += p.itemProduced;
//               }
//           }
//           await planning.save();
//        }
//       }
//      }
//      resp.status(200).json({
//       success:false,
//       message:"Done"
//      })
//     } catch (error) {
//         console.log(error);
//     }
// }
