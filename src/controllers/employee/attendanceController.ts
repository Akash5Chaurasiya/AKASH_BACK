import { NextFunction, Request, Response } from "express";
import attendanceModel from "../../database/models/attendanceModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import EmployeeModel from "../../database/models/employeeModel";
import ErrorHandler from "../../middleware/errorHandler";
import { Attendance } from "../../database/entities/attendanceDocument";
import JobProfileModel from "../../database/models/jobProfileModel";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import { JobProfileDocument } from "../../database/entities/jobProfileDocument";
import groupModel from "../../database/models/groupModel";
import * as QRCode from "qrcode";
import EmployeeDocsModel from "../../database/models/employeeDocsModel";
import departmentModel from "../../database/models/department";
import { AttendanceSchema } from "../../database/schemas/attendanceSchema";

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

// Scan The QR code And attendance get marked
export const getEmployeeByQRCode = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let jobProfile;
    // checking the jobProfile Name
    if (req.employee) {
      jobProfile = await JobProfileModel.findById({
        _id: req.employee.jobProfileId,
      });
    }

    const { data } = req.body;

    let qrCode;
    try {
      qrCode = await QRCode.toDataURL(data); // Using email as an example
    } catch (err) {
      return next(new ErrorHandler("QR Code generation failed.", 500));
    }
    if (
      req.admin ||
      jobProfile?.isSupervisor ||
      jobProfile?.jobProfileName.toLowerCase() === "hr" ||
      jobProfile?.jobProfileName.toLowerCase() === "security head" ||
      jobProfile?.jobProfileName.toLowerCase() === "security"
    ) {
      let employee = await EmployeeModel.findOne({ currentBarCode: qrCode });

      let employee1 = await EmployeeModel.findOne({ permanentBarCode: qrCode });

      if (!employee && !employee1) {
        return next(new ErrorHandler("Employee not found.", 404));
      }
      if (employee1) {
        employee = employee1;
      }
      let docs = await EmployeeDocsModel.findOne({ employeeId: employee?._id });
      let date = new Date();
      let nextDay;
      date = new Date(date);
      date.setHours(0, 0, 0, 0);
      date.setHours(date.getHours() - 6);

      nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 2);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setHours(nextDay.getHours() - 6);

      let attendanceRecord: Attendance | null = await attendanceModel.findOne({
        employeeId: employee?._id,
        date: {
          $gte: date,
          $lt: nextDay,
        },
      });

      let message = "";
      let length = attendanceRecord?.punches
        ? attendanceRecord?.punches.length - 1
        : 0;
      if (attendanceRecord?.punches[length].punchOut) {
        message = "Punch In";
      } else if (!attendanceRecord) {
        message = "Punch In";
      } else {
        message = "Punch Out";
      }

      let profilePicture;
      if (docs) {
        profilePicture = docs.profilePicture;
      }

      resp.status(200).json({
        success: true,
        message: "getting employee data successfully.",
        employee,
        profilePicture: profilePicture,
        docs: docs,
        punch: message,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "Login first as Security .",
      });
    }
  }
);

