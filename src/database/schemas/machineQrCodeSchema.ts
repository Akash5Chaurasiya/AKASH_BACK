import mongoose, { mongo } from "mongoose";

const machineQrCodeSchema = new mongoose.Schema({
  machine: {
    machineName: {
      type: String,
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  AssignBy: {
    type: mongoose.Schema.Types.ObjectId
  },
  QrCode: {
    type: String,
  },
  date: {
    type: Date,
  },
  proofPicture: {
    type: String,
    required: false, // Set 'required' to 'false' to make it optional
  },
});

export default machineQrCodeSchema;
