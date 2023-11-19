import express, { Request, Response } from "express";
import { errorMiddleware } from "./middleware/errorHandler";
import employeeRouter from "./routes/employeeRoutes";
import attendanceRouter from "./routes/attendanceRoutes";
import groupRouter from "./routes/groupRoutes";
import jobProfileRoutes from "./routes/jobProfileRoutes";
import adminRouter from "./routes/adminRoutes";
import cors from "cors";
import cron from "node-cron"
import url from "url";
import cookieParser from "cookie-parser";
import employeeDocsRouter from "./routes/employeeDocsRouters";
import { config } from "dotenv";
import leaveRouter from "./routes/leaveRoutes";
import authRouter from "./routes/authRoutes";
import { Server, Socket } from "socket.io";
import http from "http";
// import translate from "google-translate-api"
const app = express();
import path from "path";

import notificationModel from "./database/models/notificationModel";
import EmployeeModel from "./database/models/employeeModel";
import groupModel from "./database/models/groupModel";
import JobProfileModel from "./database/models/jobProfileModel";
import trainingRoutes from "./routes/trainingRoutes";
import otpRouter from "./routes/otpRouter";
import quizRouter from "./routes/quizRoutes";
import departmentRouter from "./routes/departmentRoutes";
import godownRouter from "./routes/godownRouter";
import globalProcessRouter from "./routes/gobalProcessRouter";
import rawMaterialRouter from "./routes/rawMaterialRouter";
import childPartRouter from "./routes/childPartRouter";
import finishedItemRouter from "./routes/finishedRoutes";
import customerRouter from "./routes/customerRouter";
import machineRouter from "./routes/machineRouter";
import workOrderRouter from "./routes/workOrderRouter";
import productionRouter from "./routes/productionSlipRoutes";
import shopRouter from "./routes/shopRoutes";

import v2AttendanceRouter from "./routes/v2AttendanceRouter";
import inventoryRouter from "./routes/inventoryRoutes";
import { workingDayRouter } from "./routes/workingDayRouter";
import loggedInUserHistoryRouter from "./routes/loggedInUserHistoryRouter";
import CNCProgramRouter from "./routes/CNCProgramRoutes";
import planningRouter from "./routes/planningRoutes";
import salaryRouter from "./routes/salaryRouter";
import router from "./translate";
import { changeActiveStatus } from "./controllers/employee/activeController";
import axios from "axios";
import scanSlipRouter from "./routes/scanSlipRouter";

import productivityReportRouter from "./routes/productivityReportRoutes";
import { changeSalary } from "./controllers/employee/salaryChangeController";
import salaryReportRouter from "./routes/salaryReportRoutes";



config({ path: path.join(__dirname, "..", "public/.env") });

const FRONTEND_URI1 = process.env.FRONTEND_URI1;
const FRONTEND_URI2 = process.env.FRONTEND_URI2;
const FRONTEND_URI3: any = process.env.FRONTEND_URI3;

if (!FRONTEND_URI1 || !FRONTEND_URI2) {
  throw new Error(
    "Missing FRONTEND_URI1 or FRONTEND_URI2 environment variables"
  );
}
// middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
  cors({
    credentials: true,
    origin: [FRONTEND_URI1, FRONTEND_URI2, FRONTEND_URI3],
  })
);

app.use(cookieParser());

app.use(express.static(path.join(__dirname, "..", "builds", "hrms")));
app.use(express.static(path.join(__dirname, "..", "builds", "productionApp")));

// adding websocket
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URI, // Replace this with your client URL
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
  },
});

const employeeSocketMap = new Map<string, Socket>();

io.on("connection", (socket) => {
  const { employeeId } = url.parse(socket.handshake.url, true).query;

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
    };
  });

  // Listen for new notifications and broadcast them to all connected clients
  socket.on("notification", (notification) => {
    io.emit("notification", notification);
  });
});

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

