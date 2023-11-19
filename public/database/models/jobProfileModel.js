"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const jobProfileSchema_1 = require("../schemas/jobProfileSchema");
const JobProfileModel = (0, mongoose_1.model)("JobProfile", jobProfileSchema_1.JobProfileSchema);
exports.default = JobProfileModel;
