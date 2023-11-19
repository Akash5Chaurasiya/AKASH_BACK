"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeBarCode = exports.salaryLogPerEmployee = exports.newPasswordGenerator = exports.changePassword = exports.assignedByMe = exports.assignQrCode = exports.getEmployeeByGroupAndJobProfile = exports.getSingle = exports.getAllFields = exports.updateNewFields = exports.deleteNewFields = exports.getNewFields = exports.addNewField = exports.loginEmployee = exports.getAllEmployee = exports.deleteEmployee = exports.updateEmployee = exports.updateEmployeeBarCodes = exports.addEmployee = void 0;
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const groupModel_1 = __importDefault(require("../../database/models/groupModel"));
const QRCode = __importStar(require("qrcode"));
const sendCookie_1 = require("../../utils/sendCookie");
const barCodeModel_1 = __importDefault(require("../../database/models/barCodeModel"));
const employeeDocsModel_1 = __importDefault(require("../../database/models/employeeDocsModel"));
const salaryLogModel_1 = __importDefault(require("../../database/models/salaryLogModel"));
const department_1 = __importDefault(require("../../database/models/department"));
const attendanceModel_1 = __importDefault(require("../../database/models/attendanceModel"));
const loginHistoryModel_1 = __importDefault(require("../../database/models/loginHistoryModel"));
const adminModel_1 = __importDefault(require("../../database/models/adminModel"));
// adding a employee
exports.addEmployee = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    let { name, aadharNumber, groupName, jobProfileName, email, employeeCode, contactNumber, password, dateOfBirth, gender, dateOfJoining, salary, expactedSalary, leaveTaken, workingDays, workingHours, lunchTime, overTime, overTimeRate, PF_UAN_Number, ESI_ID, PAN_Number, salaryMode, bankDetails, } = req.body;
    if (email) {
        email = email.toLowerCase();
    }
    name = name.trim();
    // for athentication
    let authorised = false;
    let addedBy = {};
    if (req.dbManager) {
        const emp = await employeeModel_1.default.findById(req.dbManager._id);
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
        const groupId = await groupModel_1.default.findOne({ groupName });
        if (!groupId) {
            return next(new errorHandler_1.default("Group not found", 404));
        }
        const jobProfileId = await jobProfileModel_1.default.findOne({ jobProfileName });
        if (!jobProfileId) {
            return next(new errorHandler_1.default("JobProfile not found", 404));
        }
        if (email) {
            let employee = await employeeModel_1.default.findOne({ email: email });
            if (employee) {
                return next(new errorHandler_1.default("Employee Already exist.", 400));
            }
        }
        let employee = await employeeModel_1.default.findOne({
            contactNumber: contactNumber,
        });
        if (employee) {
            return next(new errorHandler_1.default("Employee Already exist.", 400));
        }
        const hashedPassword = await bcrypt_1.default.hash(password || name + "123", parseInt(process.env.SALT, 10));
        // Generate QR code for the currentBarCode
        let currentBarCode;
        try {
            currentBarCode = await QRCode.toDataURL(name + "123"); // Using email as an example
        }
        catch (err) {
            return next(new errorHandler_1.default("QR Code generation failed.", 500));
        }
        // For Fixed Salary Employee
        const findJobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
        if (findJobProfile?.employmentType === "Fixed Salary Employee") {
            employee = await employeeModel_1.default.create({
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
            }
            else {
                id = req.employee?._id;
            }
            console.log("id------salary", id);
            await salaryLogModel_1.default.create({
                employeeId: employee._id,
                salary,
                workingHours,
                applicableMonth: new Date(),
                changedBy: id,
            });
        }
        // For Contract employee
        else if (findJobProfile?.employmentType === "Contract Employee") {
            employee = await employeeModel_1.default.create({
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
        const employees = await employeeModel_1.default.find()
            .populate("groupId")
            .populate("jobProfileId")
            .exec();
        resp.status(201).json({
            success: true,
            message: "Employee created successfully.",
            employee,
            // employees,
        });
    }
    else {
        return next(new errorHandler_1.default("Login first as admin or Data Manager", 400));
    }
});
// update employee barcode
exports.updateEmployeeBarCodes = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    try {
        // Find all employees or filter based on certain conditions
        let employees = await employeeModel_1.default.find({});
        if (!employees) {
            return next(new errorHandler_1.default("No employees found.", 404));
        }
        // For each employee, generate a random identifier and use it to generate the QR code
        for (let employee of employees) {
            // Generate a random identifier using uuid
            const randomIdentifier = (0, uuid_1.v4)();
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
    }
    catch (error) {
        return next(new errorHandler_1.default("QR Code generation failed.", 500));
    }
});
// update an employee
exports.updateEmployee = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    if (req.admin || req.employee) {
        const id = req.params.id;
        let { name, group, jobProfile, email, employeeCode, contactNumber, password, dateOfBirth, gender, employeeStatus, dateOfJoining, salary, lunchTime, workingHours, workingDays, overTime, overTimeRate, leaveTaken, currentBarCode, aadharNumber, PF_UAN_Number, ESI_ID, PAN_Number, salaryMode, bankName, IFSC_Code, branch, accountNumber, role, optionForRole, active, applicableMonth, } = req.body;
        if (role) {
            const employee = await employeeModel_1.default.findById(id);
            let options = employee?.optionForRole;
            if (!options.includes(role)) {
                return resp.status(400).json({
                    success: false,
                    message: "Invalid role. Role is not included in options.",
                });
            }
        }
        let updated = {};
        if (req.employee) {
            const employee = await employeeModel_1.default.findById(req.employee._id);
            updated.by = employee?._id;
            updated.name = employee?.name;
        }
        if (req.admin) {
            const admin = await adminModel_1.default.findById(req.admin._id);
            updated.by = admin?._id;
            updated.name = admin?.name;
        }
        if (active === false) {
            const employee = await employeeModel_1.default.findById(id);
            if (employee) {
                employee.BarCodeStatus = false;
                await employee.save();
            }
        }
        if (active === true) {
            const employee = await employeeModel_1.default.findById(id);
            if (employee) {
                employee.BarCodeStatus = true;
                await employee.save();
            }
        }
        if (email) {
            email = email.toLowerCase();
            let emp = await employeeModel_1.default.findOne({ email: email });
            if (emp) {
                return next(new errorHandler_1.default("Employee With same email already present.", 400));
            }
        }
        if (group) {
            var groupId;
            const findGroup = await groupModel_1.default.findOne({ groupName: group });
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
            const findJobProfile = await jobProfileModel_1.default.findOne({
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
        let employee = await employeeModel_1.default.findOne({ _id: id });
        if (!employee) {
            return next(new errorHandler_1.default("Employee doesn't exist.", 400));
        }
        if (employeeCode) {
            let employee = await employeeModel_1.default.findOne({ employeeCode });
            if (employee) {
                return next(new errorHandler_1.default("Employee With same EmployeeCode already present.", 400));
            }
        }
        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt_1.default.hash(password, parseInt(process.env.SALT, 10));
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
            let check1 = await employeeModel_1.default.findOne({ contactNumber });
            if (check1) {
                return next(new errorHandler_1.default("Same phone number is already present in database.", 400));
            }
            let overTimeRatecal = (salary ? salary : employee?.salary) /
                (4.28 *
                    (workingHours ? workingHours : employee?.workingHours) *
                    (workingDays ? workingDays : employee?.workingDays));
            employee = await employeeModel_1.default.findByIdAndUpdate({ _id: id }, {
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
            }, { new: true })
                .populate("groupId")
                .populate("jobProfileId")
                .exec();
            let idd;
            if (req.admin) {
                idd = req.admin._id;
            }
            else {
                idd = req.employee?._id;
            }
            if (salary || workingDays || workingHours) {
                await salaryLogModel_1.default.create({
                    employeeId: employee?._id,
                    salary,
                    workingHours,
                    applicableMonth,
                    changedBy: id,
                });
            }
        }
        else {
            const partialBankDetails = {};
            if (bankName)
                partialBankDetails.bankName = bankName;
            if (IFSC_Code)
                partialBankDetails.IFSC_Code = IFSC_Code;
            if (branch)
                partialBankDetails.branch = branch;
            if (accountNumber)
                partialBankDetails.accountNumber = accountNumber;
            let overTimeRatecal = (salary ? salary : employee?.salary) /
                (4.28 *
                    (workingHours ? workingHours : employee?.workingHours) *
                    (workingDays ? workingDays : employee?.workingDays));
            employee = await employeeModel_1.default.findByIdAndUpdate({ _id: id }, {
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
            }, { new: true })
                .populate("groupId")
                .populate("jobProfileId")
                .exec();
            let idd;
            if (req.admin) {
                idd = req.admin._id;
            }
            else {
                idd = req.employee?._id;
            }
            if (salary) {
                await salaryLogModel_1.default.create({
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
    }
    else {
        return next(new errorHandler_1.default("Login first.", 401));
    }
});
// delete an employee
exports.deleteEmployee = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { id } = req.params;
    let employee = await employeeModel_1.default.findByIdAndDelete({ _id: id });
    if (!employee) {
        return next(new errorHandler_1.default("Employee doesn't exist.", 400));
    }
    const attendance = await attendanceModel_1.default.deleteMany({
        employeeId: employee._id,
    });
    resp.status(201).json({
        success: true,
        message: "Employee deleted successfully.",
        employee,
    });
});
// getting employee with search and filter
exports.getAllEmployee = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    let jobProfileIds = [];
    const { jobProfileName, groupName, employmentStatus, departmentName, name, page = 1, limit = 20, aadhar, createdSort, updatedSort, role, } = req.body;
    // Create a filter object to hold the query conditions
    const filter = {};
    // Add groupName filter if provided
    if (role) {
        filter.role = role;
    }
    if (groupName &&
        Array.isArray(groupName) &&
        groupName.some((name) => name.trim() !== "")) {
        const nonEmptyGroupNames = groupName.filter((name) => name.trim() !== "");
        const groups = await groupModel_1.default
            .find({ groupName: { $in: nonEmptyGroupNames } })
            .exec();
        const groupIds = groups.map((group) => group._id);
        filter.groupId = { $in: groupIds };
    }
    // Add departmentName filter if provided and non-empty
    if (departmentName &&
        Array.isArray(departmentName) &&
        departmentName.some((name) => name.trim() !== "")) {
        const nonEmptyDepartmentNames = departmentName.filter((name) => name.trim() !== "");
        const departments = await department_1.default
            .find({ departmentName: { $in: nonEmptyDepartmentNames } })
            .exec();
        const departmentIds = departments.map((department) => department._id);
        const jobProfiles = await jobProfileModel_1.default.find({
            department: { $in: departmentIds },
        }).exec();
        const jobProfileIds = jobProfiles.map((jobProfile) => jobProfile._id);
        filter.jobProfileId = { $in: jobProfileIds };
    }
    // Add jobProfileName filter if provided and non-empty
    if (jobProfileName &&
        Array.isArray(jobProfileName) &&
        jobProfileName.some((name) => name.trim() !== "")) {
        const nonEmptyJobProfileNames = jobProfileName.filter((name) => name.trim() !== "");
        const jobProfiles = await jobProfileModel_1.default.find({
            jobProfileName: { $in: nonEmptyJobProfileNames },
        }).exec();
        const ids = jobProfiles.map((jobProfile) => jobProfile._id);
        jobProfileIds = [...jobProfileIds, ...ids];
        filter.jobProfileId = { $in: jobProfileIds };
    }
    if (employmentStatus) {
        filter.employeeStatus = employmentStatus;
    }
    // Add name search filter if provided
    if (name) {
        filter.$or = [
            { name: { $regex: name, $options: "i" } },
            { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
        ];
    }
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    let aadharNumbers = aadhar;
    aadharNumbers = parseInt(aadhar);
    if (typeof aadharNumbers != "undefined") {
        const aadharFilter = {};
        if (aadharNumbers === 1) {
            aadharFilter.$and = [
                { aadharNumber: { $exists: true } },
                { aadharNumber: { $ne: 0 } },
            ];
        }
        else if (aadharNumbers === -1) {
            aadharFilter.$or = [
                { aadharNumber: 0 },
                { aadharNumber: { $exists: false } },
            ];
        }
        Object.assign(filter, aadharFilter);
    }
    // Find employees based on the filter with pagination
    let emplys = await employeeModel_1.default.find(filter)
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
        .select("-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode")
        .exec();
    if (createdSort === "True") {
        emplys = await employeeModel_1.default.find(filter)
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
            .select("-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode")
            .exec();
    }
    if (updatedSort === "True") {
        emplys = await employeeModel_1.default.find(filter)
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
            .select("-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode")
            .exec();
    }
    if (updatedSort === "False") {
        emplys = await employeeModel_1.default.find(filter)
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
            .select("-password -trainingStatus -permanentBarCodeNumber -permanentQrCodeAssign -assignedBy -marks -leaveTaken -permanentBarCode")
            .exec();
    }
    const employeeDocs = await employeeDocsModel_1.default.find().lean();
    const docsStore = {};
    employeeDocs.forEach((e) => {
        const id = e.employeeId + "";
        docsStore[id] = { ...e };
    });
    let employees = [];
    const loggedInHistory = await loginHistoryModel_1.default
        .find()
        .select({ logInTime: 1 })
        .lean();
    const loggedInHistoryStore = {};
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
        }
        else {
            const employeeCopy = JSON.parse(JSON.stringify(employee));
            employeeCopy.loggedHistory = lastloggedHistory;
            employees.push(employeeCopy);
        }
    }
    const count = await employeeModel_1.default.countDocuments(filter);
    resp.status(200).json({
        success: true,
        message: "Getting All Employee successfully.",
        employees,
        count,
    });
});
// Login employee
exports.loginEmployee = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { email, phone, password } = req.body;
    let employee = await employeeModel_1.default.findOne({
        $or: [{ email: email }, { contactNumber: phone }],
    }).select("+password");
    if (!employee)
        return next(new errorHandler_1.default("admin doesn't exist.", 400));
    const comparePassword = await bcrypt_1.default.compare(password, employee.password);
    if (!comparePassword)
        return next(new errorHandler_1.default("Employee or password doesn't match.", 400));
    (0, sendCookie_1.sendCookieAdmin)(resp, employee._id, `Welcome back, ${employee.name}`, 200);
});
// to get dynamic fields
let dynamicallyAddedFields = [];
// add new field in employee model
exports.addNewField = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    try {
        const { fields } = req.body;
        // Update the Mongoose schema to add the new fields
        const schema = employeeModel_1.default.schema;
        for (const field of fields) {
            schema.add({ [field.name]: field.type });
            // Add the field to the dynamically added fields array
            dynamicallyAddedFields.push({ name: field.name, type: field.type });
        }
        resp.status(200).json({ message: "Fields added successfully" });
    }
    catch (error) {
        console.error(error);
        resp.status(500).json({ message: "Internal server error" });
    }
});
// get newFields
exports.getNewFields = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    try {
        resp.status(200).json({ fields: dynamicallyAddedFields });
    }
    catch (error) {
        console.error(error);
        resp.status(500).json({ message: "Internal server error" });
    }
});
//delete new fields
exports.deleteNewFields = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    try {
        const { fieldName } = req.body;
        // Update the Mongoose schema to remove the specified field
        employeeModel_1.default.schema.remove(fieldName);
        resp.status(200).json({ message: "Field deleted successfully" });
    }
    catch (error) {
        console.error(error);
        resp.status(500).json({ message: "Internal server error" });
    }
});
//delete new fields
exports.updateNewFields = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    try {
        const { oldFieldName, newFieldName } = req.body;
        // Update the Mongoose schema to modify the field name
        const schema = employeeModel_1.default.schema;
        schema.path(oldFieldName).path = newFieldName;
        // Update the field name in existing records
        await employeeModel_1.default.updateMany({}, { $rename: { [oldFieldName]: newFieldName } });
        resp.status(200).json({ message: "Field name updated successfully" });
    }
    catch (error) {
        console.error(error);
        resp.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllFields = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    try {
        const newFields = [];
        // Get all the paths in the Mongoose schema
        const schemaPaths = employeeModel_1.default.schema.paths;
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
    }
    catch (error) {
        console.error(error);
        resp.status(500).json({ message: "Internal server error" });
    }
});
// single employee status
exports.getSingle = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { employeeId } = req.params;
    if (employeeId) {
        const employeeData = await employeeModel_1.default.findById(employeeId)
            .populate("groupId")
            .populate("jobProfileId");
        const data = await employeeDocsModel_1.default.findOne({
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
    }
    else {
        resp.status(200).json({
            success: false,
            message: "employee not found.",
        });
    }
});
// get employee by group and jobProfile
exports.getEmployeeByGroupAndJobProfile = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { jobProfileName } = req.query;
    // let group;
    let jobProfile;
    // if (groupName) {
    //   group = await groupModel.findOne({ groupName });
    // }
    if (jobProfileName) {
        jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
    }
    const employees = await employeeModel_1.default.find({
        jobProfileId: jobProfile?._id,
    }).lean(); // Use the lean() method to get plain JavaScript objects instead of Mongoose documents
    resp.status(200).json({
        success: true,
        message: "Employee data fetched successfully.",
        employees: Array.isArray(employees) ? employees : [employees],
    });
});
// assign QR code
exports.assignQrCode = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    let jobProfile;
    // checking the jobProfile Name
    if (req.employee) {
        jobProfile = await jobProfileModel_1.default.findById({
            _id: req.employee.jobProfileId,
        });
    }
    const { employeeId } = req.params;
    const { data } = req.body;
    let qrCode;
    try {
        qrCode = await QRCode.toDataURL(data); // Using email as an example
    }
    catch (err) {
        return next(new errorHandler_1.default("QR Code generation failed.", 500));
    }
    let employee = await employeeModel_1.default.findOne({ currentBarCode: qrCode });
    let employee1 = await employeeModel_1.default.findOne({ permanentBarCode: qrCode });
    if (employee || employee1) {
        return next(new errorHandler_1.default("This Qr code already assigned.", 400));
    }
    if (req.admin ||
        jobProfile?.jobProfileName.toLowerCase() === "hr" ||
        jobProfile?.jobProfileName.toLowerCase() === "security head" ||
        jobProfile?.jobProfileName.toLowerCase() === "security") {
        let employee = await employeeModel_1.default.findById(employeeId);
        if (!employee) {
            return next(new errorHandler_1.default("Employee not found.", 404));
        }
        const currentDate = new Date();
        employee = await employeeModel_1.default.findByIdAndUpdate(employeeId, {
            permanentBarCode: qrCode,
            permanentQrCodeAssign: currentDate,
            assignedBy: req.employee?._id || req.admin?._id,
            permanentBarCodeNumber: data,
        }, { new: true });
        const newData = await barCodeModel_1.default.findOneAndUpdate({ barCodeNumber: data, employeeId }, { assignedBy: req.employee?._id || req.admin?._id }).exec();
        resp.status(200).json({
            success: true,
            message: "QrCode Assigned successfully.",
            employee,
            newData,
        });
    }
    else {
        resp.status(200).json({
            success: false,
            message: "Login first as Security .",
        });
    }
});
// QR Code Assigned By me
exports.assignedByMe = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { page, limit, date } = req.query;
    const pge = page ? parseInt(page) : 1; // Current page number (default: 1)
    const lmt = limit ? parseInt(limit) : 20; // Number of items per page (default: 10)
    let jobProfile;
    // checking the jobProfile Name
    if (req.employee) {
        jobProfile = await jobProfileModel_1.default.findById({
            _id: req.employee.jobProfileId,
        });
    }
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
    nextDay = new Date(filterDate);
    nextDay.setDate(filterDate.getDate() + 1);
    if (req.admin ||
        jobProfile?.jobProfileName.toLowerCase() === "hr" ||
        jobProfile?.jobProfileName.toLowerCase() === "security head" ||
        jobProfile?.jobProfileName.toLowerCase() === "security") {
        let employee;
        if (req.employee) {
            employee = await barCodeModel_1.default.find({
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
        }
        else if (req.admin) {
            employee = await barCodeModel_1.default.find({
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
    }
    else {
        resp.status(200).json({
            success: false,
            message: "Login first as Security .",
        });
    }
});
// change password
const changePassword = async (req, resp, next) => {
    if (req.employee) {
        const { oldPassword, newPassword } = req.body;
        const comparePassword = await bcrypt_1.default.compare(oldPassword, req.employee.password);
        if (comparePassword) {
            const hashedPassword = await bcrypt_1.default.hash(newPassword, parseInt(process.env.SALT, 10));
            const updatedEmployee = await employeeModel_1.default.findOneAndUpdate({ _id: req.employee._id }, { password: hashedPassword }, { new: true });
            resp.status(200).json({
                success: true,
                message: "Password changed successfully.",
                employee: updatedEmployee,
            });
        }
        else {
            resp.status(200).json({
                success: false,
                message: "Old password is not correct.",
            });
        }
    }
    else {
        return next(new errorHandler_1.default("Something went wrong. Login with employee.", 400));
    }
};
exports.changePassword = changePassword;
// new password generate with old password
const newPasswordGenerator = async (req, resp, next) => {
    if (req.admin) {
        const { employeeId } = req.params;
        const { password } = req.body;
        const employee = await employeeModel_1.default.findOne({ _id: employeeId });
        if (!employee) {
            return next(new errorHandler_1.default("Employee not found", 404));
        }
        const hashedPassword = await bcrypt_1.default.hash(password, parseInt(process.env.SALT, 10));
        const updatedEmployee = await employeeModel_1.default.findOneAndUpdate({ _id: employee._id }, { password: hashedPassword }, { new: true });
        resp.status(200).json({
            success: true,
            message: "Password changed successfully.",
            employee: updatedEmployee,
        });
    }
    else {
        resp.status(403).json({
            success: false,
            message: "Login as admin.",
        });
    }
};
exports.newPasswordGenerator = newPasswordGenerator;
// getting salary log
const salaryLogPerEmployee = async (req, resp, next) => {
    const jobProfile = await jobProfileModel_1.default.findOne({
        _id: req.employee?.jobProfileId,
    });
    if (req.admin || jobProfile?.jobProfileName.toLowerCase() === "hr") {
        const { employeeId } = req.params;
        const employee = await employeeModel_1.default.findOne({ _id: employeeId });
        if (!employee) {
            return next(new errorHandler_1.default("Employee not found", 404));
        }
        const salaryLog = await salaryLogModel_1.default.find({
            employeeId: employee._id,
        })
            .sort({ createdAt: -1 })
            .exec();
        const data = [];
        for (let item of salaryLog) {
            const admin = await adminModel_1.default.findById(item.changedBy);
            const employee = await employeeModel_1.default.findById(item.changedBy);
            if (admin) {
                data.push({
                    ...item._doc,
                    changed: admin.name,
                });
            }
            else if (employee) {
                data.push({
                    ...item._doc,
                    changed: employee.name,
                });
            }
        }
        resp.status(200).json({
            success: true,
            message: "getting salary log successfully.",
            salaryLog: data,
        });
    }
    else {
        resp.status(403).json({
            success: false,
            message: "Login as Hr or admin.",
        });
    }
};
exports.salaryLogPerEmployee = salaryLogPerEmployee;
exports.employeeBarCode = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const employeeBarCodes = [];
    const allBarCodes = await barCodeModel_1.default.find({});
    // Fetch all employees whose IDs are in the barcodes
    const employeeIds = allBarCodes.map((barcode) => barcode.employeeId);
    const employees = await employeeModel_1.default.find({ _id: { $in: employeeIds } });
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
});
