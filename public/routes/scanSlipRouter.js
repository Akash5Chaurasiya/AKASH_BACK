"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const scanSlipController_1 = require("../controllers/employee/scanSlipController");
const multer_1 = __importDefault(require("multer"));
const scanSlipRouter = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
// scanSlipRouter.post("/add", upload.single("file"), createScanSlip);
scanSlipRouter.post("/add", upload.single("file"), scanSlipController_1.addOrUpdateScanSlip);
scanSlipRouter.get("/", scanSlipController_1.getScannedSlip);
exports.default = scanSlipRouter;