// mark attendance by employee
export const markAttendanceWithEmployeeId = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let jobProfile;
    // checking the jobProfile Name
    if (req.employee) {
      jobProfile = await JobProfileModel.findById(req.employee.jobProfileId);
    }
    let lastPunchOut;
    let lastPunchIn;

    const { id } = req.body;
    let date = new Date();
    let nextDay;
    date = new Date(date);
    date.setHours(0, 0, 0, 0);
    date.setHours(date.getHours() - (6 + 5.5));

    nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 3);
    nextDay.setHours(0, 0, 0, 0);
    nextDay.setHours(nextDay.getHours() - (6 + 5.5));

    console.log(date, nextDay);
    let message = ``;
    if (
      req.admin ||
      jobProfile?.jobProfileName.toLowerCase() === "hr" ||
      jobProfile?.jobProfileName.toLowerCase() === "security head" ||
      jobProfile?.jobProfileName.toLowerCase() === "security"
    ) {
      let employee = await EmployeeModel.findOne({ _id: id })
        .populate("jobProfileId")
        .populate("groupId")
        .exec();

      if (!employee) {
        return next(new ErrorHandler("Employee not found.", 404));
      }

      const currentDate = new Date();
      console.log(currentDate.getHours(), currentDate.getDate());

      let attendanceRecord: Attendance | null = await attendanceModel.findOne({
        employeeId: employee?._id,
        date: {
          $gte: date,
          $lt: nextDay,
        },
      });

      if (!attendanceRecord) {
        attendanceRecord = new attendanceModel({
          employeeId: employee?._id,
          date: currentDate,
          punches: [
            {
              employeeId: employee?._id,
              punchIn: new Date(),
              punchInBy: req.employee?._id || req.admin?._id,
              status: "pending",
            },
          ],
          isPresent: true,
        });
        message = `Attendance punch In successfully.`;
      } else {
        let attDate = new Date(attendanceRecord.date);

        // condition added for night shift

        if (
          currentDate.getDate() !== attDate.getDate() &&
          currentDate.getHours() > 18
        ) {
          attendanceRecord = new attendanceModel({
            employeeId: employee?._id,
            date: currentDate,
            punches: [
              {
                employeeId: employee?._id,
                punchIn: new Date(),
                punchInBy: req.employee?._id || req.admin?._id,
                status: "pending",
              },
            ],
            isPresent: true,
          });
          message = `Attendance punch In successfully.`;

          return resp.status(200).json({
            success: true,
            message,
            attendance: attendanceRecord,
            employee,
          });
        }

        const todayAttendance = attendanceRecord.punches;
        if (!todayAttendance) {
          attendanceRecord.punches.push({
            punchIn: new Date(),
            punchInBy: req.employee?._id || req.admin?._id,
            status: "pending",
          });
          message = `Attendance punch In successfully.`;
        } else {
          const lastPunch = todayAttendance[todayAttendance.length - 1];
          if (lastPunch && lastPunch.punchOut) {
            // attendanceRecord.punches.push({
            //   employeeId: employee?._id,
            //   punchIn: new Date(),
            //   punchInBy: req.employee?._id || req.admin?._id,
            //   status: "approved",
            // });
            const hasApprovedRecords = todayAttendance.some(
              (record) => record.status === "approved"
            );
            const newPunch = {
              employeeId: employee?._id,
              punchIn: new Date(),
              punchInBy: req.employee?._id || req.admin?._id,
              status: hasApprovedRecords ? "approved" : "pending",
            };

            attendanceRecord.punches.push(newPunch);
            message = `Attendance punch In successfully.1`;
          } else {
            lastPunch.punchOut = new Date();
            lastPunch.punchOutBy = req.employee?._id || req.admin?._id;
            message = `Attendance punch Out successfully.`;
            // Calculate the working hours for the current day
            lastPunchIn = new Date(lastPunch.punchIn);
            lastPunchOut = new Date(lastPunch.punchOut);
            if (lastPunch.status == "approved") {
              const punchIn = new Date(lastPunch.punchIn);
              const punchOut = new Date(lastPunch.punchOut);
              const workingHours =
                (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
              attendanceRecord.workingHours += workingHours;
            } else {
              const punchIn = new Date(lastPunch.punchIn);
              const punchOut = new Date(lastPunch.punchOut);
              const workingHours =
                (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
              attendanceRecord.pendingHours += workingHours;
            }
          }
        }
        attendanceRecord.isPresent = true;
      }

      const ratePerHour =
        employee.salary / (employee.workingDays * 4.3 * employee.workingHours);

      if (attendanceRecord.workingHours <= 4) {
        attendanceRecord.totalEarning =
          ratePerHour * attendanceRecord.workingHours;
      } else {
        //   if(lastPunchOut?.getHours() === 14 && lastPunchOut?.getMinutes() >= 0 ){
        //     if(lastPunchIn?.getHours() === 14 && lastPunchIn?.getMinutes() >= 0 ){
        //      let freeTime= (lastPunchOut.getTime() - lastPunchIn.getTime()) / (1000 * 60 * 60);
        //     attendanceRecord.totalEarning = ratePerHour * (attendanceRecord.workingHours - employee.lunchTime +freeTime);
        //   }else{
        //     let freeTime= (lastPunchOut.getTime() - {should be equal to 15}) / (1000 * 60 * 60);
        //     attendanceRecord.totalEarning = ratePerHour * (attendanceRecord.workingHours - employee.lunchTime +freeTime);
        //   }
        // }else{
        //      attendanceRecord.totalEarning = ratePerHour * (attendanceRecord.workingHours - employee.lunchTime);
        //   }
        if (attendanceRecord.workingHours > 0) {
          attendanceRecord.workingHours += attendanceRecord.pendingHours;
          attendanceRecord.pendingHours = 0;
        }
        attendanceRecord.totalEarning =
          ratePerHour * (attendanceRecord.workingHours - employee.lunchTime);
      }

      if (!employee.overTime) {
        if (attendanceRecord.workingHours > employee.workingHours) {
          attendanceRecord.totalEarning = ratePerHour * employee.workingHours; //- employee.lunchTime)
        }
      }

      await attendanceRecord.save();
      resp.status(200).json({
        success: true,
        message,
        attendance: attendanceRecord,
        employee,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "Login first as Security or admin or hr.",
      });
    }
  }
);

