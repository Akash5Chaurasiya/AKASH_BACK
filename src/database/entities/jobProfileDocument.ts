import mongoose, { Document } from "mongoose";

export interface JobProfileDocument extends Document {
  jobProfileName: string;
  parentJobProfileId: mongoose.Schema.Types.ObjectId | null;
  childProfileId: mongoose.Schema.Types.ObjectId[];
  numberOfEmployees: string;
  employmentType: string;
  jobRank: number;
  jobSkill: String;
  department: mongoose.Schema.Types.ObjectId | null;
  isSupervisor: boolean;
  newFiels: [{ fieldName: string; fieldValue: string }];
  employees: {}[];
  childProfiles: {}[];
}
