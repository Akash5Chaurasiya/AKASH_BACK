import { NextFunction, Request, Response } from "express";
import EmployeeModel from "../../database/models/employeeModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import ErrorHandler from "../../middleware/errorHandler";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import JobProfileModel from "../../database/models/jobProfileModel";
import groupModel from "../../database/models/groupModel";
import * as QRCode from "qrcode";
import { AdminDocument } from "../../database/entities/adminDocument";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import { sendCookieAdmin } from "../../utils/sendCookie";
import { JobProfileDocument } from "../../database/entities/jobProfileDocument";
import BarCode from "../../database/models/barCodeModel";
import EmployeeDocsModel from "../../database/models/employeeDocsModel";
import SalaryLogModel from "../../database/models/salaryLogModel";
import departmentModel from "../../database/models/department";
import attendanceModel from "../../database/models/attendanceModel";
import loginHistoryModel from "../../database/models/loginHistoryModel";
import mongoose from "mongoose";
import AdminModel from "../../database/models/adminModel";

interface CustomRequest<T> extends Request {
  admin?: T;
  employee?: T;
  attendanceManager?: T;
  dbManager?: T;
}

// adding a employee
export const addEmployee = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let {
      name,
      aadharNumber,
      groupName,
      jobProfileName,
      email,
      employeeCode,
      contactNumber,
      password,
      dateOfBirth,
      gender,
      dateOfJoining,
      salary,
      expactedSalary,
      leaveTaken,
      workingDays,
      workingHours,
      lunchTime,
      overTime,
      overTimeRate,
      PF_UAN_Number,
      ESI_ID,
      PAN_Number,
      salaryMode,
      bankDetails,
    } = req.body;
    if (email) {
      email = email.toLowerCase();
    }
    name = name.trim();
    // for athentication
    let authorised: boolean = false;
    let addedBy: any = {};
    if (req.dbManager) {
      const emp = await EmployeeModel.findById(req.dbManager._id);
      if (emp?.role === "dbManager") {
        addedBy.by = emp._id;
        addedBy.name = emp.name;
        authorised = true;
      }
    }
    if (overTime) {
      if (!overTimeRate) {
        overTimeRate = salary / (workingDays * 4.28 * workingHours);
      }
    }
    if (req.admin) {
      addedBy.by = req.admin._id;
      addedBy.name = req.admin.name;
    }
    if (req.admin || authorised) {
      const groupId = await groupModel.findOne({ groupName });
      if (!groupId) {
        return next(new ErrorHandler("Group not found", 404));
      }

      const jobProfileId = await JobProfileModel.findOne({ jobProfileName });
      if (!jobProfileId) {
        return next(new ErrorHandler("JobProfile not found", 404));
      }
      if (email) {
        let employee = await EmployeeModel.findOne({ email: email });
        if (employee) {
          return next(new ErrorHandler("Employee Already exist.", 400));
        }
      }

      let employee = await EmployeeModel.findOne({
        contactNumber: contactNumber,
      });

      if (employee) {
        return next(new ErrorHandler("Employee Already exist.", 400));
      }

      const hashedPassword = await bcrypt.hash(
        password || name + "123",
        parseInt(process.env.SALT as string, 10)
      );

      // Generate QR code for the currentBarCode
      let currentBarCode;
      try {
        currentBarCode = await QRCode.toDataURL(name + "123"); // Using email as an example
      } catch (err) {
        return next(new ErrorHandler("QR Code generation failed.", 500));
      }
      // For Fixed Salary Employee
      const findJobProfile = await JobProfileModel.findOne({ jobProfileName });
      if (findJobProfile?.employmentType === "Fixed Salary Employee") {
        employee = await EmployeeModel.create({
          name,
          aadharNumber,
          PF_UAN_Number,
          ESI_ID,
          PAN_Number,
          salaryMode,
          bankDetails,
          groupId: groupId._id,
          jobProfileId: jobProfileId._id,
          email,
          contactNumber,
          employeeCode,
          password: hashedPassword,
          dateOfBirth,
          gender,
          dateOfJoining,
          salary,
          leaveTaken,
          currentBarCode,
          workingDays,
          workingHours,
          lunchTime,
          overTime,
          overTimeRate,
          addedby: addedBy,
        });
        let id;
        if (req.admin) {
          id = req.admin._id;
        } else {
          id = req.employee?._id;
        }
        console.log("id------salary", id);
        await SalaryLogModel.create({
          employeeId: employee._id,
          salary,
          workingHours,
          applicableMonth: new Date(),
          changedBy: id,
        });
      }
      // For Contract employee
      else if (findJobProfile?.employmentType === "Contract Employee") {
        employee = await EmployeeModel.create({
          name,
          aadharNumber,
          PF_UAN_Number,
          ESI_ID,
          PAN_Number,
          salaryMode,
          bankDetails,
          groupId: groupId._id,
          jobProfileId: jobProfileId._id,
          email,
          contactNumber,
          password: hashedPassword,
          dateOfBirth,
          gender,
          dateOfJoining,
          expactedSalary,
          leaveTaken,
          currentBarCode,
          addedby: addedBy,
        });
      }
      const employees = await EmployeeModel.find()
        .populate("groupId")
        .populate("jobProfileId")
        .exec();
      resp.status(201).json({
        success: true,
        message: "Employee created successfully.",
        employee,
        // employees,
      });
    } else {
      return next(
        new ErrorHandler("Login first as admin or Data Manager", 400)
      );
    }
  }
);

