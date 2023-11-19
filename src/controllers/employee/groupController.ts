import { NextFunction, Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import groupModel from "../../database/models/groupModel";
import ErrorHandler from "../../middleware/errorHandler";
import EmployeeModel from "../../database/models/employeeModel";

// add
export const addGroup = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let Group = {};
    let { groupName, description, parentGroupName } = req.body;
    // find parentGroupID
    groupName = groupName.trim();
    let parentGroupId;
    let parent;
    if (parentGroupName) {
      parentGroupId = await groupModel.findOne({
        groupName: parentGroupName,
      });
      parent = await groupModel.findOne({ _id: parentGroupId?._id });
      if (!parent) {
        return resp.status(404).json({
          success: false,
          message: "Parent group not found.",
        });
      }
    }
    const newGroup = await groupModel.findOne({ groupName: groupName });
    if (newGroup) {
      return resp.status(400).json({
        success: false,
        message: "Same named group already present.",
      });
    }
    if (parentGroupId) {
      Group = await groupModel.create({
        groupName,
        description,
        parentGroupId,
      });
      const childGroupid = await groupModel.findOne({
        groupName: groupName,
      });
      if (parent) {
        parent.childGroupId.push(childGroupid?._id);
        await parent.save();
      }
    } else if (!parentGroupId) {
      Group = await groupModel.create({
        groupName,
        description,
      });
    }
    resp.status(201).json({
      success: true,

      message: "Created Group successfully.",
      Group,
    });
  }
);

// // delete
export const deleteGroup = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const groupName = req.body.groupName;
    const group = await groupModel.findOne({ groupName });
    if (group) {
      const employee = await EmployeeModel.find({ groupId: group._id });
      if (employee.length <= 0) {
        let docs = await groupModel.findByIdAndDelete(group._id);
        resp.status(200).json({
          success: true,
          message: "Deleted Group list successfully.",
        });
      } else {
        resp.status(400).json({
          success: false,
          message: "Group in linked with employees",
        });
      }
    } else {
      resp.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }
  }
);

// // update
export const updateGroup = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const id = req.params.id;
    const { groupName, description } = req.body;
    const group = await groupModel.findOne({ _id: id });
    if (group) {
      const docs = await groupModel.findByIdAndUpdate(
        { _id: id },
        { groupName: groupName, description: description }
      );
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
  }
);

// // get all
export const allGroup = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const docs = await groupModel.find({});
    resp.status(200).json({
      success: true,
      message: "All group list.",

      docs,
    });
  }
);

// adding new fields in group
export const addNewField = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { groupId, fieldName } = req.body;

    const group = await groupModel.findById(groupId);
    if (!group) {
      return next(new ErrorHandler("group not found", 404));
    }
    const newField = { fieldName, fieldValue: "" };
    group.newFields.push(newField);
    await group.save();

    resp.status(200).json({ message: "New field added successfully", group });
  }
);

// updating new fields
export const updateField = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { groupId, fieldName, fieldValue } = req.body;

    const group = await groupModel.findById(groupId);
    if (!group) {
      return next(new ErrorHandler("group not found", 404));
    }

    const fieldToUpdate = group.newFields.find(
      (field) => field.fieldName === fieldName
    );
    if (!fieldToUpdate) {
      return next(new ErrorHandler("Field not found", 404));
    }

    fieldToUpdate.fieldValue = fieldValue;
    await group.save();

    resp.status(200).json({ message: "Field updated successfully", group });
  }
);

// deleting newFields
export const deleteField = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { groupId, fieldName } = req.body;
    const group = await groupModel.findById(groupId);
    if (!group) {
      return next(new ErrorHandler("group not found", 404));
    }

    const fieldIndex = group.newFields.findIndex(
      (field: any) => field.fieldName === fieldName
    );
    if (fieldIndex === -1) {
      return next(new ErrorHandler("Field not found", 404));
    }

    group.newFields.splice(fieldIndex, 1);
    await group.save();

    resp.status(200).json({ message: "Field deleted successfully", group });
  }
);

// update hierarchy
export const updateHierarchy = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { groupName, parentGroupName } = req.body;

    if (groupName === parentGroupName) {
      return resp.status(400).json({
        success: false,
        message: "The job profile and parent job profile cannot be same .",
      });
    }

    // Find job profile ID based on groupName
    const currentGroup = await groupModel.findOne({ groupName });
    if (!currentGroup) {
      return resp.status(404).json({
        success: false,
        message: "Job Profile not found.",
      });
    }

    const GroupId = currentGroup._id;

    if (parentGroupName) {
      // Find parent job profile ID based on parentGroupName
      const parentGroup = await groupModel.findOne({
        groupName: parentGroupName,
      });
      if (!parentGroup) {
        return resp.status(404).json({
          success: false,
          message: "Parent Job Profile not found.",
        });
      }
      const parentGroupId = parentGroup._id;

      if (
        parentGroup.parentGroupId?.toString() === currentGroup._id.toString()
      ) {
        const job1 = currentGroup;
        const job2 = parentGroup;
        const newArray = job1.childGroupId.filter(
          (e) => String(e) !== String(parentGroup._id)
        );
        newArray.push(job1._id);

        const newArray1 = [...job2?.childGroupId];
        const update1 = await groupModel
          .findOneAndUpdate(
            { _id: currentGroup._id },
            { parentGroupId: job2._id, childGroupId: newArray1 },
            { new: true }
          )
          .exec();
        const update2 = await groupModel
          .findOneAndUpdate(
            { _id: parentGroup._id },
            { parentGroupId: job1.parentGroupId, childGroupId: newArray },
            { new: true }
          )
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
        await groupModel.updateOne(filter3, update3);
      }
      await groupModel.updateOne(filter, update);
      await groupModel.updateOne(filter2, update2);

      resp.status(200).json({
        success: true,
        message: "Updated group successfully.",
        currentGroupId: GroupId,
        parent: parentGroup,
      });
    } else {
      const parent = currentGroup.parentGroupId;
      if (currentGroup) {
        currentGroup.parentGroupId = null;
      }

      // Remove childGroupId from old parent
      if (parent) {
        const oldParentGroup = await groupModel.findOne({
          _id: parent,
        });
        if (oldParentGroup) {
          // Use type assertion to suppress TypeScript error
          const childGroupIdArray = oldParentGroup.childGroupId as any;
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
  }
);

export const getSingleGroup = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { groupId } = req.params;
    if (groupId) {
      const groupData = await groupModel.findById(groupId);
      resp.status(200).json({
        success: true,
        message: "group data successfully.",
        groupData,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "employee not found.",
      });
    }
  }
);

// getting group data with no parent
export async function getAllGroupsWithNoParent(req: Request, res: Response) {
  try {
    const groups = await groupModel
      .find({
        parentGroupId: null,
      })
      .exec();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

// getting childGroup

export async function getChildGroups(req: Request, res: Response) {
  const { groupId } = req.params;

  try {
    const group = await groupModel
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
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
export const getEmployeeByGroup = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const allGroups = await groupModel.find({});
    const allEmployees = await EmployeeModel.find({});
    if (allEmployees && allGroups) {
      const groupCounts: any = {};
      const groupIds: any = {};

      allEmployees.forEach((employee) => {
        const groupId: any = employee.groupId.toString(); // Assuming groupId is stored as an ObjectId
        if (groupCounts[groupId]) {
          groupCounts[groupId]++;
        } else {
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
    } else {
      resp.status(400).json({
        success: false,
        message: "invalid group or employee",
      });
    }
  }
);
