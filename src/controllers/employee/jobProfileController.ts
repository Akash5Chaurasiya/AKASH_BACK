import { NextFunction, Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import JobProfileModel from "../../database/models/jobProfileModel";
import mongoose from "mongoose";
import EmployeeModel from "../../database/models/employeeModel";

// add
export const addJobProfile = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let jobProfile = {};
    let {
      jobProfileName,
      jobDescription,
      parentJobProfileName,
      employmentType,
      isSupervisor,
    } = req.body;
    // find parentJobProfileID
    jobProfileName = jobProfileName.trim();
    let parent;
    let parentJobProfileId;
    if (parentJobProfileName) {
      parentJobProfileId = await JobProfileModel.findOne({
        jobProfileName: parentJobProfileName,
      });
      parent = await JobProfileModel.findOne({ _id: parentJobProfileId?._id });
      if (!parent) {
        return resp.json(404).json({
          success: false,
          message: "Parent job profile not found.",
        });
      }
    }
    const currentJobProfile = await JobProfileModel.findOne({ jobProfileName });
    if (currentJobProfile) {
      return resp.status(400).json({
        success: false,
        message: "Job Profile with same name already present.",
      });
    }
    if (parentJobProfileId) {
      jobProfile = await JobProfileModel.create({
        jobProfileName,
        jobDescription,
        parentJobProfileId,
        employmentType,
        isSupervisor: isSupervisor,
      });
      const currentJobProfileId = await JobProfileModel.findOne({
        jobProfileName: jobProfileName,
      });
      if (parent) {
        parent.childProfileId.push(currentJobProfileId?._id);
        await parent.save();
      }
    } else if (!parentJobProfileId) {
      jobProfile = await JobProfileModel.create({
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
  }
);

// // delete
export const deleteJobProfile = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    if (!id) {
      resp.status(400).json({
        success: false,
        message: "jobProfile id not found",
      });
    }
    const jobProfile = await JobProfileModel.findById(id);
    if (jobProfile) {
      const matchingEmployees = await EmployeeModel.find({
        jobProfileId: jobProfile._id,
      });
      const numberOfEmployees = matchingEmployees.length;
      const update1 = await JobProfileModel.find({
        parentJobProfileId: jobProfile._id,
      }).exec();
      if (numberOfEmployees > 0) {
        resp.status(200).json({
          success: false,
          message: "JobProfile contains employee you can't delete that.",
          numberOfEmployees: numberOfEmployees,
        });
      } else if (update1.length > 0) {
        resp.status(200).json({
          success: false,
          message:
            "JobProfile can't delete because it is parent of some jobprofile.",
        });
      } else {
        const jobProfile = await JobProfileModel.findByIdAndDelete(id);
        resp.status(200).json({
          success: true,
          message: "jobProfile deleted successfully.",
          numberOfEmployees: numberOfEmployees,
        });
      }
    } else {
      resp.status(400).json({
        success: false,
        message: "jobProfile not found.",
      });
    }
  }
);

// // update
export const updateJobProfile = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const id = req.params.id;
    const { jobProfileName, jobDescription, isSupervisor } = req.body;
    const jobprofile = await JobProfileModel.findOne({ _id: id });
    if (jobprofile) {
      const docs = await JobProfileModel.findByIdAndUpdate(
        { _id: id },
        {
          jobProfileName: jobProfileName,
          jobDescription: jobDescription,
          isSupervisor: isSupervisor,
        },
        { new: true }
      );
    }
    resp.status(200).json({
      success: true,
      message: "Updated jobprofile successfully.",
    });
  }
);

// update jobDescription
export const updateJobDescription = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { jobprofielId, jobDescription } = req.body;
    const filter = { _id: jobprofielId };
    const update = { jobDescription: jobDescription };
    const docs = await JobProfileModel.findOneAndUpdate(filter, update, {
      new: true,
    });
    resp.status(200).json({
      success: true,
      message: "Updated jobprofile successfully.",
      docs,
    });
  }
);

// // get all
export const allJobProfile = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const jobProfiles = await JobProfileModel.find({})
      .populate("department")
      .exec();

    if (jobProfiles) {
      const responseJobProfiles = await Promise.all(
        jobProfiles.map(async (jobProfile) => {
          const matchingEmployees = await EmployeeModel.find({
            jobProfileId: jobProfile._id,
          });
          const numberOfEmployees = matchingEmployees.length;
          return {
            ...jobProfile.toObject(), // Convert Mongoose document to plain object
            numberOfEmployees,
          };
        })
      );

      resp.status(200).json({
        success: true,
        message: "All job profile list with the number of employees.",
        docs: responseJobProfiles,
      });
    } else {
      resp.status(404).json({
        success: false,
        message: "No job profiles found.",
      });
    }
  }
);

