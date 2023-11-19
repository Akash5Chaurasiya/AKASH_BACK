"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("./middleware/errorHandler");
const employeeRoutes_1 = __importDefault(require("./routes/employeeRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const groupRoutes_1 = __importDefault(require("./routes/groupRoutes"));
const jobProfileRoutes_1 = __importDefault(require("./routes/jobProfileRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const url_1 = __importDefault(require("url"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const employeeDocsRouters_1 = __importDefault(require("./routes/employeeDocsRouters"));
const dotenv_1 = require("dotenv");
const leaveRoutes_1 = __importDefault(require("./routes/leaveRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
// import translate from "google-translate-api"
const app = (0, express_1.default)();
const path_1 = __importDefault(require("path"));
const notificationModel_1 = __importDefault(require("./database/models/notificationModel"));
const employeeModel_1 = __importDefault(require("./database/models/employeeModel"));
const groupModel_1 = __importDefault(require("./database/models/groupModel"));
const jobProfileModel_1 = __importDefault(require("./database/models/jobProfileModel"));
const trainingRoutes_1 = __importDefault(require("./routes/trainingRoutes"));
const otpRouter_1 = __importDefault(require("./routes/otpRouter"));
const quizRoutes_1 = __importDefault(require("./routes/quizRoutes"));
const departmentRoutes_1 = __importDefault(require("./routes/departmentRoutes"));
const godownRouter_1 = __importDefault(require("./routes/godownRouter"));
const gobalProcessRouter_1 = __importDefault(require("./routes/gobalProcessRouter"));
const rawMaterialRouter_1 = __importDefault(require("./routes/rawMaterialRouter"));
const childPartRouter_1 = __importDefault(require("./routes/childPartRouter"));
const finishedRoutes_1 = __importDefault(require("./routes/finishedRoutes"));
const customerRouter_1 = __importDefault(require("./routes/customerRouter"));
const machineRouter_1 = __importDefault(require("./routes/machineRouter"));
const workOrderRouter_1 = __importDefault(require("./routes/workOrderRouter"));
const productionSlipRoutes_1 = __importDefault(require("./routes/productionSlipRoutes"));
const shopRoutes_1 = __importDefault(require("./routes/shopRoutes"));
const v2AttendanceRouter_1 = __importDefault(require("./routes/v2AttendanceRouter"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const workingDayRouter_1 = require("./routes/workingDayRouter");
const loggedInUserHistoryRouter_1 = __importDefault(require("./routes/loggedInUserHistoryRouter"));
const CNCProgramRoutes_1 = __importDefault(require("./routes/CNCProgramRoutes"));
const planningRoutes_1 = __importDefault(require("./routes/planningRoutes"));
const salaryRouter_1 = __importDefault(require("./routes/salaryRouter"));
const translate_1 = __importDefault(require("./translate"));
const activeController_1 = require("./controllers/employee/activeController");
const axios_1 = __importDefault(require("axios"));
const scanSlipRouter_1 = __importDefault(require("./routes/scanSlipRouter"));
const productivityReportRoutes_1 = __importDefault(require("./routes/productivityReportRoutes"));
const salaryChangeController_1 = require("./controllers/employee/salaryChangeController");
const salaryReportRoutes_1 = __importDefault(require("./routes/salaryReportRoutes"));
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, "..", "public/.env") });
const FRONTEND_URI1 = process.env.FRONTEND_URI1;
const FRONTEND_URI2 = process.env.FRONTEND_URI2;
const FRONTEND_URI3 = process.env.FRONTEND_URI3;
if (!FRONTEND_URI1 || !FRONTEND_URI2) {
    throw new Error("Missing FRONTEND_URI1 or FRONTEND_URI2 environment variables");
}
// middleware
app.use(express_1.default.json({ limit: "50mb" }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
app.use((0, cors_1.default)({
    credentials: true,
    origin: [FRONTEND_URI1, FRONTEND_URI2, FRONTEND_URI3],
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "builds", "hrms")));
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "builds", "productionApp")));
// adding websocket
const server = http_1.default.createServer(app);
exports.server = server;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URI,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true,
    },
});
const employeeSocketMap = new Map();
io.on("connection", (socket) => {
    const { employeeId } = url_1.default.parse(socket.handshake.url, true).query;
    if (employeeId) {
        employeeSocketMap.set(employeeId.toString(), socket);
        console.log("New client connected. Employee ID:", employeeId);
    }
    socket.on("disconnect", () => {
        if (employeeId) {
            const storedSocket = employeeSocketMap.get(employeeId.toString());
            if (storedSocket === socket) {
                employeeSocketMap.delete(employeeId.toString());
                console.log("Client disconnected. Employee ID:", employeeId);
            }
        }
        ;
    });
    // Listen for new notifications and broadcast them to all connected clients
    socket.on("notification", (notification) => {
        io.emit("notification", notification);
    });
});
app.post("/api/v1/notifications", async (req, res) => {
    const { message, notificationType, groupName, jobProfileName, employeeId, id, parentJobProfileId, } = req.body;
    try {
        let targetEmployees = [];
        let filter = {};
        if (groupName) {
            const group = await groupModel_1.default.findOne({ groupName });
            if (group) {
                filter.groupId = group?._id;
            }
        }
        if (jobProfileName) {
            const jobProfile = await jobProfileModel_1.default.findOne({ jobProfileName });
            if (jobProfile) {
                filter.jobProfileId = jobProfile?._id;
            }
        }
        if (parentJobProfileId) {
            filter.jobProfileId = parentJobProfileId;
        }
        if (employeeId) {
            targetEmployees = await employeeModel_1.default.find({ _id: employeeId });
        }
        else if (id) {
            const data = await employeeModel_1.default.findOne({ _id: id });
            const jobprofile = await jobProfileModel_1.default.findOne({
                _id: data?.jobProfileId,
            });
            targetEmployees = await employeeModel_1.default.find({
                jobProfileId: jobprofile?.parentJobProfileId,
            });
        }
        else {
            targetEmployees = await employeeModel_1.default.find(filter);
        }
        // Find target employees based on the request body
        // Send notification to each target employee
        for (let i = 0; i < targetEmployees.length; i++) {
            const data = {
                message,
                notificationType,
                date: new Date(),
            };
            let notificationEmployee = await notificationModel_1.default.findOne({
                employeeId: targetEmployees[i]._id,
            });
            if (!notificationEmployee) {
                notificationEmployee = new notificationModel_1.default({
                    employeeId: targetEmployees[i]._id,
                });
            }
            notificationEmployee.notification.push(data);
            const savedNotification = await notificationEmployee.save();
            const targetSocket = employeeSocketMap.get(targetEmployees[i]._id.toString());
            if (targetSocket && targetSocket.connected) {
                targetSocket.emit("notification", savedNotification);
            }
        }
        res.json({ message: "Notification sent successfully" });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// app.get(
//   "/api/v1/notifications/:employeeId",
//   async (req: Request, res: Response) => {
//     const { employeeId } = req.params;
//     const page = parseInt(req.query.page as string, 10) || 0;
//     const size = parseInt(req.query.size as string, 10) || 10;
//     try {
//       const notifications = await notificationModel
//         .findOne({ employeeId })
//         .sort({ "notification.date": -1 })
//         .skip(page * size)
//         .limit(size)
//         .exec();
//       res.json(notifications);
//     } catch (err: any) {
//       res.status(400).json({ message: err.message });
//     }
//   }
// );
app.get("/api/v1/notifications/:employeeId", async (req, res) => {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page, 10) || 0;
    const size = parseInt(req.query.size, 10) || 50;
    try {
        const notificationsData = await notificationModel_1.default.findOne({ employeeId });
        if (!notificationsData) {
            return res.json([]);
        }
        const allNotifications = notificationsData.notification || []; // Assuming notification is an array within the notifications document
        // Calculate the starting and ending indexes for the current page
        const startIndex = page * size;
        const endIndex = startIndex + size;
        // Filter notifications older than 2 months from the array
        // const currentDate = new Date();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const filteredNotifications = allNotifications.filter((notification) => {
            if (notification.notificationType.toLowerCase() === "attendance") {
                // Check if the notification is older than one day
                const oneDayAgo = new Date();
                oneDayAgo.setDate(oneDayAgo.getDate() - 2);
                return notification.date >= oneDayAgo;
            }
            else {
                // Check if the notification is older than two months
                return notification.date >= twoMonthsAgo;
            }
        });
        // Sort notifications in descending order based on the 'date' property
        filteredNotifications.sort((a, b) => b.date - a.date);
        // Slice the array to get the paginated notifications
        const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
        // Update the notifications array in the document to remove older notifications
        notificationsData.notification = filteredNotifications;
        await notificationsData.save();
        res.json({ notification: paginatedNotifications });
    }
    catch (err) {
        res.status(400).json({ message: err.message });
    }
    ;
});
// app.get('/translate', async (req: Request, res: Response) => {
//   try {
//     const textToTranslate = req.query.text as string; // Cast req.query.text to string
//     if (!textToTranslate) {
//       throw new Error('Text to translate is missing');
//     }
//     // Log the request before sending it
//     console.log('Translation Request:', textToTranslate);
//     // Use google-translate-api to translate the text from English to Hindi
//     const translation = await translate(textToTranslate, { from: 'en', to: 'hi' });
//     // Log the response from the API
//     console.log('Translation Response:', translation);
//     const translatedText = translation.text;
//     res.json({ translatedText });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Translation failed' });
//   }
// });
//testing translation
app.use("/home", (req, res) => {
    res.json({
        msg: "Hi Deployment successfull--agter github pipeline"
    });
});
app.use("/api/v1", translate_1.default);
// routes
app.use("/api/v1/auth", authRoutes_1.default);
app.use("/api/v1/employee", employeeRoutes_1.default);
app.use("/api/v1/admin", adminRoutes_1.default);
app.use("/api/v1/attendance", attendanceRoutes_1.default);
app.use("/api/v1/group", groupRoutes_1.default);
app.use("/api/v1/jobProfile", jobProfileRoutes_1.default);
app.use("/api/v1/employee/docs", employeeDocsRouters_1.default);
app.use("/api/v1/leave", leaveRoutes_1.default);
app.use("/api/v1/training", trainingRoutes_1.default);
app.use("/api/v1/otpVerify", otpRouter_1.default);
app.use("/api/v1/quiz", quizRoutes_1.default);
app.use("/api/v1/department", departmentRoutes_1.default);
// BOP
app.use("/api/v1/godown", godownRouter_1.default);
app.use("/api/v1/globalProcess", gobalProcessRouter_1.default);
app.use("/api/v1/rawMaterial", rawMaterialRouter_1.default);
//childPart and FinishedItems
app.use("/api/v1/childPart", childPartRouter_1.default);
app.use("/api/v1/finishedItems", finishedRoutes_1.default);
app.use("/api/v1/customer", customerRouter_1.default);
app.use("/api/v1/cnc", CNCProgramRoutes_1.default);
app.use("/api/v1/workOrder", workOrderRouter_1.default);
app.use("/api/v1/machine", machineRouter_1.default);
app.use("/api/v1/productionSlip", productionSlipRoutes_1.default);
app.use("/api/v1/shop", shopRoutes_1.default);
// inventory routes
app.use("/api/v1/inventory", inventoryRoutes_1.default);
// planning
app.use("/api/v1/planning", planningRoutes_1.default);
//productivityReport
app.use("/api/v1/report", productivityReportRoutes_1.default);
// salaryReport
app.use("/api/v1/salaryreport", salaryReportRoutes_1.default);
// v2 2
app.use("/api/v2/attendance", v2AttendanceRouter_1.default);
app.use("/api/v2/workingDay", workingDayRouter_1.workingDayRouter);
app.use("/api/v2/loggedInHistory", loggedInUserHistoryRouter_1.default);
app.use("/api/v2/scanSlip", scanSlipRouter_1.default);
// SUPERVISOR 
app.use("/api/v2/salary", salaryRouter_1.default);
app.get("/api/v2/changeSalary", salaryChangeController_1.changeSalary);
app.get("/api/v2/changeActive", activeController_1.changeActiveStatus);
node_cron_1.default.schedule('0 0 * * *', () => {
    const res = axios_1.default.get("https://chawlacomponents.com/api/v2/changeActive");
    const res2 = axios_1.default.get("https://chawlacomponents.com//api/v2/changeSalary");
    //console.log(res)
    // console.log('API scheduled at 12 AM daily.');
});
// Route to serve the production buildcr
app.get("/prd/*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "builds", "productionApp", "index.html"));
});
// Route to serve the hrms build
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "builds", "hrms", "index.html"));
});
// 1
//error Handler
app.use(errorHandler_1.errorMiddleware);
exports.default = app;
