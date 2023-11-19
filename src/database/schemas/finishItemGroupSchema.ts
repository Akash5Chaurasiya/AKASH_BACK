import mongoose from "mongoose";
import { FinishItemDocumentGroup } from "../entities/finishItemGroupDocument";


export const finishItemGroupSchema =new mongoose.Schema<FinishItemDocumentGroup>({
    groupName:{
        type:String,
        unique:true,
        trim:true
    },
    groupDescription:{
        type:String
    }
},{
    timestamps:true
});