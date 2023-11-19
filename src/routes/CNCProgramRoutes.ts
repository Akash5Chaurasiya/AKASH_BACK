import express from "express";
import multer from "multer";
import {
  CNCProgramLogs,
  CNCProgramLogsDelete,
  addCNCProgram,
  addChildPartInCNCProgram,
  addProgramProductionSlip,
  // addRawMaterialId,
  allProgram,
  deleteCNCProgram,
  deleteChildPartFromProgram,
  finalizeProgram,
  getWorkOrderByChildPart,
  singleProgram,
  updateCNCProgram,
  updateProduction,
} from "../controllers/bomControllers/CNCProgramController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const CNCProgramRouter = express.Router();

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

CNCProgramRouter.route("/addNew").post(upload.fields([{ name: 'DFX', maxCount: 1 }, { name: 'drawing', maxCount: 1 },{ name: 'nesting', maxCount: 1 }]), addCNCProgram);

// add childPart in CNCProgram
CNCProgramRouter.route("/addChildPart/:programId").post(addChildPartInCNCProgram);

// get All
CNCProgramRouter.route("/getAll").post(allProgram);

// Finalize the Program
CNCProgramRouter.route("/finalize/:programId").post(upload.single("file"),finalizeProgram);

// update production of childPart
CNCProgramRouter.route("/updateProduction/:programId").post(updateProduction);

// update fields of CNC Program
CNCProgramRouter.route("/updateProgram/:programId").post(upload.fields([{ name: 'DFX', maxCount: 1 }, { name: 'drawing', maxCount: 1 }, { name: 'nesting', maxCount: 1 }]),updateCNCProgram)

// create logs
CNCProgramRouter.route("/createLog/:programId").post(
  isAuthenticatedAdminOrHR,
  addProgramProductionSlip
);

// get workOrder by ChildPart
CNCProgramRouter.route("/getWorkOrderByChildPart/:childPartId").get(
  getWorkOrderByChildPart
);

// getting all logs Of CNC program
CNCProgramRouter.route("/logs").post(CNCProgramLogs);

// delete CNCProgramLog
CNCProgramRouter.route("/log/:logId").delete(CNCProgramLogsDelete);

// Delete ChildPart from CNCProgram
CNCProgramRouter.route("/removeChild/:id").patch(deleteChildPartFromProgram);


// get single Program and Delete Program
CNCProgramRouter.route("/:id").get(singleProgram).delete(deleteCNCProgram);

// add rawMaterial ID 
// CNCProgramRouter.route("/addRawMaterialId").post(addRawMaterialId);

export default CNCProgramRouter;