// approve or reject attendance
export const updateAttendance = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee || req.admin) {
      let employee: EmployeeDocument | null = null;
      let approverId;
      if (req.employee) {
        employee = await EmployeeModel.findById(req.employee._id).exec();
        approverId = employee?._id;
        if (!employee) {
          resp.status(404).json({
            success: false,
            message: "Employee not found",
          });
        }
      } else {
        approverId = req.admin?._id;
      }

      // Check if the employee is in the HR group or is an admin
      // const {date}:{date?:string} = req.query;
      let { employeeId, status, punchInTime, date } = req.body;
      let nextDay;

      if (date) {
        date = new Date(date);
        date.setHours(0, 0, 0, 0);
        date.setHours(date.getHours() - (6 + 5.5));

        nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 3);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setHours(nextDay.getHours() - (6 + 5.5));
      }
      console.log(date, nextDay);
      const employee1 = await EmployeeModel.findById(employeeId);
      if (!employee1) {
        return next(new ErrorHandler("Employee not found.", 404));
      }
      const punchIn = new Date(punchInTime);

      const attendanceRecord = await attendanceModel.findOne({
        employeeId,
        date: {
          $gte: date,
          $lt: nextDay,
        },
      });

      if (!attendanceRecord) {
        return next(new ErrorHandler("Attendance record not found.", 404));
      }
      let previousArray = false;
      const attendanceDay = attendanceRecord.punches.find((attDay, index) => {
        if (index === 0 && attDay.punchIn.getTime() === punchIn.getTime()) {
          previousArray = true;
        }
        return attDay.punchIn.getTime() === punchIn.getTime();
      });
      if (!attendanceDay) {
        return next(new ErrorHandler("No PunchIn found for this day.", 404));
      }
      let oldStatus = false;
      if (attendanceDay.status == "approved") {
        oldStatus = true;
      }
      const hasApprovedImage = attendanceRecord.punches.some(
        (punch) => punch.approvedImage !== undefined
      );

      if (status === "approved") {
        if (!hasApprovedImage) {
          if (attendanceDay.approvedImage) {
            attendanceDay.approvedBy = approverId;
            attendanceDay.status = "approved";
          } else {
            resp.status(400).json({
              success: false,
              message: "Image should be uploaded.",
            });
          }
        } else {
          attendanceDay.approvedBy = approverId;
          attendanceDay.status = "approved";
        }
      } else {
        attendanceDay.approvedBy = approverId;
        attendanceDay.status = "rejected";
      }
      if (attendanceDay.status == "approved") {
        if (oldStatus == false) {
          const punchIn = new Date(attendanceDay.punchIn);
          const punchOut =
            attendanceDay.punchOut && new Date(attendanceDay.punchOut);
          if (punchOut) {
            const workingHours =
              (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
            attendanceRecord.workingHours += workingHours;
            attendanceRecord.pendingHours -= workingHours;
          }
        }
      }

      if (attendanceDay.status == "rejected") {
        if (oldStatus == true) {
          const punchIn = new Date(attendanceDay.punchIn);
          const punchOut =
            attendanceDay.punchOut && new Date(attendanceDay.punchOut);
          if (punchOut) {
            const workingHours =
              (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
            attendanceRecord.workingHours -= workingHours;
            attendanceRecord.pendingHours += workingHours;
          }
        }
      }
      // else {
      //   const punchIn = new Date(attendanceDay.punchIn);
      //   const punchOut = attendanceDay.punchOut && new Date(attendanceDay.punchOut);
      // if (punchOut) {
      //   const workingHours = (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60); // Convert milliseconds to hours
      //   attendanceRecord.pendingHours += workingHours;
      //   if(oldStatus){
      //   attendanceRecord.workingHours -= workingHours;
      // }
      // }
      // }

      const ratePerHour =
        employee1.salary /
        (employee1.workingDays * 4.3 * employee1.workingHours);
      if (attendanceRecord.workingHours <= 4) {
        attendanceRecord.totalEarning =
          ratePerHour * attendanceRecord.workingHours;
      } else {
        attendanceRecord.totalEarning =
          ratePerHour * (attendanceRecord.workingHours - employee1.lunchTime);
      }
      if (!employee1.overTime) {
        if (attendanceRecord.workingHours > employee1.workingHours) {
          attendanceRecord.totalEarning =
            ratePerHour * (employee1.workingHours - employee1.lunchTime);
        }
      }

      await attendanceRecord.save();

      resp.status(200).json({
        success: true,
        message: "Attendance approved successfully.",
        attendance: attendanceRecord,
      });
    } else {
      return next(new ErrorHandler("Login first", 404));
    }
  }
);

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

