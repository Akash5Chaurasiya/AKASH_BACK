import mongoose from "mongoose";
import { PlanningDocument } from "../entities/planningDocument";

const PlanningSchema = new mongoose.Schema<PlanningDocument>({
  finishedItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FinishedItem",
  },
  finishedItemName:{
    type:String
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
  },
  minimumInventory: {
    type: Number,
  },
  month: {
    type: Date,
  },
  dates: [
    {
      date: {
        type: Date,
      },
      day:{
        type:String,
      }, 
       orderValue: {
        type: Number,
        default:0
      },
      dispatchValue: {
        type: Number,
        default:0
      },
      by: [{
        date: { type: Date },
        employeeId: { type: mongoose.Schema.Types.ObjectId },
        name: { type: String },
        orderValue:{
          type:Number
        }
      }],
    },
  ],
},{
  timestamps:true
});

export default PlanningSchema;
