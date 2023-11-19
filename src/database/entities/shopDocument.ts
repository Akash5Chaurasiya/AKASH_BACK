import mongoose, { Document } from "mongoose";

export interface ShopDocument extends Document{
    shopName:string;
    jobProfile:{
        jobProfileId:mongoose.Schema.Types.ObjectId
        jobProfileName:string
    };
    shopCode:string;
}