// admin panel getting all the attendance of all employee
export const absentAndPresentEmployee = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee || req.admin) {
      let employee: EmployeeDocument | null = null;
      let jobProfile: JobProfileDocument | null = null;

      let {
        date,
        nextDate,
        groupName,
        departmentName,
        jobProfileName,
        name,
        limit = 20,
        page = 1,
      } = req.query as {
        date?: string;
        nextDate?: string;
        groupName?: string;
        jobProfileName?: string;
        employmentStatus?: string;
        departmentName?: string;
        name?: string;
        page?: number;
        limit?: number;
      };

      limit = +limit;
      page = +page;
      const skip = (page - 1) * limit;

      if (req.employee) {
        employee = await EmployeeModel.findById(req.employee._id).exec();
        if (!employee) {
          resp.status(404).json({
            success: false,
            message: "Employee not found",
          });
        }

        jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
        if (!jobProfile) {
          resp.status(404).json({
            success: false,
            message: "Job profile not found",
          });
        }
      }
      let filterDate;
      let nextDay;
      if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      } else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      }
      if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 2);
        nextDay.setHours(nextDay.getHours() - 6);
      } else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 2);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setHours(nextDay.getHours() - 6);
      }

      const isHR = jobProfile?.jobProfileName.toLowerCase() === "hr";
      const isAdmin = req.admin;
      const filter: any = {};
      const filter1: any = {};
      let jobProfileIds: any = [];
      // Add groupName filter if provided
      if (groupName) {
        const group = await groupModel.findOne({ groupName }).exec();
        if (group) {
          filter.groupId = group._id;
        }
      }
      if (departmentName) {
        const department = await departmentModel.findOne({ departmentName });
        if (!department) {
          return resp.status(404).json({
            success: false,
            message: "Department not found.",
          });
        }
        const jobProfiles = await JobProfileModel.find({
          department: department._id,
        });
        const ids: any = jobProfiles.map((jobProfile) => jobProfile._id);
        jobProfileIds = [...jobProfileIds, ...ids];
        filter.jobProfileId = { $in: jobProfileIds };
      }
      // Add jobProfileId filter if provided
      if (jobProfileName) {
        const jobProfile = await JobProfileModel.findOne({
          jobProfileName: jobProfileName,
        });

        if (jobProfile) {
          jobProfileIds = [...jobProfileIds, jobProfile._id];
          filter.jobProfileId = { $in: jobProfileIds };
          filter1.jobProfileId = jobProfile._id;
        }
      }

      if (name) {
        filter.$or = [
          { name: { $regex: name, $options: "i" } }, // Search by name using case-insensitive regex
          { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
        ];
        filter1.$or = [
          { name: { $regex: name, $options: "i" } }, // Search by name using case-insensitive regex
          { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
        ];
      }
      const employeeDocsStore: any = {};
      const employeeDocs = await EmployeeDocsModel.find({}).lean();

      employeeDocs.forEach((e) => {
        const id = e.employeeId + "";
        employeeDocsStore[id] = {
          profilePicture: e.profilePicture,
        };
      });

      if (!isHR && !isAdmin) {
        let numberOfEmployee = 0;
        let totalPresent = 0;
        const employeeIds = await EmployeeModel.aggregate([
          {
            $match: {
              ...filter1,
            },
          },
          {
            $lookup: {
              from: "jobprofiles",
              localField: "jobProfileId",
              foreignField: "_id",
              as: "jobProfile",
            },
          },
          {
            $unwind: "$jobProfile",
          },
          {
            $match: {
              "jobProfile.parentJobProfileId": jobProfile?._id,
            },
          },
        ]);

        const ids: any = employeeIds.map((employee) => employee._id);
        numberOfEmployee = ids.length;

        const attendanceRecords: any = await attendanceModel
          .find({
            employeeId: { $in: ids },
            date: {
              $gte: filterDate,
              $lt: nextDay,
            },
          })
          .sort({ date: -1 })
          .populate("employeeId")
          .populate({
            path: "employeeId",
            populate: {
              path: "jobProfileId",
            },
          })
          .populate({
            path: "employeeId",
            populate: {
              path: "groupId",
            },
          })
          .populate("punches.approvedBy")
          .exec();
        totalPresent = attendanceRecords.length;
        let newRecords = [];
        for (let rec of attendanceRecords) {
          const id = rec.employeeId._id + "";
          const docs = employeeDocsStore[id];
          if (docs) {
            const doc = {
              ...rec.toObject(),
              profilePicture: docs.profilePicture,
            };
            newRecords.push(doc);
          } else {
            newRecords.push(rec);
          }
        }

        // // Get employee IDs from the attendanceRecords
        // const includedEmployeeIds = attendanceRecords.map(
        //   (record) => (record.employeeId as EmployeeDocument)?._id
        // );

        // // Find employees not included in the attendanceRecords
        // const excludedEmployees = await EmployeeModel.find({
        //   "jobProfile.parentJobProfileId": jobProfile?._id,
        //   _id: { $nin: includedEmployeeIds },
        // });

        resp.status(200).json({
          success: true,
          message: "Employee punches fetched successfully.",
          attendanceRecords: newRecords,
          // excludedEmployees,
          totalPresent,
          numberOfEmployee,
        });
      } else {
        // admin condition
        const employeeIds = await EmployeeModel.find(filter)
          .skip(skip)
          .limit(limit)
          .exec();

        const employeeid = await EmployeeModel.find(filter).exec();
        const empids = employeeid.map((employee) => employee._id);

        const ids = employeeIds.map((employee) => employee._id);
        const documnetLength = await attendanceModel.countDocuments({
          employeeId: { $in: empids },
          date: {
            $gte: filterDate,
            $lt: nextDay,
          },
        });
        const attendanceRecords: any = await attendanceModel
          .find({
            employeeId: { $in: ids },
            date: {
              $gte: filterDate,
              $lt: nextDay,
            },
          })
          .sort({ date: -1 })
          .populate("employeeId")
          .populate({
            path: "employeeId",
            populate: {
              path: "jobProfileId",
            },
          })
          .populate({
            path: "employeeId",
            populate: {
              path: "groupId",
            },
          })
          .populate("punches.approvedBy")
          .exec();

        let newRecords = [];
        for (let rec of attendanceRecords) {
          const id = rec.employeeId._id + "";
          const docs = employeeDocsStore[id];
          if (docs) {
            const doc = {
              ...rec.toObject(),
              profilePicture: docs.profilePicture,
            };
            newRecords.push(doc);
          } else {
            newRecords.push(rec);
          }
        }
        // // Get employee IDs from the attendanceRecords
        // const includedEmployeeIds: any = attendanceRecords.map(
        //   (record) => (record.employeeId as EmployeeDocument)?._id
        // );

        // // Find employees not included in the attendanceRecords
        // const excludedEmployees = await EmployeeModel.find({
        //     ...filter,
        //   _id: { $nin: includedEmployeeIds },
        // });

        resp.status(200).json({
          success: true,
          message: "Employee punches fetched successfully.",
          attendanceRecords: newRecords,
          documnetLength: documnetLength,
          // excludedEmployees,
        });
      }
    } else {
      return next(new ErrorHandler("Login first", 404));
    }
  }
);

