import { Router } from "express";
import { addAdmin, deleteAdmin, getAllAdmin, updateAdmin } from "../controllers/admin/adminController";

const adminRouter = Router();


adminRouter.route("/add").post(addAdmin);
adminRouter.route("/").get(getAllAdmin);
adminRouter.route("/:id").patch(updateAdmin).delete(deleteAdmin);



export default adminRouter;