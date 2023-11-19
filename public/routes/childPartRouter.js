"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const childPartController_1 = require("../controllers/bomControllers/childPartController");
const childPartRouter = express_1.default.Router();
// childPartRouter.route("/singleUse").post(deleteUnwanted)
childPartRouter.route("/").get(childPartController_1.getAllChildPart);
childPartRouter.route("/:id").get(childPartController_1.getChild);
childPartRouter.route("/add").post(childPartController_1.addChildPart);
childPartRouter.route("/:id").delete(childPartController_1.deleteChildPart);
//update childpart
childPartRouter.route("/:id").patch(childPartController_1.updateChildPart);
// update childPartName
childPartRouter.route("/editName/:id").patch(childPartController_1.editChildPartName);
exports.default = childPartRouter;
