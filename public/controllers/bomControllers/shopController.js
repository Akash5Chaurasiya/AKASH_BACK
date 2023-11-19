"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShop = exports.updateShop = exports.getSingleShop = exports.getAllShop = exports.addShop = void 0;
const globalProcessModel_1 = __importDefault(require("../../database/models/globalProcessModel"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
// add a shop
exports.addShop = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    let { shopName, shopCode, jobProfileName } = req.body;
    shopName = shopName.trim();
    shopCode = shopCode.trim();
    const jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
    if (!jobProfile) {
        return resp.status(404).json({
            success: false,
            message: "Job Profile not found."
        });
    }
    const shop = await shopModel_1.default.findOne({ shopName });
    if (shop) {
        return resp.status(400).json({
            success: false,
            message: "Shop with same name is already presesnt."
        });
    }
    const newShop = await shopModel_1.default.create({ shopName, shopCode, jobProfile: {
            jobProfileId: jobProfile._id,
            jobProfileName: jobProfile.jobProfileName
        } });
    resp.status(201).json({
        success: true,
        message: "Shop created successfully.",
        newShop
    });
});
// get all shops
exports.getAllShop = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const shops = await shopModel_1.default.find();
    resp.status(200).json({
        success: true,
        message: "Getting all Shops successfully.",
        shops
    });
});
// get single shops
exports.getSingleShop = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const shop = await shopModel_1.default.findById({ _id: id });
    resp.status(200).json({
        success: true,
        message: "Getting Shop successfully.",
        shop
    });
});
// get update shops
exports.updateShop = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const { shopName, shopCode, jobProfileName } = req.body;
    let jobProfile;
    let shop;
    shop = await shopModel_1.default.findById({ _id: id });
    if (!shop) {
        return resp.status(404).json({
            success: false,
            message: "Shop not found."
        });
    }
    if (shopName) {
        shop.shopName = shopName;
    }
    if (shopCode) {
        shop.shopCode = shopCode;
    }
    if (jobProfileName) {
        jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
        if (!jobProfile) {
            return resp.status(400).json({
                success: false,
                message: "Jobprofile not found."
            });
        }
        shop.jobProfile = {
            jobProfileId: jobProfile._id,
            jobProfileName: jobProfile.jobProfileName
        };
    }
    await shop.save();
    resp.status(200).json({
        success: true,
        message: "Getting Shop successfully.",
        shop
    });
});
// delete shop 
exports.deleteShop = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    const shop = await shopModel_1.default.findById(id);
    if (!shop) {
        return resp.status(404).json({
            success: false,
            message: `Shop with Id ${id} not found.`
        });
    }
    const alreadyUsed = [];
    const processes = await globalProcessModel_1.default.find({ shop });
    if (processes.length > 0) {
        processes.forEach((p) => {
            const string = p.processName;
            alreadyUsed.push(string);
        });
    }
    if (alreadyUsed.length > 0) {
        return resp.status(405).json({
            success: false,
            message: "Shop is used in processes.",
            alreadyUsed
        });
    }
    else {
        const shop = await shopModel_1.default.findByIdAndDelete({ _id: id });
        return resp.json({
            success: true,
            message: `Shop with name ${shop?.shopName} deleted.`
        });
    }
});
