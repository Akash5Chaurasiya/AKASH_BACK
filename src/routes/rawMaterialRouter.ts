import express from "express"
import { addRawMaterial, deleteRawMaterial, getRawMaterial, getAllRawMaterial, updateRawMaterial, getChildPartByRawMaterial, updateGroup, getAllGroup, createGroup, deleteGroup } from "../controllers/bomControllers/rawMaterialController";
const rawMaterialRouter = express.Router()

// group router
rawMaterialRouter.route("/addGroup").post(createGroup);
rawMaterialRouter.route("/getGroups").post(getAllGroup);
rawMaterialRouter.route("/updateGroup/:groupId").patch(updateGroup);
rawMaterialRouter.route("/deleteGroup/:groupId").delete(deleteGroup);

//----------------------------------------

// get childParts which consumed this raw material whose Id we are getting in params
rawMaterialRouter.route("/whereConsumed/:id").get(getChildPartByRawMaterial);

rawMaterialRouter.route("/").get(getAllRawMaterial);  // added search and filter with unit query is name and unit
rawMaterialRouter.route("/add").post(addRawMaterial);
rawMaterialRouter.route("/:id").get(getRawMaterial).delete(deleteRawMaterial).patch(updateRawMaterial);

export default rawMaterialRouter ;