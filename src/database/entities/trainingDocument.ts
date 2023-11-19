import mongoose,{Document} from "mongoose";


export interface TrainingDocument extends Document{

    jobProfileId:mongoose.Schema.Types.ObjectId,
    groupId:mongoose.Schema.Types.ObjectId,
    trainingMaterial:{
        resourceName:string,
        resourceUrl:string
    }[],
    status:string,
    marks:number    
}