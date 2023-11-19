"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rawMaterialController_1 = require("../controllers/bomControllers/rawMaterialController");
const rawMaterialRouter = express_1.default.Router();
// group router
rawMaterialRouter.route("/addGroup").post(rawMaterialController_1.createGroup);
rawMaterialRouter.route("/getGroups").post(rawMaterialController_1.getAllGroup);
rawMaterialRouter.route("/updateGroup/:groupId").patch(rawMaterialController_1.updateGroup);
rawMaterialRouter.route("/deleteGroup/:groupId").delete(rawMaterialController_1.deleteGroup);
//----------------------------------------
// get childParts which consumed this raw material whose Id we are getting in params
rawMaterialRouter.route("/whereConsumed/:id").get(rawMaterialController_1.getChildPartByRawMaterial);
rawMaterialRouter.route("/").get(rawMaterialController_1.getAllRawMaterial); // added search and filter with unit query is name and unit
rawMaterialRouter.route("/add").post(rawMaterialController_1.addRawMaterial);
rawMaterialRouter.route("/:id").get(rawMaterialController_1.getRawMaterial).delete(rawMaterialController_1.deleteRawMaterial).patch(rawMaterialController_1.updateRawMaterial);
exports.default = rawMaterialRouter;
