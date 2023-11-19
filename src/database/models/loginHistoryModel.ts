import mongoose from "mongoose";
import { loginHistory } from "../entities/loginHistory";
import { loginHistorySchema } from "../schemas/loginHistroy";

const loginHistoryModel = mongoose.model<loginHistory>("loginHistory",loginHistorySchema);
export default loginHistoryModel;
