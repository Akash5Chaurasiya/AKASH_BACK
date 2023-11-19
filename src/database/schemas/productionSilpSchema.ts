import mongoose from "mongoose";
import { ProductionSlipDocument } from "../entities/productionSlipDocument";

export const productionSlipSchema = new mongoose.Schema<ProductionSlipDocument>(
  {
    productionSlipNumber: {
      type: String,
      unique: true,
    },
    workOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "WorkOrder Id is required."],
      ref: "workOrder",
    },
    printCount:{
      type:Number,
      default:0
    },
    QRCode: {
      type: String,
    },
    origin: {
      type: String,
    },
    part: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
      partName: {
        type: String,
      },
    },
    shop: {
      shopName: {
        type: String,
      },
      shopId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    durationFrom: {
      type: Date,
    },
    durationTo: {
      type: Date,
    },
    process: {
      processId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      processName: {
        type: String,
      },
    },
    numberOfItems: {
      type: Number,
    },
    itemPerWorkOrder:{
       type:Number
    },
    itemProduced: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: "inactive",
    },
    manualRemark:{
      type:String
    },
    consumedItem: [
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
          type: mongoose.Schema.Types.ObjectId,
        },
        consumptionGodownName: {
          type: String,
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
        numberOfItemConsumed: {
          type: Number,
          default: 0,
        },
      },
    ],
    createdBy:{
       name:{
        type:String
       },
       employeeId:{
        type:mongoose.Schema.Types.ObjectId
       }
    },
    activatedBy:{
      name:{
        type:String
       },
       employeeId:{
        type:mongoose.Schema.Types.ObjectId
       }
    },
    completedBy:{
      name:{
        type:String
       },
       employeeId:{
        type:mongoose.Schema.Types.ObjectId
       }
    },
    working: [
      {
        updatedBy:{
          name:{
            type:String
           },
           employeeId:{
            type:mongoose.Schema.Types.ObjectId
           }
        },
        itemProduced: {
          type: Number,
          default: 0,
        },
        startTime: {
          type: Date,
        },
        endTime: {
          type: Date,
        },
        employees: [
          {
            employeeId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Employee",
            },
            employeeName: {
              type: String,
            },
          },
        ],
        machines: [
          {
            machineId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "machine",
            },
            machineName: {
              type: String,
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
