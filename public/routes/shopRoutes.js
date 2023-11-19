"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const shopController_1 = require("../controllers/bomControllers/shopController");
const shopRouter = express_1.default.Router();
shopRouter.route("/add").post(shopController_1.addShop);
shopRouter.route("/").get(shopController_1.getAllShop);
shopRouter.route("/:id").get(shopController_1.getSingleShop).patch(shopController_1.updateShop).delete(shopController_1.deleteShop);
exports.default = shopRouter;
