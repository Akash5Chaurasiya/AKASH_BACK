import { Router } from "express";
import {
  addQuestion,
  deleteQuestion,
  getQuizQuestion,
  submitAnswer,
  updateQuestion,
} from "../controllers/employee/quizController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const quizRouter = Router();

quizRouter.route("/getQuiz").post(getQuizQuestion);
quizRouter.route("/submitAnswer").post(isAuthenticatedAdminOrHR, submitAnswer);
quizRouter.route("/addQuestion").post(isAuthenticatedAdminOrHR, addQuestion);
quizRouter
  .route("/updateQuestion")
  .patch(isAuthenticatedAdminOrHR, updateQuestion);
quizRouter
  .route("/updateQuestion")
  .delete(isAuthenticatedAdminOrHR, deleteQuestion);

export default quizRouter;
