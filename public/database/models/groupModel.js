"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const groupSchema_1 = require("../schemas/groupSchema");
const groupModel = (0, mongoose_1.model)("Group", groupSchema_1.groupSchema);
exports.default = groupModel;
