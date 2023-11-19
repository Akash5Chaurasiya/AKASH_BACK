"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.editChildPartName = exports.updateChildPart = exports.getChild = exports.getAllChildPart = exports.deleteChildPart = exports.addChildPart = void 0;
const childPartModel_1 = __importDefault(require("../../database/models/childPartModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const godownModel_1 = __importDefault(require("../../database/models/godownModel"));
exports.addChildPart = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { partName, productionGodown, consumedItem } = req.body;
    const godown = await godownModel_1.default.findById(productionGodown);
    if (godown) {
        const childPart = await childPartModel_1.default.create({
            partName,
            consumedItem,
            productionGodown,
        });
        return resp.status(201).json({
            success: true,
            message: "Child Part created successfully",
            childPart,
        });
    }
    else {
        return resp.status(201).json({
            success: false,
            message: "godown not found",
        });
    }
});
exports.deleteChildPart = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const part = await childPartModel_1.default.findById(id);
    if (part) {
        const childPart = await childPartModel_1.default.findByIdAndDelete(id);
        return resp.status(201).json({
            success: true,
            message: "Child Part deleted successfully",
            childPart,
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "Child Part not found",
        });
    }
});
exports.getAllChildPart = (0, catchAsyncError_1.default)(async (req, resp) => {
    // const allChild = await ChildPartModel.find({childPartType:undefined}).lean();
    const allChild = await childPartModel_1.default.find({}).lean();
    // const result:any = [];
    // allChild.forEach((c)=>{
    //  if( c.consumedItem &&c.consumedItem.length>0){
    //   result.push({...c})
    //  }
    // })
    return resp.status(201).json({
        success: true,
        message: "Getting all ChildPart successfully",
        childParts: allChild,
    });
});
// //single use
// export const deleteUnwanted = catchErrorAsync(async(req,resp,next)=>{
//   const data:any = await ChildPartModel.find({}).lean();
//   let count = 1;
//   for(let d of data){
//     if(d.ID){
//       const element:any = await ChildPartModel.findByIdAndDelete(d._id);
//       count++;
//     }
//   };
//   resp.status(200).json({
//     success:true,
//     count
//   })
// })
// get child part with Id
exports.getChild = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const childPart = await childPartModel_1.default.findById(id);
    return resp.status(201).json({
        success: true,
        message: "Getting Child Part successfully",
        childPart,
    });
});
// update ChildPart
exports.updateChildPart = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { productionGodown, itemConsumed, newName } = req.body;
    const { id } = req.params;
    const godown = await godownModel_1.default.findById(productionGodown);
    if (!godown) {
        return resp.status(201).json({
            success: false,
            message: "godown not found",
        });
    }
    const childArray = [];
    const childPartStore = {};
    const childParts = await childPartModel_1.default.find().lean();
    childParts.forEach((c) => {
        const name = c.partName + "";
        childPartStore[name] = {
            ...c
        };
    });
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
    const godownStore = {};
    const godowns = await godownModel_1.default.find().lean();
    godowns.forEach((g) => {
        const name = g.godownName + "";
        godownStore[name] = {
            ...g
        };
    });
    itemConsumed.forEach(async (i) => {
        const name = i.childPart;
        const part = childPartStore[name];
        if (!part) {
            return resp.status(404).json({
                success: false,
                message: `Child Part with Name ${name} not found.`,
            });
        }
        const godown = godownStore[i.consumptionGodown];
        childArray.push({
            ...part,
            quantity: i.quantity,
            consumptionGodown: godown._id,
        });
    });
    // updating the production according to consumptions 
    childArray.forEach(async (c) => {
        const godown = c.consumptionGodown;
        await childPartModel_1.default.findByIdAndUpdate({ _id: c._id }, { productionGodown: godown });
    });
    const newChildArray = [];
    const newChildPart = await childPartModel_1.default.findById({ _id: id });
    if (!newChildPart) {
        return resp.status(404).json({
            success: false,
            message: "ChildPart not found."
        });
    }
    childArray.forEach((c) => {
        const itemId = c._id;
        const itemName = c.partName;
        const itemType = "child part";
        const consumedItemQuantity = c.quantity;
        // const consumptionGodown = c.productionGodown ? c.productionGodown : c.consumptionGodown;
        const consumptionGodown = c.consumptionGodown;
        newChildArray.push({
            itemId,
            itemName,
            itemType,
            consumedItemQuantity,
            consumptionGodown,
        });
    });
    // console.log(newChildArray)
    newChildPart.consumedItem = newChildArray;
    newChildPart.productionGodown = godown._id;
    if (newName && newName.trim() !== newChildPart.partName) {
        const newChildNamePart = await childPartModel_1.default.findOne({ partName: newName });
        if (newChildNamePart) {
            return resp.status(400).json({
                success: false,
                message: `ChildPart with name ${newName} already present.`
            });
        }
        newChildPart.partName = newName.trim();
    }
    await newChildPart.save();
    return resp.status(201).json({
        success: true,
        message: "Child Part updated successfully.",
        newChildPart
    });
});
// edit childPart Name 
exports.editChildPartName = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const { newName } = req.body;
    const childPart = await childPartModel_1.default.findOne({ _id: id });
    if (!childPart) {
        return resp.status(404).json({
            success: false,
            message: `ChildPart with `
        });
    }
    const childPartWithName = await childPartModel_1.default.findOne({ partName: newName.trim() });
    if (childPartWithName) {
        return resp.status(400).json({
            success: false,
            message: `ChildPart with ${newName.trim()} already present.`
        });
    }
    childPart.partName = newName.trim();
    await childPart.save();
    resp.status(200).json({
        success: true,
        message: "Child part updated successfully.",
        childPart
    });
});
