"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionSlipSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.productionSlipSchema = new mongoose_1.default.Schema({
    productionSlipNumber: {
        type: String,
        unique: true,
    },
    workOrderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: [true, "WorkOrder Id is required."],
        ref: "workOrder",
    },
    printCount: {
        type: Number,
        default: 0
    },
    QRCode: {
        type: String,
    },
    origin: {
        type: String,
    },
    part: {
        _id: {
            type: mongoose_1.default.Schema.Types.ObjectId,
        },
        partName: {
            type: String,
        },
    },
    shop: {
        shopName: {
            type: String,
        },
        shopId: {
            type: mongoose_1.default.Schema.Types.ObjectId,
        },
    },
    durationFrom: {
        type: Date,
    },
    durationTo: {
        type: Date,
    },
    process: {
        processId: {
            type: mongoose_1.default.Schema.Types.ObjectId,
        },
        processName: {
            type: String,
        },
    },
    numberOfItems: {
        type: Number,
    },
    itemPerWorkOrder: {
        type: Number
    },
    itemProduced: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        default: "inactive",
    },
    manualRemark: {
        type: String
    },
    consumedItem: [
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
                type: mongoose_1.default.Schema.Types.ObjectId,
            },
            consumptionGodownName: {
                type: String,
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
            numberOfItemConsumed: {
                type: Number,
                default: 0,
            },
        },
    ],
    createdBy: {
        name: {
            type: String
        },
        employeeId: {
            type: mongoose_1.default.Schema.Types.ObjectId
        }
    },
    activatedBy: {
        name: {
            type: String
        },
        employeeId: {
            type: mongoose_1.default.Schema.Types.ObjectId
        }
    },
    completedBy: {
        name: {
            type: String
        },
        employeeId: {
            type: mongoose_1.default.Schema.Types.ObjectId
        }
    },
    working: [
        {
            updatedBy: {
                name: {
                    type: String
                },
                employeeId: {
                    type: mongoose_1.default.Schema.Types.ObjectId
                }
            },
            itemProduced: {
                type: Number,
                default: 0,
            },
            startTime: {
                type: Date,
            },
            endTime: {
                type: Date,
            },
            employees: [
                {
                    employeeId: {
                        type: mongoose_1.default.Schema.Types.ObjectId,
                        ref: "Employee",
                    },
                    employeeName: {
                        type: String,
                    },
                },
            ],
            machines: [
                {
                    machineId: {
                        type: mongoose_1.default.Schema.Types.ObjectId,
                        ref: "machine",
                    },
                    machineName: {
                        type: String,
                    },
                },
            ],
        },
    ],
}, {
    timestamps: true,
});
