"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScannedSlip = exports.addOrUpdateScanSlip = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const path_2 = require("path");
const shopModel_1 = __importDefault(require("../../database/models/shopModel"));
const scanSlipModel_1 = __importDefault(require("../../database/models/scanSlipModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, "../../../", "public/.env") });
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
const addOrUpdateScanSlip = async (req, res) => {
    try {
        const { date, shift, shopName, registered, manual } = req.body;
        let scannedSlip = [];
        const file = req.file;
        if (file) {
            scannedSlip = [await UploadToBucket(file)];
            if (scannedSlip === false) {
                return res.status(400).json({ error: "error while uploading image" });
            }
        }
        const shop = await shopModel_1.default.findOne({ shopName: shopName });
        if (!shop) {
            res
                .status(400)
                .json({ success: false, message: "Shop name is not found" });
            return;
        }
        let scanSlip = await scanSlipModel_1.default.findOne({ date, shift });
        if (!scanSlip) {
            // If the scan slip doesn't exist for the specified date, create a new one
            scanSlip = new scanSlipModel_1.default({ date, shift, shop: [] });
        }
        const shopIndex = scanSlip.shop.findIndex((shopItem) => shopItem.shop.equals(shop._id));
        if (shopIndex !== -1) {
            // If the shop exists, update the scannedSlip, manual, and registered values
            const existingShop = scanSlip.shop[shopIndex];
            const existingScannedSlip = new Set(existingShop.scannedSlip);
            scannedSlip.forEach((value) => existingScannedSlip.add(value));
            existingShop.scannedSlip = Array.from(existingScannedSlip);
            // Update the manual and registered values for the shop
            if (manual) {
                existingShop.manual = Number(existingShop.manual) + Number(manual);
            }
            if (registered) {
                existingShop.registered =
                    Number(existingShop.registered) + Number(registered);
            }
            // existingShop.manual = Number(existingShop.manual) + Number(manual);
            // existingShop.registered =
            // Number(existingShop.registered) + Number(registered);
        }
        else {
            const newShopEntry = {
                shop: shop._id,
                shopName: shop.shopName,
                scannedSlip,
                registered,
                manual,
            };
            scanSlip.shop.push(newShopEntry);
        }
        await scanSlip.save();
        res.status(201).json({ message: "Scan slip added/updated successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error adding/updating scan slip" });
    }
};
exports.addOrUpdateScanSlip = addOrUpdateScanSlip;
const UploadToBucket = async (file) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png"];
    let fileUrl;
    if (!file) {
        return false;
    }
    const fileExt = (0, path_2.extname)(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExt)) {
        // const errorMessage = "Invalid file type. Only JPG, JPEG, PNG images are allowed.";
        return false;
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
    return fileUrl;
};
exports.getScannedSlip = (0, catchAsyncError_1.default)(async (req, res) => {
    let { date, shopName, shift } = req.query;
    let filter = {};
    try {
        if (shopName) {
            const shop = await shopModel_1.default.findOne({ shopName });
            if (!shop) {
                return res.status(404).json({
                    success: false,
                    message: "Shop not found",
                });
            }
            filter["shop.shop"] = shop._id;
        }
        if (!date) {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
            const day = currentDate.getDate().toString().padStart(2, "0");
            date = `${year}-${month}-${day}`;
        }
        if (shift) {
            filter.shift = shift;
        }
        const result = [];
        if (date) {
            const slips = await scanSlipModel_1.default.find({ ...filter, date }).lean();
            slips.forEach((s) => {
                const shops = [];
                s.shop.forEach((p) => {
                    if (shopName) {
                        if (p.shopName == shopName) {
                            const obj = {
                                ...p,
                            };
                            shops.push(obj);
                        }
                    }
                    else {
                        const obj = {
                            ...p,
                        };
                        shops.push(obj);
                    }
                });
                const obj = {
                    ...s,
                    shop: shops,
                };
                result.push(obj);
            });
        }
        return res.status(200).json({
            success: true,
            message: "Getting scanned slips",
            slips: result,
        });
    }
    catch (error) {
        console.error("An error occurred:", error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while processing the request",
        });
    }
});
