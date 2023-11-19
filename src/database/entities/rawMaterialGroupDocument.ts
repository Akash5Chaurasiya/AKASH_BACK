import mongoose,{Document} from "mongoose";

export interface RawMaterialGroupDocument extends Document{
    groupName:string,
    description:string
};