// update employee barcode
export const updateEmployeeBarCodes = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    try {
      // Find all employees or filter based on certain conditions
      let employees = await EmployeeModel.find({});

      if (!employees) {
        return next(new ErrorHandler("No employees found.", 404));
      }

      // For each employee, generate a random identifier and use it to generate the QR code
      for (let employee of employees) {
        // Generate a random identifier using uuid
        const randomIdentifier = uuidv4();

        // Generate QR code based on the random identifier
        const newBarCode = await QRCode.toDataURL(randomIdentifier);

        // Update currentBarCode
        employee.currentBarCode = newBarCode;
        await employee.save();
      }

      resp.status(200).json({
        success: true,
        message: "Employee barcodes updated successfully.",
      });
    } catch (error: any) {
      return next(new ErrorHandler("QR Code generation failed.", 500));
    }
  }
);

// update an employee
export const updateEmployee = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    if (req.admin || req.employee) {
      const id = req.params.id;
      let {
        name,
        group,
        jobProfile,
        email,
        employeeCode,
        contactNumber,
        password,
        dateOfBirth,
        gender,
        employeeStatus,
        dateOfJoining,
        salary,
        lunchTime,
        workingHours,
        workingDays,
        overTime,
        overTimeRate,
        leaveTaken,
        currentBarCode,
        aadharNumber,
        PF_UAN_Number,
        ESI_ID,
        PAN_Number,
        salaryMode,
        bankName,
        IFSC_Code,
        branch,
        accountNumber,
        role,
        optionForRole,
        active,
        applicableMonth,
      } = req.body;
      if (role) {
        const employee = await EmployeeModel.findById(id);
        let options: any = employee?.optionForRole;
        if (!options.includes(role)) {
          return resp.status(400).json({
            success: false,
            message: "Invalid role. Role is not included in options.",
          });
        }
      }
      let updated: any = {};
      if (req.employee) {
        const employee = await EmployeeModel.findById(req.employee._id);
        updated.by = employee?._id;
        updated.name = employee?.name;
      }
      if (req.admin) {
        const admin = await AdminModel.findById(req.admin._id);
        updated.by = admin?._id;
        updated.name = admin?.name;
      }
      if (active === false) {
        const employee = await EmployeeModel.findById(id);
        if (employee) {
          employee.BarCodeStatus = false;
          await employee.save();
        }
      }
      if (active === true) {
        const employee = await EmployeeModel.findById(id);
        if (employee) {
          employee.BarCodeStatus = true;
          await employee.save();
        }
      }
      if (email) {
        email = email.toLowerCase();
        let emp = await EmployeeModel.findOne({ email: email });
        if (emp) {
          return next(
            new ErrorHandler("Employee With same email already present.", 400)
          );
        }
      }
      if (group) {
        var groupId;
        const findGroup = await groupModel.findOne({ groupName: group });
        groupId = findGroup?._id;

        if (!findGroup) {
          return resp.status(404).json({
            success: false,
            message: "Group not found.",
          });
        }
      }

      if (jobProfile) {
        var jobProfileId;
        const findJobProfile = await JobProfileModel.findOne({
          jobProfileName: jobProfile,
        });
        jobProfileId = findJobProfile?._id;
        if (!findJobProfile) {
          return resp.status(404).json({
            success: false,
            message: "jobProfile not found.",
          });
        }
      }
      let employee = await EmployeeModel.findOne({ _id: id });
      if (!employee) {
        return next(new ErrorHandler("Employee doesn't exist.", 400));
      }
      if (employeeCode) {
        let employee = await EmployeeModel.findOne({ employeeCode });
        if (employee) {
          return next(
            new ErrorHandler(
              "Employee With same EmployeeCode already present.",
              400
            )
          );
        }
      }
      let hashedPassword;
      if (password) {
        hashedPassword = await bcrypt.hash(
          password,
          parseInt(process.env.SALT as string, 10)
        );
      }
      if (contactNumber) {
        // let check = await EmployeeModel.findOne({ employeeCode });
        // if (check) {
        //   return next(
        //     new ErrorHandler(
        //       "Employee With same Phone Number already present.",
        //       400
        //     )
        //   );
        // }
        let check1 = await EmployeeModel.findOne({ contactNumber });
        if (check1) {
          return next(
            new ErrorHandler(
              "Same phone number is already present in database.",
              400
            )
          );
        }

        let overTimeRatecal =
          (salary ? salary : employee?.salary) /
          (4.28 *
            (workingHours ? workingHours : employee?.workingHours) *
            (workingDays ? workingDays : employee?.workingDays));
        employee = await EmployeeModel.findByIdAndUpdate(
          { _id: id },
          {
            name,
            aadharNumber,
            groupId,
            jobProfileId,
            email,
            employeeCode,
            contactNumber,
            password: hashedPassword,
            dateOfBirth,
            gender,
            employeeStatus,
            dateOfJoining,
            salary,
            workingHours,
            workingDays,
            overTime,
            lunchTime,
            overTimeRate: overTimeRate ? overTimeRate : overTimeRatecal,
            leaveTaken,
            currentBarCode,
            verified: false,
            role: role,
            optionForRole,
            updateBy: updated,
            active,
          },
          { new: true }
        )
          .populate("groupId")
          .populate("jobProfileId")
          .exec();
        let idd;
        if (req.admin) {
          idd = req.admin._id;
        } else {
          idd = req.employee?._id;
        }
        if (salary || workingDays || workingHours) {
          await SalaryLogModel.create({
            employeeId: employee?._id,
            salary,
            workingHours,
            applicableMonth,
            changedBy: id,
          });
        }
      } else {
        const partialBankDetails: any = {};
        if (bankName) partialBankDetails.bankName = bankName;
        if (IFSC_Code) partialBankDetails.IFSC_Code = IFSC_Code;
        if (branch) partialBankDetails.branch = branch;
        if (accountNumber) partialBankDetails.accountNumber = accountNumber;

        let overTimeRatecal =
          (salary ? salary : employee?.salary) /
          (4.28 *
            (workingHours ? workingHours : employee?.workingHours) *
            (workingDays ? workingDays : employee?.workingDays));
        employee = await EmployeeModel.findByIdAndUpdate(
          { _id: id },
          {
            name,
            aadharNumber,
            PF_UAN_Number,
            ESI_ID,
            PAN_Number,
            salaryMode,
            $set: {
              bankDetails: { ...employee.bankDetails, ...partialBankDetails },
            },
            groupId,
            jobProfileId,
            email,
            employeeCode,
            password: hashedPassword,
            dateOfBirth,
            gender,
            lunchTime,
            employeeStatus,
            dateOfJoining,
            
            workingHours,
            workingDays,
            overTime,
            overTimeRate: overTimeRatecal,
            leaveTaken,
            currentBarCode,
            role: role,
            optionForRole,
            active,
            updateBy: updated,
          },
          { new: true }
        )
          .populate("groupId")
          .populate("jobProfileId")
          .exec();
        let idd;
        if (req.admin) {
          idd = req.admin._id;
        } else {
          idd = req.employee?._id;
        }
        if (salary) {
          await SalaryLogModel.create({
            employeeId: id,
            salary: salary ? salary : employee?.salary,
            applicableMonth: applicableMonth,
            changedBy: idd,
          });
        }
      }
      resp.status(201).json({
        success: true,
        message: "Employee updated successfully.",
        employee,
      });
    } else {
      return next(new ErrorHandler("Login first.", 401));
    }
  }
);

