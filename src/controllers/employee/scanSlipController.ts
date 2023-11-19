import { Request, Response, NextFunction } from "express";
import aws, { S3, TemporaryCredentials } from "aws-sdk";
import { config } from "dotenv";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { extname } from "path";
import ShopModel from "../../database/models/shopModel";
import scannedSlipModel from "../../database/models/scanSlipModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import { RFC_2822 } from "moment";

config({ path: path.join(__dirname, "../../../", "public/.env") });
aws.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION,
});
const BUCKET = process.env.BUCKET;
if (!BUCKET) {
  console.error("No bucket specified in the environment configuration.");
  process.exit(1);
}
const s3 = new aws.S3();

export const addOrUpdateScanSlip = async (req: Request, res: Response) => {
  try {
    const { date, shift, shopName, registered, manual } = req.body;
    let scannedSlip: any = [];
    const file = req.file;
    if (file) {
      scannedSlip = [await UploadToBucket(file)];
      if (scannedSlip === false) {
        return res.status(400).json({ error: "error while uploading image" });
      }
    }
    const shop = await ShopModel.findOne({ shopName: shopName });

    if (!shop) {
      res
        .status(400)
        .json({ success: false, message: "Shop name is not found" });
      return;
    }

    let scanSlip: any = await scannedSlipModel.findOne({ date, shift });

    if (!scanSlip) {
      // If the scan slip doesn't exist for the specified date, create a new one
      scanSlip = new scannedSlipModel({ date, shift, shop: [] });
    }

    const shopIndex = scanSlip.shop.findIndex((shopItem: any) =>
      shopItem.shop.equals(shop._id)
    );

    if (shopIndex !== -1) {
      // If the shop exists, update the scannedSlip, manual, and registered values
      const existingShop = scanSlip.shop[shopIndex];
      const existingScannedSlip = new Set(existingShop.scannedSlip);
      scannedSlip.forEach((value: any) => existingScannedSlip.add(value));
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
    } else {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding/updating scan slip" });
  }
};

const UploadToBucket = async (file: any) => {
  const allowedExtensions = [".jpg", ".jpeg", ".png"];
  let fileUrl;
  if (!file) {
    return false;
  }
  const fileExt = extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(fileExt)) {
    // const errorMessage = "Invalid file type. Only JPG, JPEG, PNG images are allowed.";
    return false;
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
  return fileUrl;
};

export const getScannedSlip = catchErrorAsync(
  async (req: Request, res: Response) => {
    let { date, shopName, shift } = req.query;
    let filter: any = {};
    try {
      if (shopName) {
        const shop = await ShopModel.findOne({ shopName });
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

      const result: any = [];
      if (date) {
        const slips = await scannedSlipModel.find({ ...filter, date }).lean();
        slips.forEach((s) => {
          const shops: any = [];
          s.shop.forEach((p) => {
            if (shopName) {
              if (p.shopName == shopName) {
                const obj = {
                  ...p,
                };
                shops.push(obj);
              }
            } else {
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
    } catch (error) {
      console.error("An error occurred:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing the request",
      });
    }
  }
);