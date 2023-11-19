import mongoose,{Document} from "mongoose";


export interface QuizDocument extends Document{

    jobProfileId:mongoose.Schema.Types.ObjectId,
    question: string
    options:string[],
    correctAnswer: string
    points: number
    createdBy:mongoose.Schema.Types.ObjectId
}