"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmployeeByGroup = exports.getChildGroups = exports.getAllGroupsWithNoParent = exports.getSingleGroup = exports.updateHierarchy = exports.deleteField = exports.updateField = exports.addNewField = exports.allGroup = exports.updateGroup = exports.deleteGroup = exports.addGroup = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const groupModel_1 = __importDefault(require("../../database/models/groupModel"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
// add
exports.addGroup = (0, catchAsyncError_1.default)(async (req, resp) => {
    let Group = {};
    let { groupName, description, parentGroupName } = req.body;
    // find parentGroupID
    groupName = groupName.trim();
    let parentGroupId;
    let parent;
    if (parentGroupName) {
        parentGroupId = await groupModel_1.default.findOne({
            groupName: parentGroupName,
        });
        parent = await groupModel_1.default.findOne({ _id: parentGroupId?._id });
        if (!parent) {
            return resp.status(404).json({
                success: false,
                message: "Parent group not found.",
            });
        }
    }
    const newGroup = await groupModel_1.default.findOne({ groupName: groupName });
    if (newGroup) {
        return resp.status(400).json({
            success: false,
            message: "Same named group already present.",
        });
    }
    if (parentGroupId) {
        Group = await groupModel_1.default.create({
            groupName,
            description,
            parentGroupId,
        });
        const childGroupid = await groupModel_1.default.findOne({
            groupName: groupName,
        });
        if (parent) {
            parent.childGroupId.push(childGroupid?._id);
            await parent.save();
        }
    }
    else if (!parentGroupId) {
        Group = await groupModel_1.default.create({
            groupName,
            description,
        });
    }
    resp.status(201).json({
        success: true,
        message: "Created Group successfully.",
        Group,
    });
});
// // delete
exports.deleteGroup = (0, catchAsyncError_1.default)(async (req, resp) => {
    const groupName = req.body.groupName;
    const group = await groupModel_1.default.findOne({ groupName });
    if (group) {
        const employee = await employeeModel_1.default.find({ groupId: group._id });
        if (employee.length <= 0) {
            let docs = await groupModel_1.default.findByIdAndDelete(group._id);
            resp.status(200).json({
                success: true,
                message: "Deleted Group list successfully.",
            });
        }
        else {
            resp.status(400).json({
                success: false,
                message: "Group in linked with employees",
            });
        }
    }
    else {
        resp.status(404).json({
            success: false,
            message: "Group not found.",
        });
    }
});
// // update
exports.updateGroup = (0, catchAsyncError_1.default)(async (req, resp) => {
    const id = req.params.id;
    const { groupName, description } = req.body;
    const group = await groupModel_1.default.findOne({ _id: id });
    if (group) {
        const docs = await groupModel_1.default.findByIdAndUpdate({ _id: id }, { groupName: groupName, description: description });
        resp.status(200).json({
            success: true,
            message: "Updated update group successfully.",
            docs,
        });
    }
    resp.status(200).json({
        success: true,
        message: "group invaild",
    });
});
// // get all
exports.allGroup = (0, catchAsyncError_1.default)(async (req, resp) => {
    const docs = await groupModel_1.default.find({});
    resp.status(200).json({
        success: true,
        message: "All group list.",
        docs,
    });
});
// adding new fields in group
exports.addNewField = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId, fieldName } = req.body;
    const group = await groupModel_1.default.findById(groupId);
    if (!group) {
        return next(new errorHandler_1.default("group not found", 404));
    }
    const newField = { fieldName, fieldValue: "" };
    group.newFields.push(newField);
    await group.save();
    resp.status(200).json({ message: "New field added successfully", group });
});
// updating new fields
exports.updateField = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId, fieldName, fieldValue } = req.body;
    const group = await groupModel_1.default.findById(groupId);
    if (!group) {
        return next(new errorHandler_1.default("group not found", 404));
    }
    const fieldToUpdate = group.newFields.find((field) => field.fieldName === fieldName);
    if (!fieldToUpdate) {
        return next(new errorHandler_1.default("Field not found", 404));
    }
    fieldToUpdate.fieldValue = fieldValue;
    await group.save();
    resp.status(200).json({ message: "Field updated successfully", group });
});
// deleting newFields
exports.deleteField = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId, fieldName } = req.body;
    const group = await groupModel_1.default.findById(groupId);
    if (!group) {
        return next(new errorHandler_1.default("group not found", 404));
    }
    const fieldIndex = group.newFields.findIndex((field) => field.fieldName === fieldName);
    if (fieldIndex === -1) {
        return next(new errorHandler_1.default("Field not found", 404));
    }
    group.newFields.splice(fieldIndex, 1);
    await group.save();
    resp.status(200).json({ message: "Field deleted successfully", group });
});
// update hierarchy
exports.updateHierarchy = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { groupName, parentGroupName } = req.body;
    if (groupName === parentGroupName) {
        return resp.status(400).json({
            success: false,
            message: "The job profile and parent job profile cannot be same .",
        });
    }
    // Find job profile ID based on groupName
    const currentGroup = await groupModel_1.default.findOne({ groupName });
    if (!currentGroup) {
        return resp.status(404).json({
            success: false,
            message: "Job Profile not found.",
        });
    }
    const GroupId = currentGroup._id;
    if (parentGroupName) {
        // Find parent job profile ID based on parentGroupName
        const parentGroup = await groupModel_1.default.findOne({
            groupName: parentGroupName,
        });
        if (!parentGroup) {
            return resp.status(404).json({
                success: false,
                message: "Parent Job Profile not found.",
            });
        }
        const parentGroupId = parentGroup._id;
        if (parentGroup.parentGroupId?.toString() === currentGroup._id.toString()) {
            const job1 = currentGroup;
            const job2 = parentGroup;
            const newArray = job1.childGroupId.filter((e) => String(e) !== String(parentGroup._id));
            newArray.push(job1._id);
            const newArray1 = [...job2?.childGroupId];
            const update1 = await groupModel_1.default
                .findOneAndUpdate({ _id: currentGroup._id }, { parentGroupId: job2._id, childGroupId: newArray1 }, { new: true })
                .exec();
            const update2 = await groupModel_1.default
                .findOneAndUpdate({ _id: parentGroup._id }, { parentGroupId: job1.parentGroupId, childGroupId: newArray }, { new: true })
                .exec();
            return resp.status(200).json({
                success: true,
                message: "Group exchange successfully.",
                update1,
                update2,
            });
        }
        let filter;
        let update;
        if (parentGroupId != GroupId) {
            filter = { _id: GroupId };
            update = { $set: { parentGroupId } };
        }
        // Update current job profile
        // Update parent job profile
        const filter2 = { _id: parentGroupId };
        const update2 = { $push: { childGroupId: GroupId } };
        // Remove childGroupId from old parent
        const oldParentGroupId = currentGroup?.parentGroupId;
        if (oldParentGroupId) {
            const filter3 = { _id: oldParentGroupId };
            const update3 = { $pull: { childGroupId: GroupId } };
            await groupModel_1.default.updateOne(filter3, update3);
        }
        await groupModel_1.default.updateOne(filter, update);
        await groupModel_1.default.updateOne(filter2, update2);
        resp.status(200).json({
            success: true,
            message: "Updated group successfully.",
            currentGroupId: GroupId,
            parent: parentGroup,
        });
    }
    else {
        const parent = currentGroup.parentGroupId;
        if (currentGroup) {
            currentGroup.parentGroupId = null;
        }
        // Remove childGroupId from old parent
        if (parent) {
            const oldParentGroup = await groupModel_1.default.findOne({
                _id: parent,
            });
            if (oldParentGroup) {
                // Use type assertion to suppress TypeScript error
                const childGroupIdArray = oldParentGroup.childGroupId;
                const index = childGroupIdArray.indexOf(currentGroup._id);
                if (index > -1) {
                    childGroupIdArray.splice(index, 1);
                    await oldParentGroup.save();
                }
            }
        }
        await currentGroup?.save();
        resp.status(200).json({
            success: true,
            message: "Updated group successfully.",
            currentGroup,
            parent,
        });
    }
});
exports.getSingleGroup = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { groupId } = req.params;
    if (groupId) {
        const groupData = await groupModel_1.default.findById(groupId);
        resp.status(200).json({
            success: true,
            message: "group data successfully.",
            groupData,
        });
    }
    else {
        resp.status(200).json({
            success: false,
            message: "employee not found.",
        });
    }
});
// getting group data with no parent
async function getAllGroupsWithNoParent(req, res) {
    try {
        const groups = await groupModel_1.default
            .find({
            parentGroupId: null,
        })
            .exec();
        res.status(200).json(groups);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
exports.getAllGroupsWithNoParent = getAllGroupsWithNoParent;
// getting childGroup
async function getChildGroups(req, res) {
    const { groupId } = req.params;
    try {
        const group = await groupModel_1.default
            .findById(groupId)
            .populate("childGroupId")
            .exec();
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        const childGroup = group.childGroupId;
        res.status(200).json({
            success: true,
            group,
            childGroup,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
exports.getChildGroups = getChildGroups;
exports.getEmployeeByGroup = (0, catchAsyncError_1.default)(async (req, resp) => {
    const allGroups = await groupModel_1.default.find({});
    const allEmployees = await employeeModel_1.default.find({});
    if (allEmployees && allGroups) {
        const groupCounts = {};
        const groupIds = {};
        allEmployees.forEach((employee) => {
            const groupId = employee.groupId.toString(); // Assuming groupId is stored as an ObjectId
            if (groupCounts[groupId]) {
                groupCounts[groupId]++;
            }
            else {
                groupCounts[groupId] = 1;
                groupIds[groupId] = employee.groupId; // Store the group ID
            }
        });
        const responseData = allGroups.map((group) => ({
            groupId: group._id.toString(),
            groupName: group.groupName,
            employeeCount: groupCounts[group._id.toString()] || 0,
        }));
        resp.status(200).json({
            success: true,
            message: "getting employee count as per group",
            responseData,
        });
    }
    else {
        resp.status(400).json({
            success: false,
            message: "invalid group or employee",
        });
    }
});