// delete an employee
export const deleteEmployee = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { id } = req.params;
    let employee = await EmployeeModel.findByIdAndDelete({ _id: id });
    if (!employee) {
      return next(new ErrorHandler("Employee doesn't exist.", 400));
    }
    const attendance = await attendanceModel.deleteMany({
      employeeId: employee._id,
    });
    resp.status(201).json({
      success: true,
      message: "Employee deleted successfully.",
      employee,
    });
  }
);
// getting employee with search and filter
export const getAllEmployee = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let jobProfileIds: any = [];
    const {
      jobProfileName,
      groupName,
      employmentStatus,
      departmentName,
      name,
      page = 1,
      limit = 20,
      aadhar,
      createdSort,
      updatedSort,
      role,
    } = req.body;
    // Create a filter object to hold the query conditions
    const filter: any = {};
    // Add groupName filter if provided
    if (role) {
      filter.role = role;
    }
    if (
      groupName &&
      Array.isArray(groupName) &&
      groupName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyGroupNames = groupName.filter((name) => name.trim() !== "");
      const groups = await groupModel
        .find({ groupName: { $in: nonEmptyGroupNames } })
        .exec();
      const groupIds: any = groups.map((group) => group._id);
      filter.groupId = { $in: groupIds };
    }

    // Add departmentName filter if provided and non-empty
    if (
      departmentName &&
      Array.isArray(departmentName) &&
      departmentName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyDepartmentNames = departmentName.filter(
        (name) => name.trim() !== ""
      );
      const departments = await departmentModel
        .find({ departmentName: { $in: nonEmptyDepartmentNames } })
        .exec();
      const departmentIds: any = departments.map(
        (department) => department._id
      );
      const jobProfiles = await JobProfileModel.find({
        department: { $in: departmentIds },
      }).exec();
      const jobProfileIds: any = jobProfiles.map(
        (jobProfile) => jobProfile._id
      );
      filter.jobProfileId = { $in: jobProfileIds };
    }

    // Add jobProfileName filter if provided and non-empty
    if (
      jobProfileName &&
      Array.isArray(jobProfileName) &&
      jobProfileName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyJobProfileNames = jobProfileName.filter(
        (name) => name.trim() !== ""
      );
      const jobProfiles = await JobProfileModel.find({
        jobProfileName: { $in: nonEmptyJobProfileNames },
      }).exec();
      const ids: any = jobProfiles.map((jobProfile) => jobProfile._id);
      jobProfileIds = [...jobProfileIds, ...ids];
      filter.jobProfileId = { $in: jobProfileIds };
    }

    if (employmentStatus) {
      filter.employeeStatus = employmentStatus;
    }

    // Add name search filter if provided
    if (name) {
      filter.$or = [
        { name: { $regex: name, $options: "i" } }, // Search by name using case-insensitive regex
        { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    let aadharNumbers: any = aadhar;
    aadharNumbers = parseInt(aadhar);

    if (typeof aadharNumbers != "undefined") {
      const aadharFilter: any = {};

      if (aadharNumbers === 1) {
        aadharFilter.$and = [
          { aadharNumber: { $exists: true } },
          { aadharNumber: { $ne: 0 } },
        ];
      } else if (aadharNumbers === -1) {
        aadharFilter.$or = [
          { aadharNumber: 0 },
          { aadharNumber: { $exists: false } },
        ];
      }
      Object.assign(filter, aadharFilter);
    }
    // Find employees based on the filter with pagination
    let emplys = await EmployeeModel.find(filter)
      .populate({
        path: "jobProfileId",
        select: "jobProfileName jobDescription employmentType isSupervisor",
      })
      .populate({
        path: "groupId",
        select: "groupName",
      })
      .skip(skip)
      .limit(limit)
      .select(
        "-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode"
      )
      .exec();
    if (createdSort === "True") {
      emplys = await EmployeeModel.find(filter)
        .populate({
          path: "jobProfileId",
          select: "jobProfileName jobDescription employmentType isSupervisor",
        })
        .populate({
          path: "groupId",
          select: "groupName",
        })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select(
          "-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode"
        )
        .exec();
    }
    if (updatedSort === "True") {
      emplys = await EmployeeModel.find(filter)
        .populate({
          path: "jobProfileId",
          select: "jobProfileName jobDescription employmentType isSupervisor",
        })
        .populate({
          path: "groupId",
          select: "groupName",
        })
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .select(
          "-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode"
        )
        .exec();
    }
    if (updatedSort === "False") {
      emplys = await EmployeeModel.find(filter)
        .populate({
          path: "jobProfileId",
          select: "jobProfileName jobDescription employmentType isSupervisor",
        })
        .populate({
          path: "groupId",
          select: "groupName",
        })
        .skip(skip)
        .limit(limit)
        .sort({ updatedAt: 1 })
        .select(
          "-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode"
        )
        .exec();
    }

    const employeeDocs = await EmployeeDocsModel.find().lean();
    const docsStore: any = {};
    employeeDocs.forEach((e) => {
      const id = e.employeeId + "";
      docsStore[id] = { ...e };
    });

    let employees = [];
    const loggedInHistory = await loginHistoryModel
      .find()
      .select({ logInTime: 1 })
      .lean();
    const loggedInHistoryStore: any = {};

    loggedInHistory.forEach((l) => {
      const id = l.user + "";
      if (!loggedInHistoryStore[id]) {
        loggedInHistoryStore[id] = { data: [] };
      }
      loggedInHistoryStore[id].data.push({ ...l });
    });

    for (let employee of emplys) {
      const employeeDocs = docsStore[employee._id + ""];
      const loggedHistory = loggedInHistoryStore[employee._id + ""]?.data || [];
      // const loggedHistory = await loginHistoryModel
      //   .find({ user: employee._id })
      //   .select("logInTime");
      const lastloggedHistory = loggedHistory[loggedHistory.length - 1];
      if (employeeDocs?.profilePicture) {
        const employeeCopy = JSON.parse(JSON.stringify(employee));
        employeeCopy.profilePicture = employeeDocs.profilePicture;
        employeeCopy.loggedHistory = lastloggedHistory;
        employees.push(employeeCopy);
      } else {
        const employeeCopy = JSON.parse(JSON.stringify(employee));

        employeeCopy.loggedHistory = lastloggedHistory;
        employees.push(employeeCopy);
      }
    }

    const count = await EmployeeModel.countDocuments(filter);
    resp.status(200).json({
      success: true,
      message: "Getting All Employee successfully.",
      employees,
      count,
    });
  }
);

// Login employee

export const loginEmployee = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { email, phone, password } = req.body;

    let employee = await EmployeeModel.findOne({
      $or: [{ email: email }, { contactNumber: phone }],
    }).select("+password");

    if (!employee) return next(new ErrorHandler("admin doesn't exist.", 400));

    const comparePassword = await bcrypt.compare(password, employee.password);

    if (!comparePassword)
      return next(new ErrorHandler("Employee or password doesn't match.", 400));

    sendCookieAdmin(resp, employee._id, `Welcome back, ${employee.name}`, 200);
  }
);

