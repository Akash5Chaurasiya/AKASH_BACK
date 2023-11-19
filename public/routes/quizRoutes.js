"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quizController_1 = require("../controllers/employee/quizController");
const auth_1 = require("../middleware/auth");
const quizRouter = (0, express_1.Router)();
quizRouter.route("/getQuiz").post(quizController_1.getQuizQuestion);
quizRouter.route("/submitAnswer").post(auth_1.isAuthenticatedAdminOrHR, quizController_1.submitAnswer);
quizRouter.route("/addQuestion").post(auth_1.isAuthenticatedAdminOrHR, quizController_1.addQuestion);
quizRouter
    .route("/updateQuestion")
    .patch(auth_1.isAuthenticatedAdminOrHR, quizController_1.updateQuestion);
quizRouter
    .route("/updateQuestion")
    .delete(auth_1.isAuthenticatedAdminOrHR, quizController_1.deleteQuestion);
exports.default = quizRouter;
