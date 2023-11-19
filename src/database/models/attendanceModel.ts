import mongoose, { model } from "mongoose";
import { AttendanceSchema } from "../schemas/attendanceSchema";
import { Attendance} from "../entities/attendanceDocument";

const attendanceModel = model<Attendance>("Attendance", AttendanceSchema);
export default attendanceModel;

