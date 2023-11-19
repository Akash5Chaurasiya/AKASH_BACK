import mongoose from "mongoose";
export const employeeDocsSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    profilePicture: {
      type: String,
    },
    proofPicture: [{ type: String }],
    document: [
      {
        docsName: String,
        docs: String,
        status:{
          type:String,
          default:"pending"
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);
