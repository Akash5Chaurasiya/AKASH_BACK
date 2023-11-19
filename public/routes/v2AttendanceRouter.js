"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const v2attendanceController_1 = require("../controllers/employee/v2attendanceController");
const v2AttendanceRouter = (0, express_1.Router)();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
v2AttendanceRouter.post("/", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.absentAndPresentEmployee);
v2AttendanceRouter.get("/singleEmployee/:employeeId", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.singleEmployeeAttendance);
v2AttendanceRouter.get("/myAttendance", v2attendanceController_1.myAttendance);
v2AttendanceRouter.get("/getPunchInPunchOut", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.getPunchRecords);
v2AttendanceRouter.post("/getPunchInPunchOutNumber", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.getPunchRecordsNumber);
v2AttendanceRouter.get("/staffAttendance", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.employeeStaffAttendance);
v2AttendanceRouter.get("/groupPresent", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.getGroupPunchRecords);
v2AttendanceRouter.get("/ownApproved", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.getMyApprovedAttendance);
v2AttendanceRouter.post("/addAttendance", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.addAttendanceWithEmployeeId);
v2AttendanceRouter.post("/uploadApproveImage", upload.single("file"), v2attendanceController_1.attendanceApproveImage);
v2AttendanceRouter.patch("/approveAttendance", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.updateAttendance);
v2AttendanceRouter.post("/find-employee-by-Qr", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.getEmployeeByQRCode);
// for admin and attendance manager only
v2AttendanceRouter.post("/addPunches/:id", auth_1.isAuthenticatedAdminOrAttendanceManager, v2attendanceController_1.addPunchs);
v2AttendanceRouter.patch("/updatePunches/:id", auth_1.isAuthenticatedAdminOrAttendanceManager, v2attendanceController_1.updatePunchs);
v2AttendanceRouter.delete("/deletePunches/:id", auth_1.isAuthenticatedAdminOrAttendanceManager, v2attendanceController_1.deletePunchs);
v2AttendanceRouter.post("/shopFilter", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.shopFilter);
// for  supervisor
v2AttendanceRouter.patch("/updatePunchOut/:id", auth_1.isAuthenticatedSupervisor, v2attendanceController_1.updatePunchOut);
v2AttendanceRouter.get("/employeeUnderMe", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.pendingUnderMe);
// add attendance for shift systems     
v2AttendanceRouter.post("/v2/addAttendance", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.addAttendanceWithEmployeeIdV2);
v2AttendanceRouter.get("/v2/groupview", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.groupOverView);
v2AttendanceRouter.get("/v2/departmentOverview", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.departmentOverView);
v2AttendanceRouter.get("/v2/shopOverview", auth_1.isAuthenticatedAdminOrHR, v2attendanceController_1.shopOverView);
v2AttendanceRouter.get("/OneDate", v2attendanceController_1.updateAttendanceDetails);
exports.default = v2AttendanceRouter;