app.post("/api/v1/notifications", async (req: Request, res: Response) => {
  const {
    message,
    notificationType,
    groupName,
    jobProfileName,
    employeeId,
    id,
    parentJobProfileId,
  } = req.body;
  try {
    let targetEmployees = [];
    let filter: any = {};
    if (groupName) {
      const group = await groupModel.findOne({ groupName });
      if (group) {
        filter.groupId = group?._id;
      }
    }
    if (jobProfileName) {
      const jobProfile = await JobProfileModel.findOne({ jobProfileName });
      if (jobProfile) {
        filter.jobProfileId = jobProfile?._id;
      }
    }

    if (parentJobProfileId) {
      filter.jobProfileId = parentJobProfileId;
    }

    if (employeeId) {
      targetEmployees = await EmployeeModel.find({ _id: employeeId });
    } else if (id) {
      const data = await EmployeeModel.findOne({ _id: id });
      const jobprofile = await JobProfileModel.findOne({
        _id: data?.jobProfileId,
      });
      targetEmployees = await EmployeeModel.find({
        jobProfileId: jobprofile?.parentJobProfileId,
      });
    } else {
      targetEmployees = await EmployeeModel.find(filter);
    }

    // Find target employees based on the request body
    // Send notification to each target employee
    for (let i = 0; i < targetEmployees.length; i++) {
      const data = {
        message,
        notificationType,
        date: new Date(),
      };

      let notificationEmployee = await notificationModel.findOne({
        employeeId: targetEmployees[i]._id,
      });

      if (!notificationEmployee) {
        notificationEmployee = new notificationModel({
          employeeId: targetEmployees[i]._id,
        });
      }
      notificationEmployee.notification.push(data);
      const savedNotification = await notificationEmployee.save();

      const targetSocket = employeeSocketMap.get(
        targetEmployees[i]._id.toString()
      );

      if (targetSocket && targetSocket.connected) {
        targetSocket.emit("notification", savedNotification);
      }
    }
    res.json({ message: "Notification sent successfully" });
  } catch (err: any) {
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

app.get(
  "/api/v1/notifications/:employeeId",
  async (req: Request, res: Response) => {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page as string, 10) || 0;
    const size = parseInt(req.query.size as string, 10) || 50;

    try {
      const notificationsData = await notificationModel.findOne({ employeeId });
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
        } else {
          // Check if the notification is older than two months
          return notification.date >= twoMonthsAgo;
        }
      });

      // Sort notifications in descending order based on the 'date' property
      filteredNotifications.sort((a: any, b: any) => b.date - a.date);

      // Slice the array to get the paginated notifications
      const paginatedNotifications = filteredNotifications.slice(
        startIndex,
        endIndex
      );

      // Update the notifications array in the document to remove older notifications
      notificationsData.notification = filteredNotifications;
      await notificationsData.save();

      res.json({ notification: paginatedNotifications });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    };
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
app.use("/api/v1", router);
// routes
app.use("/api/v1/auth", authRouter);

app.use("/api/v1/employee", employeeRouter);

app.use("/api/v1/admin", adminRouter);

app.use("/api/v1/attendance", attendanceRouter);

app.use("/api/v1/group", groupRouter);

app.use("/api/v1/jobProfile", jobProfileRoutes);

app.use("/api/v1/employee/docs", employeeDocsRouter);

app.use("/api/v1/leave", leaveRouter);

app.use("/api/v1/training", trainingRoutes);

app.use("/api/v1/otpVerify", otpRouter);

app.use("/api/v1/quiz", quizRouter);

app.use("/api/v1/department", departmentRouter);

// BOP
app.use("/api/v1/godown", godownRouter);

app.use("/api/v1/globalProcess", globalProcessRouter);

app.use("/api/v1/rawMaterial", rawMaterialRouter);

//childPart and FinishedItems

app.use("/api/v1/childPart", childPartRouter);

app.use("/api/v1/finishedItems", finishedItemRouter);

app.use("/api/v1/customer", customerRouter);

app.use("/api/v1/cnc", CNCProgramRouter);

app.use("/api/v1/workOrder", workOrderRouter);

app.use("/api/v1/machine", machineRouter);

app.use("/api/v1/productionSlip", productionRouter);

app.use("/api/v1/shop", shopRouter);

// inventory routes
app.use("/api/v1/inventory", inventoryRouter);

// planning
app.use("/api/v1/planning", planningRouter);

//productivityReport
app.use("/api/v1/report", productivityReportRouter);

// salaryReport
app.use("/api/v1/salaryreport", salaryReportRouter);

// v2 2
app.use("/api/v2/attendance", v2AttendanceRouter);

app.use("/api/v2/workingDay", workingDayRouter);

app.use("/api/v2/loggedInHistory", loggedInUserHistoryRouter);

app.use("/api/v2/scanSlip", scanSlipRouter);

// SUPERVISOR 
app.use("/api/v2/salary", salaryRouter);
app.get("/api/v2/changeSalary", changeSalary)
app.get("/api/v2/changeActive", changeActiveStatus);
cron.schedule('0 0 * * *', () => {
  const res = axios.get("https://chawlacomponents.com/api/v2/changeActive")
  const res2 = axios.get("https://chawlacomponents.com//api/v2/changeSalary")
  //console.log(res)
  // console.log('API scheduled at 12 AM daily.');
});


// Route to serve the production buildcr
app.get("/prd/*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "builds", "productionApp", "index.html")
  );
});

// Route to serve the hrms build
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "builds", "hrms", "index.html"));
});
// 1
//error Handler
app.use(errorMiddleware);

// set server to listen
export { server };

export default app;