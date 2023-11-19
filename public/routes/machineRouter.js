"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const machineController_1 = require("../controllers/bomControllers/machineController");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const machineRouter = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
machineRouter.route("/").post(machineController_1.getAllMachine); // added filter and search , name can be used for machineName , code or processName or code and Other Porcess is used to filter
machineRouter.route("/add").post(machineController_1.addMachine);
// assign qr code to a machine
machineRouter.route("/assignQr/:id").post(auth_1.isAuthenticatedAdminOrHR, machineController_1.assignQrToMachine);
// get machine data by QR code
machineRouter.route("/getMachineByQr").post(machineController_1.getMachineByQrCode);
machineRouter.post("/get/uploadMachineProofImage", upload.single("file"), machineController_1.uploadMachineProofImage);
machineRouter.post("/uploadMachineImage", upload.single("file"), machineController_1.uploadMachineImage);
machineRouter.route("/:id").get(machineController_1.getMachine).patch(machineController_1.updateMachine).delete(machineController_1.deleteMachine);
exports.default = machineRouter;
