import mongoose,{ Document } from "mongoose";

export interface DepartmentDocument extends Document {
    parentDepartmentId:mongoose.Schema.Types.ObjectId,
    departmentName:string,
    description:string, 
  }
  