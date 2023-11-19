import mongoose from "mongoose";
import { Attendance } from "../schemas/v2AttendanceSchema";
import { AttendanceDocs } from "../entities/attendanceDocs";


const v2AttendanceModel = mongoose.model<AttendanceDocs>("v2Attendance",Attendance);
export default v2AttendanceModel;