// get punch record by security
export const getGroupPunchRecords = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.admin || req.employee) {
      const { date, nextDate } = req.query;
      const employeeStore: any = {};
      const attendanceStore: any = {};

      let filterDate;
      let nextDay;
      if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      } else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      }
      if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 2);
        nextDay.setHours(nextDay.getHours() - 6);
      } else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 2);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setHours(nextDay.getHours() - 6);
      }

      const allEmployee = await EmployeeModel.find({});
      const allAttendance = await attendanceModel.find({
        date: {
          $gte: filterDate,
          $lt: nextDay,
        },
      });

      allEmployee.forEach((e) => {
        const id = e.groupId + "";
        if (!employeeStore[id]) {
          employeeStore[id] = {
            value: [],
          };
        }
        employeeStore[id].value.push({
          ...e.toObject(),
        });
      });

      allAttendance.forEach((a) => {
        const id = a.employeeId + "";
        attendanceStore[id] = {
          ...a.toObject(),
        };
      });

      const jobProfile = await JobProfileModel.findOne({
        _id: req.employee?.jobProfileId,
      });

      if (req.admin || jobProfile?.jobProfileName.toLowerCase() === "hr") {
        const groups = await groupModel.find();

        const groupPresent = [];
        for (let group of groups) {
          const punchIn: any[] = [];
          const punchOut: any[] = [];
          const groupId = group._id + "";
          const employees = employeeStore[groupId];

          if (employees) {
            let count = 0;
            const ids = employees.value.map((employee: any) => employee._id);

            ids.forEach((i: any) => {
              const id = i;
              const data = attendanceStore[id];
              if (data) {
                count++;
                for (let punch of data.punches) {
                  if (punch.punchInBy) {
                    const emp = {
                      employee: data.employeeId,
                      punchIn: punch.punchIn,
                    };
                    punchIn.push(emp);
                  }
                  if (punch.punchOutBy) {
                    const emp = {
                      employee: data.employeeId,
                      punchOut: punch.punchOut,
                    };
                    punchOut.push(emp);
                  }
                }
              }
            });

            const obj = {
              present: count,
              punchIn,
              punchOut,
              groupName: group.groupName,
              totalEmployeesInGroup: ids.length,
            };
            groupPresent.push(obj);
          }
        }
        resp.status(200).json({
          success: true,
          message: "All attendance successfully.",
          groupPresent,
        });
      }
    } else {
      return next(new ErrorHandler("Login first", 403));
    }
  }
);

