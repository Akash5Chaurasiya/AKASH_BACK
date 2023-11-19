import { Router } from "express";
import {
  addGroup,
  addNewField,
  allGroup,
  deleteGroup,
  deleteField,
  getAllGroupsWithNoParent,
  getChildGroups,
  getSingleGroup,
  updateGroup,
  updateField,
  updateHierarchy,
  getEmployeeByGroup,
} from "../controllers/employee/groupController";
import { isAuthenticatedAdminOrDbManager } from "../middleware/auth";

const groupRouter = Router();

groupRouter.route("/").get(allGroup);
groupRouter.route("/add").post(addGroup);
groupRouter.route("/getEmployeeGroup").get(getEmployeeByGroup); //get employee count by group name
groupRouter.route("/delete").delete(isAuthenticatedAdminOrDbManager,deleteGroup);
groupRouter.route("/:id").patch(isAuthenticatedAdminOrDbManager,updateGroup);
groupRouter.route("/update/hr").patch(isAuthenticatedAdminOrDbManager,updateHierarchy);
groupRouter.route("/getSingleGroup/:groupId").get(getSingleGroup);

// new fields
groupRouter.route("/newField").post(addNewField).patch(updateField).delete(deleteField)

// getting 
groupRouter.route("/getgroupnoparent").get(getAllGroupsWithNoParent);
groupRouter.route("/getchildren/:groupId").get(getChildGroups);


export default groupRouter;
