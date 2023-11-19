import mongoose from "mongoose";
import ChildPartDocument from "../entities/ChildPartDocument";

const childPartSchema = new mongoose.Schema<ChildPartDocument>({
    partName : {
        type: String,
        unique:true,
        trim:true
    },
    productionGodown: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Godown"
    },
    group:{
      groupId:{
        type:mongoose.Schema.Types.ObjectId
    },
    groupName:{
        type:String
    }
    },
    finishedItemId:{
        type:mongoose.Schema.Types.ObjectId
    },
    // for raw materials 
    childPartType:{
          type : String
    },
    materialCode:{
        type : String,
        unique:true,
        trim:true
    },
    typeOfMaterial:{
         type : String
    },
    unit:{
        type : String
    },
    numberOfItem:{
         type:Number
    },
    processId:{
        type:mongoose.Schema.Types.ObjectId
    },
    processName:{
        type:String
    },
    // ------------------
    consumedItem: [{
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChildPart"
        },
        itemName:{
            type:String
        },
        itemType:{
            type:String
        },
        consumedItemQuantity: {
            type: Number
        },
        consumptionGodown: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Godown"
        }
    }]
},{
    timestamps:true
})
export default childPartSchema