// get punch record by security
export const getPunchRecords = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.admin || req.employee) {
      const { date } = req.query;

      let nextDay;
      let date1;
      if (typeof date === "string") {
        date1 = new Date(date);
        date1.setHours(0, 0, 0, 0);
        date1.setHours(date1.getHours() - 6);

        nextDay = new Date(date1);
        nextDay.setDate(nextDay.getDate() + 2);
        nextDay.setHours(0, 0, 0, 0);
      }

      const punchIn: any[] = [];
      const punchOut: any[] = [];
      let countIn = 0;
      let countOut = 0;
      const jobProfile = await JobProfileModel.findOne({
        _id: req.employee?.jobProfileId,
      });

      if (
        jobProfile?.jobProfileName.toLowerCase() === "security" ||
        jobProfile?.jobProfileName.toLowerCase() === "security head"
      ) {
        const allData: any[] = await attendanceModel
          .find({
            date: {
              $gte: date1,
              $lt: nextDay,
            },
          })
          .populate("employeeId")
          .exec();

        for (let data of allData) {
          for (let punch of data.punches) {
            if (
              punch.punchInBy?.toString() ===
              (req.employee?._id?.toString() || req.admin?._id?.toString())
            ) {
              const emp = { employee: data.employeeId, punchIn: punch.punchIn };
              punchIn.push(emp);
              countIn++;
            }

            if (
              punch.punchOutBy?.toString() ===
              (req.employee?._id?.toString() || req.admin?._id?.toString())
            ) {
              const emp = {
                employee: data.employeeId,
                punchOut: punch.punchOut,
              };
              punchOut.push(emp);
              countOut++;
            }
          }
        }

        resp.status(200).json({
          success: true,
          message: "All attendance successfully security.",
          punchIn,
          punchOut,
          countIn: punchIn.length,
          countOut: punchOut.length,
        });
      } else if (jobProfile?.jobProfileName === "hr" || req.admin) {
        let totalPresent = 0;
        const totalEmployees = await EmployeeModel.countDocuments();
        const allData: any[] = await attendanceModel
          .find({
            date: {
              $gte: date1,
              $lt: nextDay,
            },
          })
          .populate("employeeId")
          .populate("punches.punchInBy")
          .populate("punches.punchOutBy")
          .exec();
        totalPresent = allData.length;
        for (let data of allData) {
          for (let punch of data.punches) {
            if (punch.punchIn) {
              const emp = {
                employee: data.employeeId,
                punchIn: punch.punchIn,
                punchInBy: punch.punchInBy,
              };
              punchIn.push(emp);
            }

            if (punch.punchOut) {
              const emp = {
                employee: data.employeeId,
                punchOut: punch.punchOut,
                punchOutBy: punch.punchOutBy,
              };
              punchOut.push(emp);
            }
          }
        }

        resp.status(200).json({
          success: true,
          message: "All attendance successfully.",
          punchIn,
          punchOut,
          countIn: punchIn.length,
          countOut: punchOut.length,
          totalEmployees,
          totalPresent,
        });
      } else {
        let totalEmployees = 0;
        let totalPresent = 0;
        const employeeIds = await EmployeeModel.aggregate([
          {
            $lookup: {
              from: "jobprofiles",
              localField: "jobProfileId",
              foreignField: "_id",
              as: "jobProfile",
            },
          },
          {
            $unwind: "$jobProfile",
          },
          {
            $match: {
              "jobProfile.parentJobProfileId": jobProfile?._id,
            },
          },
        ]).exec();

        const ids = employeeIds.map((employee) => employee._id);

        totalEmployees = ids.length;
        const allData: any[] = await attendanceModel
          .find({
            date: {
              $gte: date1,
              $lt: nextDay,
            },
            employeeId: { $in: ids },
          })
          .populate("employeeId")
          .populate("punches.punchInBy")
          .populate("punches.punchOutBy")
          .exec();

        totalPresent = allData.length;
        for (let data of allData) {
          for (let punch of data.punches) {
            if (punch.punchIn) {
              const emp = {
                employee: data.employeeId,
                punchIn: punch.punchIn,
                punchInBy: punch.punchInBy,
              };
              punchIn.push(emp);
            }

            if (punch.punchOut) {
              const emp = {
                employee: data.employeeId,
                punchOut: punch.punchOut,
                punchOutBy: punch.punchOutBy,
              };
              punchOut.push(emp);
            }
          }
        }

        resp.status(200).json({
          success: true,
          message: "All attendance successfully.",
          punchIn,
          punchOut,
          countIn: punchIn.length,
          countOut: punchOut.length,
          totalEmployees,
          totalPresent,
        });
      }
    } else {
      return next(new ErrorHandler("Login first", 403));
    }
  }
);

