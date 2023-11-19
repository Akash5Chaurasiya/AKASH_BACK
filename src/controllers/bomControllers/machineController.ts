import globalProcessModel from "../../database/models/globalProcessModel";
import machineModel from "../../database/models/machineModel";
// import { getIndianTime } from "../../middleware/dateTimeConverter";
import catchErrorAsync from "../../utils/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import * as QRCode from "qrcode";
import ErrorHandler from "../../middleware/errorHandler";
import MachineQrCodeModel from "../../database/models/machineQrCodeLogModel";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import EmployeeModel from "../../database/models/employeeModel";
import AdminModel from "../../database/models/adminModel";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import aws, { S3 } from "aws-sdk";
import { config } from "dotenv";
import path from "path";
import ShopModel from "../../database/models/shopModel";
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
interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

export const addMachine = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { machineName, code, process } = req.body;

    machineName = machineName.trim();
    code = code.trim();

    const arrayProcess: any = [];
    for (const a of process) {
      const getProcess = await globalProcessModel.findById(a);
      if (getProcess) {
        arrayProcess.push(a);
      } else {
        return resp.status(201).json({
          success: false,
          message: "process not found!",
        });
      }
    }
    const customer = await machineModel.create({
      machineName,
      code,
      process: arrayProcess,
    });
    return resp.status(201).json({
      success: true,
      message: "machine created successfully",
      customer: customer,
    });
  }
);

export const updateMachine = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const { machineName, code, process } = req.body;
    const machine = await machineModel.findById(id);
    const arrayProcess: any = [];
    for (const a of process) {
      const getProcess = await globalProcessModel.findById(a);
      if (getProcess) {
        arrayProcess.push(a);
      } else {
        return resp.status(201).json({
          success: false,
          message: "process not found!",
        });
      }
    };

    if (machine) {
      const machine = await machineModel.findByIdAndUpdate(
        { _id: id },
        { machineName, code, process: arrayProcess }
      );
      return resp.status(201).json({
        success: true,
        message: "machine updated successfully",
      });
    } else {
      return resp.status(400).json({
        success: false,
        message: "machine not found",
      });
    }
    
  }
);

export const deleteMachine = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const machine = await machineModel.findById(id);
    if (machine) {
      const machine = await machineModel.findByIdAndDelete(id);
      return resp.status(201).json({
        success: true,
        message: "machine delete successfully",
      });
    } else {
      return resp.status(400).json({
        success: false,
        message: "machine not found",
      });
    }
  }
);

export const getMachine = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const machine:any = await machineModel.findById(id).populate("process").exec();
    if(!machine){
      return resp.status(404).json({
        success:false,
        message:`Machine not found with id ${id}.`
      });
    };

    const barCodeslogs = await MachineQrCodeModel.find({"machine.id":machine._id}).lean();
    
    if(barCodeslogs.length>0){
    machine.proofPicture = barCodeslogs[barCodeslogs.length-1].proofPicture;
    }
    return resp.status(201).json({
      success: true,
      message: "getting machine successfully",
      machine: machine,
    });
  
  }
);

export const getAllMachine = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { name, processes, sort , shops } = req.body as {name:string ; processes : string[]; sort:string ;shops:string[]};

    const query: any = {};

    if (name) {
      const process = await globalProcessModel
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
      const Processes = await globalProcessModel.find({
        processName: {$in : processes},
      });
      const processIds = Processes.map((p)=>p._id);
      query.process = {$in : processIds};
    }

    if(shops && shops.length){
       const Shops = await ShopModel.find({shopName:{$in:shops}}).lean();
       const shopIds = Shops.map((s)=>s._id);
       const allProcesses = await globalProcessModel.find({"shop.shopId":{$in : shopIds}}).lean();
       if(!query.process){
        query.process = {$in : []}
       }
       allProcesses.forEach((a)=>{
          query.process.$in.push(a._id);
       });
    };
  
    const allMachineBarCode = await MachineQrCodeModel.find().lean();
    const machineQRCodeStore:any = {};

    allMachineBarCode.forEach((a)=>{
       const id = a.machine.id+"";
       machineQRCodeStore[id]={...a};
    })

    let machine:any = await machineModel.find({ ...query }).populate("process").lean();
    if (sort) {
      if (sort === "asc") {
        machine = await machineModel
          .find({ ...query })
          .sort({ machineName: 1 })
          .populate("process")
          .exec();
      } else if (sort === "dec") {
        machine = await machineModel
          .find({ ...query })
          .populate("process")
          .sort({ machineName: -1 })
          .exec();
      } else {
        machine = await machineModel
          .find({ ...query })
          .populate("process")
          .sort({ machineName: 1 })
          .exec();
      }
    } else {
      machine = await machineModel
        .find({ ...query })
        .populate("process")
        .exec();
    };
     
    machine.forEach((m:any)=>{
      const id = m._id+"";
      const barCode = machineQRCodeStore[id];

      if(barCode){
        m.newProofPicture = barCode.proofPicture || "";
      };
    });
    
      return resp.status(200).json({
        success: true,
        message: "getting all Machine successfully",
        machine: machine,
      });
});

