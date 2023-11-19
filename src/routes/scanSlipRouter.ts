import express from "express";
import { addOrUpdateScanSlip, getScannedSlip } from "../controllers/employee/scanSlipController";
import multer from "multer";

const scanSlipRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// scanSlipRouter.post("/add", upload.single("file"), createScanSlip);

scanSlipRouter.post("/add", upload.single("file"), addOrUpdateScanSlip);

scanSlipRouter.get("/", getScannedSlip);




export default scanSlipRouter;