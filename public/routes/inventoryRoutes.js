"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const InventoryController_1 = require("../controllers/bomControllers/InventoryController");
const inventoryRouter = express_1.default.Router();
// get inventory data
inventoryRouter.route("/").post(InventoryController_1.getDataInventory);
// inventory 
inventoryRouter.route("/workOrder").post(InventoryController_1.getAllInventoryByWorkOrder);
// // testing
// inventoryRouter.route("/testing").get(testing);
// inventoryRouter.route("/").post();
exports.default = inventoryRouter;
