import mongoose from "mongoose";


const ShopLogSchema = new mongoose.Schema({
     shopId:{
        type:mongoose.Schema.Types.ObjectId,
     },
     date:{
        type:Date
     },
     employees:[{
        employeeId:{
            type:mongoose.Schema.Types.ObjectId,
        },
        employeeName:{
            type:String,
        }
     }]
})

export default ShopLogSchema;
