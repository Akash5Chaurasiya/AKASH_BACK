import mongoose from "mongoose";

const machineSchema = new mongoose.Schema(
  {
    machineName: {
      type: String,
      unique:true,
      trim:true
    },
    code: {
      type: String,
      unique: true,
      trim:true
    },
    process: [{ type: mongoose.Schema.Types.ObjectId, ref: "GlobalProcess" }],
    QrCode:{
      type:String
    },
    proofPicture: {
      type:String,
      required: false, // Set 'required' to 'false' to make it optional
    },
    picture: {
      type:String,
      required: false, // Set 'required' to 'false' to make it optional
    },
    logs:[{
      productionSlipId:{
        type:mongoose.Schema.Types.ObjectId
      },
      time:{
        type:Date
      }
    }]
  },
  {
    timestamps: true,
  }
);
export default machineSchema;
