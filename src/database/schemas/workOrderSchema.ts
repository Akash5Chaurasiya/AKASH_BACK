import mongoose from "mongoose";
import { workOrderDocument } from "../entities/workOrderDocument";

export const workOrderSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
    },
    orderNumber: {
      type: String,
      unique: true,
      trim:true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    customerName: {
      type: String,
      trim:true
    },
    finishedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FinishedItem",
    },
    finishItemName: {
      type: String,
    },
    partCode: {
      type: String,
    },
    MCode: {
      type: String,
    },
    orderQuantity: {
      type: Number,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending","inProgress","completed","cancel"],
    },
    masterBom: [
      {
        partName: {
          type: String,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
        },
        process: {
          type: String,
        },
        processId:{
          type:mongoose.Schema.Types.ObjectId
        },
        unit: {
          type: String,
        },
        numberOfItem: {
          type: Number,
          default: 1,
        },
        productionGodownId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        productionGodownName: {
          type: String,
        },
        itemProduced: {
          type: Number,
          default: 0,
        },
        newChild: [
          {
            _id: {
              type: mongoose.Schema.Types.ObjectId,
            },
            partName: {
              type: String,
            },
            materialCode: {
              type: String,
            },
            typeOfMaterial: {
              type: String,
            },
            consumptionGodownId: { 
              type: mongoose.Schema.Types.ObjectId
             },
            consumptionGodownName: { 
              type: String 
            },
            childPartType: {
              type: String,
            },
            unit: {
              type: String,
            },
            numberOfItem: {
              type: Number,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);
