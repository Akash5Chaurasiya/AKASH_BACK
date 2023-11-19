import mongoose from "mongoose";
import { CNCProgramLogDocument } from "../entities/CNCProgramLogDocument";

const CNCProgramLogSchema = new mongoose.Schema<CNCProgramLogDocument>(
  {
    CNCProgramId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CNCProgram",
    },
    logNumber:{
      type:String,
      unique:true,
      trim:true
    },
    processName: {
      type: String
    },
    processId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    weight:{type:Number},
    programName:{type:String},                                // new field
    rawMaterialName: { type: String },
    rawMaterialCode:{type:String},                            // new field 
    nesting: { 
      file: { type:String},
      description:{type:String}
     },                                // new field
    DXF: {                                                    // new Field
      file: { type: String },
      description: { type: String },
    }, 
    drawing: {                                                  // new Field
      file: { type: String },
      description: { type: String },
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    sheetConsumed: {
      type: Number,
    },
    cycleTimeAsProgram: {
      type: Number,
    },
    currentCycleTime: {
      type: Number,
    },
    programLogNumber: {
      type: String,
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
    productionSlipNumber: [String],
    by: {
      name: {
        type: String,
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
  },
  {
    timestamps: true,
  }
);
export default CNCProgramLogSchema;
