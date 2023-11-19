import mongoose , {Document} from "mongoose";


export interface ShopLogDocument extends Document{

    shopId:mongoose.Schema.Types.ObjectId;
    date:Date;
    employees:{
       employeeId:mongoose.Schema.Types.ObjectId;
       employeeName:string;
    }[];
}