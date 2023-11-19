"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const godownController_1 = require("../controllers/bomControllers/godownController");
const godownRouter = express_1.default.Router();
godownRouter.route("/").get(godownController_1.getAllGodown);
godownRouter.route("/add").post(godownController_1.addGodown);
godownRouter.route("/:id").get(godownController_1.getGodown).delete(godownController_1.deleteGodown).patch(godownController_1.updateGodown);
exports.default = godownRouter;
