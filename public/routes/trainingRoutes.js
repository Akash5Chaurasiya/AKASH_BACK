"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const trainingController_1 = require("../controllers/employee/trainingController");
const auth_1 = require("../middleware/auth");
const trainingRoutes = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
trainingRoutes.get("/", auth_1.isAuthenticatedAdminOrHR, trainingController_1.getTraining);
trainingRoutes.post("/addLinks", trainingController_1.addTrainingLinks);
trainingRoutes.post("/add", upload.single("file"), trainingController_1.addTrainingDocs);
trainingRoutes.get("/:id", trainingController_1.getTrainingData);
trainingRoutes.delete("/:id", trainingController_1.deleteTrainingData);
exports.default = trainingRoutes;
