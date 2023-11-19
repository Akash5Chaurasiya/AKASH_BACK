import express from "express"
import { addChildPart, deleteChildPart, editChildPartName, getAllChildPart, getChild, updateChildPart } from "../controllers/bomControllers/childPartController";
const childPartRouter = express.Router()


// childPartRouter.route("/singleUse").post(deleteUnwanted)


childPartRouter.route("/").get(getAllChildPart);
childPartRouter.route("/:id").get(getChild);
childPartRouter.route("/add").post(addChildPart);
childPartRouter.route("/:id").delete(deleteChildPart);

//update childpart
childPartRouter.route("/:id").patch(updateChildPart);

// update childPartName
childPartRouter.route("/editName/:id").patch(editChildPartName);

export default childPartRouter;