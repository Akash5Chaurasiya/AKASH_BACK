"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFinishedItemInChildPart = exports.deleteGroup = exports.getAllGroup = exports.updateGroup = exports.AddGroup = exports.addProcessInEachChildPart = exports.addBomComplete = exports.updateFinishedItemStatus = exports.getFinished = exports.getAllFinished = exports.deleteFinishedItem = exports.DeleteChildPartFromFinishedItem = exports.updateProcess = exports.updateFinished = exports.getCNCProgramPerFinishedItem = exports.getBomItemWithQuantity = exports.getBomData = exports.addPartInBetweenBom = exports.addPartInBom = exports.addFinished = void 0;
const finishedItemModel_1 = __importDefault(require("../../database/models/finishedItemModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const globalProcessModel_1 = __importDefault(require("../../database/models/globalProcessModel"));
const childPartModel_1 = __importDefault(require("../../database/models/childPartModel"));
const customerModel_1 = __importDefault(require("../../database/models/customerModel"));
const godownModel_1 = __importDefault(require("../../database/models/godownModel"));
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
const CNCProgramModel_1 = __importDefault(require("../../database/models/CNCProgramModel"));
const finishItemGroupModel_1 = __importDefault(require("../../database/models/finishItemGroupModel"));
// adding Finished Item
exports.addFinished = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { itemName, MCode, partCode, customer, groupNames } = req.body;
    itemName = itemName.trim();
    MCode = MCode.trim();
    partCode = partCode.trim();
    const finishedItem = await finishedItemModel_1.default.findOne({
        itemName,
        MCode,
        partCode,
    });
    if (finishedItem) {
        return resp.status(400).json({
            success: false,
            message: "Finished Item already exsist.",
        });
    }
    const Customer = await customerModel_1.default.findOne({ customerName: customer });
    if (!Customer) {
        return resp.status(404).json({
            success: false,
            message: "Customer not found.",
        });
    }
    const array = [];
    const groups = await finishItemGroupModel_1.default.find({ groupName: { $in: groupNames } }).lean();
    if (groups) {
        groups.forEach((g) => {
            const obj = {
                groupId: g._id,
                groupName: g.groupName
            };
            array.push(obj);
        });
    }
    ;
    const finished = await finishedItemModel_1.default.create({
        itemName,
        MCode,
        partCode,
        customer: Customer._id,
        finishItemGroups: array
    });
    return resp.status(201).json({
        success: true,
        message: "Finished Item created successfully",
        finishedItem: finished,
    });
});
// add Process In BOM
// export const addPartInBom = catchErrorAsync(
//   async (req: Request, resp: Response) => {
//     const {
//       itemName,
//       processName,
//       childPartName,
//       productionGodown,
//       itemConsumed,
//     } = req.body;
//     const childPartStore: any = {};
//     const allChildPart = await ChildPartModel.find().lean();
//     allChildPart.forEach((a) => {
//       const name = a.partName;
//       childPartStore[name] = {
//         ...a,
//       };
//     });
//     let finishedItem = await FinishedItemModel.findOne({ itemName });
//     if (!finishedItem) {
//       return resp.status(404).json({
//         success: false,
//         message: "Finished Item not found.",
//       });
//     }
//     const Process = await globalProcessModel.findOne({ processName });
//     if (!Process) {
//       return resp.status(404).json({
//         success: false,
//         message: "Global Process not found.",
//       });
//     }
//     const childPart = await ChildPartModel.findOne({ partName: childPartName });
//     if (childPart) {
//       return resp.status(400).json({
//         success: false,
//         message: "Child Part with same name already present.",
//       });
//     }
//     const recFunction = async (id: any, quantity: number) => {
//       const item = await ChildPartModel.findById({ _id: id });
//       if (item) {
//         if(item?.childPartType == "raw"){
//            return
//         }
//         let newUnit = 1;
//         if (item.numberOfItem !== undefined) {
//           if (item.numberOfItem == 1) {
//             newUnit = quantity;
//           } else {
//             newUnit = item.numberOfItem + quantity;
//           }
//         }
//         if (item.consumedItem) {
//           for (const f of item.consumedItem) {
//             const quantity = f.consumedItemQuantity * newUnit;
//             const id = f.itemId;
//             await recFunction(id, quantity);
//           }
//         }
//         item.numberOfItem = newUnit;
//         await item.save();
//       }
//     };
//     const childArray: any = [];
//     // for checking childPart present or not
//     itemConsumed.forEach((i: any) => {
//       const name = i.childPart;
//       const part = childPartStore[name];
//       if (!part) {
//         return resp.status(404).json({
//           success: false,
//           message: `Child Part with Name ${name} not found.`,
//         });
//       }
//     });
//     itemConsumed.forEach((i: any) => {
//       const name = i.childPart;
//       const part = childPartStore[name];
//       if (!part) {
//         return resp.status(404).json({
//           success: false,
//           message: `Child Part with Name ${name} not found.`,
//         });
//       }
//       childArray.push({
//         ...part,
//         quantity: i.quantity,
//         consumptionGodown: i.consumptionGodown,
//       });
//       recFunction(part._id, i.quantity);
//     });
//     const godown = await GodownModel.findOne({ godownName: productionGodown });
//     const newChildPart = await ChildPartModel.create({
//       partName: childPartName,
//       productionGodown: godown?._id,
//       numberOfItem: 1,
//     });
//     childArray.forEach((c: any) => {
//       const itemId = c._id;
//       const itemName = c.partName;
//       const itemType = "child part";
//       const consumedItemQuantity = c.quantity;
//       const consumptionGodown = c.productionGodown;
//       newChildPart.consumedItem.push({
//         itemId,
//         itemName,
//         itemType,
//         consumedItemQuantity,
//         consumptionGodown,
//       });
//     });
//     await newChildPart.save();
//     finishedItem.masterBom?.push({
//       childPart: { id: newChildPart._id, childPartName: newChildPart.partName },
//       process: { id: Process._id, processName: Process.processName },
//       quantity: 1,
//     });
//     await finishedItem.save();
//     return resp.status(201).json({
//       success: true,
//       message: "Finished Item created successfully",
//       finishedItem,
//     });
//   }
// );
// add Process In BOM
exports.addPartInBom = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { itemName, processName, childPartName, productionGodown, itemConsumed, bomCompleted, } = req.body;
    childPartName = childPartName.trim();
    const childPartStore = {};
    const allChildPart = await childPartModel_1.default.find().lean();
    allChildPart.forEach((a) => {
        const name = a.partName;
        childPartStore[name] = {
            ...a,
        };
    });
    let finishedItem = await finishedItemModel_1.default.findOne({ itemName });
    if (!finishedItem) {
        return resp.status(404).json({
            success: false,
            message: "Finished Item not found.",
        });
    }
    ;
    const Process = await globalProcessModel_1.default.findOne({ processName });
    if (!Process) {
        return resp.status(404).json({
            success: false,
            message: "Global Process not found.",
        });
    }
    ;
    const childPart = await childPartModel_1.default.findOne({ partName: childPartName });
    if (childPart) {
        return resp.status(400).json({
            success: false,
            message: "Child Part with same name already present.",
        });
    }
    ;
    const childArray = [];
    // for checking childPart present or not
    itemConsumed.forEach((i) => {
        const name = i.childPart;
        const part = childPartStore[name];
        if (!part) {
            return resp.status(404).json({
                success: false,
                message: `Child Part with Name ${name} not found.`,
            });
        }
        ;
    });
    itemConsumed.forEach((i) => {
        const name = i.childPart;
        const part = childPartStore[name];
        if (!part) {
            return resp.status(404).json({
                success: false,
                message: `Child Part with Name ${name} not found.`,
            });
        }
        ;
        childArray.push({
            ...part,
            quantity: i.quantity,
            consumptionGodown: i.consumptionGodown,
        });
    });
    const godown = await godownModel_1.default.findOne({ godownName: productionGodown });
    if (!godown) {
        return resp.status(404).json({
            success: false,
            message: "Godown not found.",
        });
    }
    ;
    const newChildPart = await childPartModel_1.default.create({
        partName: childPartName,
        productionGodown: godown?._id,
        numberOfItem: 1,
    });
    childArray.forEach((c) => {
        const itemId = c._id;
        const itemName = c.partName;
        const itemType = "child part";
        const consumedItemQuantity = c.quantity;
        const consumptionGodown = c.productionGodown;
        newChildPart.consumedItem.push({
            itemId,
            itemName,
            itemType,
            consumedItemQuantity,
            consumptionGodown,
        });
    });
    newChildPart.finishedItemId = finishedItem._id;
    newChildPart.processId = Process._id;
    newChildPart.processName = Process.processName;
    await newChildPart.save();
    finishedItem.masterBom?.push({
        childPart: { id: newChildPart._id, childPartName: newChildPart.partName },
        process: { id: Process._id, processName: Process.processName },
        productionGodown: {
            id: newChildPart.productionGodown,
            productionGodownName: godown.godownName,
        },
        quantity: 1,
    });
    finishedItem.bomCompleted = bomCompleted;
    await finishedItem.save();
    return resp.status(201).json({
        success: true,
        message: "Finished Item created successfully",
        finishedItem,
    });
});
// add Process In BOM
exports.addPartInBetweenBom = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { itemName, processName, childPartName, productionGodown, itemConsumed, newIndex, } = req.body;
    const childPartStore = {};
    const allChildPart = await childPartModel_1.default.find().lean();
    allChildPart.forEach((a) => {
        const name = a.partName;
        childPartStore[name] = {
            ...a,
        };
    });
    let finishedItem = await finishedItemModel_1.default.findOne({ itemName });
    if (!finishedItem) {
        return resp.status(404).json({
            success: false,
            message: "Finished Item not found.",
        });
    }
    const Process = await globalProcessModel_1.default.findOne({ processName });
    if (!Process) {
        return resp.status(404).json({
            success: false,
            message: "Global Process not found.",
        });
    }
    const childPart = await childPartModel_1.default.findOne({ partName: childPartName });
    if (childPart) {
        return resp.status(400).json({
            success: false,
            message: "Child Part with same name already present.",
        });
    }
    const childArray = [];
    // for checking childPart present or not
    itemConsumed.forEach((i) => {
        const name = i.childPart;
        const part = childPartStore[name];
        if (!part) {
            return resp.status(404).json({
                success: false,
                message: `Child Part with Name ${name} not found.`,
            });
        }
    });
    itemConsumed.forEach((i) => {
        const name = i.childPart;
        const part = childPartStore[name];
        if (!part) {
            return resp.status(404).json({
                success: false,
                message: `Child Part with Name ${name} not found.`,
            });
        }
        childArray.push({
            ...part,
            quantity: i.quantity,
            consumptionGodown: i.consumptionGodown,
        });
    });
    const godown = await godownModel_1.default.findOne({ godownName: productionGodown });
    const newChildPart = await childPartModel_1.default.create({
        partName: childPartName,
        productionGodown: godown?._id,
        numberOfItem: 1,
    });
    childArray.forEach((c) => {
        const itemId = c._id;
        const itemName = c.partName;
        const itemType = "child part";
        const consumedItemQuantity = c.quantity;
        const consumptionGodown = c.productionGodown;
        newChildPart.consumedItem.push({
            itemId,
            itemName,
            itemType,
            consumedItemQuantity,
            consumptionGodown,
        });
    });
    newChildPart.finishedItemId = finishedItem._id;
    newChildPart.processId = Process._id;
    newChildPart.processName = Process.processName;
    await newChildPart.save();
    // finishedItem.masterBom?.push({
    //   childPart: { id: newChildPart._id, childPartName: newChildPart.partName },
    //   process: { id: Process._id, processName: Process.processName },
    //   quantity: 1,
    // });
    if (!finishedItem.masterBom) {
        return resp.status(400).json({
            success: false,
            message: "Master bom not added",
        });
    }
    const newItem = {
        childPart: { id: newChildPart._id, childPartName: newChildPart.partName },
        process: { id: Process._id, processName: Process.processName },
        quantity: 1,
    };
    if (newIndex >= 0 && newIndex <= finishedItem.masterBom.length) {
        finishedItem.masterBom.splice(newIndex - 1, 0, newItem);
    }
    ;
    await finishedItem.save();
    return resp.status(201).json({
        success: true,
        message: `Finished Item updated successfully with addition of child part ${childPartName}.`,
        finishedItem,
    });
});
// new api for showing the data according to backend changes
exports.getBomData = (0, catchAsyncError_1.default)(async (req, resp) => {
    const id = req.params.finishedItemId;
    const childPartStore = {};
    const childParts = await childPartModel_1.default.find().lean();
    childParts.forEach((c) => {
        const id = c._id + "";
        childPartStore[id] = {
            ...c,
        };
    });
    const finishedItem = await finishedItemModel_1.default.findById(id);
    const masterBom = [];
    if (finishedItem) {
        finishedItem.masterBom?.forEach((f) => {
            const id = f.childPart?.id + "";
            const childPart = childPartStore[id];
            const childParts = [];
            if (childPart.consumedItem) {
                childPart.consumedItem.forEach((c) => {
                    const id = c.itemId + "";
                    const childPart = childPartStore[id];
                    childParts.push(childPart);
                });
            }
            const obj = { process: f.process?.processName, childPart, childParts };
            masterBom.push(obj);
        });
        const customer = await customerModel_1.default.findById({
            _id: finishedItem.customer,
        });
        const finished = {
            finishedItemName: finishedItem.itemName,
            MCode: finishedItem.MCode,
            partCode: finishedItem.partCode,
            customer: customer?.customerName,
            masterBom,
        };
        resp.status(200).json({
            message: "Getting data sucessfully.",
            success: true,
            finished,
        });
    }
});
// get All bom items with the quantity
const getBomItemWithQuantity = async (req, resp, id, orderQuantity) => {
    try {
        const CNCPrograms = await CNCProgramModel_1.default.find().lean();
        const cncChildStore = {};
        CNCPrograms.forEach((c) => {
            const programName = c.programName;
            const programNumber = c.programNumber;
            const id = c._id;
            c.childParts.forEach((a) => {
                const id = a.childPart.id + "";
                if (!cncChildStore[id]) {
                    cncChildStore[id] = {
                        cncPrograms: []
                    };
                }
                cncChildStore[id].cncPrograms.push({
                    programName,
                    programNumber,
                    id
                });
            });
        });
        const childPartStore = {};
        const childParts = await childPartModel_1.default.find().lean();
        const godownStore = {};
        const godowns = await godownModel_1.default.find().lean();
        godowns.forEach((g) => {
            const id = g._id + "";
            godownStore[id] = {
                ...g,
            };
        });
        childParts.forEach((c) => {
            const id = c._id;
            childPartStore[id] = {
                ...c,
            };
        });
        const updatedChildPartStore = {};
        const recFunc = (id, unit) => {
            const child = childPartStore[id];
            const qu = child?.unit;
            const newChild = [];
            if (child?.consumedItem) {
                child.consumedItem.forEach((cc) => {
                    const data = recFunc(cc.itemId, cc.consumedItemQuantity * unit);
                    const id = data._id + "";
                    updatedChildPartStore[id] = { ...data };
                    newChild.push(data);
                });
            }
            ;
            const godownDetails = godownStore[child?.productionGodown];
            const CNCPrograms = cncChildStore[child?._id + ""]?.cncPrograms || [];
            return {
                _id: child?._id,
                partName: child?.partName,
                materialCode: child?.materialCode,
                typeOfMaterial: child?.typeOfMaterial,
                childPartType: child?.childPartType,
                productionGodownId: godownDetails?._id || "",
                productionGodownName: godownDetails?.godownName || "",
                unit: qu,
                CNCPrograms: CNCPrograms || [],
                numberOfItem: unit ? unit : 1,
                newChild,
            };
        };
        const finishedItem = await finishedItemModel_1.default.findById(id);
        const items = [];
        finishedItem?.masterBom?.forEach((f) => {
            const unit = orderQuantity ? orderQuantity : 1;
            const id = f.childPart?.id + "";
            const process = f.process?.processName;
            const processId = f.process?.id;
            const itemData = recFunc(id, unit || 1);
            const SrNumber = items.length + 1;
            const obj = {
                SrNumber,
                partName: itemData.partName,
                _id: itemData._id,
                numberOfItem: itemData.numberOfItem,
                productionGodownId: itemData.productionGodownId,
                productionGodownName: itemData.productionGodownName,
                newChild: itemData.newChild,
                process,
                processId: processId,
            };
            items.push(obj);
        });
        const newFinishItem = {
            finishedItemName: finishedItem?.itemName,
            customer: finishedItem?.customer,
            partCode: finishedItem?.partCode,
            MCode: finishedItem?.MCode,
            bomCompleted: finishedItem?.bomCompleted,
            items,
        };
        for (let item of newFinishItem.items) {
            const itemId = item._id;
            if (itemId in updatedChildPartStore) {
                const updatedItem = updatedChildPartStore[itemId];
                Object.assign(item, updatedItem);
            }
            ;
        }
        ;
        return newFinishItem;
    }
    catch (error) {
        console.log(error);
    }
    ;
};
exports.getBomItemWithQuantity = getBomItemWithQuantity;
const getCNCProgramPerFinishedItem = async (id) => {
    const result = [];
    const finishedItem = await finishedItemModel_1.default.findById(id).lean();
    if (!finishedItem) {
        return [];
    }
    const allChildParts = await childPartModel_1.default.find({ finishedItemId: finishedItem._id }).lean();
    const childPartIds = allChildParts.map((c) => c._id);
    // console.log(childPartIds.length)
    if (childPartIds && childPartIds.length) {
        const allCNCProgram = await CNCProgramModel_1.default.find({ "childParts.childPart.id": { $in: childPartIds } }).lean();
        allCNCProgram.forEach((c) => {
            const obj = {
                programName: c.programName,
                programNumber: c.programNumber
            };
            result.push(obj);
        });
    }
    return result;
};
exports.getCNCProgramPerFinishedItem = getCNCProgramPerFinishedItem;
exports.updateFinished = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const { itemName, groupNames, MCode, partCode, customer, bomCompleted } = req.body;
    const finished = await finishedItemModel_1.default.findById(id);
    if (!finished) {
        return resp.status(404).json({
            success: false,
            message: `Finished Item with id ${id} not found.`
        });
    }
    ;
    if (customer) {
        const Customer = await customerModel_1.default.findOne({ customerName: customer });
        if (!Customer) {
            return resp.status(404).json({
                success: false,
                message: "Customer not found.",
            });
        }
        finished.customer = Customer._id;
    }
    ;
    if (itemName) {
        finished.itemName = itemName;
    }
    ;
    if (MCode) {
        finished.MCode = MCode;
    }
    ;
    if (partCode) {
        finished.partCode = partCode;
    }
    ;
    if (groupNames && groupNames.length) {
        const groups = await finishItemGroupModel_1.default.find({ groupName: { $in: groupNames } }).lean();
        if (groups) {
            const array = [];
            groups.forEach((g) => {
                const obj = {
                    groupId: g._id,
                    groupName: g.groupName
                };
                array.push(obj);
            });
            finished.finishItemGroups = array;
        }
        ;
    }
    ;
    if (bomCompleted) {
        if (finished.masterBom) {
            if (finished.itemName !== finished.masterBom[finished.masterBom?.length - 2].childPart?.childPartName) {
                return resp.status(400).json({
                    success: false,
                    message: "Finished Item is not completed with loading."
                });
            }
            else {
                finished.bomCompleted = bomCompleted;
            }
            ;
        }
        ;
    }
    ;
    await finished.save();
    resp.status(200).json({
        success: true,
        message: "Finished Item updated .",
        finishedItem: finished
    });
});
// change process in finishedItem
exports.updateProcess = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const { index, processName } = req.body;
    const finished = await finishedItemModel_1.default.findById(id);
    if (!finished) {
        return resp.status(404).json({
            success: false,
            message: "Finished Item not found.",
        });
    }
    const process = await globalProcessModel_1.default.findOne({ processName });
    if (!process) {
        return resp.status(404).json({
            success: false,
            message: "Process not found.",
        });
    }
    let processData;
    if (finished.masterBom) {
        const obj = {
            id: process._id,
            processName: process.processName,
        };
        finished.masterBom[index].process = obj;
        processData = finished.masterBom[index].process;
        await childPartModel_1.default.findOneAndUpdate({ _id: finished.masterBom[index].childPart?.id }, { processId: process._id, processName: process.processName });
    }
    await finished.save();
    return resp.status(200).json({
        success: true,
        message: "Process Changed successfully.",
        processData,
    });
});
// delete childPart in finishedItem
exports.DeleteChildPartFromFinishedItem = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const { index } = req.body;
    const finished = await finishedItemModel_1.default.findById(id);
    if (!finished) {
        return resp.status(404).json({
            success: false,
            message: "Finished Item not found.",
        });
    }
    if (!finished.masterBom) {
        return resp.status(400).json({
            success: false,
            message: "Master bom not found.",
        });
    }
    // Check if the index is valid
    if (index < 0 || index >= finished.masterBom.length) {
        return resp
            .status(400)
            .json({ success: false, message: "Invalid index" });
    }
    // if (index > finished.masterBom.length - 3) {
    //   finished.bomCompleted = false
    // }
    finished.bomCompleted = false;
    const item = finished.masterBom[index];
    const childPartId = item.childPart?.id;
    const isConsumed = await childPartModel_1.default.findOne({ 'consumedItem.itemId': childPartId });
    if (isConsumed) {
        return resp.status(400).json({
            success: false,
            message: `Item is consumed in ChildPart ${isConsumed.partName}.`
        });
    }
    ;
    const CNCProgram = await CNCProgramModel_1.default.find().lean();
    const foundCNC = [];
    CNCProgram.forEach((c) => {
        if (c.childParts.length > 0) {
            c.childParts.forEach((p) => {
                if (p.childPart.id + "" === childPartId + "") {
                    const string = `The Child Part is used in ${c.programName} CNC Program.`;
                    foundCNC.push(string);
                }
                ;
            });
        }
        ;
    });
    if (foundCNC.length > 0) {
        return resp.status(400).json({
            success: false,
            message: "Child part is used in CNCProgram.",
            foundArray: foundCNC
        });
    }
    ;
    await childPartModel_1.default.findOneAndDelete({ _id: childPartId });
    finished.masterBom.splice(index, 1);
    await finished.save();
    return resp.status(202).json({
        success: true,
        message: `Item at ${index + 1} with childPart ${item.childPart?.childPartName} deleted successfully.`,
    });
});
// delete a finishedItem
exports.deleteFinishedItem = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const item = await finishedItemModel_1.default.findOne({ _id: id });
    if (!item) {
        return resp.status(404).json({
            success: false,
            message: `Finished Item with Id ${id} not found.`,
        });
    }
    if (!item.masterBom) {
        await finishedItemModel_1.default.findByIdAndDelete(item._id);
        return resp.status(202).json({
            success: true,
            message: `Finished Item ${item.itemName} deleted successfully.`,
        });
    }
    if (item.masterBom?.length > 0) {
        return resp.status(405).json({
            success: false,
            message: `Finished Item Have ${item.masterBom?.length} childParts First delete them.`,
        });
    }
    else {
        await finishedItemModel_1.default.findByIdAndDelete(item._id);
        return resp.status(202).json({
            success: true,
            message: `Finished Item ${item.itemName} deleted successfully.`,
        });
    }
});
// get all finished items
exports.getAllFinished = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { name, status, customers, groupNames, sort, shops, processes } = req.body;
    const processStore = {};
    if (shops && shops.length) {
        const shopDetails = await shopModel_1.default.find({ shopName: { $in: shops } });
        const shopIds = shopDetails.map((s) => s._id);
        const process = await globalProcessModel_1.default
            .find({ "shop.shopId": { $in: shopIds } })
            .lean();
        process.forEach((p) => {
            const id = p._id + "";
            processStore[id] = {
                _id: id,
            };
        });
    }
    ;
    if (processes && processes.length) {
        const Processes = await globalProcessModel_1.default.find({
            processName: { $in: processes },
        });
        Processes.forEach((p) => {
            const id = p._id + "";
            processStore[id] = {
                _id: id,
            };
        });
    }
    ;
    const query = {};
    if (name) {
        query.$or = [
            { itemName: { $regex: name, $options: "i" } },
            { MCode: { $regex: name, $options: "i" } },
            { partCode: { $regex: name, $options: "i" } },
        ];
    }
    ;
    // console.log(query)
    if (status) {
        if (status == "true") {
            query.bomCompleted = true;
        }
        else if (status == "false") {
            query.bomCompleted = false;
        }
        ;
    }
    ;
    if (customers && customers.length) {
        const cstmr = await customerModel_1.default.find({ customerName: { $in: customers } });
        const customerIds = cstmr.map((c) => c._id);
        query.customer = { $in: customerIds };
    }
    if (groupNames && groupNames.length) {
        const group = await finishItemGroupModel_1.default.find({ groupName: { $in: groupNames } });
        const groupIds = group.map((g) => g._id);
        if (group) {
            query["finishItemGroups.groupId"] = { $in: groupIds };
        }
        ;
    }
    ;
    let allFinished;
    if (sort == "asc") {
        allFinished = await finishedItemModel_1.default.find(query)
            .sort({ itemName: 1 })
            .populate("customer")
            .lean();
    }
    else if (sort == "dec") {
        allFinished = await finishedItemModel_1.default.find(query)
            .sort({ itemName: -1 })
            .populate("customer")
            .lean();
    }
    else {
        allFinished = await finishedItemModel_1.default.find(query)
            .populate("customer")
            .lean();
    }
    const result = [];
    // console.log(allFinished.length)
    if ((shops && shops.length) || (processes && processes.length)) {
        allFinished.forEach((a) => {
            const length = a.masterBom?.length;
            let obj;
            let isTrue = false;
            a.masterBom?.forEach((b) => {
                const id = b.process?.id + "";
                if (processStore[id]) {
                    isTrue = true;
                    return;
                }
            });
            if (isTrue) {
                obj = {
                    _id: a._id,
                    MCode: a.MCode,
                    itemName: a.itemName,
                    partCode: a.partCode,
                    customer: a.customer,
                    bomCompleted: a.bomCompleted,
                    processes: length,
                    groups: a.finishItemGroups
                };
                result.push(obj);
            }
        });
    }
    else {
        allFinished.forEach((a) => {
            const length = a.masterBom?.length;
            let obj;
            obj = {
                _id: a._id,
                MCode: a.MCode,
                itemName: a.itemName,
                partCode: a.partCode,
                customer: a.customer,
                bomCompleted: a.bomCompleted,
                processes: length,
                groups: a.finishItemGroups
            };
            result.push(obj);
        });
    }
    ;
    return resp.status(201).json({
        success: true,
        message: "Getting all Finished Items successfully",
        finishedItems: result,
    });
});
exports.getFinished = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const finished = await finishedItemModel_1.default.findById(id);
    return resp.status(201).json({
        success: true,
        message: "Getting Finished Item successfully",
        finished,
    });
});
exports.updateFinishedItemStatus = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const finishedItems = await finishedItemModel_1.default.find().lean();
    for (let i of finishedItems) {
        const fItem = await finishedItemModel_1.default.findById({ _id: i._id });
        if (fItem) {
            fItem.bomCompleted = false;
            await fItem.save();
        }
    }
    resp.status(200).json({
        success: true
    });
});
exports.addBomComplete = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    // const {customerId} = req.body;
    const finishedItem = await finishedItemModel_1.default.find({});
    for (let i of finishedItem) {
        const item = await finishedItemModel_1.default.findOne({ _id: i._id });
        if (item) {
            if (!item.bomCompleted) {
                item.bomCompleted = false;
                await item.save();
            }
        }
        ;
    }
    ;
    resp.status(200).json({
        success: true,
    });
});
exports.addProcessInEachChildPart = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const allFinishedItems = await finishedItemModel_1.default.find().lean();
    for (let f of allFinishedItems) {
        if (f.masterBom) {
            for (let m of f.masterBom) {
                const processName = m.process.processName;
                const processid = m.process.id;
                const childPart = await childPartModel_1.default.findById(m.childPart?.id);
                if (childPart) {
                    childPart.processId = processid;
                    childPart.processName = processName;
                    await childPart.save();
                }
                ;
            }
            ;
        }
        ;
    }
    ;
    resp.status(200).json({
        success: true,
        message: "Done"
    });
});
// -------------------------- Groups ----------------------------------------
exports.AddGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupName, groupDescription } = req.body;
    const group = await finishItemGroupModel_1.default.findOne({ groupName });
    if (group) {
        return resp.status(400).json({
            success: false,
            message: `Group with name ${group.groupName} already present.`
        });
    }
    ;
    const newGroup = await finishItemGroupModel_1.default.create({ groupName, groupDescription });
    resp.status(201).json({
        success: true,
        message: "Group created successfully.",
        newGroup
    });
});
// update group
exports.updateGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId } = req.params;
    const { groupName, groupDescription } = req.body;
    const group = await finishItemGroupModel_1.default.findById({ _id: groupId });
    if (!group) {
        return resp.status(400).json({
            success: false,
            message: `Group not found with id ${groupId}.`
        });
    }
    ;
    const newGroup = await finishItemGroupModel_1.default.findByIdAndUpdate(groupId, { groupName, groupDescription });
    const finishedItems = await finishedItemModel_1.default.find({ finishItemGroupId: newGroup?._id });
    for (let f of finishedItems) {
        const finishedItem = await finishedItemModel_1.default.findByIdAndUpdate(f._id, { finishItemGroupName: newGroup?.groupName });
    }
    resp.status(201).json({
        success: true,
        message: "Group created successfully.",
        newGroup
    });
});
// get all group
exports.getAllGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { sort, name } = req.body;
    let query = {};
    if (name) {
        // Match 'name' against 'groupName', 'groupDescription'
        query.$or = [
            { groupName: { $regex: name, $options: "i" } },
            { groupDescription: { $regex: name, $options: "i" } },
        ];
    }
    let groups;
    if (sort) {
        if (sort === "asc") {
            groups = await finishItemGroupModel_1.default.find({ ...query }).sort({ groupName: 1 }).lean();
        }
        else if (sort === "dec") {
            groups = await finishItemGroupModel_1.default.find({ ...query }).sort({ groupName: -1 }).lean();
        }
    }
    else {
        groups = await finishItemGroupModel_1.default.find({ ...query }).lean();
    }
    resp.status(201).json({
        success: true,
        message: "Group created successfully.",
        groups
    });
});
exports.deleteGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId } = req.params;
    const finishedItems = await finishedItemModel_1.default.find({ "finishItemGroups.groupId": groupId }).lean();
    if (finishedItems.length === 0) {
        const group = await finishItemGroupModel_1.default.findByIdAndDelete({ _id: groupId }).lean();
        if (!group) {
            resp.status(404).json({
                success: false,
                message: "group not found.",
            });
        }
        else {
            resp.status(200).json({
                success: true,
                message: `${group.groupName} group deleted successfully.`,
            });
        }
    }
    else {
        const foundArray = finishedItems.map(f => f.itemName);
        resp.status(400).json({
            success: false,
            message: "foundArray some where.",
            foundArray
        });
    }
});
const addFinishedItemInChildPart = async (req, resp, next) => {
    try {
        const getAllFinishedItems = await finishedItemModel_1.default.find().lean();
        for (let f of getAllFinishedItems) {
            const id = f._id;
            if (!f.masterBom) {
                return;
            }
            for (let c of f.masterBom) {
                const childPartId = c.childPart?.id;
                const childPart = await childPartModel_1.default.findById(childPartId);
                if (childPart) {
                    childPart.finishedItemId = id;
                    await childPart.save();
                }
            }
        }
        resp.status(200).json({
            success: true,
            message: "DONE"
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.addFinishedItemInChildPart = addFinishedItemInChildPart;
