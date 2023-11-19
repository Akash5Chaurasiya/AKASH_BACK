import { Router } from "express";
import multer from "multer";

import { isAuthenticatedAdminOrAttendanceManager, isAuthenticatedAdminOrHR, isAuthenticatedSupervisor } from "../middleware/auth";
import { absentAndPresentEmployee, getGroupPunchRecords, addAttendanceWithEmployeeId, myAttendance, shopFilter, getPunchRecords, employeeStaffAttendance, attendanceApproveImage, singleEmployeeAttendance, updateAttendance, getEmployeeByQRCode, getMyApprovedAttendance, addPunchs, updatePunchs, deletePunchs, pendingUnderMe, addAttendanceWithEmployeeIdV2, groupOverView, departmentOverView, getPunchRecordsNumber, updatePunchOut, shopOverView, updateAttendanceDetails } from "../controllers/employee/v2attendanceController";

const v2AttendanceRouter = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

v2AttendanceRouter.post("/", isAuthenticatedAdminOrHR, absentAndPresentEmployee);
v2AttendanceRouter.get("/singleEmployee/:employeeId", isAuthenticatedAdminOrHR, singleEmployeeAttendance);
v2AttendanceRouter.get("/myAttendance", myAttendance);
v2AttendanceRouter.get("/getPunchInPunchOut", isAuthenticatedAdminOrHR, getPunchRecords);
v2AttendanceRouter.post("/getPunchInPunchOutNumber", isAuthenticatedAdminOrHR, getPunchRecordsNumber);
v2AttendanceRouter.get("/staffAttendance", isAuthenticatedAdminOrHR, employeeStaffAttendance);
v2AttendanceRouter.get("/groupPresent", isAuthenticatedAdminOrHR, getGroupPunchRecords);
v2AttendanceRouter.get("/ownApproved", isAuthenticatedAdminOrHR, getMyApprovedAttendance);

v2AttendanceRouter.post("/addAttendance", isAuthenticatedAdminOrHR, addAttendanceWithEmployeeId);
v2AttendanceRouter.post("/uploadApproveImage", upload.single("file"), attendanceApproveImage);
v2AttendanceRouter.patch("/approveAttendance", isAuthenticatedAdminOrHR, updateAttendance);

v2AttendanceRouter.post("/find-employee-by-Qr", isAuthenticatedAdminOrHR, getEmployeeByQRCode);
// for admin and attendance manager only

v2AttendanceRouter.post("/addPunches/:id", isAuthenticatedAdminOrAttendanceManager, addPunchs);
v2AttendanceRouter.patch("/updatePunches/:id", isAuthenticatedAdminOrAttendanceManager, updatePunchs);
v2AttendanceRouter.delete("/deletePunches/:id", isAuthenticatedAdminOrAttendanceManager, deletePunchs);
v2AttendanceRouter.post("/shopFilter", isAuthenticatedAdminOrHR, shopFilter);
// for  supervisor
v2AttendanceRouter.patch("/updatePunchOut/:id", isAuthenticatedSupervisor, updatePunchOut);


v2AttendanceRouter.get("/employeeUnderMe", isAuthenticatedAdminOrHR, pendingUnderMe)

// add attendance for shift systems     
v2AttendanceRouter.post("/v2/addAttendance", isAuthenticatedAdminOrHR, addAttendanceWithEmployeeIdV2);
v2AttendanceRouter.get("/v2/groupview", isAuthenticatedAdminOrHR, groupOverView);
v2AttendanceRouter.get("/v2/departmentOverview", isAuthenticatedAdminOrHR, departmentOverView);
v2AttendanceRouter.get("/v2/shopOverview", isAuthenticatedAdminOrHR, shopOverView);
v2AttendanceRouter.get("/OneDate", updateAttendanceDetails);
export default v2AttendanceRouter;