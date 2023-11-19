import mongoose from "mongoose";
import { CNCProgramDocument } from "../entities/CNCProgramDocument";

const CNCProgramSchema = new mongoose.Schema<CNCProgramDocument>({
  programName: {
    type: String,
    unique:true,
    trim:true
  },
  programNumber: {
    type: String,
    unique:true,
    trim:true
  },
  rawMaterialName: {
    type: String,
  },
  rawMaterialCode: {
    type: String,
  },
  rawMaterialId:{
     type:mongoose.Schema.Types.ObjectId
  },
  weight: {
    type: Number,
  },
  processName: {
    type: String,
  },
  processId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  DXF: {
    file: { type: String },
    description: {
      type: String,
    },
  },
  drawing: {
    file: { type: String },
    description: {
      type: String,
    },
  },
  status: {
    type: String,
  },
  nesting: {
    file: {
      type: String,
    },
    description: {
      type: String,
    },
  },
  scrap: {
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
    },
  },
  cycleTime: {
    type: Number,
  },
  childParts: [
    {
      childPart: {
        childPartName: { type: String },
        id: { type: mongoose.Schema.Types.ObjectId },
      },
      childPartProduced: {
        type: Number,
      },
      weightPerChildPart: {
        type: Number,
      },
      weightUnit: {
        type: String,
      },
    },
  ],
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

export default CNCProgramSchema;
