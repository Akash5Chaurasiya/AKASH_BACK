import mongoose,{ Document } from "mongoose";



export interface PlanningDocument extends Document{
    finishedItemId:mongoose.Schema.Types.ObjectId;
    finishedItemName:string;
    status:string
    minimumInventory:number;
    month:Date;
    dates:{
        date:Date;
        day:string;
        orderValue?:number;
        dispatchValue?:number;
        by?:{
           orderValue:number; 
           date:Date;
           employeeId:mongoose.Schema.Types.ObjectId;
           name:string;
        }[];
    }[];
}