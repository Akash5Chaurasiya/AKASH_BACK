import attendanceModel from "../../database/models/attendanceModel";
import departmentModel from "../../database/models/department";
import EmployeeModel from "../../database/models/employeeModel";
import JobProfileModel from "../../database/models/jobProfileModel";
import parentDepartmentModel from "../../database/models/parentDepartment";
import catchErrorAsync from "../../utils/catchAsyncError";
import { Request, Response, NextFunction } from "express";
import { ParsedQs } from "qs";
// add department
export const addDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { departmentName, description, parentDepartmentName } = req.body;
    // find parentGroupID
    departmentName = departmentName.trim();
    let department = await departmentModel.findOne({ departmentName });
    if (department) {
      return resp.status(400).json({
        success: false,
        message: "Department with same name already present.",
      });
    }
    let parent;
    if (parentDepartmentName) {
      parent = await parentDepartmentModel.findOne({
        departmentName: parentDepartmentName,
      });
      if (!parent) {
        return resp.status(400).json({
          success: false,
          message: "Parent department not found.",
        });
      }
    }
    const newDepartment = await departmentModel.create({
      departmentName,
      description,
      parentDepartmentId: parent?._id,
    });
    parent?.childDepartmentId.push(newDepartment._id);
    await parent?.save();
    resp.status(201).json({
      success: true,
      message: "Created department successfully.",
      Department: newDepartment,
      parent,
    });
  }
);
export const updateDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    let { departmentName, description } = req.body;
    let department = await departmentModel.findById(id);
    if (department) {
      let allDepartment = await departmentModel.findOne({
        departmentName: departmentName,
      });
      if (allDepartment) {
        return resp.status(400).json({
          success: false,
          message: "Department with same name already present.",
        });
      } else {
        await departmentModel.findByIdAndUpdate(id, {
          departmentName: departmentName,
          description: description,
        });
        resp.status(201).json({
          success: true,
          message: "updated department successfully.",
        });
      }
    } else {
      resp.status(400).json({
        success: false,
        message: "Department not found.",
      });
    }
  }
);
export const updateParentDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    let { departmentName, description } = req.body;
    let department = await parentDepartmentModel.findById(id);
    if (department) {
      let allDepartment = await parentDepartmentModel.findOne({
        departmentName: departmentName,
      });
      if (allDepartment) {
        return resp.status(400).json({
          success: false,
          message: "Department with same name already present.",
        });
      } else {
        await parentDepartmentModel.findByIdAndUpdate(id, {
          departmentName: departmentName,
          description: description,
        });
        resp.status(201).json({
          success: true,
          message: "updated department successfully.",
        });
      }
    } else {
      resp.status(400).json({
        success: false,
        message: "Department not found.",
      });
    }
  }
);

// add new parent department
export const addParentDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { departmentName, description } = req.body;
    // find parentGroupID
    departmentName = departmentName.trim();
    let department = await parentDepartmentModel.findOne({ departmentName });
    if (department) {
      return resp.status(400).json({
        success: false,
        message: "Department with same name already present.",
      });
    }
    const newParentDepartment = await parentDepartmentModel.create({
      departmentName,
      description,
    });

    resp.status(201).json({
      success: true,
      message: "Created Parent Department successfully.",
      Department: newParentDepartment,
    });
  }
);

// add new parent department
export const updateHierarchyDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { departmentName, parentDepartmentName } = req.body;
    // find parentGroupID
    departmentName = departmentName.trim();
    parentDepartmentName = parentDepartmentName.trim();
    let department = await departmentModel.findOne({ departmentName });
    if (!department) {
      return resp.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }
    let parentDepartment = await parentDepartmentModel.findOne({
      departmentName: parentDepartmentName,
    });
    if (!parentDepartment) {
      return resp.status(404).json({
        success: false,
        message: "Parent department Not Found.",
      });
    }

    if (department.parentDepartmentId) {
      await parentDepartmentModel
        .findByIdAndUpdate(
          { _id: department.parentDepartmentId },
          { $pull: { childDepartmentId: department._id } },
          { new: true }
        )
        .exec();
    }
    parentDepartment.childDepartmentId.push(department._id);
    await parentDepartment.save();

    let updatedDepartment = await departmentModel
      .findByIdAndUpdate(
        { _id: department._id },
        { parentDepartmentId: parentDepartment._id },
        { new: true }
      )
      .exec();

    resp.status(201).json({
      success: true,
      message: "Updated Hierarchy of department successfully.",
      updatedDepartment,
      parentDepartment,
    });
  }
);

