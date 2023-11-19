"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyAllChildAndParentFields = exports.suggestionForJobProfile = exports.getSingleJobProfile = exports.getChildJobProfile = exports.getAllJobProfileWithNoParent = exports.updateHierarchy = exports.allJobProfile = exports.updateJobDescription = exports.updateJobProfile = exports.deleteJobProfile = exports.addJobProfile = void 0;
const catchAsyncError_1 = __importDefault(require("../../utils/catchAsyncError"));
const jobProfileModel_1 = __importDefault(require("../../database/models/jobProfileModel"));
const employeeModel_1 = __importDefault(require("../../database/models/employeeModel"));
// add
exports.addJobProfile = (0, catchAsyncError_1.default)(async (req, resp) => {
    let jobProfile = {};
    let { jobProfileName, jobDescription, parentJobProfileName, employmentType, isSupervisor, } = req.body;
    // find parentJobProfileID
    jobProfileName = jobProfileName.trim();
    let parent;
    let parentJobProfileId;
    if (parentJobProfileName) {
        parentJobProfileId = await jobProfileModel_1.default.findOne({
            jobProfileName: parentJobProfileName,
        });
        parent = await jobProfileModel_1.default.findOne({ _id: parentJobProfileId?._id });
        if (!parent) {
            return resp.json(404).json({
                success: false,
                message: "Parent job profile not found.",
            });
        }
    }
    const currentJobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
    if (currentJobProfile) {
        return resp.status(400).json({
            success: false,
            message: "Job Profile with same name already present.",
        });
    }
    if (parentJobProfileId) {
        jobProfile = await jobProfileModel_1.default.create({
            jobProfileName,
            jobDescription,
            parentJobProfileId,
            employmentType,
            isSupervisor: isSupervisor,
        });
        const currentJobProfileId = await jobProfileModel_1.default.findOne({
            jobProfileName: jobProfileName,
        });
        if (parent) {
            parent.childProfileId.push(currentJobProfileId?._id);
            await parent.save();
        }
    }
    else if (!parentJobProfileId) {
        jobProfile = await jobProfileModel_1.default.create({
            jobProfileName,
            jobDescription,
            employmentType,
            isSupervisor: isSupervisor,
        });
    }
    resp.status(201).json({
        success: true,
        message: "Created Job Profile successfully.",
        jobProfile,
    });
});
// // delete
exports.deleteJobProfile = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    if (!id) {
        resp.status(400).json({
            success: false,
            message: "jobProfile id not found",
        });
    }
    const jobProfile = await jobProfileModel_1.default.findById(id);
    if (jobProfile) {
        const matchingEmployees = await employeeModel_1.default.find({
            jobProfileId: jobProfile._id,
        });
        const numberOfEmployees = matchingEmployees.length;
        const update1 = await jobProfileModel_1.default.find({
            parentJobProfileId: jobProfile._id,
        }).exec();
        if (numberOfEmployees > 0) {
            resp.status(200).json({
                success: false,
                message: "JobProfile contains employee you can't delete that.",
                numberOfEmployees: numberOfEmployees,
            });
        }
        else if (update1.length > 0) {
            resp.status(200).json({
                success: false,
                message: "JobProfile can't delete because it is parent of some jobprofile.",
            });
        }
        else {
            const jobProfile = await jobProfileModel_1.default.findByIdAndDelete(id);
            resp.status(200).json({
                success: true,
                message: "jobProfile deleted successfully.",
                numberOfEmployees: numberOfEmployees,
            });
        }
    }
    else {
        resp.status(400).json({
            success: false,
            message: "jobProfile not found.",
        });
    }
});
// // update
exports.updateJobProfile = (0, catchAsyncError_1.default)(async (req, resp) => {
    const id = req.params.id;
    const { jobProfileName, jobDescription, isSupervisor } = req.body;
    const jobprofile = await jobProfileModel_1.default.findOne({ _id: id });
    if (jobprofile) {
        const docs = await jobProfileModel_1.default.findByIdAndUpdate({ _id: id }, {
            jobProfileName: jobProfileName,
            jobDescription: jobDescription,
            isSupervisor: isSupervisor,
        }, { new: true });
    }
    resp.status(200).json({
        success: true,
        message: "Updated jobprofile successfully.",
    });
});
// update jobDescription
exports.updateJobDescription = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { jobprofielId, jobDescription } = req.body;
    const filter = { _id: jobprofielId };
    const update = { jobDescription: jobDescription };
    const docs = await jobProfileModel_1.default.findOneAndUpdate(filter, update, {
        new: true,
    });
    resp.status(200).json({
        success: true,
        message: "Updated jobprofile successfully.",
        docs,
    });
});
// // get all
exports.allJobProfile = (0, catchAsyncError_1.default)(async (req, resp) => {
    const jobProfiles = await jobProfileModel_1.default.find({})
        .populate("department")
        .exec();
    if (jobProfiles) {
        const responseJobProfiles = await Promise.all(jobProfiles.map(async (jobProfile) => {
            const matchingEmployees = await employeeModel_1.default.find({
                jobProfileId: jobProfile._id,
            });
            const numberOfEmployees = matchingEmployees.length;
            return {
                ...jobProfile.toObject(),
                numberOfEmployees,
            };
        }));
        resp.status(200).json({
            success: true,
            message: "All job profile list with the number of employees.",
            docs: responseJobProfiles,
        });
    }
    else {
        resp.status(404).json({
            success: false,
            message: "No job profiles found.",
        });
    }
});
// update hierarchy
exports.updateHierarchy = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { jobProfileName, parentJobProfileName } = req.body;
    if (jobProfileName === parentJobProfileName) {
        return resp.status(400).json({
            success: false,
            message: "The job profile and parent job profile cannot be same .",
        });
    }
    // Find job profile ID based on jobProfileName
    const currentJobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
    if (!currentJobProfile) {
        return resp.status(404).json({
            success: false,
            message: "Job Profile not found.",
        });
    }
    const jobProfileId = currentJobProfile._id;
    if (parentJobProfileName) {
        // Find parent job profile ID based on parentJobProfileName
        const parentJobProfile = await jobProfileModel_1.default.findOne({
            jobProfileName: parentJobProfileName,
        });
        if (!parentJobProfile) {
            return resp.status(404).json({
                success: false,
                message: "Parent Job Profile not found.",
            });
        }
        const parentJobProfileId = parentJobProfile._id;
        if (parentJobProfile.parentJobProfileId?.toString() ===
            currentJobProfile._id.toString()) {
            const job1 = currentJobProfile;
            const job2 = parentJobProfile;
            const newArray = job1.childProfileId.filter((e) => String(e) !== String(parentJobProfile._id));
            newArray.push(job1._id);
            const newArray1 = [...job2?.childProfileId];
            const update1 = await jobProfileModel_1.default.findOneAndUpdate({ _id: currentJobProfile._id }, { parentJobProfileId: job2._id, childProfileId: newArray1 }, { new: true }).exec();
            const update2 = await jobProfileModel_1.default.findOneAndUpdate({ _id: parentJobProfile._id }, {
                parentJobProfileId: job1.parentJobProfileId,
                childProfileId: newArray,
            }, { new: true }).exec();
            return resp.status(200).json({
                success: true,
                message: "JobProfile exchange successfully.",
                update1,
                update2,
            });
        }
        let filter;
        let update;
        if (parentJobProfileId != jobProfileId) {
            filter = { _id: jobProfileId };
            update = { $set: { parentJobProfileId } };
        }
        // Update current job profile
        // Update parent job profile
        const filter2 = { _id: parentJobProfileId };
        const update2 = { $push: { childProfileId: jobProfileId } };
        // Remove childProfileId from old parent
        const oldParentJobProfileId = currentJobProfile?.parentJobProfileId;
        if (oldParentJobProfileId) {
            const filter3 = { _id: oldParentJobProfileId };
            const update3 = { $pull: { childProfileId: jobProfileId } };
            await jobProfileModel_1.default.updateOne(filter3, update3);
        }
        await jobProfileModel_1.default.updateOne(filter, update);
        await jobProfileModel_1.default.updateOne(filter2, update2);
        resp.status(200).json({
            success: true,
            message: "Updated Job Profile successfully.",
            currentJobProfileId: jobProfileId,
            parent: parentJobProfile,
        });
    }
    else {
        const parent = currentJobProfile.parentJobProfileId;
        console.log(`Job profile: ${currentJobProfile.jobProfileName}`);
        if (currentJobProfile) {
            currentJobProfile.parentJobProfileId = null;
            const jobprofile = await jobProfileModel_1.default.find({});
            for (let i = 0; i < jobprofile.length; i++) {
                const jobProfile = jobprofile[i];
                if (jobProfile.childProfileId &&
                    jobProfile.childProfileId.includes(currentJobProfile._id)) {
                    const indexToRemove = jobProfile.childProfileId.indexOf(currentJobProfile._id);
                    jobProfile.childProfileId.splice(indexToRemove, 1);
                    await jobProfile.save();
                }
            }
            // await currentJobProfile.save();
        }
        console.log("parent", parent);
        // Remove childProfileId from old parent
        if (parent) {
            const oldParentJobProfile = await jobProfileModel_1.default.findOne({
                _id: parent,
            });
            console.log("oldParentJobProfile", oldParentJobProfile);
            if (oldParentJobProfile) {
                // Use type assertion to suppress TypeScript error
                const childProfileIdArray = oldParentJobProfile.childProfileId;
                const index = childProfileIdArray.indexOf(currentJobProfile._id);
                if (index > -1) {
                    childProfileIdArray.splice(index, 1);
                    await oldParentJobProfile.save();
                }
            }
        }
        await currentJobProfile?.save();
        resp.status(200).json({
            success: true,
            message: "Updated Job Profile successfully.",
            currentJobProfile,
            parent,
        });
    }
});
// getting jobProfile data with no parent
async function getAllJobProfileWithNoParent(req, res) {
    try {
        const jobProfile = await jobProfileModel_1.default.find({
            parentJobProfileId: null,
        }).exec();
        res.status(200).json({
            success: true,
            jobProfile,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
exports.getAllJobProfileWithNoParent = getAllJobProfileWithNoParent;
async function getChildJobProfile(req, res) {
    const { jobprofielId } = req.params;
    try {
        const jobProfile = await jobProfileModel_1.default.findById(jobprofielId)
            .populate({
            path: "department",
        })
            .populate({
            path: "childProfileId",
            populate: {
                path: "department",
            },
        })
            .exec();
        if (!jobProfile) {
            return res.status(404).json({ error: "jobProfile not found" });
        }
        const childjobProfiles = jobProfile.childProfileId;
        res.status(200).json({
            success: true,
            jobProfile,
            childjobProfiles,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
}
exports.getChildJobProfile = getChildJobProfile;
exports.getSingleJobProfile = (0, catchAsyncError_1.default)(async (req, resp) => {
    const { id } = req.params;
    if (id) {
        const allEmployees = await employeeModel_1.default.find({});
        const jobProfileData = await jobProfileModel_1.default.findById(id);
        resp.status(200).json({
            success: true,
            message: "jobprofile data successfully.",
            jobProfileData,
        });
    }
    else {
        resp.status(200).json({
            success: false,
            message: "jobprofile not found.",
        });
    }
});
// suggestion for heirarchy
const suggestionForJobProfile = async (req, resp, next) => {
    try {
        const { jobprofileId } = req.params;
        const jobprofileDetails = await jobProfileModel_1.default.findById(jobprofileId);
        if (!jobprofileDetails) {
            return resp.status(404).json({
                success: false,
                message: `Job profile with Id ${jobprofileId} not found.`,
            });
        }
        const suggestionsArray = [];
        const allJobProfiles = await jobProfileModel_1.default.find().lean();
        const allJobProfileStore = {};
        allJobProfiles.forEach((a) => {
            const id = a._id + "";
            allJobProfileStore[id] = {
                ...a,
            };
        });
        if (!jobprofileDetails.parentJobProfileId) {
            allJobProfiles.forEach((a) => {
                const id = a._id + "";
                if (id !== jobprofileDetails._id + "") {
                    const obj = {
                        jobProfileName: a.jobProfileName,
                        _id: a._id,
                    };
                    suggestionsArray.push(obj);
                }
            });
        }
        else {
            jobprofileDetails.childProfileId.forEach((j) => {
                const id = j + "";
                const jobProfile = allJobProfileStore[id];
                const obj = {
                    jobProfileName: jobProfile?.jobProfileName,
                    _id: jobProfile?._id,
                };
                suggestionsArray.push(obj);
            });
        }
        resp.status(200).json({
            success: true,
            message: `Getting suggestion successfully.`,
            suggestionsArray,
            // allJobProfileStore
        });
    }
    catch (error) {
        console.log(error);
    }
};
exports.suggestionForJobProfile = suggestionForJobProfile;
const emptyAllChildAndParentFields = async (req, res) => {
    try {
        // Update all documents in the "JobProfile" collection
        const updateResult = await jobProfileModel_1.default.updateMany({}, {
            $set: {
                childProfileId: [],
                parentJobProfileId: null,
            },
        });
        return res.status(200).json({
            message: "ChildProfileId and ParentJobProfileId cleared in all documents.",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "An error occurred while clearing fields in all documents.",
        });
    }
};
exports.emptyAllChildAndParentFields = emptyAllChildAndParentFields;
// ass
