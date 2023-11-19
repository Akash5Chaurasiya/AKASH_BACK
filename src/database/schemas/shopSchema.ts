import mongoose from "mongoose";

const ShopSchema = new mongoose.Schema({
    shopName:{
        type:String,
        unique:true,
        required:true,
    },
    jobProfile:{
        jobProfileId:{type:mongoose.Schema.Types.ObjectId},
        jobProfileName:{
            type:String
        }
    },
    shopCode:{
        type:String,
        unique:true,
        required:true
    }
},{
    timestamps:true
});

export default ShopSchema ;
