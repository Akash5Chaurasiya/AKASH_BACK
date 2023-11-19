import express, { Request, Response } from "express";
import {
  allDocuments,
  uploadDocument,
} from "../controllers/employee/employeeDocsController";
import multer from "multer";
const documentRoutes = express.Router();
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

documentRoutes.post("/upload", upload.single("file"), uploadDocument);

documentRoutes.route("/").get(allDocuments);

export default documentRoutes;
