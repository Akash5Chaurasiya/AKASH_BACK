import mongoose from "mongoose";
import GodownDocument from "../entities/GodownDocument";
import GodownSchema from "../schemas/GodownSchema";


const GodownModel = mongoose.model<GodownDocument>("Godown",GodownSchema);
export default GodownModel