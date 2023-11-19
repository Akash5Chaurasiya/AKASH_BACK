import mongoose, { Document } from "mongoose";

export interface EmployeeDocsDocument extends Document {
  employeeId: mongoose.Schema.Types.ObjectId;
  profilePicture: string | undefined;
  proofPicture:[ string | undefined];
  document: [
    {
      docsName: string;
      docs: string | undefined;
      status?:string
    }
  ];
  createdAt: Date;
  updatedAt: Date;
}
