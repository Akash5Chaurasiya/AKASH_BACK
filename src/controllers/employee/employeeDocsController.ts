import { NextFunction, Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import EmployeeDocsModel from "../../database/models/employeeDocsModel";
import groupModel from "../../database/models/groupModel";
import JobProfileModel from "../../database/models/jobProfileModel";
import aws, { S3 } from "aws-sdk";
import { config } from "dotenv";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import EmployeeModel from "../../database/models/employeeModel";
import { extname } from "path";
import BarCode from "../../database/models/barCodeModel";
import ErrorHandler from "../../middleware/errorHandler";
import attendanceModel from "../../database/models/attendanceModel";
config({ path: path.join(__dirname, "../../../", "public/.env") });
aws.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION,
});
const BUCKET = process.env.BUCKET;
if (!BUCKET) {
  console.error("No bucket specified in the environment configuration.");
  process.exit(1); // Exit the application or handle the error accordingly
}
const s3 = new aws.S3();
// s3
export const uploadDocument = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groupName, name, jobProfileName, fileName, status } = req.body;
    const file = req.file;
    const filter: any = {};
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".pdf",
      ".docs",
      ".xls",
      ".xlsm",
      ".xlsx",
      ".xlts",
      ".rtf",
    ];

    if (groupName) {
      // find group id from group model
      const group = await groupModel.findOne({
        groupName: groupName,
      });
      filter.groupId = group?._id;
    }
    if (jobProfileName) {
      // find allJobProfiles from jobProfile model
      const jobProfile = await JobProfileModel.findOne({
        jobProfileName: jobProfileName,
      });
      filter.jobProfileId = jobProfile?._id;
    }
    if (name) {
      filter.$or = [
        { name: { $regex: name, $options: "i" } }, // Search by name using case-insensitive regex
        { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
      ];
    }
    let employees = await EmployeeModel.find(filter);
    const employeeIds = employees.map((emp) => emp._id);

    // finding employee by group
    let fileUrl;
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    }
    const fileExt = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).send({
        success: false,
        message:
          "Invalid file type. Only JPG, JPEG, PNG , pdf ,docs,rtf images are allowed.",
      });
    }
    const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
    const uploadParams: S3.PutObjectRequest = {
      Bucket: BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ACL: "public-read",
    };
    // documentJpg.docs
    await s3.putObject(uploadParams).promise();
    fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;

    for (let i of employeeIds) {
      let data = await EmployeeDocsModel.findOne({ employeeId: i });
      if (!data) {
        data = await EmployeeDocsModel.create({ employeeId: i });
      }
      const document = {
        docsName: fileName,
        docs: fileUrl,
        status: status,
      };
      data.employeeId = i;
      data.document.push(document);
      await data.save();
    }
    res.status(200).json({
      success: true,
      message: "document  added successfully.",
    });
  }
);

export const uploadImage = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { employeeId } = req.body;
    const file = req.file;
    const allowedExtensions = [".jpg", ".jpeg", ".png"];

    // finding employee by group

    let fileUrl;

    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    }

    const fileExt = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).send({
        success: false,
        message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
      });
    }
    const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
    const uploadParams: S3.PutObjectRequest = {
      Bucket: BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ACL: "public-read",
    };
    // documentJpg.docs
    await s3.putObject(uploadParams).promise();
    fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;

    let docs = await EmployeeDocsModel.findOne({ employeeId: employeeId });

    if (!docs) {
      docs = await EmployeeDocsModel.create({ employeeId });
    }

    docs.profilePicture = fileUrl;

    await docs.save();
    res.status(200).json({
      success: true,
      message: "image added successfully.",
      data: docs,
    });
  }
);

export const uploadProofImage = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { employeeId, data } = req.body;
    const file = req.file;
    // finding employee by group
    const allowedExtensions = [".jpg", ".jpeg", ".png"];

    let fileUrl;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }
    const fileExt = extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
      });
    }
    const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
    const uploadParams: S3.PutObjectRequest = {
      Bucket: BUCKET,
      Key: fileKey,
      Body: file.buffer,
      ACL: "public-read",
    };
    // documentJpg.docs
    await s3.putObject(uploadParams).promise();
    fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;

    // let barCodeModel = await BarCode.findOne({ barCodeNumber: data });
    // // if (barCodeModel) {
    // //   return res.status(400).json({
    // //     success: false,
    // //     message: "Data already present for this bar code",
    // //   });
    // // }

    let barCodeModel = await BarCode.create({
      employeeId,
      barCodeNumber: data,
      proofPicture: fileUrl,
      createdAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Proof image added successfully.",
      barCodeModel,
    });
  }
);

