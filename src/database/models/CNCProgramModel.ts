import mongoose from "mongoose";
import CNCProgramSchema from "../schemas/CNCProgramSchema";
import { CNCProgramDocument } from "../entities/CNCProgramDocument";


const CNCProgramModel = mongoose.model<CNCProgramDocument>("CNCProgram",CNCProgramSchema);
export default CNCProgramModel;