import mongoose, { Document } from "mongoose";

export interface groupDocument extends Document {
  groupName: string;
  parentGroupId: mongoose.Schema.Types.ObjectId | null;
  description:string;
  childGroupId: mongoose.Schema.Types.ObjectId[];
  employeesInGroup: string;
  newFields: [
    {
      fieldName: string;
      fieldValue: string;
    }
  ];

  childGroup:{}[]
}
