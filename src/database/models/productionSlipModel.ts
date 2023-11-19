
import { ProductionSlipDocument } from "../entities/productionSlipDocument";
import { productionSlipSchema } from "../schemas/productionSilpSchema";
import mongoose from "mongoose";


const ProductionSlipModel = mongoose.model<ProductionSlipDocument>("ProductionSlip",productionSlipSchema);
export default ProductionSlipModel;