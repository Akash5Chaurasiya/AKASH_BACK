import mongoose, { Document } from "mongoose";

export interface workOrderDocument extends Document {
  date:  Date;
  orderNumber:string;
  finishedItemID: mongoose.Schema.Types.ObjectId;
  finishItemName:string;
  partCode: string;
  MCode: string;
  customerId:mongoose.Schema.Types.ObjectId;
  customerName:string;
  orderQuantity: number;
  status: string;
  masterBom:
    {
      partName: string;
      _id: mongoose.Schema.Types.ObjectId;
      process: string;
      processId:mongoose.Schema.Types.ObjectId;
      unit:string;
      numberOfItem: number;
      itemProduced: number;
      productionGodownId:mongoose.Schema.Types.ObjectId;
      productionGodownName:string;
      newChild:
        {
          _id: mongoose.Schema.Types.ObjectId;
          partName:string;
          materialCode: string;
          typeOfMaterial: string;
          consumptionGodownId:mongoose.Schema.Types.ObjectId;
          consumptionGodownName:string;
          childPartType: string;
          unit: string;
          numberOfItem: number;
        }[]
    }[]
}
