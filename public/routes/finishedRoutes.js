"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const finishedItemController_1 = require("../controllers/bomControllers/finishedItemController");
const finishedItemRouter = express_1.default.Router();
// // for single use
// finishedItemRouter.route("/singleUse").patch(updateFinishedItemStatus)
// delete childPart from masterBom
finishedItemRouter.route("/deleteInMasterBom/:id").patch(finishedItemController_1.DeleteChildPartFromFinishedItem);
// added by dakshay
finishedItemRouter.route("/addBom").post(finishedItemController_1.addPartInBom);
finishedItemRouter.route("/finishedItem/:finishedItemId").get(async (req, resp, next) => {
    try {
        const id = req.params.finishedItemId;
        const orderQuantity = 1;
        const data = await (0, finishedItemController_1.getBomItemWithQuantity)(req, resp, id, orderQuantity);
        // const cncData = await getCNCProgramPerFinishedItem(id);
        resp.status(200).json({
            success: true,
            message: "Getting finished item successfully.",
            // newFinishItem:{cncProgram:cncData,...data}});
            newFinishItem: { ...data }
        });
    }
    catch (error) {
        console.log(error);
    }
});
// finishItem groups -----------------------------------------------------------
finishedItemRouter.route("/addGroup").post(finishedItemController_1.AddGroup);
finishedItemRouter.route("/getAllGroup").post(finishedItemController_1.getAllGroup);
finishedItemRouter.route("/updateGroup/:groupId").patch(finishedItemController_1.updateGroup);
finishedItemRouter.route("/deleteGroup/:groupId").delete(finishedItemController_1.deleteGroup);
// for adding finishedItemId in childParts
// finishedItemRouter.route("/singleUse").get(addFinishedItemInChildPart);
// finishedItemRouter.route("/masterBom/:finishedItemId").get(getBomData);
// API for adding a childPart In BETWEEN a master bom 
finishedItemRouter.route("/editMasterBom").post(finishedItemController_1.addPartInBetweenBom);
// api for updating process in master bom 
finishedItemRouter.route("/updateProcess/:id").post(finishedItemController_1.updateProcess);
// adding filters and searching
finishedItemRouter.route("/").post(finishedItemController_1.getAllFinished);
finishedItemRouter.route("/add").post(finishedItemController_1.addFinished);
finishedItemRouter.route("/:id").get(finishedItemController_1.getFinished).patch(finishedItemController_1.updateFinished).delete(finishedItemController_1.deleteFinishedItem);
//
// finishedItemRouter.route("/statusUpdate").post(addBomComplete);
// Add process in in every childPart
// finishedItemRouter.route("/addProcessInChild").post(addProcessInEachChildPart);
exports.default = finishedItemRouter;