// to get dynamic fields
let dynamicallyAddedFields: any = [];

// add new field in employee model
export const addNewField = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    try {
      const { fields } = req.body;
      // Update the Mongoose schema to add the new fields
      const schema = EmployeeModel.schema;
      for (const field of fields) {
        schema.add({ [field.name]: field.type });
        // Add the field to the dynamically added fields array
        dynamicallyAddedFields.push({ name: field.name, type: field.type });
      }

      resp.status(200).json({ message: "Fields added successfully" });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ message: "Internal server error" });
    }
  }
);

// get newFields
export const getNewFields = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    try {
      resp.status(200).json({ fields: dynamicallyAddedFields });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ message: "Internal server error" });
    }
  }
);

//delete new fields
export const deleteNewFields = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    try {
      const { fieldName } = req.body;

      // Update the Mongoose schema to remove the specified field
      EmployeeModel.schema.remove(fieldName);

      resp.status(200).json({ message: "Field deleted successfully" });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ message: "Internal server error" });
    }
  }
);

//delete new fields
export const updateNewFields = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    try {
      const { oldFieldName, newFieldName } = req.body;

      // Update the Mongoose schema to modify the field name
      const schema = EmployeeModel.schema;
      schema.path(oldFieldName).path = newFieldName;

      // Update the field name in existing records
      await EmployeeModel.updateMany(
        {},
        { $rename: { [oldFieldName]: newFieldName } }
      );

      resp.status(200).json({ message: "Field name updated successfully" });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ message: "Internal server error" });
    }
  }
);

