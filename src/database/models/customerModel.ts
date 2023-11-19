import mongoose, { mongo } from "mongoose";
import customerDocument from "../entities/customerDocument";
import { customerSchema } from "../schemas/customerSchema";

const customerModel = mongoose.model<customerDocument>(
  "customer",
  customerSchema
);
export default customerModel;
