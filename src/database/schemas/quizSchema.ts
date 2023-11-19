import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
          required: true,
        },
      ],
      correctAnswer: {
        type: String,
        required: true,
      },
      points: {
        type: Number,
        required: true,
      },
      jobProfileId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"JobProfile"
      },
      createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Employee"
      }
},{
    timestamps:true
})

export default quizSchema;