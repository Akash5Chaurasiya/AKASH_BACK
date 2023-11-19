import mongoose, { Schema } from "mongoose";

export const groupSchema = new Schema(
  {
    groupName: {
      type: String,
    },
    parentGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default:null
    },
    description:{
      type: String
    },
    childGroupId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
    employeesInGroup: {
      type: Number,
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