// image saving while approving attendance
export const attendanceApproveImage = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    // finding employee by group
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    let { employeeId, punchInTime, date } = req.body;
    const employee1 = await EmployeeModel.findById(employeeId);
    if (!employee1) {
      return next(new ErrorHandler("Employee not found.", 404));
    }
    const punchIn = new Date(punchInTime);

    let nextDay;

    if (date) {
      date = new Date(date);
      date.setHours(0, 0, 0, 0);
      date.setHours(date.getHours() - (6 + 5));

      nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 2);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setHours(nextDay.getHours() - (6 + 5));
    }

    const attendanceRecord = await attendanceModel.findOne({
      employeeId,
      date: {
        $gte: date,
        $lt: nextDay,
      },
    });
    if (!attendanceRecord) {
      return next(new ErrorHandler("Attendance record not found.", 404));
    }
    const punchesWithApprovedImage = attendanceRecord.punches.filter(
      (punch: any) => punch.approvedImage
    );

    if (punchesWithApprovedImage.length > 0) {
      res.status(200).json({
        success: true,
        message: "Approved image already exists.",
      });
    } else {
      const attendanceDay = attendanceRecord.punches.find((attDay: any) => {
        return attDay.punchIn.getTime() === punchIn.getTime();
      });

      if (!attendanceDay) {
        return next(new ErrorHandler("No PunchIn found for this day.", 404));
      }

      let fileUrl;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded.",
        });
      }
      const fileExt = extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
        });
      }
      const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
      const uploadParams: S3.PutObjectRequest = {
        Bucket: BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ACL: "public-read",
      };
      // documentJpg.docs
      await s3.putObject(uploadParams).promise();
      fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;

      attendanceDay.approvedImage = fileUrl;
      await attendanceRecord.save();

      res.status(200).json({
        success: true,
        message: "Approved image added successfully.",
        attendanceRecord,
      });
    }
  }
);

export const getEmployeeProfile = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { id } = req.params;
    const employee = await EmployeeDocsModel.findOne({
      employeeId: id,
    });
    if (employee) {
      resp.status(201).json({
        success: true,
        message: "employee profile getting successfully",
        employee,
      });
    } else {
      resp.status(201).json({
        success: false,
        message: "employee invaild",
      });
    }
  }
);

export const getProofPicture = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { id } = req.params;
    const data = await BarCode.find({
      employeeId: id,
    })
      .populate("assignedBy")
      .exec();
    if (data) {
      resp.status(201).json({
        success: true,
        message: "employee profile getting successfully",
        data,
      });
    } else {
      resp.status(201).json({
        success: false,
        message: "employee invaild",
      });
    }
  }
);

export const allDocuments = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const doc = await EmployeeDocsModel.find({});
    resp.status(201).json({
      success: true,
      message: " all employee document successfully",
      doc,
    });
  }
);
export const uploadEmpDocs = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { employeeId } = req.body;
    const file = req.file;
    // finding employee by department
    let fileUrl;
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    } else if (file) {
      const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
      const uploadParams: S3.PutObjectRequest = {
        Bucket: BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ACL: "public-read",
      };
      // documentJpg.docs
      await s3.putObject(uploadParams).promise();
      fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
    }
    let docs = await EmployeeDocsModel.findOne({ employeeId: employeeId });

    if (!docs) {
      docs = await EmployeeDocsModel.create(docs);
    }
    docs.employeeId = employeeId;
    const obj = {
      docsName: "Document",
      docs: fileUrl,
    };
    docs.document.push(obj);
    await docs.save();
    res.status(200).json({
      success: true,
      message: "image added successfully.",
      data: docs,
    });
  }
);

export const deleteDocs = catchErrorAsync(
  async (req: Request, res: Response) => {
    const { employeeCode } = req.query;
    const filename = req.body.filename;
    if (employeeCode) {
      const employee = await EmployeeModel.findOne({
        employeeCode: employeeCode,
      });
      if (employee) {
        const employeeDocs = await EmployeeDocsModel.findOne({
          employeeId: employee.id,
        });

        if (!employeeDocs) {
          return res.status(404).send("employeeDocs does not exist.");
        }
        const matchedDocumentIndex = employeeDocs.document.findIndex(
          (doc) => doc.docs === filename
        );

        if (matchedDocumentIndex !== -1) {
          employeeDocs.document.splice(matchedDocumentIndex, 1);
          employeeDocs.save();
        }
        let stringAfterUploads: any;
        const parts = filename.split("/uploads/");
        if (parts.length > 1) {
          stringAfterUploads = parts[1];
        } else {
          res.status(500).send("Error deleting file.");
        }
        try {
          await s3
            .deleteObject({ Bucket: BUCKET, Key: stringAfterUploads })
            .promise();
          return res.status(200).json({
            success: true,
            message: "Document deleted successfully",
          });
        } catch (error: any) {
          return res.status(200).json({
            success: false,
            message: error.message,
          });
        }
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "Employee not found.",
      });
    }
  }
);
export const uploadEmpDoc = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { employeeId, fileName } = req.body;
    const file = req.file;
    // finding employee by department
    let fileUrl;
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    } else if (file) {
      const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
      const uploadParams: S3.PutObjectRequest = {
        Bucket: BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ACL: "public-read",
      };
      // documentJpg.docs
      await s3.putObject(uploadParams).promise();
      fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
    }
    let docs = await EmployeeDocsModel.findOne({ employeeId: employeeId });

    if (!docs) {
      docs = await EmployeeDocsModel.create(docs);
    }
    docs.employeeId = employeeId;
    const obj = {
      docsName: fileName,
      docs: fileUrl,
    };
    docs.document.push(obj);
    await docs.save();
    res.status(200).json({
      success: true,
      message: "image added successfully.",
      data: docs,
    });
  }
);

// export const a = catchErrorAsync(async (req: Request, res: Response) => {
//   const filename = req.params.filename;

//   try {
//     const a= await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise();
//     res.send("File Deleted Successfully");
//   } catch (error) {
//     res.status(500).send("Error deleting file.");
//   }
// });
