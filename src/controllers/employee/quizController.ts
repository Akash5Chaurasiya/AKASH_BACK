import { Request, Response, NextFunction } from "express";
import QuizModel from "../../database/models/quizModel";
import JobProfileModel from "../../database/models/jobProfileModel";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import ErrorHandler from "../../middleware/errorHandler";
import EmployeeModel from "../../database/models/employeeModel";

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

// Shuffle array function
const shuffleArray = (array: any) => {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }
  return shuffledArray;
};

// get Quiz questions
export const getQuizQuestion = async (
  req: CustomRequest<EmployeeDocument>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { jobProfileId } = req.body;
    const jobProfile = await JobProfileModel.findOne({
      _id: req.employee?.jobProfileId || jobProfileId,
    });
    const questions = await QuizModel.find({ jobProfileId }).select(
      "-correctAnswer"
    );
    res.status(200).json({
      success: true,
      message: `getting question for ${jobProfile?.jobProfileName} Job profile.`,
      questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// submit the test
export const submitAnswer = async (
  req: CustomRequest<EmployeeDocument>,
  res: Response,
  next: NextFunction
) => {
  if(req.employee ||req.admin){
  const submittedAnswers = req.body.answers;
  let jobProfile = req.body.jobProfileId;

  if (jobProfile) {
    jobProfile = await JobProfileModel.findById({ _id: req.employee?.jobProfileId || jobProfile });
  } else {
    return next(new ErrorHandler("Login First", 403));
  }
  
    try {
      const questions = await QuizModel.find({ jobProfileId: jobProfile?._id });

      let score = 0;

      for (let i = 0; i < questions.length; i++) {
        if (questions[i].correctAnswer === submittedAnswers[i]) {
          score++;
        }
      }

      const percent = (score / questions.length) * 100;
      const employee = await EmployeeModel.findById(req.employee?._id);
      employee?.marks.push(score);
      if (employee) {
        if (percent > 35) {
          employee.trainingStatus = "Pass";
        } else {
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    return next(new ErrorHandler("Login In first", 404));
  }
};

// add question
export const addQuestion = async (
  req: CustomRequest<EmployeeDocument>,
  res: Response,
  next: NextFunction
) => {
  const { question, options, correctAnswer, points, jobProfile } = req.body;
  if (req.employee || req.admin) {
    const job = await JobProfileModel.findOne({ jobProfileName: jobProfile });
    const jobProfileId = job?._id;
    try {
      const newQuestion = new QuizModel({
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
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    return next(new ErrorHandler("Login first ", 403));
  }
};

// update Question
export const updateQuestion = async (
  req: CustomRequest<EmployeeDocument>,
  res: Response,
  next: NextFunction
) => {
  if (req.employee || req.admin) {
    const { question, options, correctAnswer } = req.body;
    const questionId = req.params.id;

    try {
      const updatedQuestion = await QuizModel.findByIdAndUpdate(
        questionId,
        {
          question,
          options,
          correctAnswer,
          createdBy: req?.employee?._id || req.admin?._id,
        },
        { new: true }
      );

      if (!updatedQuestion) {
        return next(new ErrorHandler("Question not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Question updated Successfully",
        updatedQuestion,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    return next(new ErrorHandler("Login First to update the question", 403));
  }
};

// delete Question
export const deleteQuestion = async (
  req: CustomRequest<EmployeeDocument>,
  res: Response,
  next: NextFunction
) => {
  if (req.employee || req.admin) {
    const questionId = req.params.id;

    try {
      const updatedQuestion = await QuizModel.findByIdAndDelete(questionId, {
        new: true,
      });

      if (!updatedQuestion) {
        return next(new ErrorHandler("Question not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Question Deleted Successfully.",
        updatedQuestion,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    return next(new ErrorHandler("Login First to delete the question", 403));
  }
};
