import { Router } from "express";
import {
  addDepartment,
  addParentDepartment,
  childDepartmentAllData,
  deleteDepartment,
  getAllDepartment,
  getAllParentDepartment,
  getDepartmentByParent,
  getJobProfileInDepartment,
  newChildDepartmentAllData,
  updateDepartment,
  updateHierarchyDepartment,
  updateParentDepartment,
} from "../controllers/employee/departmentController";

const departmentRouter = Router();

departmentRouter.route("/add").post(addDepartment);
departmentRouter.route("/updateDepartment/:id").patch(updateDepartment);
departmentRouter.route("/updateParentDepartment/:id").patch(updateParentDepartment);
departmentRouter.route("/addParent").post(addParentDepartment);
departmentRouter.route("/updateHierarchy").patch(updateHierarchyDepartment);
departmentRouter.route("/getAllParent").get(getAllParentDepartment);
departmentRouter.route("/getAllDepartment").get(getAllDepartment);
departmentRouter.route("/getDepartmentByParent").get(getDepartmentByParent); //  query departmentName of parent
departmentRouter.route("/getJobProfile").get(getJobProfileInDepartment); // query departmentName of department
departmentRouter.route("/data").get(childDepartmentAllData); // query departmentName of department
departmentRouter.route("/newData").get(newChildDepartmentAllData); // query departmentName of department
departmentRouter.route("/delete/:id").delete(deleteDepartment);

export default departmentRouter;
