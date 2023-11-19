import mongoose from "mongoose";


export const leaveSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    },
    appliedDate: {
        type: Date
    },
    appliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee"
    },
    from: {
        type: Date
    },
    to: {
        type: Date
    },
    message: {
        type: String
    },
    status: {
        type: String
    },
    acceptedDate: {
        type: Date
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
    },
    rejectedDate: {
        type: Date
    },
    rejectedReason: {
        type: String
    },
    approvedDate: {
        type: Date
    },
    gatePassDate: {
        type: Date
    },
    gatePassTime: {
        type: String
    },
})