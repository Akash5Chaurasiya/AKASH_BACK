import mongoose from "mongoose";

export const connectDB = async () => {
        try{
                const connect = await mongoose.connect(`${process.env.DB_URI}`);
                console.log("DB connected");
                return connect;
        }catch(err: any){
                console.log(err.message)
        }
}