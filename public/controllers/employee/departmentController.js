"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDepartment = exports.newChildDepartmentAllData = exports.childDepartmentAllData = exports.getJobProfileInDepartment = exports.getDepartmentByParent = exports.getAllDepartment = exports.getAllParentDepartment = exports.deleteDepartmentToJobProfile = exports.addDepartmentToJobProfile = exports.updateHierarchyDepartment = exports.addParentDepartment = exports.updateParentDepartment = exports.updateDepartment = exports.addDepartment = void 0;
const attendanceModel_1 = __importDefault(require("../../database/models/attendanceModel"));
const department_1 = __importDefault(require("../../database/models/department"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const parentDepartment_1 = __importDefault(require("../../database/models/parentDepartment"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
// add department
exports.addDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { departmentName, description, parentDepartmentName } = req.body;
    // find parentGroupID
    departmentName = departmentName.trim();
    let department = await department_1.default.findOne({ departmentName });
    if (department) {
        return resp.status(400).json({
            success: false,
            message: "Department with same name already present.",
        });
    }
    let parent;
    if (parentDepartmentName) {
        parent = await parentDepartment_1.default.findOne({
            departmentName: parentDepartmentName,
        });
        if (!parent) {
            return resp.status(400).json({
                success: false,
                message: "Parent department not found.",
            });
        }
    }
    const newDepartment = await department_1.default.create({
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
});
exports.updateDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    let { departmentName, description } = req.body;
    let department = await department_1.default.findById(id);
    if (department) {
        let allDepartment = await department_1.default.findOne({
            departmentName: departmentName,
        });
        if (allDepartment) {
            return resp.status(400).json({
                success: false,
                message: "Department with same name already present.",
            });
        }
        else {
            await department_1.default.findByIdAndUpdate(id, {
                departmentName: departmentName,
                description: description,
            });
            resp.status(201).json({
                success: true,
                message: "updated department successfully.",
            });
        }
    }
    else {
        resp.status(400).json({
            success: false,
            message: "Department not found.",
        });
    }
});
exports.updateParentDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    let { departmentName, description } = req.body;
    let department = await parentDepartment_1.default.findById(id);
    if (department) {
        let allDepartment = await parentDepartment_1.default.findOne({
            departmentName: departmentName,
        });
        if (allDepartment) {
            return resp.status(400).json({
                success: false,
                message: "Department with same name already present.",
            });
        }
        else {
            await parentDepartment_1.default.findByIdAndUpdate(id, {
                departmentName: departmentName,
                description: description,
            });
            resp.status(201).json({
                success: true,
                message: "updated department successfully.",
            });
        }
    }
    else {
        resp.status(400).json({
            success: false,
            message: "Department not found.",
        });
    }
});
// add new parent department
exports.addParentDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { departmentName, description } = req.body;
    // find parentGroupID
    departmentName = departmentName.trim();
    let department = await parentDepartment_1.default.findOne({ departmentName });
    if (department) {
        return resp.status(400).json({
            success: false,
            message: "Department with same name already present.",
        });
    }
    const newParentDepartment = await parentDepartment_1.default.create({
        departmentName,
        description,
    });
    resp.status(201).json({
        success: true,
        message: "Created Parent Department successfully.",
        Department: newParentDepartment,
    });
});
// add new parent department
exports.updateHierarchyDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { departmentName, parentDepartmentName } = req.body;
    // find parentGroupID
    departmentName = departmentName.trim();
    parentDepartmentName = parentDepartmentName.trim();
    let department = await department_1.default.findOne({ departmentName });
    if (!department) {
        return resp.status(404).json({
            success: false,
            message: "Department not found.",
        });
    }
    let parentDepartment = await parentDepartment_1.default.findOne({
        departmentName: parentDepartmentName,
    });
    if (!parentDepartment) {
        return resp.status(404).json({
            success: false,
            message: "Parent department Not Found.",
        });
    }
    if (department.parentDepartmentId) {
        await parentDepartment_1.default
            .findByIdAndUpdate({ _id: department.parentDepartmentId }, { $pull: { childDepartmentId: department._id } }, { new: true })
            .exec();
    }
    parentDepartment.childDepartmentId.push(department._id);
    await parentDepartment.save();
    let updatedDepartment = await department_1.default
        .findByIdAndUpdate({ _id: department._id }, { parentDepartmentId: parentDepartment._id }, { new: true })
        .exec();
    resp.status(201).json({
        success: true,
        message: "Updated Hierarchy of department successfully.",
        updatedDepartment,
        parentDepartment,
    });
});
// add department to a jobProfile
exports.addDepartmentToJobProfile = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { departmentName, jobProfileName } = req.body;
    // find parentGroupID
    // departmentName = departmentName.trim();
    let department = await department_1.default.findOne({ departmentName });
    if (!department) {
        return resp.status(404).json({
            success: false,
            message: "Department not found.",
        });
    }
    let jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
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
});
// delete department to a jobProfile
exports.deleteDepartmentToJobProfile = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { departmentName, jobProfileName } = req.body;
    // find parentGroupID
    // departmentName = departmentName.trim();
    let department = await department_1.default.findOne({ departmentName });
    if (!department) {
        return resp.status(404).json({
            success: false,
            message: "Department not found.",
        });
    }
    let jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
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
});
// getting all parent department
exports.getAllParentDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    const allParentDepartment = await parentDepartment_1.default
        .find({})
        .populate("childDepartmentId")
        .exec();
    return resp.status(200).json({
        success: true,
        message: "Getting all parent department successfully.",
        allParentDepartment,
    });
});
// getting all department
exports.getAllDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    const allDepartment = await department_1.default
        .find({})
        .populate("parentDepartmentId")
        .exec();
    return resp.status(200).json({
        success: true,
        message: "Getting all department successfully.",
        allDepartment,
    });
});
// getting department by parent department
exports.getDepartmentByParent = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { departmentName } = req.query;
    // getting the parent department details
    const parent = await parentDepartment_1.default.findOne({ departmentName });
    if (!parent) {
        return resp.status(404).json({
            success: false,
            message: "Parent department not found.",
        });
    }
    const allDepartment = await department_1.default.find({
        parentDepartmentId: parent._id,
    });
    return resp.status(200).json({
        success: true,
        message: "Getting all department successfully.",
        allDepartment,
    });
});
// getting all department
exports.getJobProfileInDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { departmentName } = req.query;
    const department = await department_1.default.findOne({ departmentName });
    if (!department) {
        return resp.status(404).json({
            success: false,
            message: "Department not found.",
        });
    }
    const jobProfile = await jobProfileModel_1.default.find({
        department: department._id,
    });
    return resp.status(200).json({
        success: true,
        message: `Getting all job Profile successfully of department ${departmentName}.`,
        jobProfile,
    });
});
// all data per department
exports.childDepartmentAllData = (0, catchAsyncError_1.default)(async (req, resp) => {
    let { departmentName, date, nextDate } = req.query;
    let filterDate;
    let nextDay;
    if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
    }
    else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
    }
    if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 1);
    }
    else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 1);
    }
    const parentDepartment = await parentDepartment_1.default.findOne({
        departmentName,
    });
    if (!parentDepartment) {
        return resp.status(404).json({
            success: false,
            message: "Parent Department not found.",
        });
    }
    const departmentArrary = await department_1.default
        .find({ parentDepartmentId: parentDepartment._id })
        .lean();
    let dep = [];
    for (let department of departmentArrary) {
        const jobProfilesArray = await jobProfileModel_1.default.find({
            department: department._id,
        });
        let data = [];
        for (let jobProfile of jobProfilesArray) {
            const employees = await employeeModel_1.default.find({
                jobProfileId: jobProfile._id,
            }).select({ _id: 1 });
            const ids = employees.map((e) => e._id);
            let totalHours = 0;
            for (let e of employees) {
                totalHours += e.workingHours;
            }
            const todaysAttendance = await attendanceModel_1.default.find({
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
});
// for better time complexity
exports.newChildDepartmentAllData = (0, catchAsyncError_1.default)(async (req, resp) => {
    const jobProfileStore = {};
    const employeeStore = {};
    const attendanceStore = {};
    let { departmentName, date, nextDate } = req.query;
    let filterDate;
    let nextDay;
    if (typeof date === "string") {
        filterDate = new Date(date);
        filterDate.setHours(0, 0, 0, 0);
    }
    else {
        filterDate = new Date();
        filterDate.setHours(0, 0, 0, 0);
    }
    if (typeof nextDate === "string") {
        nextDay = new Date(nextDate);
        nextDay.setHours(0, 0, 0, 0);
        nextDay.setDate(nextDay.getDate() + 1);
    }
    else {
        nextDay = new Date(filterDate);
        nextDay.setDate(filterDate.getDate() + 1);
    }
    const parentDepartment = await parentDepartment_1.default.findOne({
        departmentName,
    });
    if (!parentDepartment) {
        return resp.status(404).json({
            success: false,
            message: "Parent Department not found.",
        });
    }
    const departmentArrary = await department_1.default
        .find({ parentDepartmentId: parentDepartment._id })
        .lean();
    const jobProfileArray = await jobProfileModel_1.default.find({}).lean();
    const employees = await employeeModel_1.default.find({}).lean();
    const attendance = await attendanceModel_1.default
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
    const departmentSalary = [];
    departmentArrary.forEach((d) => {
        const id = d._id + "";
        const jobProfiles = jobProfileStore[id];
        const salaryData = [];
        if (jobProfiles) {
            jobProfiles.value.forEach((j) => {
                const employee = employeeStore[j.jobProfileId];
                let employeeWorkingHours = 0;
                let employeePendingHours = 0;
                let employeeTotalEarning = 0;
                let employeeTotalHours = 0;
                let totalSalaryOfEmployee = 0;
                let totalPresent = 0;
                if (employee) {
                    employee.value.forEach((e) => {
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
});
exports.deleteDepartment = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    const department = await department_1.default.findById(id);
    let numberOfJobProfiles = null;
    if (!department) {
        return resp.status(404).json({
            success: false,
            message: "Department not found.",
        });
    }
    const matchingEmployees = await jobProfileModel_1.default.find({
        department: department._id,
    });
    numberOfJobProfiles = matchingEmployees.length;
    if (numberOfJobProfiles > 0) {
        return resp.status(200).json({
            success: false,
            message: "Department cannot be deleted because it has job profiles.",
            numberOfJobProfiles,
        });
    }
    else {
        const department = await department_1.default.findByIdAndDelete(id);
        return resp.status(200).json({
            success: true,
            message: `Department Deleted successfully`,
            numberOfJobProfiles,
        });
    }
});
