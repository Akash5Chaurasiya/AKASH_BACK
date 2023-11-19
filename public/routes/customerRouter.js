"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const customController_1 = require("../controllers/bomControllers/customController");
const customerRouter = express_1.default.Router();
customerRouter.route("/").get(customController_1.getAllCustomer); // added search and filter with Customer COde , query is name and code;
customerRouter.route("/:id").get(customController_1.getCustomer);
customerRouter.route("/add").post(customController_1.addCustomer);
customerRouter.route("/:id").delete(customController_1.deleteCustomer);
customerRouter.route("/:id").patch(customController_1.updateCoustomer);
exports.default = customerRouter;
