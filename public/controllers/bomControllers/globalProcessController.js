"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllGlobalProcess = exports.getGlobalProcess = exports.updateGlobalProcess = exports.deleteGlobalProcess = exports.addGlobalProcess = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const globalProcessModel_1 = __importDefault(require("../../database/models/globalProcessModel"));
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
const finishedItemModel_1 = __importDefault(require("../../database/models/finishedItemModel"));
const machineModel_1 = __importDefault(require("../../database/models/machineModel"));
const workOrderModel_1 = __importDefault(require("../../database/models/workOrderModel"));
const CNCProgramModel_1 = __importDefault(require("../../database/models/CNCProgramModel"));
// add godown
exports.addGlobalProcess = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { processName, processCode, shopName } = req.body;
    processName = processName.trim();
    processCode = processCode.trim();
    let shop = await shopModel_1.default.findOne({ shopName });
    if (shop) {
        // const newName = processName +" " +shop.shopName;
        const process = await globalProcessModel_1.default.create({
            processName: processName,
            processCode,
            shop: {
                shopId: shop._id,
                shopName: shop.shopName,
            },
        });
        return resp.status(201).json({
            success: true,
            message: "Global Process created successfully",
            process,
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "Shop not found",
        });
    }
});
// delete global process
exports.deleteGlobalProcess = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const process = await globalProcessModel_1.default.findById(id);
    if (!process) {
        return resp.json({
            success: false,
            message: `Process with id ${id} not found.`,
        });
    }
    const processId = process._id + "";
    const finishedItems = await finishedItemModel_1.default.find().lean();
    const workOrders = await workOrderModel_1.default.find().lean();
    const CNCPrograms = await CNCProgramModel_1.default.find().lean();
    const machines = await machineModel_1.default.find().lean();
    const foundArray = [];
    finishedItems.forEach((f) => {
        let i = 1;
        f.masterBom?.forEach((m) => {
            const id = m.process?.id + "";
            if (id == processId) {
                const string = `The ${process.processName} is used in finishedItem ${f.itemName} at index ${i}.`;
                foundArray.push(string);
            }
            i++;
        });
    });
    workOrders.forEach((w) => {
        let i = 1;
        w.masterBom.forEach((p) => {
            if (p.processId + "" === processId) {
                const string = `The ${process.processName} is used in workOrder with Number ${w.orderNumber} at index ${i}.`;
                foundArray.push(string);
            }
            ;
        });
    });
    CNCPrograms.forEach((c) => {
        if (c.processId + "" === processId) {
            const string = `The ${process.processName} is used in CNCProgram with programName ${c.programName}.`;
            foundArray.push(string);
        }
        ;
    });
    machines.forEach((m) => {
        m.process.forEach((p) => {
            const id = p + "";
            if (id == processId) {
                const string = `The ${m.machineName} can process this ${process.processName}.`;
                foundArray.push(string);
            }
            ;
        });
    });
    if (foundArray.length > 0) {
        return resp.status(405).json({
            success: false,
            message: "Found item someWhere.",
            foundArray,
        });
    }
    else {
        const process = await globalProcessModel_1.default.findByIdAndDelete(id);
        return resp.status(202).json({
            success: true,
            message: `Process with name ${process?.processName} deleted.`,
        });
    }
    ;
});
// update global process
exports.updateGlobalProcess = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const { processName, processCode, shopName } = req.body;
    let Process = await globalProcessModel_1.default.findById(id);
    let shop = await shopModel_1.default.findOne({ shopName });
    if (!shop) {
        return resp.status(400).json({
            success: false,
            message: "Shop not found.",
        });
    }
    if (!Process) {
        return resp.status(404).json({
            success: false,
            message: `Process not found with Id ${id}.`,
        });
    }
    Process = await globalProcessModel_1.default.findByIdAndUpdate({ _id: id }, {
        processName,
        processCode,
        shop: {
            shopName: shop.shopName,
            shopId: shop._id,
        },
    });
    if (processName) {
        const allFinishedItem = await finishedItemModel_1.default.find({
            "masterBom.process.id": Process?._id,
        });
        allFinishedItem.forEach(async (a) => {
            const fItem = await finishedItemModel_1.default.findById(a._id);
            if (fItem) {
                fItem?.masterBom?.forEach((f) => {
                    if (f.process?.id + "" === id) {
                        if (f.process?.processName && Process) {
                            f.process.processName = Process.processName;
                        }
                    }
                });
                await fItem?.save();
            }
            ;
        });
    }
    ;
    return resp.status(201).json({
        success: true,
        message: "process updated successfully",
    });
});
exports.getGlobalProcess = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const process = await globalProcessModel_1.default.findById(id).exec();
    if (process) {
        return resp.status(201).json({
            success: true,
            message: "getting process successfully",
            process: process,
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "process not found",
        });
    }
});
exports.getAllGlobalProcess = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { name, shops, sort } = req.body;
    const query = {};
    if (name) {
        query.$or = [
            { processName: { $regex: name, $options: "i" } },
            { processCode: { $regex: name, $options: "i" } },
            { "shop.shopName": { $regex: name, $options: "i" } },
        ];
    }
    ;
    if (shops && shops.length > 0) {
        const shopsDetails = await shopModel_1.default.find({ shopName: { $in: shops } });
        const shopIds = shopsDetails.map((s) => s._id);
        query["shop.shopId"] = { $in: shopIds };
    }
    ;
    let process;
    if (sort) {
        if (sort === "asc") {
            process = await globalProcessModel_1.default
                .find({ ...query })
                .sort({ processName: 1 })
                .exec();
        }
        else if (sort === "dec") {
            process = await globalProcessModel_1.default
                .find({ ...query })
                .sort({ processName: -1 })
                .exec();
        }
        else {
            process = await globalProcessModel_1.default
                .find({ ...query })
                .sort({ processName: 1 })
                .exec();
        }
    }
    else {
        process = await globalProcessModel_1.default.find({ ...query }).exec();
    }
    if (process) {
        // NEW CODE
        const resultArr = [];
        process.forEach((e) => {
            resultArr.push({
                _id: e._id,
                createdAt: e.createdAt,
                processCode: e.processCode,
                processName: e.processName,
                shop: e.shop,
                updatedAt: e.updatedAt,
                shopName: e.shop.shopName,
            });
        });
        return resp.status(201).json({
            success: true,
            message: "getting all process successfully",
            process: resultArr,
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "process not found",
        });
    }
});
