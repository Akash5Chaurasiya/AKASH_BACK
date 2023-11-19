import mongoose,{ Document } from "mongoose";

export interface ParentDepartmentDocument extends Document {
    deparmentName:string,
    childDepartmentId:{
        type:mongoose.Schema.Types.ObjectId
    }[],
    description:string 
}
  