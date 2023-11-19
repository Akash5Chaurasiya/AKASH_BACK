"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/admin/adminController");
const adminRouter = (0, express_1.Router)();
adminRouter.route("/add").post(adminController_1.addAdmin);
adminRouter.route("/").get(adminController_1.getAllAdmin);
adminRouter.route("/:id").patch(adminController_1.updateAdmin).delete(adminController_1.deleteAdmin);
exports.default = adminRouter;
