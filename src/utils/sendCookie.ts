import jwt,{Secret} from "jsonwebtoken"
import { Response } from "express";
import EmployeeDocsModel from "../database/models/employeeDocsModel";
import AdminModel from "../database/models/adminModel";

export const sendCookieAdmin = async (
  resp: Response,
  user:any,
  message: string,
  statusCode = 200
) => {

  const token = jwt.sign({user:user._id} , process.env.JWT_KEY as Secret);
  const userPicture = await EmployeeDocsModel.findOne({employeeId:user._id});
  if(user?.email === "dev@gmail.com"){
    return resp
    .status(statusCode)
    .cookie("token", token, {
      maxAge: 500000 * 60 * 60 * 1000,
      httpOnly:true,
      secure: true, // Set to true if using HTTPS
      sameSite: "none", // Set the appropriate SameSite policy based on your requirements
    })
    .json({
      success: true,
      profilePicture:userPicture?.profilePicture,
      user,
      message,
      cookie:"Cookie saved successfully."
    });
  }
  return resp
    .status(statusCode)
    .cookie("token", token, {
      maxAge: 5 * 60 * 60 * 1000,
      httpOnly:true,
      secure: true, // Set to true if using HTTPS
      sameSite: "none", // Set the appropriate SameSite policy based on your requirements
    })
    .json({
      success: true,
      profilePicture:userPicture?.profilePicture,
      user,
      message,
      cookie:"Cookie saved successfully."
    });
};
