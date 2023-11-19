"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGroup = exports.getAllGroup = exports.updateGroup = exports.createGroup = exports.getChildPartByRawMaterial = exports.updateRawMaterial = exports.getAllRawMaterial = exports.getRawMaterial = exports.deleteRawMaterial = exports.addRawMaterial = void 0;
const childPartModel_1 = __importDefault(require("../../database/models/childPartModel"));
const finishedItemModel_1 = __importDefault(require("../../database/models/finishedItemModel"));
const rawMaterialGroup_1 = __importDefault(require("../../database/models/rawMaterialGroup"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
// add
exports.addRawMaterial = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { name, materialType, code, unit, groupName } = req.body;
    name = name.trim();
    materialType = materialType.trim();
    code = code.trim();
    unit = unit.trim();
    const rawMaterial = await childPartModel_1.default.findOne({ partName: name });
    if (rawMaterial) {
        return resp.status(400).json({
            success: false,
            message: "raw material already present.",
        });
    }
    else {
        const rawMaterial = await childPartModel_1.default.create({
            childPartType: "raw",
            partName: name,
            typeOfMaterial: materialType,
            materialCode: code,
            unit,
            numberOfItem: 1,
        });
        if (groupName) {
            const groupDetails = await rawMaterialGroup_1.default.findOne({ groupName });
            if (!groupDetails) {
                return resp.status(404).json({
                    success: false,
                    message: `Group with nam ${groupName} not found.`
                });
            }
            ;
            rawMaterial.group.groupId = groupDetails._id;
            rawMaterial.group.groupName = groupDetails.groupName;
            await rawMaterial.save();
        }
        return resp.status(201).json({
            success: true,
            message: "raw material created successfully",
            rawMaterial,
        });
    }
    ;
});
// delete  raw material
exports.deleteRawMaterial = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const rawMaterial = await childPartModel_1.default.findById(id);
    if (!rawMaterial) {
        return resp.status(404).json({
            success: false,
            message: `Raw Material with Id ${id} not found.`,
        });
    }
    const materialId = rawMaterial._id + "";
    const allChildParts = await childPartModel_1.default.find().lean();
    const foundArray = [];
    allChildParts.forEach((a) => {
        if (a.consumedItem) {
            a.consumedItem.forEach((c) => {
                const id = c.itemId + "";
                if (materialId == id) {
                    const string = `Raw Material ${rawMaterial.partName} is used in ChildPart ${a.partName}.`;
                    foundArray.push(string);
                }
            });
        }
    });
    if (foundArray.length > 0) {
        return resp.status(405).json({
            success: false,
            message: "Child part already present which consuming this raw material.",
            foundArray,
        });
    }
    else {
        await childPartModel_1.default.findByIdAndDelete({ _id: rawMaterial._id });
        return resp.status(202).json({
            success: true,
            message: `Raw material deleted with name ${rawMaterial.partName}.`,
        });
    }
    ;
});
// get
exports.getRawMaterial = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const rawMaterial = await childPartModel_1.default.findById(id);
    if (rawMaterial) {
        return resp.status(200).json({
            success: true,
            message: "getting raw material successfully",
            rawMaterial: rawMaterial,
        });
    }
    else {
        return resp.status(201).json({
            success: true,
            message: "raw material not found",
        });
    }
});
// get all
exports.getAllRawMaterial = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { name, unit, sort, groupName } = req.query;
    const query = {};
    if (name) {
        query.$or = [
            { partName: { $regex: name, $options: "i" } },
            { materialCode: { $regex: name, $options: "i" } },
            { unit: { $regex: name, $options: "i" } },
        ];
    }
    ;
    if (groupName) {
        const group = await rawMaterialGroup_1.default.findOne({ groupName: groupName }).lean();
        if (!group) {
            resp.status(400).json({
                success: false,
                message: `${groupName} group not found`,
            });
        }
        else {
            query['group.groupId'] = group._id;
        }
    }
    if (unit) {
        query.unit = unit;
    }
    ;
    let allRawMaterial;
    if (sort) {
        if (sort === "asc") {
            allRawMaterial = await childPartModel_1.default.find({ ...query, childPartType: "raw" })
                .sort({ partName: 1 })
                .lean();
        }
        else if (sort === "dec") {
            allRawMaterial = await childPartModel_1.default.find({ ...query, childPartType: "raw" })
                .sort({ partName: -1 })
                .lean();
        }
        else {
            allRawMaterial = await childPartModel_1.default.find({ ...query, childPartType: "raw" })
                .sort({ partName: 1 })
                .lean();
        }
    }
    else {
        allRawMaterial = await childPartModel_1.default.find({ ...query, childPartType: "raw" }).lean();
    }
    ;
    return resp.status(201).json({
        success: true,
        message: "getting all  raw material",
        allRawMaterial: allRawMaterial,
    });
});
exports.updateRawMaterial = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { name, materialType, code, unit, groupName } = req.body;
    const { id } = req.params;
    const rawMaterial = await childPartModel_1.default.findById(id);
    if (!rawMaterial) {
        return resp.status(404).json({
            success: false,
            message: "Raw material not found",
        });
    }
    if (name) {
        rawMaterial.partName = name;
    }
    if (materialType) {
        rawMaterial.typeOfMaterial = materialType;
    }
    if (code) {
        rawMaterial.materialCode = code;
    }
    if (unit) {
        rawMaterial.unit = unit;
    }
    if (groupName) {
        const groupDetails = await rawMaterialGroup_1.default.findOne({ groupName });
        if (!groupDetails) {
            return resp.status(404).json({
                success: false,
                message: `Group with name ${groupName} not found.`
            });
        }
        ;
        rawMaterial.group.groupId = groupDetails._id;
        rawMaterial.group.groupName = groupDetails.groupName;
    }
    await rawMaterial.save();
    return resp.status(200).json({
        success: true,
        message: "Raw material updated successfully",
        rawMaterial: rawMaterial,
    });
});
// get all childPart which consumed this raw material
exports.getChildPartByRawMaterial = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const rawMaterial = await childPartModel_1.default.findOne({ _id: id });
    if (!rawMaterial) {
        return resp.status(404).json({
            success: false,
            message: `Raw material not found with id ${id}.`,
        });
    }
    const allFinishedItem = await finishedItemModel_1.default.find().lean();
    const finisheditemStore = {};
    allFinishedItem.forEach((f) => {
        f.masterBom?.forEach((m) => {
            const id = m.childPart?.id + "";
            finisheditemStore[id] = {
                finishedItemName: f.itemName
            };
        });
    });
    const childPartArray = [];
    const allChildParts = await childPartModel_1.default.find().lean();
    allChildParts.forEach((a) => {
        const childPartId = a._id + "";
        a.consumedItem.forEach((c) => {
            if (c.itemId + "" === rawMaterial._id + "") {
                childPartArray.push({
                    ...a,
                    finishItemName: finisheditemStore[childPartId]?.finishedItemName
                });
            }
        });
    });
    resp.status(200).json({
        success: true,
        message: `Getting all childParts which consumed ${rawMaterial.partName}`,
        childPartArray,
    });
});
// // get all finished Item where the Raw material is used 
// export const getfinishedItemByRawMaterial = catchErrorAsync(async (req,resp,next)=>{
//   const {id} = req.params;
//   const rawmaterialDetails = await ChildPartModel.findById(id);
//   if(!rawmaterialDetails){
//     return resp.status(404).json({
//       success:false,
//       message:`Raw material not found with id ${id}.`
//     });
//   };
//   const finishedItem = await 
// })
// create a group
exports.createGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupName, description } = req.body;
    const groupDetails = await rawMaterialGroup_1.default.findOne({ groupName });
    if (groupDetails) {
        return resp.status(404).json({
            success: false,
            message: `Group with name ${groupName} already present.`
        });
    }
    ;
    const newGroup = await rawMaterialGroup_1.default.create({ groupName, description });
    resp.status(201).json({
        success: true,
        message: `${groupName} group created successfully.`,
        group: newGroup
    });
});
// update group
exports.updateGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId } = req.params;
    const { groupName, description } = req.body;
    const groupDetails = await rawMaterialGroup_1.default.findOne({ _id: groupId });
    if (!groupDetails) {
        return resp.status(404).json({
            success: false,
            message: `Group with name ${groupId} not found.`
        });
    }
    ;
    if (groupName) {
        groupDetails.groupName = groupName;
    }
    if (description) {
        groupDetails.description = description;
    }
    await groupDetails.save();
    const rawMaterials = await childPartModel_1.default.find({ "group.groupId": groupDetails._id }).lean();
    for (let r of rawMaterials) {
        await childPartModel_1.default.findByIdAndUpdate(r._id, { "group.groupName": groupDetails.groupName });
    }
    resp.status(200).json({
        success: true,
        message: `${groupName} updated successfully.`,
        group: groupDetails
    });
});
// get all groups
exports.getAllGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { sort, name } = req.body;
    let query = {};
    if (name) {
        // Match 'name' against 'groupName', 'groupDescription'
        query.$or = [
            { groupName: { $regex: name, $options: "i" } },
            { description: { $regex: name, $options: "i" } },
        ];
    }
    let groups;
    if (sort) {
        if (sort === "asc") {
            groups = await rawMaterialGroup_1.default.find({ ...query }).sort({ groupName: 1 }).lean();
        }
        else if (sort === "dec") {
            groups = await rawMaterialGroup_1.default.find({ ...query }).sort({ groupName: -1 }).lean();
        }
    }
    else {
        groups = await rawMaterialGroup_1.default.find({ ...query }).lean();
    }
    resp.status(200).json({
        success: true,
        message: "Getting all group successfully.",
        groups
    });
});
// DELETE GROUP
exports.deleteGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId } = req.params;
    const rawMaterials = await childPartModel_1.default.find({ 'group.groupId': groupId, childPartType: "raw" }).lean();
    if (rawMaterials.length === 0) {
        let group = await rawMaterialGroup_1.default.findByIdAndDelete({ _id: groupId }).lean();
        if (!group) {
            return resp.status(404).json({
                success: false,
                message: "Group Not Found",
            });
        }
        return resp.status(200).json({
            success: true,
            message: `${group.groupName} group deleted successfully`,
        });
    }
    else {
        const foundArray = rawMaterials.map(f => f.partName);
        return resp.status(400).json({
            success: false,
            message: `Found somewhere includes this group`,
            foundArray
        });
    }
});