// add department to a jobProfile
export const addDepartmentToJobProfile = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { departmentName, jobProfileName } = req.body;
    // find parentGroupID
    // departmentName = departmentName.trim();
    let department = await departmentModel.findOne({ departmentName });
    if (!department) {
      return resp.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }
    let jobProfile = await JobProfileModel.findOne({ jobProfileName });
    if (!jobProfile) {
      return resp.status(404).json({
        success: false,
        message: "Job profile not found.",
      });
    }
    jobProfile.department = department._id;
    await jobProfile.save();

    resp.status(201).json({
      success: true,
      message: "Added department to jobProfile.",
      jobProfile,
    });
  }
);
// delete department to a jobProfile
export const deleteDepartmentToJobProfile = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { departmentName, jobProfileName } = req.body;
    // find parentGroupID
    // departmentName = departmentName.trim();
    let department = await departmentModel.findOne({ departmentName });
    if (!department) {
      return resp.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }
    let jobProfile = await JobProfileModel.findOne({ jobProfileName });
    if (!jobProfile) {
      return resp.status(404).json({
        success: false,
        message: "Job profile not found.",
      });
    }
    jobProfile.department = null;
    await jobProfile.save();

    resp.status(201).json({
      success: true,
      message: "deleted department to jobProfile.",
      jobProfile,
    });
  }
);

// getting all parent department
export const getAllParentDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const allParentDepartment = await parentDepartmentModel
      .find({})
      .populate("childDepartmentId")
      .exec();

    return resp.status(200).json({
      success: true,
      message: "Getting all parent department successfully.",
      allParentDepartment,
    });
  }
);

// getting all department
export const getAllDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const allDepartment = await departmentModel
      .find({})
      .populate("parentDepartmentId")
      .exec();

    return resp.status(200).json({
      success: true,
      message: "Getting all department successfully.",
      allDepartment,
    });
  }
);

// getting department by parent department
export const getDepartmentByParent = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { departmentName } = req.query;

    // getting the parent department details
    const parent = await parentDepartmentModel.findOne({ departmentName });
    if (!parent) {
      return resp.status(404).json({
        success: false,
        message: "Parent department not found.",
      });
    }

    const allDepartment = await departmentModel.find({
      parentDepartmentId: parent._id,
    });

    return resp.status(200).json({
      success: true,
      message: "Getting all department successfully.",
      allDepartment,
    });
  }
);

// getting all department
export const getJobProfileInDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { departmentName } = req.query;

    const department = await departmentModel.findOne({ departmentName });
    if (!department) {
      return resp.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }
    const jobProfile = await JobProfileModel.find({
      department: department._id,
    });

    return resp.status(200).json({
      success: true,
      message: `Getting all job Profile successfully of department ${departmentName}.`,
      jobProfile,
    });
  }
);

// parent department -- department and jobprofiles in department and total number of employees with salary
interface QueryData extends ParsedQs {
  departmentName: string;
  date: string;
  [key: string]: any; // Allow any other properties on the query
}

// all data per department

export const childDepartmentAllData = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { departmentName, date, nextDate }: QueryData = req.query as QueryData;

    let filterDate;
    let nextDay;
    if (typeof date === "string") {
      filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
    } else {
      filterDate = new Date();
      filterDate.setHours(0, 0, 0, 0);
    }
    if (typeof nextDate === "string") {
      nextDay = new Date(nextDate);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setDate(nextDay.getDate() + 1);
    } else {
      nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
    }
    const parentDepartment = await parentDepartmentModel.findOne({
      departmentName,
    });
    if (!parentDepartment) {
      return resp.status(404).json({
        success: false,
        message: "Parent Department not found.",
      });
    }

    const departmentArrary = await departmentModel
      .find({ parentDepartmentId: parentDepartment._id })
      .lean();
    let dep = [];
    for (let department of departmentArrary) {
      const jobProfilesArray = await JobProfileModel.find({
        department: department._id,
      });
      let data = [];
      for (let jobProfile of jobProfilesArray) {
        const employees = await EmployeeModel.find({
          jobProfileId: jobProfile._id,
        }).select({ _id: 1 });
        const ids = employees.map((e) => e._id);
        let totalHours = 0;
        for (let e of employees) {
          totalHours += e.workingHours;
        }
        const todaysAttendance = await attendanceModel.find({
          date: {
            $gte: filterDate,
            $lt: nextDay,
          },
          employeeId: { $in: ids },
        });
        let pendingHours = 0;
        let workingHours = 0;
        let totalEarning = 0;
        for (let total of todaysAttendance) {
          pendingHours += total.pendingHours;
          workingHours += total.workingHours;
          totalEarning += total.totalEarning;
        }
        const obj = {
          pendingHours,
          workingHours,
          totalEarning,
          totalHours,
          jobProfileName: jobProfile.jobProfileName,
          totalEmployee: ids.length,
        };
        data.push(obj);
      }
      const obj = {
        departmentName: department.departmentName,
        departmentDescription: department.description,
        data: data,
      };
      dep.push(obj);
    }

    resp.status(200).json({
      success: true,
      message: "Getting data successfully",
      dep,
    });
  }
);

