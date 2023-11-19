"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const globalProcessController_1 = require("../controllers/bomControllers/globalProcessController");
const globalProcessRouter = express_1.default.Router();
globalProcessRouter.route("/").post(globalProcessController_1.getAllGlobalProcess); // added shop WIse filter and name search where search by processName , code or shopName
globalProcessRouter.route("/add").post(globalProcessController_1.addGlobalProcess);
globalProcessRouter.route("/:id").delete(globalProcessController_1.deleteGlobalProcess).patch(globalProcessController_1.updateGlobalProcess).get(globalProcessController_1.getGlobalProcess);
exports.default = globalProcessRouter;
