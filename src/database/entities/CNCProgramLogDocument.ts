import mongoose, { Document } from "mongoose";

export interface CNCProgramLogDocument extends Document {
  CNCProgramId: mongoose.Schema.Types.ObjectId;
  logNumber:string;
  rawMaterialName: string;
  rawMaterialCode:string;
  processName:string;
  processId: mongoose.Schema.Types.ObjectId;
  programName:string;
  childParts: {
    _id?: mongoose.Schema.Types.ObjectId;
    childPart: {
      childPartName: string;
      id: mongoose.Schema.Types.ObjectId;
    };
    childPartProduced: number;
    weightPerChildPart: number;
    weightUnit: string;
  }[];
  nesting: {
    file:string,
    description:string
  };
  DXF: {
    file: string;
    description: string;
  };
  drawing: {
    file: string;
    description: string;
  };
  weight: number;
  scrap: number;
  startTime: Date;
  endTime: Date;
  sheetConsumed: number;
  cycleTimeAsProgram: number;
  currentCycleTime: number;
  programLogNumber: string;
  employees: {
    employeeId: mongoose.Schema.Types.ObjectId;
    employeeName: string;
  }[];
  machines: {
    machineId: mongoose.Schema.Types.ObjectId;
    machineName: string;
  }[];
  productionSlipNumber: string[];
  by: {
    name: string;
    id: mongoose.Schema.Types.ObjectId;
  };
}
