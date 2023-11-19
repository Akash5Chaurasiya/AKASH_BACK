import { Document } from "mongoose";

interface GodownDocument extends Document{
    godownName:string,
    godownCode:string,
}
export default GodownDocument