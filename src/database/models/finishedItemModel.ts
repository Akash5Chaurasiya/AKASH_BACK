import mongoose from "mongoose";
import FinishedItemDocument from "../entities/FinishedItemDocument";
import FinishedItemSchema from "../schemas/finishedItem";

const FinishedItemModel = mongoose.model<FinishedItemDocument>("FinishedItem",FinishedItemSchema);

export default FinishedItemModel;
