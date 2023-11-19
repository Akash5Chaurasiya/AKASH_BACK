import mongoose from "mongoose";
import { finishItemGroupSchema } from "../schemas/finishItemGroupSchema";
import { FinishItemDocumentGroup } from "../entities/finishItemGroupDocument";


const FinishItemGroupModel = mongoose.model<FinishItemDocumentGroup>("finishItemGroup",finishItemGroupSchema);

export default FinishItemGroupModel;