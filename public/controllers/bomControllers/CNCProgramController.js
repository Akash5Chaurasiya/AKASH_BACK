"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteChildPartFromProgram = exports.CNCProgramLogsDelete = exports.deleteCNCProgram = exports.CNCProgramLogs = exports.getWorkOrderByChildPart = exports.addProgramProductionSlip = exports.updateProduction = exports.updateCNCProgram = exports.finalizeProgram = exports.singleProgram = exports.allProgram = exports.addChildPartInCNCProgram = exports.addCNCProgram = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const path_1 = require("path");
const uuid_1 = require("uuid");
const dotenv_1 = require("dotenv");
const path_2 = __importDefault(require("path"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const CNCProgramModel_1 = __importDefault(require("../../database/models/CNCProgramModel"));
const childPartModel_1 = __importDefault(require("../../database/models/childPartModel"));
const finishedItemModel_1 = __importDefault(require("../../database/models/finishedItemModel"));
const globalProcessModel_1 = __importDefault(require("../../database/models/globalProcessModel"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const machineModel_1 = __importDefault(require("../../database/models/machineModel"));
const workOrderModel_1 = __importDefault(require("../../database/models/workOrderModel"));
const CNCProgramLogModel_1 = __importDefault(require("../../database/models/CNCProgramLogModel"));
const productionSlipController_1 = require("./productionSlipController");
const productionSlipModel_1 = __importDefault(require("../../database/models/productionSlipModel"));
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
const customerModel_1 = __importDefault(require("../../database/models/customerModel"));
(0, dotenv_1.config)({ path: path_2.default.join(__dirname, "../../../", "public/.env") });
aws_sdk_1.default.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION,
});
const BUCKET = process.env.BUCKET;
if (!BUCKET) {
    console.error("No bucket specified in the environment configuration.");
    process.exit(1);
}
const s3 = new aws_sdk_1.default.S3();
exports.addCNCProgram = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { programName, rawMaterialName, weight, DXFDescription, drawingDescription, nestingDescription, status, process, cycleTime, scrapGeneration } = req.body;
    const rawMaterial = await childPartModel_1.default.findOne({
        partName: rawMaterialName,
    });
    if (!rawMaterial) {
        return resp.status(404).json({
            success: false,
            message: `Raw material not found with Name ${rawMaterialName}`,
        });
    }
    const processDetail = await globalProcessModel_1.default.findOne({
        processName: process,
    });
    if (!processDetail) {
        return resp.status(404).json({
            success: false,
            message: `Process with name ${process} not found.`,
        });
    }
    const programs = await CNCProgramModel_1.default.find({
        processId: processDetail._id,
    });
    const programNumber = programs.length;
    const files = req.files;
    const allowedExtensions = [".pdf"];
    let dfxFileUrl = "";
    let drawingUrl = "";
    let nestingUrl = "";
    if (files['DFX']) {
        const dfxFile = files['DFX'][0];
        const fileExt = (0, path_1.extname)(dfxFile.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            return resp.status(400).send({
                success: false,
                message: "Invalid file type. Only PDF files are allowed.",
            });
        }
        ;
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${dfxFile.originalname}`;
        const uploadParams = {
            Bucket: BUCKET,
            Key: fileKey,
            Body: dfxFile.buffer,
            ACL: "public-read",
        };
        await s3.putObject(uploadParams).promise();
        const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
        dfxFileUrl = fileUrl;
    }
    if (files['drawing']) {
        const drawingFile = files['drawing'][0];
        const fileExt = (0, path_1.extname)(drawingFile.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            return resp.status(400).send({
                success: false,
                message: "Invalid file type. Only PDF files are allowed.",
            });
        }
        ;
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${drawingFile.originalname}`;
        const uploadParams = {
            Bucket: BUCKET,
            Key: fileKey,
            Body: drawingFile.buffer,
            ACL: "public-read",
        };
        await s3.putObject(uploadParams).promise();
        const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
        drawingUrl = fileUrl;
    }
    if (files['nesting']) {
        const nestingFile = files['nesting'][0];
        const fileExt = (0, path_1.extname)(nestingFile.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            return resp.status(400).send({
                success: false,
                message: "Invalid file type. Only PDF files are allowed.",
            });
        }
        ;
        const fileKey = `uploads/${(0, uuid_1.v4)()}-${nestingFile.originalname}`;
        const uploadParams = {
            Bucket: BUCKET,
            Key: fileKey,
            Body: nestingFile.buffer,
            ACL: "public-read",
        };
        await s3.putObject(uploadParams).promise();
        const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
        nestingUrl = fileUrl;
    }
    ;
    const newProgram = await CNCProgramModel_1.default.create({
        programName: programName,
        programNumber: processDetail.processCode + "/" + (programNumber + 1),
        rawMaterialName: rawMaterial.partName,
        rawMaterialCode: rawMaterial.materialCode,
        rawMaterialId: rawMaterial._id,
        processId: processDetail._id,
        processName: processDetail.processName,
        DXF: {
            file: dfxFileUrl,
            description: DXFDescription,
        },
        drawing: {
            file: drawingUrl,
            description: drawingDescription,
        },
        nesting: {
            file: nestingUrl,
            description: nestingDescription,
        },
        weight: weight,
        status: status,
    });
    newProgram.cycleTime = cycleTime;
    newProgram.scrap.quantity = scrapGeneration;
    newProgram.scrap.unit = "kg";
    // Save the new program to your database
    await newProgram.save();
    resp.status(200).json({
        success: true,
        message: "CNC program added successfully.",
        newProgram,
    });
});
// add childPart in CNC Program
exports.addChildPartInCNCProgram = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { 
    // programId,
    childPartName, childPartProduced, 
    // weightPerChildPart,
    weightUnit, } = req.body;
    const { programId } = req.params;
    // const finishedItem = await FinishedItemModel.findOne({MCode:finishItemCode});
    // if(!finishedItem){
    //   return resp.status(404).json({
    //     success:false,
    //     message:`Finished Item with MCode ${finishItemCode} not found.`
    //   })
    // };
    const childPart = await childPartModel_1.default.findOne({ partName: childPartName });
    if (!childPart) {
        return resp.status(404).json({
            success: false,
            message: `Child part with name ${childPartName} not found.`,
        });
    }
    // let check = false;
    // finishedItem.masterBom?.forEach((m)=>{
    //   const childPart1 = m.childPart?.childPartName;
    //   if(childPart1 === childPart.partName){
    //     check = true;
    //   };
    // });
    // if(check === false){
    //   return resp.status(404).json({
    //     success:false,
    //     message:`ChildPart with name ${childPartName} not present in finished Item with name ${finishedItem.itemName}`
    //   });
    // };
    const program = await CNCProgramModel_1.default.findById(programId);
    if (!program) {
        return resp.status(400).json({
            success: false,
            message: `Program not found with ID ${programId}`,
        });
    }
    let programCheck = false;
    program.childParts.forEach((p) => {
        const ChildPartName = p.childPart.childPartName;
        if (ChildPartName === childPartName) {
            programCheck = true;
        }
    });
    if (programCheck) {
        return resp.status(400).json({
            success: false,
            message: `Child part ${childPartName} already present in the program.`,
        });
    }
    let weight = 0;
    childPart.consumedItem.forEach((c) => {
        weight += c.consumedItemQuantity;
    });
    program.childParts.push({
        // finishItemCode:finishedItem.MCode,
        childPart: {
            childPartName: childPart.partName,
            id: childPart._id,
        },
        childPartProduced: childPartProduced,
        weightPerChildPart: weight,
        weightUnit: weightUnit || "kg",
    });
    await program.save();
    resp.json({
        success: true,
        message: "ChildPart added successfully.",
        program,
    });
});
// get all Program
exports.allProgram = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { name, processes, rawMaterialCodes, shops, sort, customers } = req.body;
    const query = {};
    if (name) {
        query.$or = [
            { programName: { $regex: name, $options: "i" } },
            { programNumber: { $regex: name, $options: "i" } },
            { rawMaterialName: { $regex: name, $options: "i" } },
            { rawMaterialCode: { $regex: name, $options: "i" } },
            { processName: { $regex: name, $options: "i" } }
        ];
    }
    ;
    if (processes && processes.length > 0) {
        const processesDetails = await globalProcessModel_1.default.find({ processName: { $in: processes } });
        //  const ids = processesDetails.map((p)=>p._id);
        if (!query.processId) {
            query.processId = { $in: [] };
        }
        processesDetails.forEach((p) => {
            query.processId.$in.push(p._id);
        });
    }
    ;
    if (rawMaterialCodes && rawMaterialCodes.length > 0) {
        const rawMaterials = await childPartModel_1.default.find({ materialCode: { $in: rawMaterialCodes } });
        const ids = rawMaterials.map((r) => r._id);
        query.rawMaterialId = { $in: ids };
    }
    ;
    if (shops && shops.length > 0) {
        const Shops = await shopModel_1.default.find({ shopName: { $in: shops } });
        const shopIds = Shops.map((s) => s._id);
        const processesDetails = await globalProcessModel_1.default.find({ "shop.shopId": { $in: shopIds } });
        if (!query.processId) {
            query.processId = { $in: [] };
        }
        ;
        processesDetails.forEach((p) => {
            query.processId.$in.push(p._id);
        });
    }
    ;
    if (customers && customers.length) {
        const customerDetails = await customerModel_1.default.find({ customerName: { $in: customers } }).lean();
        const customersId = customerDetails.map((c) => c._id);
        const finishedItems = await finishedItemModel_1.default.find({ customer: { $in: customersId } }).lean();
        const finishedItemIds = finishedItems.map((f) => f._id);
        const childParts = await childPartModel_1.default.find({ finishedItemId: { $in: finishedItemIds } }).lean();
        if (childParts) {
            const childPartids = childParts.map((c) => c._id);
            query["childParts.childPart.id"] = { $in: childPartids };
        }
    }
    let allProgram;
    if (sort === "asc") {
        allProgram = await CNCProgramModel_1.default.find({ ...query }).sort({ programName: 1 }).lean();
    }
    else if (sort === "dec") {
        allProgram = await CNCProgramModel_1.default.find({ ...query }).sort({ programName: -1 }).lean();
    }
    else {
        allProgram = await CNCProgramModel_1.default.find({ ...query }).lean();
    }
    resp.status(200).json({
        success: true,
        message: `Getting all the Programs.`,
        allProgram,
    });
});
// get Single Program
exports.singleProgram = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const program = await CNCProgramModel_1.default.findById(id);
    if (!program) {
        return resp.json({
            success: false,
            message: `Program not found with ID ${id}`,
        });
    }
    ;
    resp.status(200).json({
        success: true,
        message: "Getting the program successfully.",
        program,
    });
});
// finalize Apis
exports.finalizeProgram = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { cycleTime, scrapGeneration } = req.body;
    const file = req.file;
    const { programId } = req.params;
    const program = await CNCProgramModel_1.default.findById(programId);
    if (!program)
        return next(new errorHandler_1.default(`Program not found with id ${programId}.`, 404));
    if (!file)
        return next(new errorHandler_1.default("File is not uploaded.", 400));
    if (!cycleTime)
        return next(new errorHandler_1.default(`Cycle time not found.`, 400));
    if (!scrapGeneration)
        return next(new errorHandler_1.default(`Scrap quantity is required.`, 400));
    const allowedExtensions = [".pdf"];
    let uploadedFile = "";
    if (file) {
        const fileExt = (0, path_1.extname)(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(fileExt)) {
            return resp.status(400).send({
                success: false,
                message: "Invalid file type. Only PDF files are allowed.",
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
        uploadedFile = fileUrl;
    }
    program.nesting.file = uploadedFile;
    program.cycleTime = cycleTime;
    program.scrap.quantity = scrapGeneration;
    program.scrap.unit = "kg";
    program.isCompleted = true;
    await program.save();
    resp.status(200).json({
        success: true,
        message: "updating Program successfully.",
        program,
    });
});
// update CNC Program
const updateCNCProgram = async (req, resp, next) => {
    try {
        const { programId } = req.params;
        const { weight, scrap, rawMaterial, programName, process, status, cycleTime, DXFDescription, drawingDescription, isCompleted, nestingDescription } = req.body;
        const files = req.files;
        const allowedExtensions = [".pdf"];
        let dfxFileUrl = "";
        let drawingUrl = "";
        let nestingUrl = "";
        // let dfxCheck = false;
        // let drawingCheck = false;
        // let nestingCheck = false;
        if (files) {
            if (files['DFX']) {
                // dfxCheck = true;
                const dfxFile = files['DFX'][0];
                const fileExt = (0, path_1.extname)(dfxFile.originalname).toLowerCase();
                if (!allowedExtensions.includes(fileExt)) {
                    return resp.status(400).send({
                        success: false,
                        message: "Invalid file type. Only PDF files are allowed.",
                    });
                }
                ;
                const fileKey = `uploads/${(0, uuid_1.v4)()}-${dfxFile.originalname}`;
                const uploadParams = {
                    Bucket: BUCKET,
                    Key: fileKey,
                    Body: dfxFile.buffer,
                    ACL: "public-read",
                };
                await s3.putObject(uploadParams).promise();
                const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
                dfxFileUrl = fileUrl;
            }
            if (files['drawing']) {
                // drawingCheck = true;
                const drawingFile = files['drawing'][0];
                const fileExt = (0, path_1.extname)(drawingFile.originalname).toLowerCase();
                if (!allowedExtensions.includes(fileExt)) {
                    return resp.status(400).send({
                        success: false,
                        message: "Invalid file type. Only PDF files are allowed.",
                    });
                }
                ;
                const fileKey = `uploads/${(0, uuid_1.v4)()}-${drawingFile.originalname}`;
                const uploadParams = {
                    Bucket: BUCKET,
                    Key: fileKey,
                    Body: drawingFile.buffer,
                    ACL: "public-read",
                };
                await s3.putObject(uploadParams).promise();
                const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
                drawingUrl = fileUrl;
            }
            if (files['nesting']) {
                // nestingCheck = true;
                const nestingFile = files['nesting'][0];
                const fileExt = (0, path_1.extname)(nestingFile.originalname).toLowerCase();
                if (!allowedExtensions.includes(fileExt)) {
                    return resp.status(400).send({
                        success: false,
                        message: "Invalid file type. Only PDF files are allowed.",
                    });
                }
                ;
                const fileKey = `uploads/${(0, uuid_1.v4)()}-${nestingFile.originalname}`;
                const uploadParams = {
                    Bucket: BUCKET,
                    Key: fileKey,
                    Body: nestingFile.buffer,
                    ACL: "public-read",
                };
                await s3.putObject(uploadParams).promise();
                const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${fileKey}`;
                nestingUrl = fileUrl;
            }
            ;
        }
        ;
        const program = await CNCProgramModel_1.default.findById(programId);
        if (!program) {
            return resp.status(404).json({
                success: false,
                message: `Program not found with Id ${programId}.`
            });
        }
        ;
        if (weight) {
            program.weight = weight;
        }
        ;
        if (scrap) {
            program.scrap.quantity = scrap;
            program.scrap.unit = "kg";
        }
        ;
        if (cycleTime) {
            program.cycleTime = cycleTime;
        }
        ;
        if (drawingUrl) {
            program.drawing.file = drawingUrl;
        }
        ;
        if (dfxFileUrl) {
            program.DXF.file = dfxFileUrl;
        }
        ;
        if (nestingUrl) {
            program.nesting.file = nestingUrl;
        }
        ;
        if (DXFDescription) {
            program.DXF.description = DXFDescription;
        }
        ;
        if (drawingDescription) {
            program.drawing.description = drawingDescription;
        }
        ;
        if (nestingDescription) {
            program.nesting.description = nestingDescription;
        }
        ;
        if (isCompleted) {
            program.isCompleted = isCompleted;
        }
        ;
        // if(dfxCheck=== false){
        //   program.DXF.file = ""
        // };
        // if(drawingCheck === false){
        //   program.drawing.file = ""
        // };
        // if(nestingCheck === false){
        //   program.nesting.file = ""
        // };
        if (rawMaterial) {
            const rawMaterialDetails = await childPartModel_1.default.findOne({ partName: rawMaterial });
            if (!rawMaterialDetails) {
                return resp.status(404).json({
                    success: false,
                    message: "Raw Material not found."
                });
            }
            ;
            program.rawMaterialName = rawMaterialDetails.partName;
            program.rawMaterialCode = rawMaterialDetails.materialCode;
        }
        ;
        if (process) {
            const processDetail = await globalProcessModel_1.default.findOne({ processName: process });
            if (!processDetail) {
                return resp.status(404).json({
                    success: false,
                    message: "Process not found."
                });
            }
            ;
            program.processName = processDetail.processName;
            program.processId = processDetail._id;
        }
        ;
        if (programName) {
            program.programName = programName;
        }
        ;
        if (status) {
            program.status = status;
        }
        ;
        await program.save();
        resp.status(200).json({
            success: true,
            message: `Updated ${program.programName}.`,
            program
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.updateCNCProgram = updateCNCProgram;
// update ChildPart production in CNC Program
exports.updateProduction = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { programId } = req.params;
    const { part, objectId } = req.body;
    const program = await CNCProgramModel_1.default.findById(programId);
    if (!program)
        return next(new errorHandler_1.default("Program not found.", 404));
    for (let c of program.childParts) {
        const id = c._id + "";
        if (id + "" === objectId + "") {
            const childPart = await childPartModel_1.default.findOne({ partName: part.childPartName });
            if (!childPart) {
                return resp.status(404).json({
                    success: false,
                    message: `Child Part not found with name ${part.childPartName}.`
                });
            }
            let weight = 0;
            childPart?.consumedItem.forEach((c) => {
                weight += c.consumedItemQuantity;
            });
            c.childPart = {
                childPartName: childPart.partName,
                id: childPart._id,
            };
            c.childPartProduced = part.childPartProduced;
            c.weightPerChildPart = weight;
            c.weightUnit = "kg";
            break;
        }
    }
    await program.save();
    resp.status(200).json({
        success: true,
        message: "Updated successfully.",
        program,
    });
});
function convertTimeTo24HourFormat(timeString) {
    // Split the time string into components
    const [time, amOrPm] = timeString.split(" ");
    // Split the time into hours and minutes
    let [hours, minutes] = time.split(":").map(Number);
    // Convert to 24-hour format
    if (amOrPm.toLowerCase() === "pm" && hours !== 12) {
        hours += 12;
    }
    else if (amOrPm.toLowerCase() === "am" && hours === 12) {
        hours = 0;
    }
    const obj = {
        hour: hours,
        min: minutes,
    };
    // Return the time in 24-hour format
    return obj;
}
;
// Add production Slip log
const addProgramProductionSlip = async (req, resp, next) => {
    try {
        const { programId } = req.params;
        const { childArray, employees, machines, sheetQuantity, startTime, endTime, } = req.body;
        if (req.employee || req.admin) {
            let name = "";
            let employeeId;
            if (req.employee) {
                name = req.employee.name;
                employeeId = req.employee._id;
            }
            ;
            if (req.admin) {
                name = req.admin.name;
                employeeId = req.admin._id;
            }
            ;
            const convertedStartTime = convertTimeTo24HourFormat(startTime);
            const convertedEndTime = convertTimeTo24HourFormat(endTime);
            const newStartTime = new Date();
            newStartTime.setHours(convertedStartTime.hour, convertedStartTime.min, 0, 0);
            const newEndTime = new Date();
            newEndTime.setHours(convertedEndTime.hour, convertedEndTime.min, 0, 0);
            const program = await CNCProgramModel_1.default.findById(programId);
            if (!program || program.isCompleted === false)
                return next(new errorHandler_1.default("Program not found or incomplete.", 404));
            const employeeDetails = await employeeModel_1.default.find({
                _id: { $in: employees },
            }).lean();
            const employeesArray = [];
            employeeDetails.forEach((e) => {
                employeesArray.push({
                    employeeId: e._id,
                    employeeName: e.name,
                });
            });
            const machineDetails = await machineModel_1.default
                .find({ _id: { $in: machines } })
                .lean();
            const machineArray = [];
            machineDetails.forEach((m) => {
                machineArray.push({
                    machineCode: m.code,
                    machineId: m._id,
                    machineName: m.machineName,
                });
            });
            const workOrders = await workOrderModel_1.default.find({}).lean();
            const workOrderStore = {};
            workOrders.forEach((w) => {
                const orderNumber = w.orderNumber + "";
                workOrderStore[orderNumber] = {
                    ...w,
                };
            });
            const childPartStore = {};
            childArray.forEach((c) => {
                const id = c.childPartId + "";
                const orderNumber = c.workOrderNumber + "";
                if (!workOrderStore[orderNumber]) {
                    return resp.status(404).json({
                        success: false,
                        message: `Work order not found with number ${orderNumber}.`
                    });
                }
                let check = false;
                workOrderStore[orderNumber].masterBom.forEach((m) => {
                    // console.log(m._id+"",c.childPartId);
                    if (m._id + "" === c.childPartId + "") {
                        check = true;
                    }
                });
                if (check === false) {
                    return resp.status(404).json({
                        success: false,
                        message: `ChildPart ${c.childPartId} not present in workOrder ${orderNumber}`
                    });
                }
                childPartStore[id] = {
                    workOrderId: workOrderStore[orderNumber]._id,
                };
            });
            let totalWeight = 0;
            program.childParts.forEach((c) => {
                totalWeight += c.weightPerChildPart * c.childPartProduced;
            });
            let count = await CNCProgramLogModel_1.default.find({ "machine.machineName": machineArray[0].machineName });
            let number = count.length + 1;
            const programLog = await CNCProgramLogModel_1.default.create({
                logNumber: program.programNumber + "-" + machineArray[0].machineCode + "-" + number,
                CNCProgramId: programId,
                rawMaterialName: program.rawMaterialName,
                rawMaterialCode: program.rawMaterialCode,
                processName: program.processName,
                processId: program.processId,
                weight: program.weight,
                nesting: {
                    file: program.nesting.file,
                    description: program.nesting.description
                },
                DXF: {
                    file: program.DXF.file,
                    description: program.DXF.description
                },
                drawing: {
                    file: program.drawing.file,
                    description: program.drawing.description
                },
                startTime: newStartTime,
                endTime: newEndTime,
                sheetConsumed: sheetQuantity,
                employees: employeesArray,
                machines: machineArray,
                productionSlipNumber: [],
            });
            let employeeIds = [];
            employeeIds = employeesArray.map((e) => e.employeeId);
            let machineIds = [];
            machineIds = machineArray.map((m) => m.machineId);
            const cycleTime = (newEndTime.getTime() - newStartTime.getTime()) / sheetQuantity;
            const productionSlipNumbers = [];
            let currentStartTime = new Date(newStartTime);
            // Assuming program.childParts is an array
            for (const c of program.childParts) {
                const numberofItem = c.childPartProduced * sheetQuantity;
                const workOrderId = childPartStore[c.childPart.id + ""]?.workOrderId;
                const fraction = (c.weightPerChildPart * c.childPartProduced) / totalWeight;
                const intervalDuration = fraction * (newEndTime.getTime() - newStartTime.getTime());
                const EndTime = new Date(currentStartTime.getTime() + intervalDuration);
                try {
                    const productionSlip = await (0, productionSlipController_1.addCompletedSlip)({
                        workOrderId: workOrderId,
                        childPartId: c.childPart.id + "",
                        employeeIds: employeeIds,
                        machineIds: machineIds,
                        itemProduced: numberofItem,
                        startTime: currentStartTime + "",
                        endTime: EndTime + "",
                        name,
                        status: "cnc",
                        employeeId
                    });
                    currentStartTime = new Date(EndTime);
                    if (productionSlip?.productionSlip) {
                        const prdNumber = productionSlip?.productionSlip.productionSlipNumber;
                        productionSlipNumbers.push(prdNumber);
                    }
                    ;
                }
                catch (error) {
                    console.error(error);
                }
            }
            programLog.productionSlipNumber = productionSlipNumbers;
            programLog.currentCycleTime = cycleTime / (1000 * 60 * 60);
            programLog.cycleTimeAsProgram = program.cycleTime;
            if (req.employee) {
                programLog.by.name = req.employee.name;
                programLog.by.id = req.employee._id;
            }
            if (req.admin) {
                programLog.by.name = req.admin.name;
                programLog.by.id = req.admin._id;
            }
            await programLog.save();
            resp.status(201).json({
                success: true,
                message: "Program log active.",
                programLog,
            });
        }
        else {
            return resp.status(403).json({
                success: false,
                message: "Login first.",
            });
        }
    }
    catch (error) {
        console.log(error);
    }
};
exports.addProgramProductionSlip = addProgramProductionSlip;
// get workOrder by childPart
exports.getWorkOrderByChildPart = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { childPartId } = req.params;
    let MCode;
    const allFinishedItem = await finishedItemModel_1.default.find().lean();
    allFinishedItem.forEach((a) => {
        let check = false;
        a.masterBom?.forEach((m) => {
            if (m.childPart?.id + "" === childPartId + "") {
                MCode = a.MCode;
                check = true;
                return;
            }
        });
        if (check)
            return;
    });
    if (MCode === "") {
        return resp.status(400).json({
            success: false,
            message: `Child part with id ${childPartId} not found in any finished Item.`
        });
    }
    const allWorkOrder = await workOrderModel_1.default.find({ MCode }).lean();
    const allProductionSlips = await productionSlipModel_1.default.find({ "part._id": childPartId }).lean();
    const filterData = [];
    allWorkOrder.forEach((a) => {
        // NEW CODE
        a.masterBom.forEach(b => {
            let itemProduced = 0;
            if ((b._id + "") === childPartId) {
                if (allProductionSlips) {
                    allProductionSlips.forEach((p) => {
                        if ((p.workOrderId + "") === (a._id + "")) {
                            itemProduced += p.itemProduced;
                        }
                    });
                }
                const obj = { workOrderNumber: a.orderNumber, status: a.status, pendingReq: b.numberOfItem - itemProduced };
                filterData.push(obj);
            }
        });
    });
    return resp.status(200).json({
        success: true,
        message: "Getting all workOrders per childPart",
        data: filterData
    });
});
// get all CNC Program Logs 
exports.CNCProgramLogs = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { name, CNCPrograms, shops, processes, sort, machines, date, nextDate } = req.body;
    const query = {};
    if (date) {
        let startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        if (nextDate) {
            let endDate = new Date(nextDate);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = {
                $gt: startDate,
                $lte: endDate
            };
        }
        else {
            let endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = {
                $gt: startDate,
                $lte: endDate
            };
        }
    }
    if (name) {
        const CNCPrograms = await CNCProgramModel_1.default.find({
            $or: [
                { rawMaterialName: { $regex: name, $options: "i" } },
                { processName: { $regex: name, $options: "i" } },
                { rawMaterialCode: { $regex: name, $options: "i" } },
                { programName: { $regex: name, $options: "i" } },
                { programNumber: { $regex: name, $options: "i" } },
            ]
        });
        const ids = CNCPrograms.map((c) => c._id);
        query.$or = [
            { "employees.employeeName": { $regex: name, $options: "i" } },
            { "machines.machineName": { $regex: name, $options: "i" } },
            { "by.name": { $regex: name, $options: "i" } },
            { CNCProgramId: { $in: ids } }
        ];
    }
    ;
    if (machines && machines.length > 0) {
        const allMachines = await machineModel_1.default.find({ machineName: { $in: machines } });
        if (allMachines && allMachines.length > 0) {
            query["machines.machineId"] = allMachines.map(m => m._id);
        }
    }
    if (CNCPrograms && CNCPrograms.length > 0) {
        const program = await CNCProgramModel_1.default.find({ programName: { $in: CNCPrograms } });
        if (!query.CNCProgramId) {
            query.CNCProgramId = { $in: [] };
        }
        program.forEach((p) => {
            query.CNCProgramId.$in.push(p._id);
        });
    }
    ;
    if (shops && shops.length > 0) {
        const allShops = await shopModel_1.default.find({ shopName: { $in: shops } });
        const shopIds = allShops.map((a) => a._id);
        const processes = await globalProcessModel_1.default.find({ "shop.shopId": { $in: shopIds } });
        const processIds = processes.map((p) => p._id);
        const program = await CNCProgramModel_1.default.find({ processId: { $in: processIds } });
        if (!query.CNCProgramId) {
            query.CNCProgramId = { $in: [] };
        }
        program.forEach((p) => {
            query.CNCProgramId.$in.push(p._id);
        });
    }
    ;
    if (processes && processes.length > 0) {
        const Processes = await globalProcessModel_1.default.find({ processName: { $in: processes } });
        const processIds = Processes.map((p) => p._id);
        const program = await CNCProgramModel_1.default.find({ processId: { $in: processIds } });
        if (!query.CNCProgramId) {
            query.CNCProgramId = { $in: [] };
        }
        ;
        program.forEach((p) => {
            query.CNCProgramId.$in.push(p._id);
        });
    }
    ;
    let logs;
    if (sort === "latest") {
        logs = await CNCProgramLogModel_1.default.find({ ...query }).populate("CNCProgramId").sort({ createdAt: -1 }).lean();
    }
    else if (sort === "oldest") {
        logs = await CNCProgramLogModel_1.default.find({ ...query }).populate("CNCProgramId").sort({ createdAt: 1 }).lean();
    }
    else {
        logs = await CNCProgramLogModel_1.default.find({ ...query }).populate("CNCProgramId").lean();
    }
    ;
    // const productionSlipNumber = await ProductionSlipModel.find().lean();
    // const productionSlipsStore:any = {};
    // productionSlipNumber.forEach((p)=>{
    //  const number = p.productionSlipNumber ;
    //  productionSlipsStore[number] = {
    //    ...p
    //  };
    // });
    // const result:any = [];
    // logs.forEach((l)=>{
    //   const productionSlips:any = [];
    //   l.productionSlipNumber.forEach((p)=>{
    //      const number = p;
    //      const data =  productionSlipsStore[number];
    //      productionSlips.push(data);
    //   });
    //   result.push({
    //     ...l
    //     ,productionSlipNumber:productionSlips
    //   });
    // });
    const result = [];
    const allProcesses = await globalProcessModel_1.default.find({}).lean();
    const processStore = {};
    allProcesses.forEach((a) => {
        const id = a._id + "";
        processStore[id] = { ...a };
    });
    logs.forEach((l) => {
        const processId = l.CNCProgramId.processId + "";
        const name = processStore[processId].processName;
        const obj = {
            ...l
        };
        obj.CNCProgramId.processName = name;
        result.push(obj);
    });
    resp.status(200).json({
        success: true,
        message: "Getting all data successfully.",
        logs: result
    });
});
// delete a CNC Program
exports.deleteCNCProgram = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const program = await CNCProgramModel_1.default.findById(id);
    if (!program) {
        return resp.status(404).json({
            success: false,
            message: `Program with id ${id} not found.`
        });
    }
    ;
    const allLogs = await CNCProgramLogModel_1.default.find({ CNCProgramId: program._id }).lean();
    if (allLogs.length > 0) {
        return resp.status(400).json({
            success: false,
            message: `This program have total ${allLogs.length} logs.`
        });
    }
    ;
    await CNCProgramModel_1.default.findByIdAndDelete(program._id);
    resp.status(200).json({
        success: true,
        message: `Program with Id ${id} deleted.`
    });
});
// Delete CNC Program Logs
exports.CNCProgramLogsDelete = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { logId } = req.params;
    const log = await CNCProgramLogModel_1.default.findByIdAndDelete(logId);
    return resp.status(200).json({
        success: true,
        message: "Log deleted successfully.",
    });
});
// delete a chlidPart in CNCProgram
exports.deleteChildPartFromProgram = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const { childPartId } = req.body;
    const program = await CNCProgramModel_1.default.findById(id);
    if (!program) {
        return resp.status(404).json({
            success: false,
            message: `Program with Id ${id} not found.`
        });
    }
    ;
    program.childParts = program.childParts.filter((p) => p._id?.toString() !== childPartId);
    await program.save();
    resp.status(200).json({
        success: true,
        message: "Program updated successfully.",
        CNCProgram: program
    });
});
// // api for raw material id storing in cnc Program
// export const addRawMaterialId = catchErrorAsync(async (req,resp,next)=>{
//    const allCNCProgram = await CNCProgramModel.find();
//    const allRawMaterial = await ChildPartModel.find().lean();
//    const allRawMaterialStore:any = {};
//    allRawMaterial.forEach((a)=>{
//         const name = a.partName+"";
//         allRawMaterialStore[name] = {
//           ...a
//         };
//    });
//    for (let i of allCNCProgram ){
//     const program = await CNCProgramModel.findById(i._id);
//     const rawMaterial = allRawMaterialStore[program?.rawMaterialName+""];
//     if(program){
//     program.rawMaterialId= rawMaterial._id;
//     await program.save()
//     };
//    };
//    resp.status(200).json({
//     success:true,
//     message:`Done.`
//    });
// });
