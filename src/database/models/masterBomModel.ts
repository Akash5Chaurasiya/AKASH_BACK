import mongoose from "mongoose";
import { masterBomdocumnet } from "../entities/masterBomdocumnet";
import { bomSchema } from "../schemas/masterBomSchema";


const bomModel= mongoose.model<masterBomdocumnet>("Bom",bomSchema);
export default bomModel;