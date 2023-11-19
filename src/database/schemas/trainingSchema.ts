import mongoose from "mongoose";

export const trainingSchema = new mongoose.Schema({
  jobProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "JobProfile",
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
  },
  trainingMaterial: [
    {
      resourceName: {
        type: String,
      },
      resourceUrl: {
        type: String,
      },
    },
  ],
  status: {
    type: String,
  },
  marks: {
    type: String,
  },
});
