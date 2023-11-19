import { NextFunction, Request, Response, RequestHandler } from "express";
import AdminModel from "../../database/models/adminModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import ErrorHandler from "../../middleware/errorHandler";
import bcrypt from "bcrypt";
import { sendCookieAdmin } from "../../utils/sendCookie";
import { ParamsDictionary, Query } from "express-serve-static-core";
import { AdminDocument } from "../../database/entities/adminDocument";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import EmployeeModel from "../../database/models/employeeModel";
import EmployeeDocsModel from "../../database/models/employeeDocsModel";
import loginHistoryModel from "../../database/models/loginHistoryModel";
import { getIndianTime } from "../../middleware/dateTimeConverter";
import ShopModel from "../../database/models/shopModel";

// adding a admin
export const addAdmin = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    let admin = await AdminModel.findOne({ email });
    if (admin) {
      return next(new ErrorHandler("Admin Already exist.", 400));
    }
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT as string, 10)
    );
    admin = await AdminModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    resp.status(201).json({
      success: true,
      message: "Admin created successfully.",
      admin,
    });
  }
);

// update an admin
export const updateAdmin = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const id = req.params;

    const { userName, email, password } = req.body;
    let admin = await AdminModel.findOne({ email });
    if (!admin) {
      return next(new ErrorHandler("Admin doesn't exist.", 400));
    }
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT as string, 10)
    );
    admin = await AdminModel.findByIdAndUpdate(
      { _id: id },
      {
        userName,
        email,
        password: hashedPassword,
      }
    );
    resp.status(201).json({
      success: true,
      message: "Admin updated successfully.",
      admin,
    });
  }
);

// delete an admin
export const deleteAdmin = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const id = req.params;
    let admin = await AdminModel.findByIdAndDelete({ _id: id });
    if (!admin) {
      return next(new ErrorHandler("admin doesn't exist.", 400));
    }
    resp.status(201).json({
      success: true,
      message: "admin created successfully.",
      admin,
    });
  }
);

// get all admin
export const getAllAdmin = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    let admin = await AdminModel.find({});
    resp.status(201).json({
      success: true,
      message: "Getting All admin successfully.",
      admin,
    });
  }
);

// admin Login
export const adminLogin = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    let { email, phone, password, userAgent, platform, ipAddress } = req.body;
    if (email) {

      email = email.toLowerCase();
    }
    if (phone) {
      if (typeof phone === "string") {
        phone = parseInt(phone);
      }
    }
    let admin = await AdminModel.findOne({
      $or: [
        { email: email || "abc@gmail.com" },
        { contactNumber: phone || 985953857 },
      ],
    }).select("+password");
    let user = await EmployeeModel.findOne({
      $or: [{ email: email || "xyz@gmail.com" }, { contactNumber: phone || 99999999999 }],
    })
      .populate("jobProfileId")
      .exec();
    const obj = {
      userAgent,
      platform,
    };
    if (admin) {
      const userInfo = {
        name: admin.name,
        role: "Admin",
        jobProfile: "Admin",
        employeeCode: "Admin",
      };
      if (admin._id + "" !== "64a3f3353d41be4135d71b31") {
        const userLog = await loginHistoryModel.create({
          user: admin._id,
          userInfo: userInfo,
          device: obj,
          ipAddress: ipAddress,
          logInTime: getIndianTime(new Date()),
        });
      };

      const comparePassword = await bcrypt.compare(password, admin.password);
      if (!comparePassword) {
        return next(new ErrorHandler("admin or password doesn't match.", 400));
      }
      sendCookieAdmin(resp, admin, `Welcome back, ${admin.name}`, 200);
    } else if (user) {
      const comparePassword = await bcrypt.compare(password, user.password);
      const jobprofile: any = user.jobProfileId;
      const userInfo = {
        name: user.name,
        jobProfile: jobprofile.jobProfileName,
        role: user.role,
        employeeCode: user.employeeCode,
      };
      const userLog = await loginHistoryModel.create({
        user: user._id,
        userInfo: userInfo,
        device: obj,
        ipAddress: ipAddress,
        logInTime: getIndianTime(new Date()),
      });


      if (!comparePassword) {
        return next(new ErrorHandler("user or password doesn't match.", 400));
      }
      if (user.active) {
        sendCookieAdmin(resp, user, `Welcome back, ${user.name}`, 200);
      } else {
        return next(new ErrorHandler("Sorry you are Inactive user !", 404));
      }
    } else {
      return next(new ErrorHandler("User not found", 404));
    }
  }
);

// getting admin user details

interface CustomRequest extends Request {
  admin?: AdminDocument;
  employee?: EmployeeDocument;
}
export const myProfile: RequestHandler<ParamsDictionary, any, any, Query> =
  catchErrorAsync(
    async (req: CustomRequest, resp: Response, next: NextFunction) => {
      if (req.admin) {
        const admin = req.admin;
        resp.status(200).json({
          success: true,
          message: "Getting admin details successfully.",
          admin,
        });
      } else if (req.employee) {
        const employee = await EmployeeModel.findById(req.employee._id)
          .populate("jobProfileId")
          .exec();
        const shop = await ShopModel.findOne({ "jobProfile.jobProfileId": employee?.jobProfileId }).select("shopName shopCode")

        const userPicture = await EmployeeDocsModel.findOne({
          employeeId: employee?._id,
        });
        resp.status(200).json({
          success: true,
          message: "Getting employee details successfully.",
          profilePicture: userPicture?.profilePicture,
          employee,
          shop
        });
      } else {
        resp.status(400).json({
          success: false,
          message: "Login first User not found",
        });
      }
    }
  );

// logout
export const logout = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    resp
      .status(200)
      .cookie("token", "", {
        expires: new Date(Date.now()),
      })
      .json({
        success: true,
        message: "User logged out successfully",
      });
  }
);


export const changePasswordAdmin = async (
  req: CustomRequest,
  resp: Response,
  next: NextFunction
) => {
  if (req.admin) {
    const { oldPassword, newPassword } = req.body;
    const comparePassword = await bcrypt.compare(
      oldPassword,
      req.admin.password
    );
    if (comparePassword) {
      const hashedPassword = await bcrypt.hash(
        newPassword,
        parseInt(process.env.SALT as string, 10)
      );

      const updatedEmployee = await AdminModel.findOneAndUpdate(
        { _id: req.admin._id },
        { password: hashedPassword },
        { new: true }
      );
      resp.status(200).json({
        success: true,
        message: "Password changed successfully.",
        employee: updatedEmployee,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "Old password is not correct.",
      });
    }
  } else {
    return next(
      new ErrorHandler("Something went wrong. Login with admin.", 400)
    );
  }
};