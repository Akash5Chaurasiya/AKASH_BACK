import mongoose from "mongoose";
import { trainingSchema } from "../schemas/trainingSchema";


const TrainingModel = mongoose.model("Training",trainingSchema);
export default TrainingModel;