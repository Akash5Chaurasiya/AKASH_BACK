import { Router } from "express";
import {
    approveGatePassRequestOrReject,
     approveLeaveRequestOrReject,
    // getAcceptedGatePassRequest,
    getAcceptedLeaveRequest,
    getAllLeaveAndGatePass,
    // getApprovedGatePassRequest,
    getApprovedLeaveRequest,
    // getLeaveData,
    getLeaveRequestByEmployee,
    // getPendingGatePassRequest,
    getPendingLeaveRequest,
    // getRejectedGatePassRequest,
    getRejectedLeaveRequest,
    requestLeave,
    updateGatePassRequestStatusAcceptedOrReject,
    updateLeaveRequestStatusAcceptedOrReject
} from "../controllers/employee/LeaveController";
import { isAuthenticatedAdminOrHR } from "../middleware/auth";

const leaveRouter = Router();


leaveRouter.route("/").post(isAuthenticatedAdminOrHR,requestLeave)
leaveRouter.route("/pending").get(isAuthenticatedAdminOrHR, getPendingLeaveRequest);//1
leaveRouter.route("/accepted").get(isAuthenticatedAdminOrHR, getAcceptedLeaveRequest);
leaveRouter.route("/approved").get(isAuthenticatedAdminOrHR, getApprovedLeaveRequest);
leaveRouter.route("/rejected").get(isAuthenticatedAdminOrHR, getRejectedLeaveRequest);//3
leaveRouter.route("/all").get(isAuthenticatedAdminOrHR, getAllLeaveAndGatePass);


// get leave by employee
leaveRouter.route("/myleave").get(isAuthenticatedAdminOrHR, getLeaveRequestByEmployee)

// approve leave
leaveRouter.route("/acceptleave").patch(isAuthenticatedAdminOrHR, updateLeaveRequestStatusAcceptedOrReject)//2
leaveRouter.route("/approveleave").patch(isAuthenticatedAdminOrHR, approveLeaveRequestOrReject)//3

// approve gatePass
leaveRouter.route("/acceptgatepass").patch(isAuthenticatedAdminOrHR, updateGatePassRequestStatusAcceptedOrReject)
leaveRouter.route("/approvegatepass").patch(isAuthenticatedAdminOrHR, approveGatePassRequestOrReject)

// get all gatePassRequest
// leaveRouter.route("/pendinggatepass").get(isAuthenticatedAdminOrHR,getPendingGatePassRequest);
// leaveRouter.route("/acceptedgatepass").get(isAuthenticatedAdminOrHR,getAcceptedGatePassRequest);
// leaveRouter.route("/approvedgatepass").get(isAuthenticatedAdminOrHR,getApprovedGatePassRequest);
// leaveRouter.route("/rejectedgatepass").get(isAuthenticatedAdminOrHR,getRejectedGatePassRequest);

// get leave data with filter
// leaveRouter.route("/leavegatepass").get(getLeaveData);

export default leaveRouter;