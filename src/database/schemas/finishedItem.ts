import mongoose from "mongoose";
import FinishedItemDocument from "../entities/FinishedItemDocument";

const FinishedItemSchema = new mongoose.Schema<FinishedItemDocument>({
  itemName: {
    type: String,
    unique: true,
    trim: true,
  },
  MCode: {
    type: String,
    unique: true,
    trim: true,
  },
  partCode: {
    type: String,
    unique: true,
    trim: true,
  },
  status: {
    type: String,
  },
  bomCompleted: {
    type: Boolean,
    default: false,
  },
  finishItemGroups: [
    {
      groupId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      groupName: {
        type: String,
      },
    },
  ],
  masterBom: [
    {
      childPart: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "ChildPart" },
        childPartName: { type: String },
      },
      process: {
        id: { type: mongoose.Schema.Types.ObjectId },
        processName: { type: String },
      },

      quantity: {
        type: Number,
        default: 1,
      },
    },
  ],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customer",
  },
  numberOfProcess: {
    type: Number,
  },
},{
  timestamps:true
});

export default FinishedItemSchema;
