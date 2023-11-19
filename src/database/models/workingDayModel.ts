import mongoose from "mongoose";
import { workingDaySchema } from "../schemas/workingDaySchema";

const workingDayModel = mongoose.model("workingDay", workingDaySchema);
export default workingDayModel;
