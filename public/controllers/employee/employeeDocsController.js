"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadEmpDoc = exports.deleteDocs = exports.uploadEmpDocs = exports.allDocuments = exports.getProofPicture = exports.getEmployeeProfile = exports.attendanceApproveImage = exports.uploadProofImage = exports.uploadImage = exports.uploadDocument = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const employeeDocsModel_1 = __importDefault(require("../../database/models/employeeDocsModel"));
const groupModel_1 = __importDefault(require("../../database/models/groupModel"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const path_2 = require("path");
const barCodeModel_1 = __importDefault(require("../../database/models/barCodeModel"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const attendanceModel_1 = __importDefault(require("../../database/models/attendanceModel"));
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, "../../../", "public/.env") });
aws_sdk_1.default.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION,
});
const BUCKET = process.env.BUCKET;
if (!BUCKET) {
    console.error("No bucket specified in the environment configuration.");
    process.exit(1); // Exit the application or handle the error accordingly
}
const s3 = new aws_sdk_1.default.S3();
// s3
exports.uploadDocument = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { groupName, name, jobProfileName, fileName, status } = req.body;
    const file = req.file;
    const filter = {};
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
        const group = await groupModel_1.default.findOne({
            groupName: groupName,
        });
        filter.groupId = group?._id;
    }
    if (jobProfileName) {
        // find allJobProfiles from jobProfile model
        const jobProfile = await jobProfileModel_1.default.findOne({
            jobProfileName: jobProfileName,
        });
        filter.jobProfileId = jobProfile?._id;
    }
    if (name) {
        filter.$or = [
            { name: { $regex: name, $options: "i" } },
            { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
        ];
    }
    let employees = await employeeModel_1.default.find(filter);
    const employeeIds = employees.map((emp) => emp._id);
    // finding employee by group
    let fileUrl;
    if (!file) {
        res.status(400).send("No file uploaded.");
        return;
    }
    const fileExt = (0, path_2.extname)(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).send({
            success: false,
            message: "Invalid file type. Only JPG, JPEG, PNG , pdf ,docs,rtf images are allowed.",
        });
    }
    const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
    const uploadParams = {
        Bucket: BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ACL: "public-read",
    };
    // documentJpg.docs
    await s3.putObject(uploadParams).promise();
    fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
    for (let i of employeeIds) {
        let data = await employeeDocsModel_1.default.findOne({ employeeId: i });
        if (!data) {
            data = await employeeDocsModel_1.default.create({ employeeId: i });
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
});
exports.uploadImage = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { employeeId } = req.body;
    const file = req.file;
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    // finding employee by group
    let fileUrl;
    if (!file) {
        res.status(400).send("No file uploaded.");
        return;
    }
    const fileExt = (0, path_2.extname)(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).send({
            success: false,
            message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
        });
    }
    const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
    const uploadParams = {
        Bucket: BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ACL: "public-read",
    };
    // documentJpg.docs
    await s3.putObject(uploadParams).promise();
    fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
    let docs = await employeeDocsModel_1.default.findOne({ employeeId: employeeId });
    if (!docs) {
        docs = await employeeDocsModel_1.default.create({ employeeId });
    }
    docs.profilePicture = fileUrl;
    await docs.save();
    res.status(200).json({
        success: true,
        message: "image added successfully.",
        data: docs,
    });
});
exports.uploadProofImage = (0, catchAsyncError_1.default)(async (req, res, next) => {
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
    const fileExt = (0, path_2.extname)(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({
            success: false,
            message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
        });
    }
    const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
    const uploadParams = {
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
    let barCodeModel = await barCodeModel_1.default.create({
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
});
// image saving while approving attendance
exports.attendanceApproveImage = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const file = req.file;
    // finding employee by group
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    let { employeeId, punchInTime, date } = req.body;
    const employee1 = await employeeModel_1.default.findById(employeeId);
    if (!employee1) {
        return next(new errorHandler_1.default("Employee not found.", 404));
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
    const attendanceRecord = await attendanceModel_1.default.findOne({
        employeeId,
        date: {
            $gte: date,
            $lt: nextDay,
        },
    });
    if (!attendanceRecord) {
        return next(new errorHandler_1.default("Attendance record not found.", 404));
    }
    const punchesWithApprovedImage = attendanceRecord.punches.filter((punch) => punch.approvedImage);
    if (punchesWithApprovedImage.length > 0) {
        res.status(200).json({
            success: true,
            message: "Approved image already exists.",
        });
    }
    else {
        const attendanceDay = attendanceRecord.punches.find((attDay) => {
            return attDay.punchIn.getTime() === punchIn.getTime();
        });
        if (!attendanceDay) {
            return next(new errorHandler_1.default("No PunchIn found for this day.", 404));
        }
        let fileUrl;
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded.",
            });
        }
        const fileExt = (0, path_2.extname)(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
            });
        }
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
        const uploadParams = {
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
});
exports.getEmployeeProfile = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const employee = await employeeDocsModel_1.default.findOne({
        employeeId: id,
    });
    if (employee) {
        resp.status(201).json({
            success: true,
            message: "employee profile getting successfully",
            employee,
        });
    }
    else {
        resp.status(201).json({
            success: false,
            message: "employee invaild",
        });
    }
});
exports.getProofPicture = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const data = await barCodeModel_1.default.find({
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
    }
    else {
        resp.status(201).json({
            success: false,
            message: "employee invaild",
        });
    }
});
exports.allDocuments = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const doc = await employeeDocsModel_1.default.find({});
    resp.status(201).json({
        success: true,
        message: " all employee document successfully",
        doc,
    });
});
exports.uploadEmpDocs = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { employeeId } = req.body;
    const file = req.file;
    // finding employee by department
    let fileUrl;
    if (!file) {
        res.status(400).send("No file uploaded.");
        return;
    }
    else if (file) {
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
        const uploadParams = {
            Bucket: BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ACL: "public-read",
        };
        // documentJpg.docs
        await s3.putObject(uploadParams).promise();
        fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
    }
    let docs = await employeeDocsModel_1.default.findOne({ employeeId: employeeId });
    if (!docs) {
        docs = await employeeDocsModel_1.default.create(docs);
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
});
exports.deleteDocs = (0, catchAsyncError_1.default)(async (req, res) => {
    const { employeeCode } = req.query;
    const filename = req.body.filename;
    if (employeeCode) {
        const employee = await employeeModel_1.default.findOne({
            employeeCode: employeeCode,
        });
        if (employee) {
            const employeeDocs = await employeeDocsModel_1.default.findOne({
                employeeId: employee.id,
            });
            if (!employeeDocs) {
                return res.status(404).send("employeeDocs does not exist.");
            }
            const matchedDocumentIndex = employeeDocs.document.findIndex((doc) => doc.docs === filename);
            if (matchedDocumentIndex !== -1) {
                employeeDocs.document.splice(matchedDocumentIndex, 1);
                employeeDocs.save();
            }
            let stringAfterUploads;
            const parts = filename.split("/uploads/");
            if (parts.length > 1) {
                stringAfterUploads = parts[1];
            }
            else {
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
            }
            catch (error) {
                return res.status(200).json({
                    success: false,
                    message: error.message,
                });
            }
        }
    }
    else {
        return res.status(404).json({
            success: false,
            message: "Employee not found.",
        });
    }
});
exports.uploadEmpDoc = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { employeeId, fileName } = req.body;
    const file = req.file;
    // finding employee by department
    let fileUrl;
    if (!file) {
        res.status(400).send("No file uploaded.");
        return;
    }
    else if (file) {
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
        const uploadParams = {
            Bucket: BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ACL: "public-read",
        };
        // documentJpg.docs
        await s3.putObject(uploadParams).promise();
        fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
    }
    let docs = await employeeDocsModel_1.default.findOne({ employeeId: employeeId });
    if (!docs) {
        docs = await employeeDocsModel_1.default.create(docs);
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
});
// export const a = catchErrorAsync(async (req: Request, res: Response) => {
//   const filename = req.params.filename;
//   try {
//     const a= await s3.deleteObject({ Bucket: BUCKET, Key: filename }).promise();
//     res.send("File Deleted Successfully");
//   } catch (error) {
//     res.status(500).send("Error deleting file.");
//   }
// });
