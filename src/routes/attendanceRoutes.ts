import { Router } from "express";
import {
  // allEmployeeByDate,
  // approveAttendance,
  // getAllEmployeePunches,
  getEmployeeByQRCode,
  updateAttendance,
  // getEmployeePunchesByDate,
  // getEmployeeTotalHours,
  // getMyAttendanceSortedByDate,
  // getPresentEmployeeBelowJobProfile,
  // getPresentNumber,
  // getTodaysPunchIns,
  // getTotalWorkingHours,
  markAttendanceWithEmployeeId,
  absentAndPresentEmployee,
  getPunchRecords,
  getGroupRecordPerDay,
  myAttendance,
  employeeStaffAttendance,
  getGroupPunchRecords,
  singleEmployeeAttendance,
  getFirstPunchInLastPunchOut,
} from "../controllers/employee/attendanceController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const attendanceRouter = Router();

// by QR Code
attendanceRouter.route("/addAttendance").post(isAuthenticatedAdminOrHR,markAttendanceWithEmployeeId); //v1

attendanceRouter.route("/find-employee-by-Qr").post(isAuthenticatedAdminOrHR,getEmployeeByQRCode);
// attendanceRouter.route("/getTodaysPunchIns").get(getTodaysPunchIns);//data
// attendanceRouter.route("/getEmployeeTotalHours").get(getEmployeeTotalHours);

attendanceRouter.route("/updateAttendance").patch(isAuthenticatedAdminOrHR,updateAttendance);//update v1
attendanceRouter.route("/").get(absentAndPresentEmployee);//v1
attendanceRouter.route("/myAttendance").get(isAuthenticatedAdminOrHR,myAttendance); //v1
attendanceRouter.route("/singleEmployee/:employeeId").get(isAuthenticatedAdminOrHR,singleEmployeeAttendance);//v1
// security
attendanceRouter.route("/getPunchInPunchOut").get(isAuthenticatedAdminOrHR,getPunchRecords);//v1
attendanceRouter.route("/staffAttendance").get(isAuthenticatedAdminOrHR,employeeStaffAttendance);//v1
attendanceRouter.route("/groupPresent").get(isAuthenticatedAdminOrHR,getGroupPunchRecords);//v1
// attendanceRouter.router('/getAllPunchInPunchOutData',isAuthenticatedAdminOrHR)
// get group salary record with attendance
attendanceRouter.route("/groupSalary").get(isAuthenticatedAdminOrHR,getGroupRecordPerDay);
attendanceRouter.route("/lastPunchOut").get(getFirstPunchInLastPunchOut);







// attendanceRouter.route("/getallpunches").get(isAuthenticatedAdminOrHR,getAllEmployeePunches); // Get all punched without approved
// attendanceRouter.route("/getattendancebydate").get(isAuthenticatedAdminOrHR,getEmployeePunchesByDate);
// attendanceRouter.route("/myattendance").get(isAuthenticatedAdminOrHR,getMyAttendanceSortedByDate);

// // filter by date
// attendanceRouter.route("/getAllEmployeeByDate").post(allEmployeeByDate);
// attendanceRouter.route("/getPresentNumber").get(getPresentNumber);//number


// attendanceRouter.route("/getpresentbelow").get(isAuthenticatedAdminOrHR,getPresentEmployeeBelowJobProfile);

// // get total working hours in a range of date 
// attendanceRouter.route("/getTotalWorkingHours").post(getTotalWorkingHours);



export default attendanceRouter;
