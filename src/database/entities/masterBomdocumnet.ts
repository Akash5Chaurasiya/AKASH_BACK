import mongoose, { Document } from "mongoose";

export interface masterBomdocumnet extends Document {
    process?: mongoose.Schema.Types.ObjectId,
    productionGodown?: mongoose.Schema.Types.ObjectId,
    childProduct?: string
    Consumption: [
        {
            rawMaterial: mongoose.Schema.Types.ObjectId,
            godownConsumption: mongoose.Schema.Types.ObjectId,
            quantityRequired: {
                type: string
                value: number
            }
        }
    ]   
}