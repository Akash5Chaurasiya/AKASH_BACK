import { Document } from "mongoose";


export interface FinishItemDocumentGroup extends Document{
    groupName : string;
    groupDescription : string;
}