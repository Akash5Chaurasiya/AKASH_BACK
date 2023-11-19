import mongoose, { Document } from "mongoose";

interface globalProcessDocument extends Document{
    processName:string,
    processCode:string,
    // departmentId?:mongoose.Schema.Types.ObjectId
    shop:{
        shopId:mongoose.Schema.Types.ObjectId;
        shopName:string;
    }
}

export default globalProcessDocument