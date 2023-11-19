"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMachineImage = exports.uploadMachineProofImage = exports.getMachineByQrCode = exports.assignQrToMachine = exports.getAllMachine = exports.getMachine = exports.deleteMachine = exports.updateMachine = exports.addMachine = void 0;
const globalProcessModel_1 = __importDefault(require("../../database/models/globalProcessModel"));
const machineModel_1 = __importDefault(require("../../database/models/machineModel"));
// import { getIndianTime } from "../../middleware/dateTimeConverter";
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const QRCode = __importStar(require("qrcode"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const machineQrCodeLogModel_1 = __importDefault(require("../../database/models/machineQrCodeLogModel"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const adminModel_1 = __importDefault(require("../../database/models/adminModel"));
const path_1 = require("path");
const uuid_1 = require("uuid");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = require("dotenv");
const path_2 = __importDefault(require("path"));
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
(0, dotenv_1.config)({ path: path_2.default.join(__dirname, "../../../", "public/.env") });
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
exports.addMachine = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { machineName, code, process } = req.body;
    machineName = machineName.trim();
    code = code.trim();
    const arrayProcess = [];
    for (const a of process) {
        const getProcess = await globalProcessModel_1.default.findById(a);
        if (getProcess) {
            arrayProcess.push(a);
        }
        else {
            return resp.status(201).json({
                success: false,
                message: "process not found!",
            });
        }
    }
    const customer = await machineModel_1.default.create({
        machineName,
        code,
        process: arrayProcess,
    });
    return resp.status(201).json({
        success: true,
        message: "machine created successfully",
        customer: customer,
    });
});
exports.updateMachine = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const { machineName, code, process } = req.body;
    const machine = await machineModel_1.default.findById(id);
    const arrayProcess = [];
    for (const a of process) {
        const getProcess = await globalProcessModel_1.default.findById(a);
        if (getProcess) {
            arrayProcess.push(a);
        }
        else {
            return resp.status(201).json({
                success: false,
                message: "process not found!",
            });
        }
    }
    ;
    if (machine) {
        const machine = await machineModel_1.default.findByIdAndUpdate({ _id: id }, { machineName, code, process: arrayProcess });
        return resp.status(201).json({
            success: true,
            message: "machine updated successfully",
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "machine not found",
        });
    }
});
exports.deleteMachine = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const machine = await machineModel_1.default.findById(id);
    if (machine) {
        const machine = await machineModel_1.default.findByIdAndDelete(id);
        return resp.status(201).json({
            success: true,
            message: "machine delete successfully",
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "machine not found",
        });
    }
});
exports.getMachine = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const machine = await machineModel_1.default.findById(id).populate("process").exec();
    if (!machine) {
        return resp.status(404).json({
            success: false,
            message: `Machine not found with id ${id}.`
        });
    }
    ;
    const barCodeslogs = await machineQrCodeLogModel_1.default.find({ "machine.id": machine._id }).lean();
    if (barCodeslogs.length > 0) {
        machine.proofPicture = barCodeslogs[barCodeslogs.length - 1].proofPicture;
    }
    return resp.status(201).json({
        success: true,
        message: "getting machine successfully",
        machine: machine,
    });
});
exports.getAllMachine = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { name, processes, sort, shops } = req.body;
    const query = {};
    if (name) {
        const process = await globalProcessModel_1.default
            .find({
            $or: [
                { processName: { $regex: name, $options: "i" } },
                { processCode: { $regex: name, $options: "i" } },
            ],
        })
            .lean();
        const processIds = process.map((p) => p._id);
        query.$or = [
            { machineName: { $regex: name, $options: "i" } },
            { code: { $regex: name, $options: "i" } },
            { process: { $in: processIds } },
        ];
    }
    if (processes && processes.length > 0) {
        const Processes = await globalProcessModel_1.default.find({
            processName: { $in: processes },
        });
        const processIds = Processes.map((p) => p._id);
        query.process = { $in: processIds };
    }
    if (shops && shops.length) {
        const Shops = await shopModel_1.default.find({ shopName: { $in: shops } }).lean();
        const shopIds = Shops.map((s) => s._id);
        const allProcesses = await globalProcessModel_1.default.find({ "shop.shopId": { $in: shopIds } }).lean();
        if (!query.process) {
            query.process = { $in: [] };
        }
        allProcesses.forEach((a) => {
            query.process.$in.push(a._id);
        });
    }
    ;
    const allMachineBarCode = await machineQrCodeLogModel_1.default.find().lean();
    const machineQRCodeStore = {};
    allMachineBarCode.forEach((a) => {
        const id = a.machine.id + "";
        machineQRCodeStore[id] = { ...a };
    });
    let machine = await machineModel_1.default.find({ ...query }).populate("process").lean();
    if (sort) {
        if (sort === "asc") {
            machine = await machineModel_1.default
                .find({ ...query })
                .sort({ machineName: 1 })
                .populate("process")
                .exec();
        }
        else if (sort === "dec") {
            machine = await machineModel_1.default
                .find({ ...query })
                .populate("process")
                .sort({ machineName: -1 })
                .exec();
        }
        else {
            machine = await machineModel_1.default
                .find({ ...query })
                .populate("process")
                .sort({ machineName: 1 })
                .exec();
        }
    }
    else {
        machine = await machineModel_1.default
            .find({ ...query })
            .populate("process")
            .exec();
    }
    ;
    machine.forEach((m) => {
        const id = m._id + "";
        const barCode = machineQRCodeStore[id];
        if (barCode) {
            m.newProofPicture = barCode.proofPicture || "";
        }
        ;
    });
    return resp.status(200).json({
        success: true,
        message: "getting all Machine successfully",
        machine: machine,
    });
});
// add QrCode to machine
exports.assignQrToMachine = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    if (req.employee || req.admin) {
        let _id;
        if (req.employee) {
            const employee = await employeeModel_1.default.findOne({ _id: req.employee._id });
            if (!employee) {
                return resp.status(404).json({
                    success: false,
                    message: `Logged in employee with name ${req.employee.name} not found.`,
                });
            }
            _id = employee._id;
        }
        if (req.admin) {
            const admin = await adminModel_1.default.findOne({ _id: req.admin._id });
            if (!admin) {
                return resp.status(404).json({
                    success: false,
                    message: `Logged in Admin with name ${req.admin.name} not found .`,
                });
            }
            _id = admin._id;
        }
        const { id } = req.params;
        const { data } = req.body;
        const machine = await machineModel_1.default.findById(id);
        if (!machine) {
            return resp.status(404).json({
                success: false,
                message: `Machine with id ${id} not found.`,
            });
        }
        ;
        const date = new Date();
        const updatedDate = date;
        let qrCode;
        try {
            qrCode = await QRCode.toDataURL(data); // Using email as an example
        }
        catch (err) {
            return next(new errorHandler_1.default("QR Code generation failed.", 500));
        }
        ;
        const newData = {
            machineName: machine.machineName,
            id: machine._id,
        };
        let isAlreadyUsed = { is: false, value: "" };
        const allMachines = await machineModel_1.default.find();
        allMachines.forEach((m) => {
            if (m?.QrCode === qrCode) {
                isAlreadyUsed.is = true;
                isAlreadyUsed.value = m.machineName;
                return;
            }
            ;
        });
        if (isAlreadyUsed.is === true) {
            return resp.status(409).json({
                success: false,
                message: `Same qr Code already assigned to ${isAlreadyUsed.value}.`,
            });
        }
        machine.QrCode = qrCode;
        await machine.save();
        const machineLog = await machineQrCodeLogModel_1.default.create({
            machine: newData,
            date: updatedDate,
            AssignBy: _id,
            QrCode: data,
        });
        resp.status(201).json({
            success: true,
            message: `Qr code Assigned to machine ${machine.machineName}.`,
            machine,
        });
    }
    else {
        return resp.status(403).json({
            success: false,
            message: "Login first.",
        });
    }
});
// get machine details by qrCode
exports.getMachineByQrCode = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { data } = req.body;
    let qrCode;
    try {
        qrCode = await QRCode.toDataURL(data); // Using email as an example
    }
    catch (err) {
        return next(new errorHandler_1.default("QR Code generation failed.", 500));
    }
    ;
    const machine = await machineModel_1.default.findOne({ QrCode: qrCode });
    if (!machine) {
        return resp.status(404).json({
            success: false,
            message: `Machine not found with qrCode data of ${data}.`,
        });
    }
    ;
    resp.status(200).json({
        success: true,
        message: "Machine found .",
        machine,
    });
});
// export const uploadMachineProofImage = catchErrorAsync(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { machineId, data } = req.body;
//       // Check if a machine with the given ID exists
//       const machine = await machineModel.findById(machineId);
//       if (!machine) {
//         return res.status(404).json({
//           success: false,
//           message: `Machine with id ${machineId} not found.`,
//         });
//       }
//       const file = req.file;
//       const allowedExtensions = [".jpg", ".jpeg", ".png"];
//       if (!file) {
//         return res.status(400).json({
//           success: false,
//           message: "No file uploaded.",
//         });
//       }
//       const fileExt = extname(file.originalname).toLowerCase();
//       if (!allowedExtensions.includes(fileExt)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
//         });
//       }
//       const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
//       const uploadParams: S3.PutObjectRequest = {
//         Bucket: BUCKET,
//         Key: fileKey,
//         Body: file.buffer,
//         ACL: "public-read",
//       };
//       await s3.putObject(uploadParams).promise();
//       const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
//       // Check if a MachineQrCodeModel with the same QR code (data) already exists
//       let existing = await machineModel.findOne({ _id: machineId });
//       let existingBarCodeModel = await MachineQrCodeModel.findOne({ QrCode: data });
//       if (existing||existingBarCodeModel) {
//         existingBarCodeModel.proofPicture = fileUrl;
//         await existingBarCodeModel.save();
//         existing.proofPicture = fileUrl;
//         await existing.save();
//         return res.status(200).json({
//           success: true,
//           message: "Proof image updated successfully.",
//           machine,
//         });
//       }
//       const newBarCodeModel = await MachineQrCodeModel.create({
//         machine: {
//           machineName: machine.machineName,
//           id: machine._id,
//         },
//         QrCode: data,
//         proofPicture: fileUrl,
//         createdAt: new Date(),
//       });
//       // if (existingBarCodeModel) {
//       //   // If an existing MachineQrCodeModel is found, update its proofPicture
//       //   // Return a success response or any necessary information
//       //   return res.status(200).json({
//       //     success: true,
//       //     message: "Proof image updated successfully.",
//       //     barCodeModel: existingBarCodeModel,
//       //     machine,
//       //     newBarCodeModel
//       //   });
//       // }
//       // If no existing MachineQrCodeModel is found, create a new one
//       // Return a success response or any necessary information
//       res.status(200).json({
//         success: true,
//         message: "Proof image added successfully.",
//         barCodeModel: newBarCodeModel,
//       });
//     } catch (error) {
//       // Handle unexpected errors
//       console.error(error);
//       res.status(500).json({
//         success: false,
//         message: "An error occurred while processing your request.",
//       });
//     }
//   }
// );
exports.uploadMachineProofImage = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { machineId, data } = req.body;
        // Check if a machine with the given ID exists
        const machine = await machineModel_1.default.findById(machineId);
        if (!machine) {
            return res.status(404).json({
                success: false,
                message: `Machine with id ${machineId} not found.`,
            });
        }
        ;
        const file = req.file;
        const allowedExtensions = [".jpg", ".jpeg", ".png"];
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded.",
            });
        }
        ;
        const fileExt = (0, path_1.extname)(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
            });
        }
        ;
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
        const uploadParams = {
            Bucket: BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ACL: "public-read",
        };
        await s3.putObject(uploadParams).promise();
        const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
        // Check if a MachineQrCodeModel with the same QR code (data) already exists
        let existing = await machineModel_1.default.findOne({ _id: machineId });
        let existingBarCodeModel = await machineQrCodeLogModel_1.default.findOne({
            QrCode: data,
        });
        if (existing || existingBarCodeModel) {
            if (existingBarCodeModel) {
                // If an existing MachineQrCodeModel is found, update its proofPicture
                existingBarCodeModel.proofPicture = fileUrl;
                await existingBarCodeModel.save();
            }
            ;
            // Update the machine's proofPicture as well
            if (existing) {
                existing.proofPicture = fileUrl;
                await existing.save();
            }
            ;
        }
        ;
        // If no existing MachineQrCodeModel is found, create a new one
        const newBarCodeModel = await machineQrCodeLogModel_1.default.create({
            machine: {
                machineName: machine.machineName,
                id: machine._id,
            },
            QrCode: data,
            proofPicture: fileUrl,
            createdAt: new Date(),
        });
        // Return a success response or any necessary information
        res.status(200).json({
            success: true,
            message: "Proof image added successfully.",
            barCodeModel: newBarCodeModel,
            machine,
        });
    }
    catch (error) {
        // Handle unexpected errors
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
});
exports.uploadMachineImage = (0, catchAsyncError_1.default)(async (req, res, next) => {
    try {
        const { machineId } = req.body;
        // Check if a machine with the given ID exists
        const machine = await machineModel_1.default.findById(machineId);
        if (!machine) {
            return res.status(404).json({
                success: false,
                message: `Machine with id ${machineId} not found.`,
            });
        }
        ;
        const file = req.file;
        const allowedExtensions = [".jpg", ".jpeg", ".png"];
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded.",
            });
        }
        ;
        const fileExt = (0, path_1.extname)(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
            });
        }
        ;
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${file.originalname}`;
        const uploadParams = {
            Bucket: BUCKET,
            Key: fileKey,
            Body: file.buffer,
            ACL: "public-read",
        };
        await s3.putObject(uploadParams).promise();
        const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
        machine.picture = fileUrl;
        await machine.save();
        // Return a success response or any necessary information
        res.status(200).json({
            success: true,
            message: "Proof image added successfully.",
            machine,
        });
    }
    catch (error) {
        // Handle unexpected errors
        console.error(error);
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request.",
        });
    }
    ;
});