export const getAllFields = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    try {
      const newFields = [];

      // Get all the paths in the Mongoose schema
      const schemaPaths = EmployeeModel.schema.paths;

      for (const path in schemaPaths) {
        // Check if the path is not a default Mongoose field
        if (!path.startsWith("_")) {
          const field = {
            name: path,
            type: schemaPaths[path].instance,
          };
          newFields.push(field);
        }
      }

      resp.status(200).json({ fields: newFields });
    } catch (error) {
      console.error(error);
      resp.status(500).json({ message: "Internal server error" });
    }
  }
);

// single employee status
export const getSingle = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { employeeId } = req.params;
    if (employeeId) {
      const employeeData = await EmployeeModel.findById(employeeId)
        .populate("groupId")
        .populate("jobProfileId");
      const data = await EmployeeDocsModel.findOne({
        employeeId: employeeData?._id,
      });
      const ep = {
        ...employeeData?.toObject(),
        profilePicture: data?.profilePicture,
        docs: data?.document,
      };

      resp.status(200).json({
        success: true,
        message: "employee data successfully.",
        employeeData: ep,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "employee not found.",
      });
    }
  }
);

// get employee by group and jobProfile
export const getEmployeeByGroupAndJobProfile = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const { jobProfileName } = req.query;
    // let group;
    let jobProfile;

    // if (groupName) {
    //   group = await groupModel.findOne({ groupName });
    // }
    if (jobProfileName) {
      jobProfile = await JobProfileModel.findOne({ jobProfileName });
    }

    const employees = await EmployeeModel.find({
      jobProfileId: jobProfile?._id,
    }).lean(); // Use the lean() method to get plain JavaScript objects instead of Mongoose documents

    resp.status(200).json({
      success: true,
      message: "Employee data fetched successfully.",
      employees: Array.isArray(employees) ? employees : [employees],
    });
  }
);

