import mongoose from "mongoose";
import ShopLogSchema from "../schemas/shopLogSchema";
import { ShopLogDocument } from "../entities/shopLogDocument";

const ShopLogModel = mongoose.model("ShopLog",ShopLogSchema);

export default ShopLogModel;