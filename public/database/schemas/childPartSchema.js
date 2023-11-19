"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const childPartSchema = new mongoose_1.default.Schema({
    partName: {
        type: String,
        unique: true,
        trim: true
    },
    productionGodown: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Godown"
    },
    group: {
        groupId: {
            type: mongoose_1.default.Schema.Types.ObjectId
        },
        groupName: {
            type: String
        }
    },
    finishedItemId: {
        type: mongoose_1.default.Schema.Types.ObjectId
    },
    // for raw materials 
    childPartType: {
        type: String
    },
    materialCode: {
        type: String,
        unique: true,
        trim: true
    },
    typeOfMaterial: {
        type: String
    },
    unit: {
        type: String
    },
    numberOfItem: {
        type: Number
    },
    processId: {
        type: mongoose_1.default.Schema.Types.ObjectId
    },
    processName: {
        type: String
    },
    // ------------------
    consumedItem: [{
            itemId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "ChildPart"
            },
            itemName: {
                type: String
            },
            itemType: {
                type: String
            },
            consumedItemQuantity: {
                type: Number
            },
            consumptionGodown: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Godown"
            }
        }]
}, {
    timestamps: true
});
exports.default = childPartSchema;
