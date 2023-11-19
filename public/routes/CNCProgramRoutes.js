"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const CNCProgramController_1 = require("../controllers/bomControllers/CNCProgramController");
const auth_1 = require("../middleware/auth");
const CNCProgramRouter = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
CNCProgramRouter.route("/addNew").post(upload.fields([{ name: 'DFX', maxCount: 1 }, { name: 'drawing', maxCount: 1 }, { name: 'nesting', maxCount: 1 }]), CNCProgramController_1.addCNCProgram);
// add childPart in CNCProgram
CNCProgramRouter.route("/addChildPart/:programId").post(CNCProgramController_1.addChildPartInCNCProgram);
// get All
CNCProgramRouter.route("/getAll").post(CNCProgramController_1.allProgram);
// Finalize the Program
CNCProgramRouter.route("/finalize/:programId").post(upload.single("file"), CNCProgramController_1.finalizeProgram);
// update production of childPart
CNCProgramRouter.route("/updateProduction/:programId").post(CNCProgramController_1.updateProduction);
// update fields of CNC Program
CNCProgramRouter.route("/updateProgram/:programId").post(upload.fields([{ name: 'DFX', maxCount: 1 }, { name: 'drawing', maxCount: 1 }, { name: 'nesting', maxCount: 1 }]), CNCProgramController_1.updateCNCProgram);
// create logs
CNCProgramRouter.route("/createLog/:programId").post(auth_1.isAuthenticatedAdminOrHR, CNCProgramController_1.addProgramProductionSlip);
// get workOrder by ChildPart
CNCProgramRouter.route("/getWorkOrderByChildPart/:childPartId").get(CNCProgramController_1.getWorkOrderByChildPart);
// getting all logs Of CNC program
CNCProgramRouter.route("/logs").post(CNCProgramController_1.CNCProgramLogs);
// delete CNCProgramLog
CNCProgramRouter.route("/log/:logId").delete(CNCProgramController_1.CNCProgramLogsDelete);
// Delete ChildPart from CNCProgram
CNCProgramRouter.route("/removeChild/:id").patch(CNCProgramController_1.deleteChildPartFromProgram);
// get single Program and Delete Program
CNCProgramRouter.route("/:id").get(CNCProgramController_1.singleProgram).delete(CNCProgramController_1.deleteCNCProgram);
// add rawMaterial ID 
// CNCProgramRouter.route("/addRawMaterialId").post(addRawMaterialId);
exports.default = CNCProgramRouter;
