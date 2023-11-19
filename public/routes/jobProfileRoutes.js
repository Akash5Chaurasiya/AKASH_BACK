"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jobProfileController_1 = require("../controllers/employee/jobProfileController");
const departmentController_1 = require("../controllers/employee/departmentController");
const jobProfileRoute = (0, express_1.Router)();
// get jobProfile with no parent
jobProfileRoute.route("/getjobprofilewithnoparent").get(jobProfileController_1.getAllJobProfileWithNoParent);
jobProfileRoute.route("/getchildjobprofile/:jobprofielId").get(jobProfileController_1.getChildJobProfile);
// for empty all child and parent fields in all jobProfile
jobProfileRoute.route("/removeParentAndChild").get(jobProfileController_1.emptyAllChildAndParentFields);
jobProfileRoute.route("/").get(jobProfileController_1.allJobProfile);
jobProfileRoute.route("/add").post(jobProfileController_1.addJobProfile);
jobProfileRoute.route("/delete/:id").delete(jobProfileController_1.deleteJobProfile);
jobProfileRoute.route("/updateHierarchy").patch(jobProfileController_1.updateHierarchy);
jobProfileRoute.route("/update/:id").patch(jobProfileController_1.updateJobProfile);
jobProfileRoute.route("/updateJobDescription").patch(jobProfileController_1.updateJobDescription);
jobProfileRoute.route("/addDepartment").patch(departmentController_1.addDepartmentToJobProfile);
jobProfileRoute.route("/deleteDepartment").delete(departmentController_1.deleteDepartmentToJobProfile);
jobProfileRoute.route("/:id").get(jobProfileController_1.getSingleJobProfile);
jobProfileRoute.route("/suggestion/:jobprofileId").get(jobProfileController_1.suggestionForJobProfile);
exports.default = jobProfileRoute;
