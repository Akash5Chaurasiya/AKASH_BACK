import mongoose from "mongoose";

export const bomSchema = new mongoose.Schema({
    finished:{},
    process: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"globalProcess"
    },
    childProduct: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"ChildPart"
    }],
});
