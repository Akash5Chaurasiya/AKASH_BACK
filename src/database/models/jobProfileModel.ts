import mongoose, { model } from "mongoose";
import { JobProfileSchema } from "../schemas/jobProfileSchema";
import { JobProfileDocument } from "../entities/jobProfileDocument";

const JobProfileModel = model<JobProfileDocument>("JobProfile", JobProfileSchema);
export default JobProfileModel;
