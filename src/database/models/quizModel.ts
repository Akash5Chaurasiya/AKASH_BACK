import mongoose from "mongoose";
import quizSchema from "../schemas/quizSchema";
import { QuizDocument } from "../entities/quizDocument";


const QuizModel = mongoose.model<QuizDocument>("Quiz",quizSchema);
export default QuizModel;