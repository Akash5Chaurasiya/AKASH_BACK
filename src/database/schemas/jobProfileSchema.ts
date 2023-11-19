import mongoose, { Schema } from "mongoose";

export const JobProfileSchema = new Schema(
  {
    jobProfileName: {
      type: String,
    },
    parentJobProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobProfile",
      default: null,
    },
    jobRank:{ 
      type:Number
    },
    jobDescription: {
      type:String
    },
    childProfileId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobProfile",
    }],
    numberOfEmployees: {
      type: Number,
    },
    employmentType:{
       type:String
    },
    jobSkill:{
      type:String
    }, 
    department:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Department"
    },
    isSupervisor:{
      type:Boolean,
      default: false
    },
    newFields:[
      {
        fieldName:{
          type:String
        },
        fieldValue:{
          type:String,
          default:""
        }
      }
    ]
  },
  {
    timestamps: true,
  }
);
