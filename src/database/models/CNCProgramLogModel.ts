import mongoose from "mongoose";
import CNCProgramLogSchema from "../schemas/CNCProgramLog";
import { CNCProgramLogDocument } from "../entities/CNCProgramLogDocument";


const CNCProgramLogModel = mongoose.model<CNCProgramLogDocument>("CNCProgramLog",CNCProgramLogSchema);
export default CNCProgramLogModel;