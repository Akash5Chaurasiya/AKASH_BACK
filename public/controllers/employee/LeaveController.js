"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.approveGatePassRequestOrReject = exports.approveLeaveRequestOrReject = exports.updateGatePassRequestStatusAcceptedOrReject = exports.updateLeaveRequestStatusAcceptedOrReject = exports.getLeaveRequestByEmployee = exports.getApprovedLeaveRequest = exports.getAllLeaveAndGatePass = exports.getRejectedLeaveRequest = exports.getAcceptedLeaveRequest = exports.getPendingLeaveRequest = exports.requestLeave = void 0;
const leaveModel_1 = __importDefault(require("../../database/models/leaveModel"));
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
const errorHandler_1 = __importDefault(require("../../middleware/errorHandler"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const groupModel_1 = __importDefault(require("../../database/models/groupModel"));
const employeeDocsModel_1 = __importDefault(require("../../database/models/employeeDocsModel"));
// request for leave
exports.requestLeave = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    if (req.employee || req.admin) {
        const { employeeId, from, to, gatePassTime, gatePassDate, message } = req.body;
        try {
            const employee = await employeeModel_1.default.findById(employeeId || req.employee?._id);
            if (!employee) {
                return next(new errorHandler_1.default("Employee not found", 404));
            }
            let leave;
            let fromHours;
            let toHours;
            let gatePassDateHours;
            if (from && to) {
                fromHours = new Date(from);
                fromHours.setHours(0, 0, 0, 0);
                toHours = new Date(to);
                toHours.setHours(0, 0, 0, 0);
            }
            if (from && to) {
                leave = await leaveModel_1.default.findOne({ employeeId: employee._id, from: fromHours, to: toHours });
                if (leave) {
                    return next(new errorHandler_1.default("Leave already present for this date interval", 400));
                }
            }
            if (gatePassDate) {
                gatePassDateHours = new Date(gatePassDate);
                gatePassDateHours.setHours(0, 0, 0, 0);
            }
            leave = await leaveModel_1.default.create({ employeeId: employee._id, appliedBy: req.admin?._id || req.employee?._id, appliedDate: new Date().setHours(0, 0, 0, 0) });
            if (from && to) {
                leave.from = fromHours;
                leave.to = toHours;
            }
            else if (gatePassTime) {
                leave.gatePassDate = gatePassDateHours;
                leave.gatePassTime = gatePassTime;
            }
            leave.message = message;
            leave.status = "pending";
            await leave.save();
            resp.status(200).json({
                success: true,
                message: "Leave requested successfully.",
                leave: leave
            });
        }
        catch (error) {
            return next(new errorHandler_1.default("Failed to request leave", 500));
        }
    }
    else {
        return next(new errorHandler_1.default("Login first", 404));
    }
});
// getting all the leave request 
const getPendingLeaveRequest = async (req, resp, next) => {
    try {
        // Checking the jobProfile Name
        // let {groupName, jobProfileName, name } = req.query;
        if (req.employee || req.admin) {
            let employee = null;
            let jobProfile = null;
            if (req.employee) {
                employee = await employeeModel_1.default.findById(req.employee._id).exec();
                if (!employee) {
                    resp.status(404).json({
                        success: false,
                        message: 'Employee not found',
                    });
                }
                jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
                if (!jobProfile) {
                    resp.status(404).json({
                        success: false,
                        message: 'Job profile not found',
                    });
                }
            }
            let { groupName, jobProfileName, name } = req.query;
            const filter = {};
            const filter1 = {};
            // Add groupName filter if provided
            if (groupName) {
                const group = await groupModel_1.default.findOne({ groupName }).exec();
                if (group) {
                    filter.groupId = group._id;
                }
            }
            // Add jobProfileId filter if provided
            if (jobProfileName) {
                const jobProfile = await jobProfileModel_1.default.findOne({
                    jobProfileName: jobProfileName
                });
                if (jobProfile) {
                    filter.jobProfileId = jobProfile._id;
                }
            }
            if (name) {
                filter.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
                filter1.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
            }
            // Check if the employee is in the HR group or is an admin
            const isHR = jobProfile?.jobProfileName === "hr";
            const isAdmin = req.admin;
            if (!isHR && !isAdmin) {
                // Find employees in the same group with lower job rank
                const groupEmployees = await employeeModel_1.default.aggregate([
                    {
                        $match: {
                            ...filter1
                        },
                    },
                    {
                        $lookup: {
                            from: 'jobprofiles',
                            localField: 'jobProfileId',
                            foreignField: '_id',
                            as: 'jobProfile',
                        },
                    },
                    {
                        $unwind: '$jobProfile',
                    },
                    {
                        $match: {
                            'jobProfile.parentJobProfileId': jobProfile?._id,
                        },
                    },
                ]).exec();
                // Find pending leave requests for the selected employees
                const employeeIds = groupEmployees.map((emp) => emp._id);
                const allPendingRequest = await leaveModel_1.default.find({ employeeId: { $in: employeeIds }, status: 'pending', }).sort({ "appliedDate": -1 }).populate('employeeId').exec();
                const newRecords = [];
                for (let rec of allPendingRequest) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all leave requests',
                    allPendingRequest: newRecords,
                });
            }
            else {
                const groupEmployees = await employeeModel_1.default.find(filter);
                const employeeIds = groupEmployees.map((employee) => employee._id);
                // If the employee is in HR or is an admin, get all pending leave requests
                const allPendingRequest = await leaveModel_1.default.find({ employeeId: { $in: employeeIds }, status: 'pending' }).sort({ "appliedDate": -1 })
                    .populate('employeeId')
                    .exec();
                const newRecords = [];
                for (let rec of allPendingRequest) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all leave requests',
                    allPendingRequest: newRecords,
                });
            }
        }
        else {
            return next(new errorHandler_1.default("Login first", 404));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
};
exports.getPendingLeaveRequest = getPendingLeaveRequest;
// export const getPendingGatePassRequest: RequestHandler<ParamsDictionary, any, any, Query> = async (req: CustomRequest<EmployeeDocument>, resp: Response, next: NextFunction): Promise<void> => {
//   try {
//     // Checking the jobProfile Name
//     if (req.employee || req.admin) {
//       let employee: EmployeeDocument | null = null;
//       let jobProfile: JobProfileDocument | null = null;
//       if (req.employee) {
//         employee = await EmployeeModel.findById(req.employee._id).exec();
//         if (!employee) {
//           resp.status(404).json({
//             success: false,
//             message: 'Employee not found',
//           });
//         }
//         jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
//         if (!jobProfile) {
//           resp.status(404).json({
//             success: false,
//             message: 'Job profile not found',
//           });
//         }
//       }
//       let { groupName, jobProfileName, name } = req.query;
//       const filter: any = {};
//       const filter1: any = {};
//       // Add groupName filter if provided
//       if (groupName) {
//         const group = await groupModel.findOne({ groupName }).exec();
//         if (group) {
//           filter.groupId = group._id;
//         }
//       }
//       // Add jobProfileId filter if provided
//       if (jobProfileName) {
//         const jobProfile = await JobProfileModel.findOne({
//           jobProfileName: jobProfileName
//         });
//         if (jobProfile) {
//           filter.jobProfileId = jobProfile._id;
//         }
//       }
//       if (name) {
//         // Use a regular expression to perform case-insensitive search by name
//         filter.$or = [{ name: { $regex: name, $options: "i" } }];
//         filter1.$or = [{ name: { $regex: name, $options: "i" } }];
//       }
//       // Check if the employee is in the HR group or is an admin
//       const isHR = jobProfile?.jobProfileName === "hr";
//       const isAdmin = req.admin;
//       if (!isHR && !isAdmin) {
//         // Find employees in the same group with lower job rank
//         const groupEmployees = await EmployeeModel.aggregate([
//           {
//             $match: {
//               groupId: employee?.groupId,
//               ...filter1
//             },
//           },
//           {
//             $lookup: {
//               from: 'jobprofiles',
//               localField: 'jobProfileId',
//               foreignField: '_id',
//               as: 'jobProfile',
//             },
//           },
//           {
//             $unwind: '$jobProfile',
//           },
//           {
//             $match: {
//               'jobProfile.parentJobProfileId': jobProfile?._id,
//             },
//           },
//         ]).exec();
//         // Find pending leave requests for the selected employees
//         const employeeIds = groupEmployees.map((emp) => emp._id);
//         const allPendingRequest = await LeaveModel.find({
//           employeeId: { $in: employeeIds },
//           'gatePass.status': 'pending',
//         })
//           .populate('employeeId')
//           .exec();
//         // Filter leave requests to include only those with approved leave periods
//         const filteredPendingGatePass = allPendingRequest.filter((leave) =>
//           leave.gatePass.some((period) => period.status === 'pending')
//         );
//         // Filter leave periods within each leave request to include only approved periods
//         const pendingGatePassWithFilteredPeriods = filteredPendingGatePass.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'pending'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all leave requests',
//           pendingGatePassWithFilteredPeriods,
//         });
//       } else {
//         const groupEmployees = await EmployeeModel.find(filter)
//         const employeeIds = groupEmployees.map((employee) => employee._id)
//         const allPendingRequest = await LeaveModel.find({ employeeId: { $in: employeeIds }, 'gatePass.status': 'pending' })
//           .populate('employeeId')
//           .exec();
//         const pendingGatePassWithFilteredPeriods = allPendingRequest.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'pending'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all leave requests',
//           pendingGatePassWithFilteredPeriods,
//         });
//       }
//     } else {
//       return next(new ErrorHandler("Login first", 404));
//     }
//   } catch (error: any) {
//     // Handle any potential errors and return an error response
//     resp.status(500).json({
//       success: false,
//       message: 'An error occurred',
//       error: error.message,
//     });
//   }
// };
// get all accepted leave Request
const getAcceptedLeaveRequest = async (req, resp, next) => {
    try {
        // Checking the jobProfile Name
        if (req.employee || req.admin) {
            let employee = null;
            let jobProfile = null;
            if (req.employee) {
                employee = await employeeModel_1.default.findById(req.employee._id).exec();
                if (!employee) {
                    resp.status(404).json({
                        success: false,
                        message: 'Employee not found',
                    });
                }
                jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
                if (!jobProfile) {
                    resp.status(404).json({
                        success: false,
                        message: 'Job profile not found',
                    });
                }
            }
            let { groupName, jobProfileName, name } = req.query;
            const filter = {};
            const filter1 = {};
            // Add groupName filter if provided
            if (groupName) {
                const group = await groupModel_1.default.findOne({ groupName }).exec();
                if (group) {
                    filter.groupId = group._id;
                }
            }
            // Add jobProfileId filter if provided
            if (jobProfileName) {
                const jobProfile = await jobProfileModel_1.default.findOne({
                    jobProfileName: jobProfileName
                });
                if (jobProfile) {
                    filter.jobProfileId = jobProfile._id;
                }
            }
            if (name) {
                filter.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
                filter1.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
            }
            // Check if the employee is in the HR group or is an admin
            const isHR = jobProfile?.jobProfileName === "hr";
            const isAdmin = req.admin;
            if (!isHR && !isAdmin) {
                // Find employees in the same group with lower job rank
                const groupEmployees = await employeeModel_1.default.aggregate([
                    {
                        $match: {
                            ...filter1
                        },
                    },
                    {
                        $lookup: {
                            from: 'jobprofiles',
                            localField: 'jobProfileId',
                            foreignField: '_id',
                            as: 'jobProfile',
                        },
                    },
                    {
                        $unwind: '$jobProfile',
                    },
                    {
                        $match: {
                            'jobProfile.parentJobProfileId': jobProfile?._id,
                        },
                    },
                ]).exec();
                // Find pending leave requests for the selected employees
                const employeeIds = groupEmployees.map((emp) => emp._id);
                const allAcceptedRequest = await leaveModel_1.default.find({
                    employeeId: { $in: employeeIds },
                    status: 'accepted',
                }).sort({ "appliedDate": -1 })
                    .populate('employeeId').populate("acceptedBy")
                    .exec();
                const newRecords = [];
                for (let rec of allAcceptedRequest) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all leave requests',
                    allAcceptedRequest: newRecords,
                });
            }
            else {
                const groupEmployees = await employeeModel_1.default.find(filter);
                const employeeIds = groupEmployees.map((employee) => employee._id);
                const allAcceptedRequest = await leaveModel_1.default.find({ employeeId: { $in: employeeIds }, status: 'accepted' })
                    .sort({ "appliedDate": -1 }).populate('employeeId').populate("acceptedBy")
                    .exec();
                const newRecords = [];
                for (let rec of allAcceptedRequest) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all leave requests',
                    allAcceptedRequest: newRecords,
                });
            }
        }
        else {
            return next(new errorHandler_1.default("Login first", 404));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
};
exports.getAcceptedLeaveRequest = getAcceptedLeaveRequest;
// get all rejected leave Request
const getRejectedLeaveRequest = async (req, resp, next) => {
    try {
        // Checking the jobProfile Name
        if (req.employee || req.admin) {
            let employee = null;
            let jobProfile = null;
            if (req.employee) {
                employee = await employeeModel_1.default.findById(req.employee._id).exec();
                if (!employee) {
                    resp.status(404).json({
                        success: false,
                        message: 'Employee not found',
                    });
                }
                jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
                if (!jobProfile) {
                    resp.status(404).json({
                        success: false,
                        message: 'Job profile not found',
                    });
                }
            }
            let { name, groupName, jobProfileName, page, limit } = req.query;
            const pge = page ? parseInt(page) : 1;
            const lmt = limit ? parseInt(limit) : 20;
            const filter = {};
            const filter1 = {};
            // Add groupName filter if provided
            if (groupName) {
                const group = await groupModel_1.default.findOne({ groupName }).exec();
                if (group) {
                    filter.groupId = group._id;
                }
            }
            // Add jobProfileId filter if provided
            if (jobProfileName) {
                const jobProfile = await jobProfileModel_1.default.findOne({
                    jobProfileName: jobProfileName
                });
                if (jobProfile) {
                    filter.jobProfileId = jobProfile._id;
                }
            }
            if (name) {
                filter.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
                filter1.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
            }
            // Check if the employee is in the HR group or is an admin
            const isHR = jobProfile?.jobProfileName === "hr";
            const isAdmin = req.admin;
            if (!isHR && !isAdmin) {
                // Find employees in the same group with lower job rank
                const groupEmployees = await employeeModel_1.default.aggregate([
                    {
                        $match: {
                            ...filter1
                        },
                    },
                    {
                        $lookup: {
                            from: 'jobprofiles',
                            localField: 'jobProfileId',
                            foreignField: '_id',
                            as: 'jobProfile',
                        },
                    },
                    {
                        $unwind: '$jobProfile',
                    },
                    {
                        $match: {
                            'jobProfile.parentJobProfileId': jobProfile?._id,
                        },
                    },
                ]).exec();
                // Find pending leave requests for the selected employees
                const employeeIds = groupEmployees.map((emp) => emp._id);
                const allAcceptedRequest = await leaveModel_1.default.find({
                    employeeId: { $in: employeeIds },
                    status: 'rejected',
                }).sort({ appliedDate: -1 })
                    .skip((pge - 1) * lmt)
                    .limit(lmt)
                    .populate('rejectedBy')
                    .populate('employeeId')
                    .exec();
                const newRecords = [];
                for (let rec of allAcceptedRequest) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all rejected leave requests',
                    allRejectedLeave: newRecords,
                });
            }
            else {
                const groupEmployees = await employeeModel_1.default.find(filter);
                const employeeIds = groupEmployees.map((emp) => emp._id);
                const allAcceptedRequest = await leaveModel_1.default.find({ employeeId: { $in: employeeIds }, status: 'rejected' })
                    .sort({ appliedDate: -1 })
                    .skip((pge - 1) * lmt)
                    .limit(lmt)
                    .populate('rejectedBy')
                    .populate('employeeId')
                    .exec();
                const newRecords = [];
                for (let rec of allAcceptedRequest) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all rejected leave requests',
                    allRejectedLeave: newRecords,
                });
            }
        }
        else {
            return next(new errorHandler_1.default("Login first", 404));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
};
exports.getRejectedLeaveRequest = getRejectedLeaveRequest;
// get all rejected leave Request
const getAllLeaveAndGatePass = async (req, resp, next) => {
    try {
        // Checking the jobProfile Name
        if (req.employee || req.admin) {
            let employee = null;
            let jobProfile = null;
            if (req.employee) {
                employee = await employeeModel_1.default.findById(req.employee._id).exec();
                if (!employee) {
                    resp.status(404).json({
                        success: false,
                        message: 'Employee not found',
                    });
                    return;
                }
                jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
                if (!jobProfile) {
                    resp.status(404).json({
                        success: false,
                        message: 'Job profile not found',
                    });
                    return;
                }
            }
            let { name, groupName, jobProfileName, page, limit, status } = req.query;
            const pge = page ? parseInt(page) : 1;
            const lmt = limit ? parseInt(limit) : 20;
            const filter = {};
            const filter1 = {};
            // Add groupName filter if provided
            if (groupName) {
                const group = await groupModel_1.default.findOne({ groupName }).exec();
                if (group) {
                    filter.groupId = group._id;
                }
            }
            // Add jobProfileId filter if provided
            if (jobProfileName) {
                const jobProfile = await jobProfileModel_1.default.findOne({
                    jobProfileName: jobProfileName
                });
                if (jobProfile) {
                    filter.jobProfileId = jobProfile._id;
                }
            }
            if (name) {
                filter.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
                filter1.$or = [
                    { name: { $regex: name, $options: "i" } },
                    { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
                ];
            }
            // Check if the employee is in the HR group or is an admin
            const isHR = jobProfile?.jobProfileName === "hr";
            const isAdmin = req.admin;
            if (!isHR && !isAdmin) {
                // Find employees in the same group with lower job rank
                const groupEmployees = await employeeModel_1.default.aggregate([
                    {
                        $match: {
                            ...filter1
                        },
                    },
                    {
                        $lookup: {
                            from: 'jobprofiles',
                            localField: 'jobProfileId',
                            foreignField: '_id',
                            as: 'jobProfile',
                        },
                    },
                    {
                        $unwind: '$jobProfile',
                    },
                    {
                        $match: {
                            'jobProfile.parentJobProfileId': jobProfile?._id,
                        },
                    },
                ]).exec();
                // Find pending leave requests for the selected employees
                const employeeIds = groupEmployees.map((emp) => emp._id);
                const allLeaves = await leaveModel_1.default.find({
                    employeeId: { $in: employeeIds }
                }).sort({ appliedDate: -1 })
                    .skip((pge - 1) * lmt)
                    .limit(lmt)
                    .populate("acceptedBy").populate("rejectedBy")
                    .populate('employeeId')
                    .exec();
                const newRecords = [];
                for (let rec of allLeaves) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all leave requests',
                    allLeaves: newRecords,
                });
            }
            else {
                const groupEmployees = await employeeModel_1.default.find(filter);
                const employeeIds = groupEmployees.map((emp) => emp._id);
                const allLeaves = await leaveModel_1.default.find({ employeeId: { $in: employeeIds } })
                    .sort({ appliedDate: -1 })
                    .skip((pge - 1) * lmt)
                    .limit(lmt)
                    .populate("acceptedBy")
                    .populate("rejectedBy")
                    .populate('employeeId')
                    .exec();
                const newRecords = [];
                for (let rec of allLeaves) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all leave requests',
                    allLeaves: newRecords,
                });
            }
        }
        else {
            return next(new errorHandler_1.default('Login first', 404));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
};
exports.getAllLeaveAndGatePass = getAllLeaveAndGatePass;
// get all accepted leave Request
// export const getAcceptedGatePassRequest: RequestHandler<ParamsDictionary, any, any, Query> = async (req: CustomRequest<EmployeeDocument>, resp: Response, next: NextFunction): Promise<void> => {
//   try {
//     // Checking the jobProfile Name
//     if (req.employee || req.admin) {
//       let employee: EmployeeDocument | null = null;
//       let jobProfile: JobProfileDocument | null = null;
//       if (req.employee) {
//         employee = await EmployeeModel.findById(req.employee._id).exec();
//         if (!employee) {
//           resp.status(404).json({
//             success: false,
//             message: 'Employee not found',
//           });
//         }
//         jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
//         if (!jobProfile) {
//           resp.status(404).json({
//             success: false,
//             message: 'Job profile not found',
//           });
//         }
//       }
//       let { groupName, jobProfileName, name } = req.query;
//       const filter: any = {};
//       const filter1: any = {};
//       // Add groupName filter if provided
//       if (groupName) {
//         const group = await groupModel.findOne({ groupName }).exec();
//         if (group) {
//           filter.groupId = group._id;
//         }
//       }
//       // Add jobProfileId filter if provided
//       if (jobProfileName) {
//         const jobProfile = await JobProfileModel.findOne({
//           jobProfileName: jobProfileName
//         });
//         if (jobProfile) {
//           filter.jobProfileId = jobProfile._id;
//         }
//       }
//       if (name) {
//         // Use a regular expression to perform case-insensitive search by name
//         filter.$or = [{ name: { $regex: name, $options: "i" } }];
//         filter1.$or = [{ name: { $regex: name, $options: "i" } }];
//       }
//       // Check if the employee is in the HR group or is an admin
//       const isHR = jobProfile?.jobProfileName === "hr";
//       const isAdmin = req.admin;
//       if (!isHR && !isAdmin) {
//         // Find employees in the same group with lower job rank
//         const groupEmployees = await EmployeeModel.aggregate([
//           {
//             $match: {
//               groupId: employee?.groupId,
//               ...filter1
//             },
//           },
//           {
//             $lookup: {
//               from: 'jobprofiles',
//               localField: 'jobProfileId',
//               foreignField: '_id',
//               as: 'jobProfile',
//             },
//           },
//           {
//             $unwind: '$jobProfile',
//           },
//           {
//             $match: {
//               'jobProfile.parentJobProfileId': jobProfile?._id,
//             },
//           },
//         ]).exec();
//         // Find pending leave requests for the selected employees
//         const employeeIds = groupEmployees.map((emp) => emp._id);
//         const allAcceptedRequest = await LeaveModel.find({
//           employeeId: { $in: employeeIds },
//           'gatePass.status': 'accepted',
//         })
//           .populate('employeeId').populate('gatePass.acceptedBy')
//           .exec();
//         // Filter leave requests to include only those with approved leave periods
//         const filteredAcceptedGatePass = allAcceptedRequest.filter((leave) =>
//           leave.gatePass.some((period) => period.status === 'accepted')
//         );
//         // Filter leave periods within each leave request to include only approved periods
//         const acceptedGatePassWithFilteredPeriods = filteredAcceptedGatePass.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'accepted'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all leave requests',
//           acceptedGatePassWithFilteredPeriods,
//         });
//       } else {
//         const groupEmployees = await EmployeeModel.find(filter);
//         const employeeIds = groupEmployees.map((emp) => emp._id);
//         // If the employee is in HR or is an admin, get all pending leave requests
//         const allAcceptedRequest = await LeaveModel.find({ employeeId: { $in: employeeIds }, 'gatePass.status': 'accepted' })
//           .populate('employeeId')
//           .exec();
//         const acceptedGatePassWithFilteredPeriods = allAcceptedRequest.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'accepted'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all leave requests',
//           acceptedGatePassWithFilteredPeriods,
//         });
//       }
//     } else {
//       return next(new ErrorHandler("Login first", 404));
//     }
//   } catch (error: any) {
//     // Handle any potential errors and return an error response
//     resp.status(500).json({
//       success: false,
//       message: 'An error occurred',
//       error: error.message,
//     });
//   }
// };
// get all rejected leave Request
// export const getRejectedGatePassRequest: RequestHandler<ParamsDictionary, any, any, Query> = async (req: CustomRequest<EmployeeDocument>, resp: Response, next: NextFunction): Promise<void> => {
//   try {
//     // Checking the jobProfile Name
//     if (req.employee || req.admin) {
//       let employee: EmployeeDocument | null = null;
//       let jobProfile: JobProfileDocument | null = null;
//       if (req.employee) {
//         employee = await EmployeeModel.findById(req.employee._id).exec();
//         if (!employee) {
//           resp.status(404).json({
//             success: false,
//             message: 'Employee not found',
//           });
//         }
//         jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
//         if (!jobProfile) {
//           resp.status(404).json({
//             success: false,
//             message: 'Job profile not found',
//           });
//         }
//       }
//       let { name, groupName, jobProfileName, page, limit }: { name?: string, groupName?: string, jobProfileName?: string, page?: string, limit?: string } = req.query;
//       const pge: number = page ? parseInt(page) : 1;
//       const lmt: number = limit ? parseInt(limit) : 20;
//       const filter: any = {};
//       const filter1: any = {};
//       // Add groupName filter if provided
//       if (groupName) {
//         const group = await groupModel.findOne({ groupName }).exec();
//         if (group) {
//           filter.groupId = group._id;
//         }
//       }
//       // Add jobProfileId filter if provided
//       if (jobProfileName) {
//         const jobProfile = await JobProfileModel.findOne({
//           jobProfileName: jobProfileName
//         });
//         if (jobProfile) {
//           filter.jobProfileId = jobProfile._id;
//         }
//       }
//       if (name) {
//         // Use a regular expression to perform case-insensitive search by name
//         filter.$or = [{ name: { $regex: name, $options: "i" } }];
//         filter1.$or = [{ name: { $regex: name, $options: "i" } }];
//       }
//       // Check if the employee is in the HR group or is an admin
//       const isHR = jobProfile?.jobProfileName === "hr";
//       const isAdmin = req.admin;
//       if (!isHR && !isAdmin) {
//         // Find employees in the same group with lower job rank
//         const groupEmployees = await EmployeeModel.aggregate([
//           {
//             $match: {
//               groupId: employee?.groupId,
//               ...filter1
//             },
//           },
//           {
//             $lookup: {
//               from: 'jobprofiles',
//               localField: 'jobProfileId',
//               foreignField: '_id',
//               as: 'jobProfile',
//             },
//           },
//           {
//             $unwind: '$jobProfile',
//           },
//           {
//             $match: {
//               'jobProfile.parentJobProfileId': jobProfile?._id,
//             },
//           },
//         ]).exec();
//         // Find pending leave requests for the selected employees
//         const employeeIds = groupEmployees.map((emp) => emp._id);
//         const allAcceptedRequest = await LeaveModel.find({
//           employeeId: { $in: employeeIds },
//           'gatePass.status': 'rejected',
//         }).sort({ "gatePass.date": -1 })
//           .skip((pge - 1) * lmt)
//           .limit(lmt)
//           .populate('gatePass.rejectedBy')
//           .populate('employeeId')
//           .exec();
//         // Filter leave requests to include only those with approved leave periods
//         const filteredAcceptedGatePass = allAcceptedRequest.filter((leave) =>
//           leave.gatePass.some((period) => period.status === 'rejected')
//         );
//         // Filter leave periods within each leave request to include only approved periods
//         const rejectedGatePassWithFilteredPeriods = filteredAcceptedGatePass.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'rejected'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all rejected gatepass',
//           rejectedGatePassWithFilteredPeriods,
//         });
//       } else {
//         const groupEmployees = await EmployeeModel.find(filter);
//         const employeeIds = groupEmployees.map((emp) => emp._id);
//         const allAcceptedRequest = await LeaveModel.find({ employeeId: { $in: employeeIds }, 'gatePass.status': 'rejected' })
//         .sort({ "gatePass.date": -1 })
//         .skip((pge - 1) * lmt)
//         .limit(lmt)
//         .populate('gatePass.rejectedBy')
//         .populate('employeeId')
//         .exec();
//         const rejectedGatePassWithFilteredPeriods = allAcceptedRequest.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'rejected'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all rejected gatepass',
//           rejectedGatePassWithFilteredPeriods,
//         });
//       }
//     } else {
//       return next(new ErrorHandler("Login first", 404));
//     }
//   } catch (error: any) {
//     // Handle any potential errors and return an error response
//     resp.status(500).json({
//       success: false,
//       message: 'An error occurred',
//       error: error.message,
//     });
//   }
// };
// getting  Approved  leaves 
const getApprovedLeaveRequest = async (req, resp, next) => {
    try {
        let { name, groupName, jobProfileName, page, limit } = req.query;
        const pge = page ? parseInt(page) : 1;
        const lmt = limit ? parseInt(limit) : 20;
        const filter = {};
        const filter1 = {};
        if (groupName) {
            const group = await groupModel_1.default.findOne({ groupName });
            if (group) {
                filter.groupId = group._id;
            }
        }
        if (jobProfileName) {
            const jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
            if (jobProfile) {
                filter.jobProfileId = jobProfile._id;
            }
        }
        if (name) {
            filter.$or = [
                { name: { $regex: name, $options: "i" } },
                { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
            ];
            filter1.$or = [
                { name: { $regex: name, $options: "i" } },
                { employeeCode: { $regex: name, $options: "i" } }, // Search by employeeCode using case-insensitive regex
            ];
        }
        if (req.employee || req.admin) {
            let employee = null;
            let jobProfile = null;
            if (req.employee) {
                employee = await employeeModel_1.default.findById(req.employee._id).exec();
                if (!employee) {
                    resp.status(404).json({
                        success: false,
                        message: 'Employee not found',
                    });
                    return;
                }
                jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
                if (!jobProfile) {
                    resp.status(404).json({
                        success: false,
                        message: 'Job profile not found',
                    });
                    return;
                }
            }
            const isHR = jobProfile?.jobProfileName === "hr";
            const isAdmin = req.admin;
            if (!isHR && !isAdmin) {
                // Find employees in the same group with lower job rank
                const groupEmployees = await employeeModel_1.default.aggregate([
                    {
                        $match: {
                            ...filter1
                        },
                    },
                    {
                        $lookup: {
                            from: 'jobprofiles',
                            localField: 'jobProfileId',
                            foreignField: '_id',
                            as: 'jobProfile',
                        },
                    },
                    {
                        $unwind: '$jobProfile',
                    },
                    {
                        $match: {
                            'jobProfile.parentJobProfileId': jobProfile?._id,
                        },
                    },
                ]).exec();
                const employeeIds = groupEmployees.map((emp) => emp._id);
                const allLeaveRequests = await leaveModel_1.default.find({
                    employeeId: { $in: employeeIds },
                    status: "approved"
                }).sort({ appliedDate: -1 })
                    .skip((pge - 1) * lmt)
                    .limit(lmt)
                    .populate('employeeId')
                    .populate("acceptedBy")
                    .exec();
                const newRecords = [];
                for (let rec of allLeaveRequests) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all approved leave requests',
                    allApprovedLeave: newRecords,
                });
            }
            else {
                const groupEmployees = await employeeModel_1.default.find(filter);
                const ids = groupEmployees.map((employee) => employee._id);
                const allApprovedLeave = await leaveModel_1.default.find({
                    employeeId: { $in: ids },
                    status: "approved"
                }).sort({ appliedDate: -1 })
                    .skip((pge - 1) * lmt)
                    .limit(lmt)
                    .populate("acceptedBy")
                    .populate('employeeId').exec();
                const newRecords = [];
                for (let rec of allApprovedLeave) {
                    const docs = await employeeDocsModel_1.default.findOne({ employeeId: rec.employeeId._id });
                    if (docs) {
                        const doc = { ...rec.toObject(), profilePicture: docs.profilePicture };
                        newRecords.push(doc);
                    }
                    else {
                        newRecords.push(rec);
                    }
                }
                resp.status(200).json({
                    success: true,
                    message: 'Getting all approved leave requests',
                    allApprovedLeave: newRecords,
                });
            }
        }
        else {
            return next(new errorHandler_1.default('Login first', 404));
        }
    }
    catch (error) {
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
};
exports.getApprovedLeaveRequest = getApprovedLeaveRequest;
// getting  Approved  gatepass
// export const getApprovedGatePassRequest: RequestHandler<ParamsDictionary, any, any, Query> = async (req: CustomRequest<EmployeeDocument>, resp: Response, next: NextFunction): Promise<void> => {
//   try {
//     if (req.employee || req.admin) {
//       let employee: EmployeeDocument | null = null;
//       let jobProfile: JobProfileDocument | null = null;
//       if (req.employee) {
//         employee = await EmployeeModel.findById(req.employee._id).exec();
//         if (!employee) {
//           resp.status(404).json({
//             success: false,
//             message: 'Employee not found',
//           });
//           return;
//         }
//         jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
//         if (!jobProfile) {
//           resp.status(404).json({
//             success: false,
//             message: 'Job profile not found',
//           });
//           return;
//         }
//       }
//       let { name, groupName, jobProfileName, page, limit }: { name?: string, groupName?: string, jobProfileName?: string, page?: string, limit?: string } = req.query;
//       const pge: number = page ? parseInt(page) : 1;
//       const lmt: number = limit ? parseInt(limit) : 20;
//       const filter: any = {};
//       const filter1: any = {};
//       // Add groupName filter if provided
//       if (groupName) {
//         const group = await groupModel.findOne({ groupName }).exec();
//         if (group) {
//           filter.groupId = group._id;
//         }
//       }
//       // Add jobProfileId filter if provided
//       if (jobProfileName) {
//         const jobProfile = await JobProfileModel.findOne({
//           jobProfileName: jobProfileName
//         });
//         if (jobProfile) {
//           filter.jobProfileId = jobProfile._id;
//         }
//       }
//       if (name) {
//         // Use a regular expression to perform case-insensitive search by name
//         filter.$or = [{ name: { $regex: name, $options: "i" } }];
//         filter1.$or = [{ name: { $regex: name, $options: "i" } }];
//       }
//       const isHR = jobProfile?.jobProfileName == "hr";
//       const isAdmin = req.admin;
//       if (!isHR && !isAdmin) {
//         // Find employees in the same group with lower job rank
//         const groupEmployees = await EmployeeModel.aggregate([
//           {
//             $match: {
//               groupId: employee?.groupId,
//               ...filter1
//             },
//           },
//           {
//             $lookup: {
//               from: 'jobprofiles',
//               localField: 'jobProfileId',
//               foreignField: '_id',
//               as: 'jobProfile',
//             },
//           },
//           {
//             $unwind: '$jobProfile',
//           },
//           {
//             $match: {
//               'jobProfile.parentJobProfileId': jobProfile?._id,
//             },
//           },
//         ]).exec();
//         const employeeIds = groupEmployees.map((emp) => emp._id);
//         const allLeaveRequests = await LeaveModel.find({
//           employeeId: { $in: employeeIds },
//         }).sort({ "gatePass.date": -1 })
//           .skip((pge - 1) * lmt)
//           .limit(lmt)
//           .populate('employeeId')
//           .populate('gatePass.acceptedBy')
//           .exec();
//         // Filter leave requests to include only those with approved leave periods
//         const filteredApprovedLeave = allLeaveRequests.filter((leave) =>
//           leave.gatePass.some((period) => period.status === 'approved')
//         );
//         // Filter leave periods within each leave request to include only approved periods
//         const approvedGatePassWithFilteredPeriods = filteredApprovedLeave.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'approved'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all approved gate pass requests',
//           approvedGatePassWithFilteredPeriods,
//         });
//       } else {
//         const groupEmployees = await EmployeeModel.find(filter)
//         const ids = groupEmployees.map((employee) => employee._id)
//         const allApprovedGatePass = await LeaveModel.find({ employeeId: { $in: ids }, 'gatePass.status': 'approved' })
//           .sort({ "gatePass.date": -1 })
//           .skip((pge - 1) * lmt)
//           .limit(lmt)
//           .populate('gatePass.acceptedBy')  
//           .populate('employeeId')
//           .exec();
//         const approvedGatePassWithFilteredPeriods = allApprovedGatePass.map((leave) => ({
//           ...leave.toObject(),
//           gatePass: leave.gatePass.filter((period) => period.status === 'approved'),
//           fromTo: null
//         }));
//         resp.status(200).json({
//           success: true,
//           message: 'Getting all approved gate pass requests',
//           approvedGatePassWithFilteredPeriods,
//         });
//       }
//     } else {
//       return next(new ErrorHandler('Login first', 404));
//     }
//   } catch (error: any) {
//     resp.status(500).json({
//       success: false,
//       message: 'An error occurred',
//       error: error.message,
//     });
//   }
// };
// get all leave request by  Employee
exports.getLeaveRequestByEmployee = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    if (!req.employee) {
        return next(new errorHandler_1.default("Login First", 404));
    }
    const { page, limit } = req.query;
    const pge = page ? parseInt(page) : 1;
    const lmt = limit ? parseInt(limit) : 20;
    const employeeId = req.employee._id;
    const jobProfile = await jobProfileModel_1.default.findOne({ _id: req.employee.jobProfileId });
    const leaves = await leaveModel_1.default.find({ employeeId }).populate("acceptedBy").populate("rejectedBy").sort({ appliedDate: -1 })
        .skip((pge - 1) * lmt).exec();
    const upperLevelEmployee = await employeeModel_1.default.findOne({ jobProfileId: jobProfile?.parentJobProfileId }).exec();
    resp.status(200).json({
        success: true,
        message: "Getting all the leaves successfully.",
        leaves,
        upperLevelEmployee
    });
});
function isIJobProfile(jobProfileId) {
    return jobProfileId?.jobRank !== undefined;
}
// update leave request status to accepted
exports.updateLeaveRequestStatusAcceptedOrReject = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { employeeId, from, to, status, rejectedReason } = req.body;
    try {
        let employee = null;
        let jobProfile = null;
        if (req.employee) {
            employee = await employeeModel_1.default.findById(req.employee._id).exec();
            if (!employee) {
                resp.status(404).json({
                    success: false,
                    message: 'Employee not found',
                });
                return;
            }
            jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
            if (!jobProfile) {
                resp.status(404).json({
                    success: false,
                    message: 'Job profile not found',
                });
                return;
            }
        }
        // Check if the employee is in the HR group or is an admin
        let isSuper = false;
        const emp = await employeeModel_1.default.findOne({ _id: employeeId });
        const jobProfile1 = await jobProfileModel_1.default.findOne({ _id: emp?.jobProfileId, parentJobProfileId: employee?.jobProfileId });
        if ((jobProfile1?.parentJobProfileId)?.toString() === (employee?.jobProfileId)?.toString()) {
            isSuper = true;
        }
        else {
            isSuper = false;
        }
        const isHR = jobProfile?.jobProfileName === "hr";
        const isAdmin = req.admin;
        let fromHours;
        let toHours;
        fromHours = new Date(from);
        fromHours.setHours(0, 0, 0, 0);
        toHours = new Date(to);
        toHours.setHours(0, 0, 0, 0);
        if (isHR || isAdmin || isSuper) {
            // Find leave requests for the selected employees
            const leaveRequest = await leaveModel_1.default.findOne({
                employeeId,
                from: fromHours,
                to: toHours
            });
            if (!leaveRequest) {
                resp.status(404).json({
                    success: false,
                    message: 'Leave request not found',
                });
                return;
            }
            if (leaveRequest) {
                leaveRequest.status = status;
                if (status == "accepted") {
                    leaveRequest.acceptedBy = req?.employee?._id || req.admin;
                    leaveRequest.acceptedDate = new Date();
                }
                else if (status == "rejected") {
                    leaveRequest.rejectedBy = req?.employee?._id || req.admin;
                    leaveRequest.rejectedDate = new Date();
                    leaveRequest.rejectedReason = rejectedReason;
                }
                await leaveRequest.save();
                resp.status(200).json({
                    success: true,
                    message: 'Leave request accepted',
                    leaveRequest
                });
            }
            else {
                resp.status(404).json({
                    success: false,
                    message: 'Leave period not found',
                });
                return;
            }
        }
        else {
            return next(new errorHandler_1.default("Not authorized to accept leave requests", 403));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
});
// gatepass accept or reject
exports.updateGatePassRequestStatusAcceptedOrReject = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { employeeId, gatePassDate, gatePassTime, status, rejectedReason } = req.body;
    try {
        let employee = null;
        let jobProfile = null;
        if (req.employee) {
            employee = await employeeModel_1.default.findById(req.employee._id).exec();
            if (!employee) {
                resp.status(404).json({
                    success: false,
                    message: 'Employee not found',
                });
                return;
            }
            jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
            if (!jobProfile) {
                resp.status(404).json({
                    success: false,
                    message: 'Job profile not found',
                });
                return;
            }
        }
        let isSuper = false;
        const emp = await employeeModel_1.default.findOne({ _id: employeeId });
        const jobProfile1 = await jobProfileModel_1.default.findOne({ _id: emp?.jobProfileId, parentJobProfileId: employee?.jobProfileId });
        if ((jobProfile1?.parentJobProfileId)?.toString() === (employee?.jobProfileId)?.toString()) {
            isSuper = true;
        }
        else {
            isSuper = false;
        }
        const gatePassDateHours = new Date(gatePassDate);
        gatePassDateHours.setHours(0, 0, 0, 0);
        const isHR = jobProfile?.jobProfileName === "hr";
        const isAdmin = req.admin;
        if (isHR || isAdmin || isSuper) {
            // Find leave requests for the selected employees
            const leaveRequest = await leaveModel_1.default.findOne({
                employeeId,
                gatePassDate: gatePassDateHours,
                gatePassTime: gatePassTime
            });
            if (!leaveRequest) {
                resp.status(404).json({
                    success: false,
                    message: 'gatePass request not found',
                });
                return;
            }
            if (leaveRequest) {
                if (status == "accepted") {
                    leaveRequest.status = status;
                    leaveRequest.acceptedBy = req?.employee?._id || req.admin;
                    leaveRequest.acceptedDate = new Date();
                }
                else if (status == "rejected") {
                    leaveRequest.status = status;
                    leaveRequest.rejectedBy = req?.employee?._id || req.admin;
                    leaveRequest.rejectedDate = new Date();
                    leaveRequest.rejectedReason = rejectedReason;
                }
                await leaveRequest.save();
                resp.status(200).json({
                    success: true,
                    message: `GatePass request updated to ${status}`,
                    leaveRequest
                });
            }
            else {
                resp.status(404).json({
                    success: false,
                    message: 'Gatepass period not found',
                });
                return;
            }
        }
        else {
            return next(new errorHandler_1.default("Not authorized to accept leave requests", 403));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
});
// update leave Request to Approved
exports.approveLeaveRequestOrReject = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { employeeId, from, to, status, rejectedReason } = req.body;
    try {
        let employee = null;
        let jobProfile = null;
        if (req.employee) {
            employee = await employeeModel_1.default.findById(req.employee._id).exec();
            if (!employee) {
                resp.status(404).json({
                    success: false,
                    message: 'Employee not found',
                });
                return;
            }
            jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
            if (!jobProfile) {
                resp.status(404).json({
                    success: false,
                    message: 'Job profile not found',
                });
                return;
            }
        }
        // Check if the employee is in the HR group or is an admin
        const isHR = jobProfile?.jobProfileName === "hr";
        const isAdmin = req.admin;
        let fromHours;
        let toHours;
        fromHours = new Date(from);
        fromHours.setHours(0, 0, 0, 0);
        toHours = new Date(to);
        toHours.setHours(0, 0, 0, 0);
        if (isHR || isAdmin) {
            // Find leave requests for the selected employees
            const leaveRequest = await leaveModel_1.default.findOne({
                employeeId,
                from: new Date(from),
                to: new Date(to),
            });
            if (!leaveRequest) {
                resp.status(404).json({
                    success: false,
                    message: 'Leave request not found',
                });
                return;
            }
            if (leaveRequest) {
                if (status == "approved") {
                    leaveRequest.status = status; // set status to 'approved' instead of 'accepted'
                    leaveRequest.approvedDate = new Date();
                }
                else if (status == "rejected") {
                    leaveRequest.status = status; // set status to 'approved' instead of 'accepted'
                    leaveRequest.rejectedDate = new Date();
                    leaveRequest.rejectedReason = rejectedReason;
                }
                await leaveRequest.save();
                resp.status(200).json({
                    success: true,
                    message: `Leave request ${status}`,
                    leaveRequest
                });
            }
            else {
                resp.status(404).json({
                    success: false,
                    message: 'Leave period not found',
                });
                return;
            }
        }
        else {
            return next(new errorHandler_1.default("Not authorized to approve leave requests", 403));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
});
// update leave Request to Approved
exports.approveGatePassRequestOrReject = (0, catchAsyncError_1.default)(async (req, resp, next) => {
    const { employeeId, gatePassDate, gatePassTime, status, rejectedReason } = req.body;
    try {
        let employee = null;
        let jobProfile = null;
        if (req.employee) {
            employee = await employeeModel_1.default.findById(req.employee._id).exec();
            if (!employee) {
                resp.status(404).json({
                    success: false,
                    message: 'Employee not found',
                });
                return;
            }
            jobProfile = await jobProfileModel_1.default.findById(employee?.jobProfileId);
            if (!jobProfile) {
                resp.status(404).json({
                    success: false,
                    message: 'Job profile not found',
                });
                return;
            }
        }
        // Check if the employee is in the HR group or is an admin
        const isHR = jobProfile?.jobProfileName === "hr";
        const isAdmin = req.admin;
        let gatePassHours = new Date(gatePassDate);
        gatePassHours.setHours(0, 0, 0, 0);
        if (isHR || isAdmin) {
            // Find leave requests for the selected employees
            const gatePassRequest = await leaveModel_1.default.findOne({
                employeeId,
                gatePassDate: gatePassHours,
                gatePassTime: gatePassTime
            });
            if (!gatePassRequest) {
                resp.status(404).json({
                    success: false,
                    message: 'GatePass request not found',
                });
                return;
            }
            if (gatePassRequest) {
                if (status == "approved") {
                    gatePassRequest.status = status; // set status to 'approved' or 'reject' instead of 'accepted'
                    gatePassRequest.approvedDate = new Date();
                }
                else if (status == "rejected") {
                    gatePassRequest.status = status; // set status to 'approved' or 'reject' instead of 'accepted'
                    gatePassRequest.rejectedDate = new Date();
                    gatePassRequest.rejectedReason = rejectedReason;
                }
                await gatePassRequest.save();
                resp.status(200).json({
                    success: true,
                    message: `GatePass request ${status}`,
                    gatePassRequest,
                });
            }
            else {
                resp.status(404).json({
                    success: false,
                    message: 'GatePass period not found',
                });
                return;
            }
        }
        else {
            return next(new errorHandler_1.default("Not authorized to approve leave requests", 403));
        }
    }
    catch (error) {
        // Handle any potential errors and return an error response
        resp.status(500).json({
            success: false,
            message: 'An error occurred',
            error: error.message,
        });
    }
});
// // update leave Request to Approved
// export const getAllLeavePerEmployee: RequestHandler<ParamsDictionary, any, any, Query> = catchErrorAsync(async (req: CustomRequest<EmployeeDocument>, resp: Response, next: NextFunction): Promise<void> => {
//   const { employeeId, gatePassDate, gatePassTime, status } = req.body;
//   try {
//     let employee: EmployeeDocument | null = null;
//     let jobProfile: JobProfileDocument | null = null;
//     if (req.employee) {
//       employee = await EmployeeModel.findById(req.employee._id).exec();
//       if (!employee) {
//         resp.status(404).json({
//           success: false,
//           message: 'Employee not found',
//         });
//         return;
//       }
//       jobProfile = await JobProfileModel.findById(employee?.jobProfileId);
//       if (!jobProfile) {
//         resp.status(404).json({
//           success: false,
//           message: 'Job profile not found',
//         });
//         return;
//       }
//     }
//     // Check if the employee is in the HR group or is an admin
//     const isHR = jobProfile?.jobProfileName === "hr";
//     const isAdmin = req.admin;
//     if (isHR || isAdmin) {
//       // Find leave requests for the selected employees
//       const gatePassRequest = await LeaveModel.findOne({
//         employeeId,
//         'gatePass.date': new Date(gatePassDate),
//         'gatePass.time': gatePassTime,
//         'gatePass.status': 'accepted'
//       });
//       if (!gatePassRequest) {
//         resp.status(404).json({
//           success: false,
//           message: 'GatePass request not found',
//         });
//         return;
//       }
//       const leavePeriod = gatePassRequest.gatePass.find(leave => leave.date.toISOString().slice(0, 10) === gatePassDate && leave.time === gatePassTime);
//       if (leavePeriod) {
//         if (status == "approved") {
//           leavePeriod.status = status; // set status to 'approved' or 'reject' instead of 'accepted'
//           leavePeriod.approvedDate = new Date();
//         } else if (status == "approved") {
//           leavePeriod.status = status; // set status to 'approved' or 'reject' instead of 'accepted'
//           leavePeriod.rejectedDate = new Date();
//         }
//         await gatePassRequest.save();
//         resp.status(200).json({
//           success: true,
//           message: 'GatePass request approved',
//           gatePassRequest,
//         });
//       } else {
//         resp.status(404).json({
//           success: false,
//           message: 'GatePass period not found',
//         });
//         return;
//       }
//     } else {
//       return next(new ErrorHandler("Not authorized to approve leave requests", 403));
//     }
//   } catch (error: any) {
//     // Handle any potential errors and return an error response
//     resp.status(500).json({
//       success: false,
//       message: 'An error occurred',
//       error: error.message,
//     });
//   }
// });
// get leave records
// export const getLeaveData: RequestHandler<ParamsDictionary, any, any, Query> = async (
//   req: Request,
//   resp: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const { name, groupName, jobProfileName } = req.query;
//     let filters: any = {};
//     if (name) {
//       filters['name'] = { $regex: new RegExp(String(name), 'i') };
//     }
//     if (groupName) {
//       const group = await groupModel.findOne({ groupName })
//       if (group) {
//         filters['groupId'] = String(group._id);
//       }
//     }
//     if (jobProfileName) {
//       const jobProfile = await JobProfileModel.findOne({ jobProfileName });
//       if (jobProfile) {
//         filters['jobProfileId'] = String(jobProfile._id);
//       }
//     }
//     const employees = await EmployeeModel.find(filters).exec();
//     const employeeIds = employees.map((employee) => employee._id);
//     const leaveData = await LeaveModel.find({ employeeId: { $in: employeeIds } })
//       .exec();
//     const result: any[] = [];
//     for (const leave of leaveData) {
//       const employee = leave.employeeId;
//       const employeeDetails = await EmployeeModel.findById({ _id: employee })
//       const leaveRecords = leave.fromTo.map((record) => ({
//         appliedDate: record.appliedDate,
//         from: record.from,
//         to: record.to,
//         message: record.message,
//         status: record.status,
//         acceptedDate: record.acceptedDate,
//         acceptedBy: record.acceptedBy,
//         rejectedDate: record.rejectedDate,
//         rejectedBy: record.rejectedBy,
//         approvedDate: record.approvedDate,
//       }));
//       const gatePassRecords = leave.gatePass.map((record) => ({
//         date: record.date,
//         time: record.time,
//         status: record.status,
//         acceptedDate: record.acceptedDate,
//         acceptedBy: record.acceptedBy,
//         rejectedDate: record.rejectedDate,
//         rejectedBy: record.rejectedBy,
//         approvedDate: record.approvedDate,
//       }));
//       result.push({
//         employeeDetails,
//         leaveRecords,
//         gatePassRecords,
//       });
//     }
//     resp.status(200).json({
//       success: true,
//       message: 'Getting leave data with filters',
//       leaveData: result,
//     });
//   } catch (error: any) {
//     resp.status(500).json({
//       success: false,
//       message: 'An error occurred',
//       error: error.message,
//     });
//   }
// };
