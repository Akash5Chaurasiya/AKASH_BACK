"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCustomer = exports.getCustomer = exports.deleteCustomer = exports.updateCoustomer = exports.addCustomer = void 0;
const customerModel_1 = __importDefault(require("../../database/models/customerModel"));
const finishedItemModel_1 = __importDefault(require("../../database/models/finishedItemModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
exports.addCustomer = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { customerName, code, date } = req.body;
    const newDate = new Date(date);
    const customer = await customerModel_1.default.create({ customerName, code, date: newDate });
    return resp.status(201).json({
        success: true,
        message: "customer created successfully",
        customer
    });
});
exports.updateCoustomer = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    let { customerName, code } = req.body;
    const customer = await customerModel_1.default.findById(id);
    if (customer) {
        const customer = await customerModel_1.default.findByIdAndUpdate({ _id: id }, { customerName, code });
        return resp.status(201).json({
            success: true,
            message: "customer updated successfully",
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "customer not found",
        });
    }
});
// delete customer 
exports.deleteCustomer = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const customer = await customerModel_1.default.findById(id);
    if (!customer) {
        return resp.status(404).json({
            success: false,
            message: "Customer not Found."
        });
    }
    const customerId = customer._id + "";
    const finishedItems = await finishedItemModel_1.default.find().lean();
    const foundArray = [];
    finishedItems.forEach((f) => {
        const id = f.customer + "";
        if (id == customerId) {
            const string = `The Customer ${customer.customerName} is used in FinishedItem ${f.itemName}.`;
            foundArray.push(string);
        }
    });
    if (foundArray.length > 0) {
        return resp.status(405).json({
            success: false,
            message: "Found some items where customer is used.",
            foundArray
        });
    }
    else {
        await customerModel_1.default.findByIdAndDelete(id);
        return resp.status(202).json({
            success: true,
            message: `Customer ${customer.customerName} deleted successfully.`
        });
    }
});
// get customer 
exports.getCustomer = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const customer = await customerModel_1.default.findById(id);
    if (customer) {
        return resp.status(201).json({
            success: true,
            message: "getting customer successfully",
            customer: customer,
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "customer not found",
        });
    }
});
exports.getAllCustomer = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { name, code, sort } = req.query;
    const query = {};
    if (name) {
        query.$or = [
            { customerName: { $regex: name, $options: "i" } },
            { code: { $regex: name, $options: "i" } }
        ];
    }
    ;
    if (code) {
        query.code = code;
    }
    let customer = await customerModel_1.default.find({ ...query });
    if (sort) {
        if (sort === "asc") {
            customer = await customerModel_1.default.find({ ...query }).sort({ customerName: 1 }).lean();
        }
        else if (sort === "dec") {
            customer = await customerModel_1.default.find({ ...query }).sort({ customerName: -1 }).lean();
        }
        else {
            customer = await customerModel_1.default.find({ ...query }).sort({ customerName: 1 }).lean();
        }
    }
    else {
        customer = await customerModel_1.default.find({ ...query });
    }
    if (customer) {
        return resp.status(201).json({
            success: true,
            message: "getting all customer successfully",
            customer: customer,
        });
    }
    else {
        return resp.status(400).json({
            success: false,
            message: "customer not found",
        });
    }
});
