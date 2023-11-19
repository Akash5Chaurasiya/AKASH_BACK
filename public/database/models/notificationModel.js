"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notificationSchema_1 = require("../schemas/notificationSchema");
const notificationModel = (0, mongoose_1.model)("Notification", notificationSchema_1.notificationSchema);
exports.default = notificationModel;
