import express, { Request, Response } from "express";
import multer from "multer";
import {
  allDocuments,
  attendanceApproveImage,
  deleteDocs,
  getEmployeeProfile,
  getProofPicture,
  uploadDocument,
  uploadEmpDoc,
  uploadEmpDocs,
  uploadImage,
  uploadProofImage,
} from "../controllers/employee/employeeDocsController";

const EmployeeDocsRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage : storage, limits: { fileSize: 1024 * 1024 * 50 } });

EmployeeDocsRouter.post("/upload", upload.single("file"), uploadDocument);
EmployeeDocsRouter.post("/uploadImage", upload.single("file"), uploadImage);
EmployeeDocsRouter.get("/getProfile/:id", getEmployeeProfile);
EmployeeDocsRouter.get("/getProofPicture/:id", getProofPicture);
EmployeeDocsRouter.get("/getAll", allDocuments);
EmployeeDocsRouter.get("/uploadEmpDocs", upload.single("file"), uploadEmpDocs);

// for aadhar and docs
EmployeeDocsRouter.post("/uploadEmpDoc", upload.single("file"), uploadEmpDoc);

// adding proof picture when we assigning Qr code
EmployeeDocsRouter.post(
  "/uploadproofImage",
  upload.single("file"),
  uploadProofImage
);

// adding approve picture while approving attendance
EmployeeDocsRouter.post(
  "/uploadApproveImage",
  upload.single("file"),
  attendanceApproveImage
);

// delete
EmployeeDocsRouter.post("/delete", deleteDocs);

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

export default EmployeeDocsRouter;
