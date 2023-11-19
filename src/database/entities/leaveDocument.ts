import mongoose,{ Document } from "mongoose";

export interface LeaveDocument extends Document{
    employeeId:mongoose.Schema.Types.ObjectId,
        appliedDate:Date,
        from?:Date,
        to?:Date,
        message:string,
        status:string,
        acceptedBy?:mongoose.Schema.Types.ObjectId,
        acceptedDate?:Date,
        approvedDate?:Date,
        rejectedBy?:mongoose.Schema.Types.ObjectId,
        rejectedDate?:Date,
        rejectedReason?:string
        gatePassDate?:Date,
        gatePassTime?:string,
        appliedBy?:mongoose.Schema.Types.ObjectId
}