// assign QR code
export const assignQrCode = catchErrorAsync(
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

    const { employeeId } = req.params;
    const { data } = req.body;

    let qrCode;
    try {
      qrCode = await QRCode.toDataURL(data); // Using email as an example
    } catch (err) {
      return next(new ErrorHandler("QR Code generation failed.", 500));
    }
    let employee = await EmployeeModel.findOne({ currentBarCode: qrCode });

    let employee1 = await EmployeeModel.findOne({ permanentBarCode: qrCode });

    if (employee || employee1) {
      return next(new ErrorHandler("This Qr code already assigned.", 400));
    }

    if (
      req.admin ||
      jobProfile?.jobProfileName.toLowerCase() === "hr" ||
      jobProfile?.jobProfileName.toLowerCase() === "security head" ||
      jobProfile?.jobProfileName.toLowerCase() === "security"
    ) {
      let employee = await EmployeeModel.findById(employeeId);

      if (!employee) {
        return next(new ErrorHandler("Employee not found.", 404));
      }

      const currentDate = new Date();
      employee = await EmployeeModel.findByIdAndUpdate(
        employeeId,
        {
          permanentBarCode: qrCode,
          permanentQrCodeAssign: currentDate,
          assignedBy: req.employee?._id || req.admin?._id,
          permanentBarCodeNumber: data,
        },
        { new: true }
      );
      const newData = await BarCode.findOneAndUpdate(
        { barCodeNumber: data, employeeId },
        { assignedBy: req.employee?._id || req.admin?._id }
      ).exec();

      resp.status(200).json({
        success: true,
        message: "QrCode Assigned successfully.",
        employee,
        newData,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "Login first as Security .",
      });
    }
  }
);

