import mongoose, { Document,Schema } from "mongoose";
import { EmployeeDocument } from "./employeeDocument";

export interface AttendanceDay {
        punchIn: Date;
        punchOut?: Date;
        punchInBy: mongoose.Schema.Types.ObjectId; 
        punchOutBy?: mongoose.Schema.Types.ObjectId;
        approvedBy?: mongoose.Schema.Types.ObjectId;
        approvedImage?:string;
        status?:String;
}

export interface Attendance extends Document {
    date: Date;
    employeeId: Schema.Types.ObjectId | EmployeeDocument ;
    punches: AttendanceDay[];
    isPresent: boolean;
    workingHours:number;
    pendingHours:number;
    totalEarning:number;
}