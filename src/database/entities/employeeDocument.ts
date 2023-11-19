import mongoose, { Document } from "mongoose";
import { EmployeeDocsDocument } from "./employeeDocsDocument";


export interface EmployeeDocument extends Document {
    name: string,
    active:boolean,
    BarCodeStatus:boolean,
    // new details for Employee
    aadharNumber:number,
    PF_UAN_Number:string,
    ESI_ID:string,
    PAN_Number:string,
    salaryMode:string,
    bankDetails:Object,
    // new details for Employee
    groupId: mongoose.Schema.Types.ObjectId,
    jobProfileId: mongoose.Schema.Types.ObjectId,
    role: string,
    email: string,
    employeeCode:string,
    password: string,
    contactNumber: number,
    verified?:boolean,
    dateOfBirth: Date,
    gender: string,
    dateOfJoining: Date,
    workingDays:number,
    workingHours:number,
    lunchTime:number,
    overTime:boolean,
    overTimeRate:number,
    salary: number,
    leaveTaken: number,
    currentBarCode: string,
    createdAt: Date,
    updatedAt: Date,
    permanentBarCode:string,
    permanentBarCodeNumber:string,
    permanentQrCodeAssign:Date,
    assignedBy: mongoose.Schema.Types.ObjectId,
    trainingStatus:string,
    marks:number[],
    optionForRole:[],
    employeeDocs?: EmployeeDocsDocument;
    profilePicture?:string
    productionLogs:{
          productionSlipId:mongoose.Schema.Types.ObjectId;
          time:Date;
        }[]
}