// for better time complexity
export const newChildDepartmentAllData = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const jobProfileStore: Record<
      string,
      {
        value: {
          jobProfileName: string;
          jobProfileId: string;
        }[];
      }
    > = {};
    const employeeStore: Record<
      string,
      {
        value: {
          id: string;
          name: string;
          workingHours: number;
          salary: number;
        }[];
      }
    > = {};
    const attendanceStore: Record<
      string,
      {
        employeeId: string;
        workingHours: number;
        pendingHours: number;
        totolEarning: number;
      }
    > = {};

    let { departmentName, date, nextDate }: QueryData = req.query as QueryData;

    let filterDate;
    let nextDay;
    if (typeof date === "string") {
      filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
    } else {
      filterDate = new Date();
      filterDate.setHours(0, 0, 0, 0);
    }
    if (typeof nextDate === "string") {
      nextDay = new Date(nextDate);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setDate(nextDay.getDate() + 1);
    } else {
      nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
    }
    const parentDepartment = await parentDepartmentModel.findOne({
      departmentName,
    });
    if (!parentDepartment) {
      return resp.status(404).json({
        success: false,
        message: "Parent Department not found.",
      });
    }

    const departmentArrary = await departmentModel
      .find({ parentDepartmentId: parentDepartment._id })
      .lean();
    const jobProfileArray = await JobProfileModel.find({}).lean();
    const employees = await EmployeeModel.find({}).lean();
    const attendance = await attendanceModel
      .find({
        date: {
          $gte: filterDate,
          $lt: nextDay,
        },
      })
      .lean();

    jobProfileArray.forEach((d) => {
      const id = d.department + "";
      if (!jobProfileStore[id]) {
        jobProfileStore[id] = { value: [] };
      }
      jobProfileStore[id].value.push({
        jobProfileName: d.jobProfileName,
        jobProfileId: d._id,
      });
    });

    employees.forEach((d) => {
      const id = d.jobProfileId + "";
      if (!employeeStore[id]) {
        employeeStore[id] = { value: [] };
      }
      const obj = {
        id: d._id,
        name: d.name,
        workingHours: d.workingHours,
        salary: d.salary,
      };
      employeeStore[id].value.push(obj);
    });

    attendance.forEach((d) => {
      const id = d.employeeId + "";

      attendanceStore[id] = {
        employeeId: id,
        workingHours: d.workingHours ? d.workingHours : 0,
        pendingHours: d.pendingHours ? d.pendingHours : 0,
        totolEarning: d.totalEarning ? d.totalEarning : 0,
      };
    });

    const departmentSalary: any = [];
    departmentArrary.forEach((d) => {
      const id = d._id + "";
      const jobProfiles = jobProfileStore[id];

      const salaryData: any = [];
      if (jobProfiles) {
        jobProfiles.value.forEach((j: any) => {
          const employee = employeeStore[j.jobProfileId];

          let employeeWorkingHours = 0;
          let employeePendingHours = 0;
          let employeeTotalEarning = 0;
          let employeeTotalHours = 0;
          let totalSalaryOfEmployee = 0;
          let totalPresent = 0;

          if (employee) {
            employee.value.forEach((e: any) => {
              const id = e.id + "";
              employeeTotalHours += e.workingHours;
              totalSalaryOfEmployee += e.salary;

              const salary = attendanceStore[id];

              if (attendanceStore[id]) {
                totalPresent++;
                employeeWorkingHours += salary.workingHours;
                employeeTotalEarning += salary.totolEarning;
                employeePendingHours += salary.pendingHours;
              }
            });

            const obj = {
              jobProfilesName: j.jobProfileName,
              numberOfEmployee: employee.value.length,
              employeeWorkingHours,
              employeePendingHours,
              employeeTotalEarning,
              employeeTotalHours,
              totalSalaryOfEmployee,
            };
            salaryData.push(obj);
          }
        });
        departmentSalary.push({
          departmentName: d.departmentName,
          departmentDescription: d.description,
          numberOfJobProfiles: jobProfiles.value.length,
          salaryData,
        });
      }
    });

    resp.status(200).json({
      success: true,
      message: "Getting data successfully",
      departmentSalary,
    });
  }
);
export const deleteDepartment = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const department = await departmentModel.findById(id);
    let numberOfJobProfiles: any = null;
    if (!department) {
      return resp.status(404).json({
        success: false,
        message: "Department not found.",
      });
    }
    const matchingEmployees = await JobProfileModel.find({
      department: department._id,
    });
    numberOfJobProfiles = matchingEmployees.length;
    if (numberOfJobProfiles > 0) {
      return resp.status(200).json({
        success: false,
        message: "Department cannot be deleted because it has job profiles.",
        numberOfJobProfiles,
      });
    } else {
      const department = await departmentModel.findByIdAndDelete(id);
      return resp.status(200).json({
        success: true,
        message: `Department Deleted successfully`,
        numberOfJobProfiles,
      });
    }
  }
);
