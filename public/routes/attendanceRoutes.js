"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_1 = require("../controllers/employee/attendanceController");
const auth_1 = require("../middleware/auth");
const attendanceRouter = (0, express_1.Router)();
// by QR Code
attendanceRouter.route("/addAttendance").post(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.markAttendanceWithEmployeeId); //v1
attendanceRouter.route("/find-employee-by-Qr").post(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.getEmployeeByQRCode);
// attendanceRouter.route("/getTodaysPunchIns").get(getTodaysPunchIns);//data
// attendanceRouter.route("/getEmployeeTotalHours").get(getEmployeeTotalHours);
attendanceRouter.route("/updateAttendance").patch(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.updateAttendance); //update v1
attendanceRouter.route("/").get(attendanceController_1.absentAndPresentEmployee); //v1
attendanceRouter.route("/myAttendance").get(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.myAttendance); //v1
attendanceRouter.route("/singleEmployee/:employeeId").get(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.singleEmployeeAttendance); //v1
// security
attendanceRouter.route("/getPunchInPunchOut").get(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.getPunchRecords); //v1
attendanceRouter.route("/staffAttendance").get(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.employeeStaffAttendance); //v1
attendanceRouter.route("/groupPresent").get(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.getGroupPunchRecords); //v1
// attendanceRouter.router('/getAllPunchInPunchOutData',isAuthenticatedAdminOrHR)
// get group salary record with attendance
attendanceRouter.route("/groupSalary").get(auth_1.isAuthenticatedAdminOrHR, attendanceController_1.getGroupRecordPerDay);
attendanceRouter.route("/lastPunchOut").get(attendanceController_1.getFirstPunchInLastPunchOut);
// attendanceRouter.route("/getallpunches").get(isAuthenticatedAdminOrHR,getAllEmployeePunches); // Get all punched without approved
// attendanceRouter.route("/getattendancebydate").get(isAuthenticatedAdminOrHR,getEmployeePunchesByDate);
// attendanceRouter.route("/myattendance").get(isAuthenticatedAdminOrHR,getMyAttendanceSortedByDate);
// // filter by date
// attendanceRouter.route("/getAllEmployeeByDate").post(allEmployeeByDate);
// attendanceRouter.route("/getPresentNumber").get(getPresentNumber);//number
// attendanceRouter.route("/getpresentbelow").get(isAuthenticatedAdminOrHR,getPresentEmployeeBelowJobProfile);
// // get total working hours in a range of date 
// attendanceRouter.route("/getTotalWorkingHours").post(getTotalWorkingHours);
exports.default = attendanceRouter;
