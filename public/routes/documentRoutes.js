"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employeeDocsController_1 = require("../controllers/employee/employeeDocsController");
const multer_1 = __importDefault(require("multer"));
const documentRoutes = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
documentRoutes.post("/upload", upload.single("file"), employeeDocsController_1.uploadDocument);
documentRoutes.route("/").get(employeeDocsController_1.allDocuments);
exports.default = documentRoutes;
