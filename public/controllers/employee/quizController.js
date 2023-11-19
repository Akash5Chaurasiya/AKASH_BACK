"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.updateQuestion = exports.addQuestion = exports.submitAnswer = exports.getQuizQuestion = void 0;
const quizModel_1 = __importDefault(require("../../database/models/quizModel"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
// Shuffle array function
const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
};
// get Quiz questions
const getQuizQuestion = async (req, res, next) => {
    try {
        const { jobProfileId } = req.body;
        const jobProfile = await jobProfileModel_1.default.findOne({
            _id: req.employee?.jobProfileId || jobProfileId,
        });
        const questions = await quizModel_1.default.find({ jobProfileId }).select("-correctAnswer");
        res.status(200).json({
            success: true,
            message: `getting question for ${jobProfile?.jobProfileName} Job profile.`,
            questions,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};
exports.getQuizQuestion = getQuizQuestion;
// submit the test
const submitAnswer = async (req, res, next) => {
    if (req.employee || req.admin) {
        const submittedAnswers = req.body.answers;
        let jobProfile = req.body.jobProfileId;
        if (jobProfile) {
            jobProfile = await jobProfileModel_1.default.findById({ _id: req.employee?.jobProfileId || jobProfile });
        }
        else {
            return next(new errorHandler_1.default("Login First", 403));
        }
        try {
            const questions = await quizModel_1.default.find({ jobProfileId: jobProfile?._id });
            let score = 0;
            for (let i = 0; i < questions.length; i++) {
                if (questions[i].correctAnswer === submittedAnswers[i]) {
                    score++;
                }
            }
            const percent = (score / questions.length) * 100;
            const employee = await employeeModel_1.default.findById(req.employee?._id);
            employee?.marks.push(score);
            if (employee) {
                if (percent > 35) {
                    employee.trainingStatus = "Pass";
                }
                else {
                    employee.trainingStatus = "Fail";
                }
                await employee.save();
            }
            res.status(200).json({
                success: true,
                message: "Getting result successfully.",
                percent,
                score,
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
    else {
        return next(new errorHandler_1.default("Login In first", 404));
    }
};
exports.submitAnswer = submitAnswer;
// add question
const addQuestion = async (req, res, next) => {
    const { question, options, correctAnswer, points, jobProfile } = req.body;
    if (req.employee || req.admin) {
        const job = await jobProfileModel_1.default.findOne({ jobProfileName: jobProfile });
        const jobProfileId = job?._id;
        try {
            const newQuestion = new quizModel_1.default({
                question,
                options,
                correctAnswer,
                points,
                jobProfileId,
                createdBy: req?.employee?._id || req.admin?._id,
            });
            await newQuestion.save();
            res.status(201).json({
                success: true,
                message: "Question added successfully",
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
    else {
        return next(new errorHandler_1.default("Login first ", 403));
    }
};
exports.addQuestion = addQuestion;
// update Question
const updateQuestion = async (req, res, next) => {
    if (req.employee || req.admin) {
        const { question, options, correctAnswer } = req.body;
        const questionId = req.params.id;
        try {
            const updatedQuestion = await quizModel_1.default.findByIdAndUpdate(questionId, {
                question,
                options,
                correctAnswer,
                createdBy: req?.employee?._id || req.admin?._id,
            }, { new: true });
            if (!updatedQuestion) {
                return next(new errorHandler_1.default("Question not found", 404));
            }
            res.status(200).json({
                success: true,
                message: "Question updated Successfully",
                updatedQuestion,
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
    else {
        return next(new errorHandler_1.default("Login First to update the question", 403));
    }
};
exports.updateQuestion = updateQuestion;
// delete Question
const deleteQuestion = async (req, res, next) => {
    if (req.employee || req.admin) {
        const questionId = req.params.id;
        try {
            const updatedQuestion = await quizModel_1.default.findByIdAndDelete(questionId, {
                new: true,
            });
            if (!updatedQuestion) {
                return next(new errorHandler_1.default("Question not found", 404));
            }
            res.status(200).json({
                success: true,
                message: "Question Deleted Successfully.",
                updatedQuestion,
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
    else {
        return next(new errorHandler_1.default("Login First to delete the question", 403));
    }
};
exports.deleteQuestion = deleteQuestion;
