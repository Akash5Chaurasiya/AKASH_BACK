import ShopSchema from "../schemas/shopSchema";
import { ShopDocument } from "../entities/shopDocument";
import mongoose from "mongoose";

const ShopModel = mongoose.model<ShopDocument>("shop",ShopSchema);

export default ShopModel;