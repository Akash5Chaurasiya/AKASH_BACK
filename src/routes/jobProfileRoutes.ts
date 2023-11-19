import { Router } from "express";

import {
  addJobProfile,
  allJobProfile,
  deleteJobProfile,
  emptyAllChildAndParentFields,
  getAllJobProfileWithNoParent,
  getChildJobProfile,
  getSingleJobProfile,
  suggestionForJobProfile,
  updateHierarchy,
  updateJobDescription,
  updateJobProfile,
} from "../controllers/employee/jobProfileController";
import { addDepartmentToJobProfile, deleteDepartmentToJobProfile } from "../controllers/employee/departmentController";

const jobProfileRoute = Router();

// get jobProfile with no parent
jobProfileRoute.route("/getjobprofilewithnoparent").get(getAllJobProfileWithNoParent);
jobProfileRoute.route("/getchildjobprofile/:jobprofielId").get(getChildJobProfile);
// for empty all child and parent fields in all jobProfile
jobProfileRoute.route("/removeParentAndChild").get(emptyAllChildAndParentFields);

jobProfileRoute.route("/").get(allJobProfile);
jobProfileRoute.route("/add").post(addJobProfile);
jobProfileRoute.route("/delete/:id").delete(deleteJobProfile);
jobProfileRoute.route("/updateHierarchy").patch(updateHierarchy);
jobProfileRoute.route("/update/:id").patch(updateJobProfile);
jobProfileRoute.route("/updateJobDescription").patch(updateJobDescription);
jobProfileRoute.route("/addDepartment").patch(addDepartmentToJobProfile);
jobProfileRoute.route("/deleteDepartment").delete(deleteDepartmentToJobProfile);
jobProfileRoute.route("/:id").get(getSingleJobProfile);
jobProfileRoute.route("/suggestion/:jobprofileId").get(suggestionForJobProfile);




export default jobProfileRoute;
