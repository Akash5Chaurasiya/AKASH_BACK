"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGodown = exports.getGodown = exports.getAllGodown = exports.deleteGodown = exports.addGodown = void 0;
const godownModel_1 = __importDefault(require("../../database/models/godownModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const childPartModel_1 = __importDefault(require("../../database/models/childPartModel"));
// add godown
exports.addGodown = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { godownName, godownCode } = req.body;
    godownName = godownName.trim();
    godownCode = godownCode.trim();
    const godown = await godownModel_1.default.create({ godownName, godownCode });
    return resp.status(201).json({
        success: true,
        message: "Godown created successfully",
        godown
    });
});
// delete godown
exports.deleteGodown = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const Godown = await godownModel_1.default.findById(id);
    if (!Godown) {
        return resp.status(404).json({
            success: false,
            message: `Godown with id ${id} not found.`,
        });
    }
    const godownId = Godown._id + "";
    const childParts = await childPartModel_1.default.find().lean();
    const foundArray = [];
    childParts.forEach((c) => {
        const id = c.productionGodown + "";
        if (godownId == id) {
            const string = `Child Part ${c.partName} in Production using this ${Godown.godownName} .`;
            foundArray.push(string);
        }
        c.consumedItem.forEach((i) => {
            const id = i.consumptionGodown + "";
            if (godownId == id) {
                const string = `Child Part ${c.partName}'s part ${i.itemName} consumption godown using this ${Godown.godownName} .`;
                foundArray.push(string);
            }
        });
    });
    if (foundArray.length > 0) {
        return resp.status(405).json({
            success: false,
            message: "Found Godown somewhere",
            foundArray,
        });
    }
    else {
        await godownModel_1.default.findByIdAndDelete(id);
        return resp.status(202).json({
            success: true,
            message: `${Godown.godownName} deleted successfully.`,
        });
    }
});
// get all godown
exports.getAllGodown = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { name, sort } = req.query;
    const query = {};
    if (name) {
        query.$or = [
            { godownName: { $regex: name, $options: "i" } },
            { godownCode: { $regex: name, $options: "i" } },
        ];
    }
    let allGodown;
    if (sort) {
        if (sort === "asc") {
            allGodown = await godownModel_1.default.find({ ...query })
                .sort({ godownName: 1 })
                .lean();
        }
        else if (sort === "dec") {
            allGodown = await godownModel_1.default.find({ ...query })
                .sort({ godownName: -1 })
                .lean();
        }
        else {
            allGodown = await godownModel_1.default.find({ ...query })
                .sort({ godownName: 1 })
                .lean();
        }
    }
    else {
        allGodown = await godownModel_1.default.find({ ...query }).lean();
    }
    return resp.status(200).json({
        success: true,
        message: "Getting all godown successfully",
        allgodown: allGodown,
    });
});
exports.getGodown = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const godown = await godownModel_1.default.findById(id);
    return resp.status(201).json({
        success: true,
        message: "Getting godown successfully",
        godown: godown,
    });
});
exports.updateGodown = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const { godownName, godownCode } = req.body;
    const godown = await godownModel_1.default.findByIdAndUpdate({ _id: id }, { godownName, godownCode });
    return resp.status(201).json({
        success: true,
        message: "Getting godown successfully",
        godown: godown,
    });
});
