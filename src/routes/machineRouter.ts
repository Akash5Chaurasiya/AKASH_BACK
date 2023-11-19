import express from "express";
import {
  addMachine,
  assignQrToMachine,
  deleteMachine,
  getAllMachine,
  getMachine,
  getMachineByQrCode,
  updateMachine,
  uploadMachineImage,
  uploadMachineProofImage,
} from "../controllers/bomControllers/machineController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";
import multer from "multer";

const machineRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


machineRouter.route("/").post(getAllMachine);  // added filter and search , name can be used for machineName , code or processName or code and Other Porcess is used to filter
machineRouter.route("/add").post(addMachine);

// assign qr code to a machine
machineRouter.route("/assignQr/:id").post(isAuthenticatedAdminOrHR,assignQrToMachine);

// get machine data by QR code
machineRouter.route("/getMachineByQr").post(getMachineByQrCode);

machineRouter.post(
  "/get/uploadMachineProofImage",
  upload.single("file"),
  uploadMachineProofImage
);

machineRouter.post(
  "/uploadMachineImage",
  upload.single("file"),
  uploadMachineImage
);

machineRouter.route("/:id").get(getMachine).patch(updateMachine).delete(deleteMachine);

export default machineRouter;

