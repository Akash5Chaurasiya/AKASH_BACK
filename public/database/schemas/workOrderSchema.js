"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workOrderSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.workOrderSchema = new mongoose_1.default.Schema({
    date: {
        type: Date,
    },
    orderNumber: {
        type: String,
        unique: true,
        trim: true
    },
    customerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
    },
    customerName: {
        type: String,
        trim: true
    },
    finishedItemId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "FinishedItem",
    },
    finishItemName: {
        type: String,
    },
    partCode: {
        type: String,
    },
    MCode: {
        type: String,
    },
    orderQuantity: {
        type: Number,
    },
    status: {
        type: String,
        default: "pending",
        enum: ["pending", "inProgress", "completed", "cancel"],
    },
    masterBom: [
        {
            partName: {
                type: String,
            },
            _id: {
                type: mongoose_1.default.Schema.Types.ObjectId,
            },
            process: {
                type: String,
            },
            processId: {
                type: mongoose_1.default.Schema.Types.ObjectId
            },
            unit: {
                type: String,
            },
            numberOfItem: {
                type: Number,
                default: 1,
            },
            productionGodownId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
            },
            productionGodownName: {
                type: String,
            },
            itemProduced: {
                type: Number,
                default: 0,
            },
            newChild: [
                {
                    _id: {
                        type: mongoose_1.default.Schema.Types.ObjectId,
                    },
                    partName: {
                        type: String,
                    },
                    materialCode: {
                        type: String,
                    },
                    typeOfMaterial: {
                        type: String,
                    },
                    consumptionGodownId: {
                        type: mongoose_1.default.Schema.Types.ObjectId
                    },
                    consumptionGodownName: {
                        type: String
                    },
                    childPartType: {
                        type: String,
                    },
                    unit: {
                        type: String,
                    },
                    numberOfItem: {
                        type: Number,
                    },
                },
            ],
        },
    ],
}, {
    timestamps: true,
});