// get all group salary per day
export const getGroupRecordPerDay = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee || req.admin) {
      let employee: EmployeeDocument | null = null;
      let jobProfile: JobProfileDocument | null = null;
      let { date, nextDate, groupName, jobProfileName, name } = req.query;
      if (req.employee) {
        employee = await EmployeeModel.findById(req.employee._id).exec();
        if (!employee) {
          resp.status(404).json({
            success: false,
            message: "Employee not found",
          });
        }

        jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
        if (!jobProfile) {
          resp.status(404).json({
            success: false,
            message: "Job profile not found",
          });
        }
      }
      let filterDate;
      let nextDay;
      if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      } else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      }
      if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 2);
      } else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 2);
        nextDay.setHours(0, 0, 0, 0);
      }

      const isHR = jobProfile?.jobProfileName.toLowerCase() === "hr";
      const isAdmin = req.admin;

      const filter1: any = {};
      if (name) {
        filter1.$or = [
          { name: { $regex: name, $options: "i" } }, // Search by name using case-insensitive regex
          { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
        ];
      }

      if (!isHR && !isAdmin) {
        const employeeIds = await EmployeeModel.aggregate([
          {
            $match: {
              ...filter1,
            },
          },
          {
            $lookup: {
              from: "jobprofiles",
              localField: "jobProfileId",
              foreignField: "_id",
              as: "jobProfile",
            },
          },
          {
            $unwind: "$jobProfile",
          },
          {
            $match: {
              "jobProfile.parentJobProfileId": jobProfile?._id,
            },
          },
        ]).exec();

        const ids = employeeIds.map((employee) => employee._id);

        const attendanceRecords = await attendanceModel
          .find({
            employeeId: { $in: ids },
            date: {
              $gte: filterDate,
              $lt: nextDay,
            },
          })
          .populate("employeeId")
          .exec();

        // Get employee IDs from the attendanceRecords
        const includedEmployeeIds = attendanceRecords.map(
          (record) => (record.employeeId as EmployeeDocument)?._id
        );

        // Find employees not included in the attendanceRecords
        const excludedEmployees = await EmployeeModel.find({
          "jobProfile.parentJobProfileId": jobProfile?._id,
          _id: { $nin: includedEmployeeIds },
        });

        resp.status(200).json({
          success: true,
          message: "Employee punches fetched successfully.",
          employees: attendanceRecords,
          excludedEmployees,
        });
      } else {
        const groupData = await groupModel.find({});

        let data: any = [];
        for (let group of groupData) {
          const employeeIds = await EmployeeModel.find({ groupId: group._id });
          const ids = employeeIds.map((employee) => employee._id);
          const attendanceRecords = await attendanceModel.find({
            employeeId: { $in: ids },
            date: {
              $gte: filterDate,
              $lt: nextDay,
            },
          });
          let totalBasicSalary = 0;
          let totalEarning = 0;
          let totalWorkingHour = 0;
          let totalPendingHour = 0;
          let totalHoursAsPerEmployee = 0;
          let netRatePerHour = 0;
          for (let att of attendanceRecords) {
            totalWorkingHour += att.workingHours;
            totalPendingHour += att.pendingHours;
            totalEarning += att.totalEarning;
          }
          for (let emp of employeeIds) {
            totalHoursAsPerEmployee += emp.workingHours - emp.lunchTime;
            let rate = emp.salary / (emp.workingDays * 4.3);
            totalBasicSalary += rate;
          }
          let totalAbsentHour =
            totalHoursAsPerEmployee - totalWorkingHour - totalPendingHour;
          netRatePerHour =
            totalEarning / (totalWorkingHour / employeeIds.length);
          data.push({
            groupName: group.groupName,
            groupId: group._id,
            numberOfEmployees: employeeIds.length,
            totalBasicSalary,
            totalEarning,
            totalWorkingHour,
            totalPendingHour,
            totalHoursAsPerEmployee,
            totalAbsentHour,
            netRatePerHour,
          });
        }

        resp.status(200).json({
          success: true,
          message: "Employee punches fetched successfully.",
          data,
        });
      }
    } else {
      return next(new ErrorHandler("Login first", 404));
    }
  }
);

//my attendance
export const myAttendance = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee) {
      let { date, nextDate } = req.query;
      let filterDate;
      let nextDay;
      if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      } else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      }
      if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 2);
      } else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 2);
        nextDay.setHours(0, 0, 0, 0);
      }
      const data = await attendanceModel
        .find({
          employeeId: req.employee._id,
          date: {
            $gte: filterDate,
            $lt: nextDay,
          },
        })
        .sort({ date: -1 })
        .populate("punches.approvedBy")
        .exec();
      resp.status(200).json({
        success: true,
        message: "Getting all attendance successfully.",
        data,
      });
    } else {
      return next(new ErrorHandler("Login as employee", 404));
    }
  }
);

// single employee Attendance
export const singleEmployeeAttendance = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee || req.admin) {
      let { date, nextDate } = req.query;
      let { employeeId } = req.params;
      let employee = await EmployeeModel.findOne({ _id: employeeId });
      if (!employee) {
        return resp.status(404).json({
          success: false,
          message: "Employee not found .",
        });
      }
      let filterDate;
      let nextDay;
      if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      } else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      }
      if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 2);
      } else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 2);
        nextDay.setHours(0, 0, 0, 0);
      }
      const data = await attendanceModel
        .find({
          employeeId: employee._id,
          date: {
            $gte: filterDate,
            $lt: nextDay,
          },
        })
        .sort({ date: -1 })
        .populate("punches.approvedBy")
        .exec();
      resp.status(200).json({
        success: true,
        message: "Getting all attendance successfully.",
        data,
      });
    } else {
      return next(new ErrorHandler("Login as employee", 404));
    }
  }
);

// employee staff attendance

