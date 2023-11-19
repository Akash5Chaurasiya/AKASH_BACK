import mongoose, { Document } from "mongoose";

interface ChildPartDocument extends Document {
  partName: string;
  productionGodown: mongoose.Schema.Types.ObjectId;
  childPartType: string;
  group:{
    groupName:string;
    groupId:mongoose.Schema.Types.ObjectId;
  }
  finishedItemId:mongoose.Schema.Types.ObjectId;
  materialCode: string;
  typeOfMaterial: string;
  unit: string;
  numberOfItem:number;
  processId:mongoose.Schema.Types.ObjectId;
  processName:string;
  consumedItem: {
    itemId: mongoose.Schema.Types.ObjectId;
    itemName: string;
    itemType: string;
    consumedItemQuantity: number;
    consumptionGodown: mongoose.Schema.Types.ObjectId;
  }[];
}
export default ChildPartDocument;