// add QrCode to machine
export const assignQrToMachine = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee || req.admin) {
      let _id;
      if (req.employee) {
        const employee = await EmployeeModel.findOne({ _id: req.employee._id });
        if (!employee) {
          return resp.status(404).json({
            success: false,
            message: `Logged in employee with name ${req.employee.name} not found.`,
          });
        }
        _id = employee._id;
      }
      if (req.admin) {
        const admin = await AdminModel.findOne({ _id: req.admin._id });
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
      const machine = await machineModel.findById(id);
      if (!machine) {
        return resp.status(404).json({
          success: false,
          message: `Machine with id ${id} not found.`,
        });
      };

      const date = new Date();
      const updatedDate = date;
      let qrCode: any;
      try {
        qrCode = await QRCode.toDataURL(data); // Using email as an example
      } catch (err) {
        return next(new ErrorHandler("QR Code generation failed.", 500));
      };

      const newData = {
        machineName: machine.machineName,
        id: machine._id,
      };
      let isAlreadyUsed = { is: false, value: "" };
      const allMachines = await machineModel.find();

      allMachines.forEach((m) => {
        if (m?.QrCode === qrCode) {
          isAlreadyUsed.is = true;
          isAlreadyUsed.value = m.machineName;
          return;
        };
      });
      if (isAlreadyUsed.is === true) {
        return resp.status(409).json({
          success: false,
          message: `Same qr Code already assigned to ${isAlreadyUsed.value}.`,
        });
      }

      machine.QrCode = qrCode;
      await machine.save();

      const machineLog = await MachineQrCodeModel.create({
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
    } else {
      return resp.status(403).json({
        success: false,
        message: "Login first.",
      });
    }
  }
);

// get machine details by qrCode
export const getMachineByQrCode = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { data } = req.body;
    let qrCode;
    try {
      qrCode = await QRCode.toDataURL(data); // Using email as an example
    } catch (err) {
      return next(new ErrorHandler("QR Code generation failed.", 500));
    };

    const machine = await machineModel.findOne({ QrCode: qrCode });
    if (!machine) {
      return resp.status(404).json({
        success: false,
        message: `Machine not found with qrCode data of ${data}.`,
      });
    };

    resp.status(200).json({
      success: true,
      message: "Machine found .",
      machine,
    });
  }
);

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

export const uploadMachineProofImage = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { machineId, data } = req.body;

      // Check if a machine with the given ID exists
      const machine = await machineModel.findById(machineId);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: `Machine with id ${machineId} not found.`,
        });
      };

      const file = req.file;
      const allowedExtensions = [".jpg", ".jpeg", ".png"];

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded.",
        });
      };

      const fileExt = extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
        });
      };

      const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
      const uploadParams: S3.PutObjectRequest = {
        Bucket: BUCKET,
        Key: fileKey,
        Body: file.buffer,
        ACL: "public-read",
      };

      await s3.putObject(uploadParams).promise();
      const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;

      // Check if a MachineQrCodeModel with the same QR code (data) already exists
      let existing = await machineModel.findOne({ _id: machineId });
      let existingBarCodeModel = await MachineQrCodeModel.findOne({
        QrCode: data,
      });

      if (existing || existingBarCodeModel) {
        if (existingBarCodeModel) {
          // If an existing MachineQrCodeModel is found, update its proofPicture
          existingBarCodeModel.proofPicture = fileUrl;
          await existingBarCodeModel.save();
        };

        // Update the machine's proofPicture as well
        if (existing) {
          existing.proofPicture = fileUrl;
          await existing.save();
        };
      };

      // If no existing MachineQrCodeModel is found, create a new one
      const newBarCodeModel = await MachineQrCodeModel.create({
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
    } catch (error) {
      // Handle unexpected errors
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request.",
      });
    }
  }
);

export const uploadMachineImage = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { machineId } = req.body;

      // Check if a machine with the given ID exists
      const machine = await machineModel.findById(machineId);

      if (!machine) {
        return res.status(404).json({
          success: false,
          message: `Machine with id ${machineId} not found.`,
        });
      };

      const file = req.file;
      const allowedExtensions = [".jpg", ".jpeg", ".png"];

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded.",
        });
      };

      const fileExt = extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only JPG, JPEG, PNG images are allowed.",
        });
      };

      const fileKey = `uploads/${uuidv4()}-${file.originalname}`;
      const uploadParams: S3.PutObjectRequest = {
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
    } catch (error) {
      // Handle unexpected errors
      console.error(error);
      res.status(500).json({
        success: false,
        message: "An error occurred while processing your request.",
      });
    };
});
