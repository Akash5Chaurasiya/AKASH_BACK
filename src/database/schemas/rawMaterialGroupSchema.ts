import mongoose from "mongoose";
import { RawMaterialGroupDocument } from "../entities/rawMaterialGroupDocument";

const rawMaterialGroupSchema = new mongoose.Schema<RawMaterialGroupDocument>({
   groupName:{
    type:String
   },
   description:{
    type:String
   }
});

export default rawMaterialGroupSchema;