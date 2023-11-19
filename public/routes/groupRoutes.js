"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groupController_1 = require("../controllers/employee/groupController");
const auth_1 = require("../middleware/auth");
const groupRouter = (0, express_1.Router)();
groupRouter.route("/").get(groupController_1.allGroup);
groupRouter.route("/add").post(groupController_1.addGroup);
groupRouter.route("/getEmployeeGroup").get(groupController_1.getEmployeeByGroup); //get employee count by group name
groupRouter.route("/delete").delete(auth_1.isAuthenticatedAdminOrDbManager, groupController_1.deleteGroup);
groupRouter.route("/:id").patch(auth_1.isAuthenticatedAdminOrDbManager, groupController_1.updateGroup);
groupRouter.route("/update/hr").patch(auth_1.isAuthenticatedAdminOrDbManager, groupController_1.updateHierarchy);
groupRouter.route("/getSingleGroup/:groupId").get(groupController_1.getSingleGroup);
// new fields
groupRouter.route("/newField").post(groupController_1.addNewField).patch(groupController_1.updateField).delete(groupController_1.deleteField);
// getting 
groupRouter.route("/getgroupnoparent").get(groupController_1.getAllGroupsWithNoParent);
groupRouter.route("/getchildren/:groupId").get(groupController_1.getChildGroups);
exports.default = groupRouter;
