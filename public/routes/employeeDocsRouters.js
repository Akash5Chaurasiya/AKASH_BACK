"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const employeeDocsController_1 = require("../controllers/employee/employeeDocsController");
const EmployeeDocsRouter = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage, limits: { fileSize: 1024 * 1024 * 50 } });
EmployeeDocsRouter.post("/upload", upload.single("file"), employeeDocsController_1.uploadDocument);
EmployeeDocsRouter.post("/uploadImage", upload.single("file"), employeeDocsController_1.uploadImage);
EmployeeDocsRouter.get("/getProfile/:id", employeeDocsController_1.getEmployeeProfile);
EmployeeDocsRouter.get("/getProofPicture/:id", employeeDocsController_1.getProofPicture);
EmployeeDocsRouter.get("/getAll", employeeDocsController_1.allDocuments);
EmployeeDocsRouter.get("/uploadEmpDocs", upload.single("file"), employeeDocsController_1.uploadEmpDocs);
// for aadhar and docs
EmployeeDocsRouter.post("/uploadEmpDoc", upload.single("file"), employeeDocsController_1.uploadEmpDoc);
// adding proof picture when we assigning Qr code
EmployeeDocsRouter.post("/uploadproofImage", upload.single("file"), employeeDocsController_1.uploadProofImage);
// adding approve picture while approving attendance
EmployeeDocsRouter.post("/uploadApproveImage", upload.single("file"), employeeDocsController_1.attendanceApproveImage);
// delete
EmployeeDocsRouter.post("/delete", employeeDocsController_1.deleteDocs);
// EmployeeDocsRouter.delete("/delete/:filename",a)
// get all from bucket
// EmployeeDocsRouter.get("/list",catchErrorAsync(async (req: Request, res: Response) => {
//     let r = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
//     let x = r.Contents ?? []; // Use an empty array as a fallback if r.Contents is undefined
//     res.send(x);
//   })
// );
// EmployeeDocsRouter.get(
//   "/listOne",
//   catchErrorAsync(async (req: Request, res: Response) => {
//     const { id } = req.body;
//     const docs = await EmployeeDocsModel.findById({ _id: id });
//     res.send({
//       success: true,
//       message: "successfully get file",
//       fileUrl: docs?.document,
//     });
//   })
// );
// EmployeeDocsRouter.get(
//   "/download/:filename",
//   catchErrorAsync(async (req: Request, res: Response) => {
//     const filename = req.params.filename;
//     // Check if the filename exists in the database
//     const fileExists = await EmployeeDocsModel.findOne({ file: filename });
//     if (!fileExists) {
//       return res.status(404).send("Filename does not exist.");
//     }
//     let file = await s3.getObject({ Bucket: BUCKET, Key: filename }).promise();
//     res.send(file.Body);
//   })
// );
// EmployeeDocsRouter.delete(
//   "/delete/:filename",
//   catchErrorAsync(async (req: Request, res: Response) => {
//     const filename = req.params.filename;
//     // Check if the filename exists in the database
//     const fileExists = await EmployeeDocsModel.findOne({ file: filename });
//     if (!fileExists) {
//       return res.status(404).send("Filename does not exist.");
//     }
//     try {
//       await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise();
//       res.send("File Deleted Successfully");
//     } catch (error) {
//       res.status(500).send("Error deleting file.");
//     }
//   })
// );
exports.default = EmployeeDocsRouter;
