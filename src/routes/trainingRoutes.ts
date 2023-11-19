import { Router } from "express";
import multer from "multer";

import {
  addTrainingLinks,
  addTrainingDocs,
  getTrainingData,
  deleteTrainingData,
  getTraining,
} from "../controllers/employee/trainingController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const trainingRoutes = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

trainingRoutes.get("/",isAuthenticatedAdminOrHR , getTraining);
trainingRoutes.post("/addLinks", addTrainingLinks);
trainingRoutes.post("/add", upload.single("file"), addTrainingDocs);

trainingRoutes.get("/:id", getTrainingData);
trainingRoutes.delete("/:id", deleteTrainingData);

export default trainingRoutes;
