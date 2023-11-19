import mongoose, { Document } from "mongoose";

export interface ProductionSlipDocument extends Document {
  productionSlipNumber: string;
  workOrderId: mongoose.Schema.Types.ObjectId;
  printCount: number;
  QRCode: string;
  part: {
    _id: mongoose.Schema.Types.ObjectId;
    partName: string;
  };
  departmentId: mongoose.Schema.Types.ObjectId;
  durationFrom: Date;
  durationTo: Date;
  numberOfItems: number;
  itemPerWorkOrder:number;
  origin: string;
  status: string;
  manualRemark:string;
  createdBy: {
    name: string;
    employeeId: mongoose.Schema.Types.ObjectId;
  };
  activatedBy: {
    name: string;
    employeeId: mongoose.Schema.Types.ObjectId;
  };
  completedBy: {
    name: string;
    employeeId: mongoose.Schema.Types.ObjectId;
  };
  process: {
    processId: mongoose.Schema.Types.ObjectId;
    processName: string;
  };
  shop: {
    shopId: mongoose.Schema.Types.ObjectId;
    shopName: string;
  };
  itemProduced: number;
  consumedItem: {
    _id: mongoose.Schema.Types.ObjectId;
    partName: string;
    materialCode: string;
    typeOfMaterial: string;
    consumptionGodownId: mongoose.Schema.Types.ObjectId;
    consumptionGodownName: string;
    childPartType: string;
    unit: string;
    numberOfItem: number;
    numberOfItemConsumed: number;
  }[];
  working: {
    updatedBy?: {
      name: string;
      employeeId: mongoose.Schema.Types.ObjectId;
    };
    itemProduced?: number;
    startTime?: Date;
    endTime?: Date;
    employees: {
      employeeId: mongoose.Schema.Types.ObjectId;
      employeeName: string;
    }[];
    machines: {
      machineId: mongoose.Schema.Types.ObjectId;
      machineName: string;
    }[];
  }[];
  updatedAt:Date;
  createdAt:Date;
}
