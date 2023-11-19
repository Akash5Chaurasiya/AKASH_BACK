import mongoose, { Document } from "mongoose";

export interface CNCProgramDocument extends Document {
  programName: string;
  programNumber : string;
  rawMaterialName: string;
  rawMaterialCode: string;
  rawMaterialId:mongoose.Schema.Types.ObjectId;
  processName:string;
  processId:mongoose.Schema.Types.ObjectId;
  DXF: {
    file: string;
    description: string;
  };
  drawing: {
    file: string;
    description: string;
  };
  weight:number;
  status: string;
  nesting: {file:string,description:string};
  scrap: {
    quantity: number;
    unit: string;
  };
  cycleTime: number;
  childParts: {
    _id?:mongoose.Schema.Types.ObjectId
    childPart: {
      childPartName: string;
      id: mongoose.Schema.Types.ObjectId;
    };
    childPartProduced: number;
    weightPerChildPart: number;
    weightUnit: string;
  }[];
  isCompleted:boolean
}
