"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentController_1 = require("../controllers/employee/departmentController");
const departmentRouter = (0, express_1.Router)();
departmentRouter.route("/add").post(departmentController_1.addDepartment);
departmentRouter.route("/updateDepartment/:id").patch(departmentController_1.updateDepartment);
departmentRouter.route("/updateParentDepartment/:id").patch(departmentController_1.updateParentDepartment);
departmentRouter.route("/addParent").post(departmentController_1.addParentDepartment);
departmentRouter.route("/updateHierarchy").patch(departmentController_1.updateHierarchyDepartment);
departmentRouter.route("/getAllParent").get(departmentController_1.getAllParentDepartment);
departmentRouter.route("/getAllDepartment").get(departmentController_1.getAllDepartment);
departmentRouter.route("/getDepartmentByParent").get(departmentController_1.getDepartmentByParent); //  query departmentName of parent
departmentRouter.route("/getJobProfile").get(departmentController_1.getJobProfileInDepartment); // query departmentName of department
departmentRouter.route("/data").get(departmentController_1.childDepartmentAllData); // query departmentName of department
departmentRouter.route("/newData").get(departmentController_1.newChildDepartmentAllData); // query departmentName of department
departmentRouter.route("/delete/:id").delete(departmentController_1.deleteDepartment);
exports.default = departmentRouter;