interface QueryParams {
  page?: string;
  limit?: string;
  date?: string;
}

// QR Code Assigned By me
export const assignedByMe = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    const { page, limit, date }: QueryParams = req.query;
    const pge: number = page ? parseInt(page) : 1; // Current page number (default: 1)
    const lmt: number = limit ? parseInt(limit) : 20; // Number of items per page (default: 10)
    let jobProfile;
    // checking the jobProfile Name
    if (req.employee) {
      jobProfile = await JobProfileModel.findById({
        _id: req.employee.jobProfileId,
      });
    }
    let filterDate;
    let nextDay;
    if (typeof date === "string") {
      filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
    } else {
      filterDate = new Date();
      filterDate.setHours(0, 0, 0, 0);
    }

    nextDay = new Date(filterDate);
    nextDay.setDate(filterDate.getDate() + 1);

    if (
      req.admin ||
      jobProfile?.jobProfileName.toLowerCase() === "hr" ||
      jobProfile?.jobProfileName.toLowerCase() === "security head" ||
      jobProfile?.jobProfileName.toLowerCase() === "security"
    ) {
      let employee;

      if (req.employee) {
        employee = await BarCode.find({
          assignedBy: req.employee?._id,
          createdAt: {
            $gte: filterDate,
            $lt: nextDay,
          },
        })
          .populate("employeeId")
          .sort({ createdAt: -1 })
          .skip((pge - 1) * lmt)
          .limit(lmt)
          .exec();
      } else if (req.admin) {
        employee = await BarCode.find({
          assignedBy: req.admin?._id,
          createdAt: {
            $gte: filterDate,
            $lt: nextDay,
          },
        })
          .populate("employeeId")
          .sort({ createdAt: -1 })
          .skip((pge - 1) * lmt)
          .limit(lmt)
          .exec();
      }

      resp.status(200).json({
        success: true,
        message: "getting all employee Assigned Qr by me successfully.",
        employee,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "Login first as Security .",
      });
    }
  }
);

