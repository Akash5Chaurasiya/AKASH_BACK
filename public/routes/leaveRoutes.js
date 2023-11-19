"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const LeaveController_1 = require("../controllers/employee/LeaveController");
const auth_1 = require("../middleware/auth");
const leaveRouter = (0, express_1.Router)();
leaveRouter.route("/").post(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.requestLeave);
leaveRouter.route("/pending").get(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.getPendingLeaveRequest); //1
leaveRouter.route("/accepted").get(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.getAcceptedLeaveRequest);
leaveRouter.route("/approved").get(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.getApprovedLeaveRequest);
leaveRouter.route("/rejected").get(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.getRejectedLeaveRequest); //3
leaveRouter.route("/all").get(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.getAllLeaveAndGatePass);
// get leave by employee
leaveRouter.route("/myleave").get(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.getLeaveRequestByEmployee);
// approve leave
leaveRouter.route("/acceptleave").patch(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.updateLeaveRequestStatusAcceptedOrReject); //2
leaveRouter.route("/approveleave").patch(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.approveLeaveRequestOrReject); //3
// approve gatePass
leaveRouter.route("/acceptgatepass").patch(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.updateGatePassRequestStatusAcceptedOrReject);
leaveRouter.route("/approvegatepass").patch(auth_1.isAuthenticatedAdminOrHR, LeaveController_1.approveGatePassRequestOrReject);
// get all gatePassRequest
// leaveRouter.route("/pendinggatepass").get(isAuthenticatedAdminOrHR,getPendingGatePassRequest);
// leaveRouter.route("/acceptedgatepass").get(isAuthenticatedAdminOrHR,getAcceptedGatePassRequest);
// leaveRouter.route("/approvedgatepass").get(isAuthenticatedAdminOrHR,getApprovedGatePassRequest);
// leaveRouter.route("/rejectedgatepass").get(isAuthenticatedAdminOrHR,getRejectedGatePassRequest);
// get leave data with filter
// leaveRouter.route("/leavegatepass").get(getLeaveData);
exports.default = leaveRouter;