export const employeeStaffAttendance = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.employee || req.admin) {
      let employee: EmployeeDocument | null = null;
      let jobProfile: JobProfileDocument | null = null;

      let { date, nextDate } = req.query;

      if (req.employee) {
        employee = await EmployeeModel.findById(req.employee._id).exec();
        if (!employee) {
          resp.status(404).json({
            success: false,
            message: "Employee not found",
          });
        }

        jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
        if (!jobProfile) {
          resp.status(404).json({
            success: false,
            message: "Job profile not found",
          });
        }
      }
      let filterDate;
      let nextDay;
      if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      } else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
        filterDate.setHours(filterDate.getHours() - 6);
      }
      if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 2);
      } else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 2);
        nextDay.setHours(0, 0, 0, 0);
      }

      const isHR = jobProfile?.jobProfileName.toLowerCase() === "hr";
      const isAdmin = req.admin;

      if (!isHR && !isAdmin) {
        const myJobProfile = await JobProfileModel.findOne({
          _id: jobProfile?._id,
        });
        const childJobProfile = myJobProfile?.childProfileId;
        const data = [];
        if (childJobProfile) {
          for (let jobProfile of childJobProfile) {
            const thisJobProfile = await JobProfileModel.findOne({
              _id: jobProfile,
            });
            const employees = await EmployeeModel.find({
              jobProfileId: jobProfile,
            });
            const totalEmployees = employees.length;
            const ids: any = employees.map((employee) => employee._id);
            const attendanceRecords = await attendanceModel
              .find({
                employeeId: { $in: ids },
                date: {
                  $gte: filterDate,
                  $lt: nextDay,
                },
              })
              .sort({ date: -1 })
              .populate("employeeId")
              .populate({
                path: "employeeId",
                populate: {
                  path: "jobProfileId",
                },
              })
              .populate("punches.approvedBy")
              .exec();
            const todayPresent = attendanceRecords.length;
            const dataa = {
              todayPresent,
              totalEmployees,
              thisJobProfile,
            };
            data.push(dataa);
          }
        }

        resp.status(200).json({
          success: true,
          message: "Employee punches fetched successfully.",
          data,
        });
      }
    } else {
      return next(new ErrorHandler("Login first", 404));
    }
  }
);

// api for excel sheet
export const getFirstPunchInLastPunchOut = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let { date, nextDate } = req.query;
    let filterDate;
    let nextDay;
    if (typeof date === "string") {
      filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      filterDate.setHours(filterDate.getHours() - (6 + 5.5));
    } else {
      filterDate = new Date();
      filterDate.setHours(0, 0, 0, 0);
      filterDate.setHours(filterDate.getHours() - (6 + 5.5));
    }
    if (typeof nextDate === "string") {
      nextDay = new Date(nextDate);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setDate(nextDay.getDate() + 3);
    } else {
      nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 3);
      nextDay.setHours(0, 0, 0, 0);
    }
    const adjustTimeForIndianTimeZone = (time: any) => {
      const indianTime = new Date(time);
      indianTime.setHours(indianTime.getHours() + 5); // Add 5 hours
      indianTime.setMinutes(indianTime.getMinutes() + 30); // Add 30 minutes
      return indianTime;
    };
    console.log("adjustTimeForIndianTimeZone", adjustTimeForIndianTimeZone);
    const data: any = await attendanceModel
      .find({
        date: {
          $gte: filterDate,
          $lt: nextDay,
        },
      })
      .populate({
        path: "employeeId",
        populate: {
          path: "jobProfileId",
        },
      })
      .populate({
        path: "employeeId",
        populate: {
          path: "jobProfileId",
        },
      })
      .populate({
        path: "employeeId",
        populate: {
          path: "groupId",
        },
      })
      .sort({ date: -1 })
      .exec();
    let result: any = [];

    const dateFormat = (dateString: any) => {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");

      const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
      return formattedDate;
    };

    data.forEach((d: any) => {
      const punchIn = adjustTimeForIndianTimeZone(d.punches[0].punchIn);
      let punchOut;

      if (d.punches[d.punches.length - 1].punchOut) {
        // if (d.punches[d.punches.length - 1].punchOut) {
        punchOut = adjustTimeForIndianTimeZone(
          d.punches[d.punches.length - 1].punchOut
        );
        console.log(
          "d.punches[d.punches.length - 1].punchOut",
          d.punches[d.punches.length - 1].punchOut
        );
        console.log("punchOut", punchOut);
        // }
      } else {
        if (d.punches[d.punches.length - 2]) {
          punchOut = adjustTimeForIndianTimeZone(
            d.punches[d.punches.length - 2].punchOut
          );
        }
      }
      let workingHours;
      if (punchOut) {
        workingHours =
          (punchOut.getTime() - punchIn.getTime()) / (1000 * 60 * 60);
      }
      if (d.employeeId) {
        const obj = {
          employeeCode: d.employeeId.employeeCode,
          employeeName: d.employeeId.name,
          jobProfile: d.employeeId.jobProfileId.jobProfileName,
          groupName: d.employeeId.groupId.groupName,
          date: new Date(d.date).toISOString().split("T")[0],
          punchIn: dateFormat(punchIn),
          punchOut: dateFormat(punchOut),
          workingHours: workingHours ? Number(workingHours.toFixed(3)) : 0,
          approvedHours: Number(d.workingHours.toFixed(3)),
          pendingHours: Number(d.pendingHours.toFixed(3)),
          totalEarning: Number(d.totalEarning.toFixed(3)),
        };
        result.push(obj);
      }
    });

    resp.status(200).json({
      success: true,
      message: "Getting all attendance successfully.",
      result,
    });
  }
);