// change password
export const changePassword = async (
  req: CustomRequest<EmployeeDocument>,
  resp: Response,
  next: NextFunction
) => {
  if (req.employee) {
    const { oldPassword, newPassword } = req.body;
    const comparePassword = await bcrypt.compare(
      oldPassword,
      req.employee.password
    );
    if (comparePassword) {
      const hashedPassword = await bcrypt.hash(
        newPassword,
        parseInt(process.env.SALT as string, 10)
      );

      const updatedEmployee = await EmployeeModel.findOneAndUpdate(
        { _id: req.employee._id },
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
      new ErrorHandler("Something went wrong. Login with employee.", 400)
    );
  }
};

// new password generate with old password
export const newPasswordGenerator = async (
  req: CustomRequest<EmployeeDocument>,
  resp: Response,
  next: NextFunction
) => {
  if (req.admin) {
    const { employeeId } = req.params;
    const { password } = req.body;
    const employee = await EmployeeModel.findOne({ _id: employeeId });

    if (!employee) {
      return next(new ErrorHandler("Employee not found", 404));
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT as string, 10)
    );

    const updatedEmployee = await EmployeeModel.findOneAndUpdate(
      { _id: employee._id },
      { password: hashedPassword },
      { new: true }
    );
    resp.status(200).json({
      success: true,
      message: "Password changed successfully.",
      employee: updatedEmployee,
    });
  } else {
    resp.status(403).json({
      success: false,
      message: "Login as admin.",
    });
  }
};

// getting salary log
export const salaryLogPerEmployee = async (
  req: CustomRequest<EmployeeDocument>,
  resp: Response,
  next: NextFunction
) => {
  const jobProfile = await JobProfileModel.findOne({
    _id: req.employee?.jobProfileId,
  });
  if (req.admin || jobProfile?.jobProfileName.toLowerCase() === "hr") {
    const { employeeId } = req.params;
    const employee = await EmployeeModel.findOne({ _id: employeeId });

    if (!employee) {
      return next(new ErrorHandler("Employee not found", 404));
    } 
    const salaryLog: any = await SalaryLogModel.find({
      employeeId: employee._id,
    })
      .sort({ createdAt: -1 })
      .exec();
    const data: any[] = [];

    for (let item of salaryLog) {
      const admin = await AdminModel.findById(item.changedBy);
      const employee = await EmployeeModel.findById(item.changedBy);

      if (admin) {
        data.push({
          ...item._doc,
          changed: admin.name,
        });
      } else if (employee) {
        data.push({
          ...item._doc,
          changed: employee.name,
        });
      }
    }
    resp.status(200).json({
      success: true,
      message: "getting salary log successfully.",
      salaryLog:data,
    });
  } else {
    resp.status(403).json({
      success: false,
      message: "Login as Hr or admin.",
    });
  }
};
// Define an interface to represent the Employee model
interface Employee {
  name: string;
  // Add other fields if necessary
}
export const employeeBarCode = catchErrorAsync(
  async (req: Request, resp: Response, next: NextFunction) => {
    const employeeBarCodes: Array<{
      name: string;
      employeeCode: string;
      barCodes: string[];
    }> = [];

    const allBarCodes = await BarCode.find({});

    // Fetch all employees whose IDs are in the barcodes
    const employeeIds = allBarCodes.map((barcode) => barcode.employeeId);
    const employees = await EmployeeModel.find({ _id: { $in: employeeIds } });

    employees.forEach((employee) => {
      const employeeIdString = employee._id.toString();
      const employeeName = employee.name;
      const employeeCode = employee.employeeCode;

      const employeeBarCodeNumbers = allBarCodes
        .filter((barcode) => barcode.employeeId.toString() === employeeIdString)
        .map((barcode) => barcode.barCodeNumber);

      employeeBarCodes.push({
        name: employeeName,
        employeeCode: employeeCode,
        barCodes: employeeBarCodeNumbers,
      });
    });

    resp.status(200).json({
      success: true,
      message: "Bar Code.",
      employeeBarCodesLength: employeeBarCodes.length,
      employeeBarCodes,
    });
  }
);