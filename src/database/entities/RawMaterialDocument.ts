import { Document } from "mongoose";


interface RawMaterialDocument extends Document {
    name:string,
    type:string,
    code:string,
    unit:string
}

export default RawMaterialDocument