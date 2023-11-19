"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraining = exports.deleteTrainingData = exports.getTrainingData = exports.addTrainingDocs = exports.addTrainingLinks = void 0;
const groupModel_1 = __importDefault(require("../../database/models/groupModel"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const uuid_1 = require("uuid");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const trainingModel_1 = __importDefault(require("../../database/models/trainingModel"));
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, "../../", "public/.env") });
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
exports.addTrainingLinks = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { groupName, jobProfileName, objArray } = req.body;
    const filter = {};
    if (groupName) {
        const group = await groupModel_1.default.findOne({ groupName: groupName });
        filter.groupId = group?._id;
    }
    if (jobProfileName) {
        const jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName: jobProfileName });
        filter.jobProfileId = jobProfile?._id;
    }
    let data = await trainingModel_1.default.findOne(filter);
    if (!data) {
        // Create a new document if not found
        data = new trainingModel_1.default(filter);
    }
    // Add training materials to the existing or newly created document
    for (let t of objArray) {
        // Check if the resourceName already exists in trainingMaterial
        const existingTraining = data.trainingMaterial.find((training) => training.resourceName === t.resourceName);
        if (!existingTraining) {
            data.trainingMaterial.push(t);
        }
    }
    try {
        await data.save();
        res.status(200).json({
            success: true,
            message: "Training data added successfully.",
            data: data,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Error occurred while saving the training data.",
            error: error?.message,
        });
    }
});
exports.addTrainingDocs = (0, catchAsyncError_1.default)(async (req, res, next) => {
    const { groupName, jobProfileName, fileName } = req.body;
    const file = req.file;
    const filter = {};
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
    // finding employee by group
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
    let data = await trainingModel_1.default.findOne(filter);
    if (!data) {
        data = await trainingModel_1.default.create(filter);
    }
    const obj = {
        resourceName: fileName,
        resourceUrl: fileUrl,
    };
    data.trainingMaterial.push(obj);
    await data.save();
    res.status(200).json({
        success: true,
        message: "training data added successfully.",
        data: data,
    });
});
exports.getTrainingData = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { Id } = req.params;
    if (Id) {
        const trainingData = await trainingModel_1.default.findById(Id);
        resp.status(200).json({
            success: true,
            message: "Training  data successfully.",
            trainingData,
        });
    }
    else {
        resp.status(200).json({
            success: false,
            message: "Training not found.",
        });
    }
});
exports.deleteTrainingData = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { Id } = req.params;
    if (Id) {
        const trainingData = await trainingModel_1.default.findByIdAndDelete(Id);
        resp.status(200).json({
            success: true,
            message: "Training  data successfully.",
            trainingData,
        });
    }
    else {
        resp.status(200).json({
            success: false,
            message: "Training not found.",
        });
    }
});
// get training material
exports.getTraining = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    if (req.admin || req.employee) {
        const { groupName, jobProfileName } = req.query;
        const filter = {};
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
        if (req.employee) {
            const trainingData = await trainingModel_1.default.findOne({ jobProfileId: req.employee._id });
            resp.status(200).json({
                success: true,
                message: "Training  data successfully.",
                trainingData: trainingData,
            });
        }
        else {
            const trainingData = await trainingModel_1.default.find(filter);
            resp.status(200).json({
                success: true,
                message: "Training  data successfully.",
                trainingData: trainingData,
            });
        }
    }
});
