import mongoose from "mongoose";
import PlanningSchema from "../schemas/planningSchema";
import { PlanningDocument } from "../entities/planningDocument";

const PlanningModel = mongoose.model<PlanningDocument>("Planning",PlanningSchema);

export default PlanningModel;