// update hierarchy
export const updateHierarchy = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { jobProfileName, parentJobProfileName } = req.body;

    if (jobProfileName === parentJobProfileName) {
      return resp.status(400).json({
        success: false,
        message: "The job profile and parent job profile cannot be same .",
      });
    }

    // Find job profile ID based on jobProfileName
    const currentJobProfile = await JobProfileModel.findOne({ jobProfileName });
    if (!currentJobProfile) {
      return resp.status(404).json({
        success: false,
        message: "Job Profile not found.",
      });
    }

    const jobProfileId = currentJobProfile._id;

    if (parentJobProfileName) {
      // Find parent job profile ID based on parentJobProfileName
      const parentJobProfile = await JobProfileModel.findOne({
        jobProfileName: parentJobProfileName,
      });
      if (!parentJobProfile) {
        return resp.status(404).json({
          success: false,
          message: "Parent Job Profile not found.",
        });
      }
      const parentJobProfileId = parentJobProfile._id;

      if (
        parentJobProfile.parentJobProfileId?.toString() ===
        currentJobProfile._id.toString()
      ) {
        const job1 = currentJobProfile;
        const job2 = parentJobProfile;
        const newArray = job1.childProfileId.filter(
          (e) => String(e) !== String(parentJobProfile._id)
        );
        newArray.push(job1._id);

        const newArray1 = [...job2?.childProfileId];
        const update1 = await JobProfileModel.findOneAndUpdate(
          { _id: currentJobProfile._id },
          { parentJobProfileId: job2._id, childProfileId: newArray1 },
          { new: true }
        ).exec();
        const update2 = await JobProfileModel.findOneAndUpdate(
          { _id: parentJobProfile._id },
          {
            parentJobProfileId: job1.parentJobProfileId,
            childProfileId: newArray,
          },
          { new: true }
        ).exec();
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
        await JobProfileModel.updateOne(filter3, update3);
      }
      await JobProfileModel.updateOne(filter, update);
      await JobProfileModel.updateOne(filter2, update2);

      resp.status(200).json({
        success: true,
        message: "Updated Job Profile successfully.",
        currentJobProfileId: jobProfileId,
        parent: parentJobProfile,
      });
    } else {
      const parent = currentJobProfile.parentJobProfileId;
      console.log(`Job profile: ${currentJobProfile.jobProfileName}`);
      if (currentJobProfile) {
        currentJobProfile.parentJobProfileId = null;

        const jobprofile = await JobProfileModel.find({});
        for (let i = 0; i < jobprofile.length; i++) {
          const jobProfile = jobprofile[i];

          if (
            jobProfile.childProfileId &&
            jobProfile.childProfileId.includes(currentJobProfile._id)
          ) {
            const indexToRemove = jobProfile.childProfileId.indexOf(
              currentJobProfile._id
            );
            jobProfile.childProfileId.splice(indexToRemove, 1);

            await jobProfile.save();
          }
        }
        // await currentJobProfile.save();
      }
      console.log("parent", parent);
      // Remove childProfileId from old parent
      if (parent) {
        const oldParentJobProfile = await JobProfileModel.findOne({
          _id: parent,
        });
        console.log("oldParentJobProfile", oldParentJobProfile);
        if (oldParentJobProfile) {
          // Use type assertion to suppress TypeScript error
          const childProfileIdArray = oldParentJobProfile.childProfileId as any;
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
  }
);

// getting jobProfile data with no parent
export async function getAllJobProfileWithNoParent(
  req: Request,
  res: Response
) {
  try {
    const jobProfile = await JobProfileModel.find({
      parentJobProfileId: null,
    }).exec();
    res.status(200).json({
      success: true,
      jobProfile,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getChildJobProfile(req: Request, res: Response) {
  const { jobprofielId } = req.params;

  try {
    const jobProfile = await JobProfileModel.findById(jobprofielId)
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
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

export const getSingleJobProfile = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    if (id) {
      const allEmployees = await EmployeeModel.find({});
      const jobProfileData = await JobProfileModel.findById(id);
      resp.status(200).json({
        success: true,
        message: "jobprofile data successfully.",
        jobProfileData,
      });
    } else {
      resp.status(200).json({
        success: false,
        message: "jobprofile not found.",
      });
    }
  }
);

// suggestion for heirarchy

export const suggestionForJobProfile = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  try {
    const { jobprofileId } = req.params;
    const jobprofileDetails = await JobProfileModel.findById(jobprofileId);
    if (!jobprofileDetails) {
      return resp.status(404).json({
        success: false,
        message: `Job profile with Id ${jobprofileId} not found.`,
      });
    }

    const suggestionsArray: any = [];

    const allJobProfiles = await JobProfileModel.find().lean();
    const allJobProfileStore: any = {};

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
    } else {
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
  } catch (error) {
    console.log(error);
  }
};

export const emptyAllChildAndParentFields = async (
  req: Request,
  res: Response
) => {
  try {
    // Update all documents in the "JobProfile" collection
    const updateResult = await JobProfileModel.updateMany(
      {},
      {
        $set: {
          childProfileId: [],
          parentJobProfileId: null,
        },
      }
    );

    return res.status(200).json({
      message:
        "ChildProfileId and ParentJobProfileId cleared in all documents.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An error occurred while clearing fields in all documents.",
    });
  }
};
// ass
