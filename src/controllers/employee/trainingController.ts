import groupModel from "../../database/models/groupModel";
import JobProfileModel from "../../database/models/jobProfileModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import aws, { S3 } from "aws-sdk";
import TrainingModel from "../../database/models/trainingModel";
import { config } from "dotenv";
import path from "path";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
config({ path: path.join(__dirname, "../../", "public/.env") });
aws.config.update({
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION,
});



interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}
const BUCKET = process.env.BUCKET;
if (!BUCKET) {
  console.error("No bucket specified in the environment configuration.");
  process.exit(1); // Exit the application or handle the error accordingly
}
const s3 = new aws.S3();


export const addTrainingLinks = catchErrorAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { groupName, jobProfileName, objArray } = req.body;

  const filter: any = {};
  if (groupName) {
    const group = await groupModel.findOne({ groupName: groupName });
    filter.groupId = group?._id;
  }
  if (jobProfileName) {
    const jobProfile = await JobProfileModel.findOne({ jobProfileName: jobProfileName });
    filter.jobProfileId = jobProfile?._id;
  }

  let data = await TrainingModel.findOne(filter);

  if (!data) {
    // Create a new document if not found
    data = new TrainingModel(filter);
  }

  // Add training materials to the existing or newly created document
  for (let t of objArray) {
    // Check if the resourceName already exists in trainingMaterial
    const existingTraining = data.trainingMaterial.find(
      (training) => training.resourceName === t.resourceName
    );

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
  } catch (error:any) {
    res.status(500).json({
      success: false,
      message: "Error occurred while saving the training data.",
      error: error?.message,
    });
  }
});

export const addTrainingDocs = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { groupName, jobProfileName, fileName } = req.body;

    const file = req.file;
    const filter: any = {};
    if (groupName) {
      // find group id from group model
      const group = await groupModel.findOne({
        groupName: groupName,
      });
      filter.groupId = group?._id;
    }
    if (jobProfileName) {
      // find allJobProfiles from jobProfile model
      const jobProfile = await JobProfileModel.findOne({
        jobProfileName: jobProfileName,
      });
      filter.jobProfileId = jobProfile?._id;
    }
    // finding employee by group
    let fileUrl;
    if (!file) {
      res.status(400).send("No file uploaded.");
      return;
    } else if (file) {
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
    }
    let data = await TrainingModel.findOne(filter);

    if (!data) {
      data = await TrainingModel.create(filter);
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
  }
);

export const getTrainingData = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { Id } = req.params;
    if (Id) {
      const trainingData = await TrainingModel.findById(Id);
      resp.status(200).json({
        success: true,
        message: "Training  data successfully.",
        trainingData,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "Training not found.",
      });
    }
  }
);
export const deleteTrainingData = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { Id } = req.params;
    if (Id) {
      const trainingData = await TrainingModel.findByIdAndDelete(Id);
      resp.status(200).json({
        success: true,
        message: "Training  data successfully.",
        trainingData,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "Training not found.",
      });
    }
  }
);


// get training material
export const getTraining = catchErrorAsync(
  async (req: CustomRequest<EmployeeDocument>, resp: Response, next: NextFunction) => {

    if(req.admin || req.employee){
      const { groupName , jobProfileName } = req.query
      const filter: any = {};
    if (groupName) {
      // find group id from group model
      const group = await groupModel.findOne({
        groupName: groupName,
      });
      filter.groupId = group?._id;
    }
    if (jobProfileName) {
      // find allJobProfiles from jobProfile model
      const jobProfile = await JobProfileModel.findOne({
        jobProfileName: jobProfileName,
      });
      filter.jobProfileId = jobProfile?._id;
    }
    if(req.employee){

    const trainingData = await TrainingModel.findOne({jobProfileId:req.employee._id});
    resp.status(200).json({
      success: true,
      message: "Training  data successfully.",
      trainingData: trainingData,
    });
  }else{
    const trainingData = await TrainingModel.find(filter);
    resp.status(200).json({
      success: true,
      message: "Training  data successfully.",
      trainingData: trainingData,
    });
  }
  }
  }
);