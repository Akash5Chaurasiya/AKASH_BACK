import JobProfileModel from "../../database/models/jobProfileModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import { Request, Response, NextFunction } from "express";
import groupModel from "../../database/models/groupModel";
import departmentModel from "../../database/models/department";
import EmployeeModel from "../../database/models/employeeModel";
import v2AttendanceModel from "../../database/models/v2attendanceModel";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import { JobProfileDocument } from "../../database/entities/jobProfileDocument";
import EmployeeDocsModel from "../../database/models/employeeDocsModel";
import workingDayModel from "../../database/models/workingDayModel";
import { mkdtempSync } from "fs";
import SalaryLogModel from "../../database/models/salaryLogModel";
interface CustomRequest<T> extends Request {
  admin?: T;
  employee?: T;
  attendanceManager?: T;
  dbManager?: T;
}
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const getSalary = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const {
      jobProfileName,
      groupName,
      name,
      departmentName,
      employmentStatus,
      page = 1,
      limit = 20,
    } = req.query as {
      jobProfileName?: string;
      groupName?: string;
      departmentName?: string;
      employmentStatus?: string;
      name?: string;
      page?: number;
      limit?: number;
    };
    let jobProfileIds: any = [];
    const filter: any = {};
    if (groupName) {
      const group = await groupModel.findOne({ groupName }).exec();
      if (group) {
        filter.groupId = group._id;
      }
    }
    if (departmentName) {
      const department = await departmentModel.findOne({ departmentName });
      if (!department) {
        return resp.status(404).json({
          success: false,
          message: "Department not found.",
        });
      }
      const jobProfiles = await JobProfileModel.find({
        department: department._id,
      });
      const ids: any = jobProfiles.map((jobProfile) => jobProfile._id);
      jobProfileIds = [...jobProfileIds, ...ids];
      filter.jobProfileId = { $in: jobProfileIds };
    }
    if (jobProfileName) {
      const jobProfile = await JobProfileModel.findOne({
        jobProfileName,
      }).exec();
      if (jobProfile) {
        jobProfileIds = [...jobProfileIds, jobProfile._id];
        filter.jobProfileId = { $in: jobProfileIds };
      }
    }
    if (employmentStatus) {
      filter.employeeStatus = employmentStatus;
    }

    if (name) {
      filter.$or = [
        { name: { $regex: name, $options: "i" } },
        { employeeCode: { $regex: name, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    let emplys1 = await EmployeeModel.find(filter);
    let emplys = await EmployeeModel.find(filter)
      .populate({
        path: "jobProfileId",
        select: "jobProfileName",
      })
      .populate({
        path: "groupId",
        select: "groupName",
      })
      .select({
        name: 1,
        employeeCode: 1,
        email: 1,
        contactNumber: 1,
        lunchTime: 1,
        salary: 1,
        workingDays: 1,
        workingHours: 1,
        gender: 1,
        aadharNumber: 1,
        ESI_ID: 1,
        PF_UAN_Number: 1,
        PAN_Number: 1,
        overTimeRate: 1,
        bankDetails: 1,
      })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: 1 })
      .exec();

    // const employeeIds = emplys.map((employee) => employee._id);
    // const attendance = await v2AttendanceModel
    //   .find({ employeeId: employeeIds })
    //   .select({ employeeId: 1, date: 1, punches: 1 });
    // const workingHours: any = attendance.map((item: any) => {
    //   item.punches[item.punches.length - 1].punchOut - item.punches[0].punchIn;
    // });
    resp.status(200).json({
      success: true,
      message: "Getting All Employee successfully.",
      // employeeIds,
      // workingHours,
      // attendance,
      Total: emplys1.length,
      emplys,
    });
  }
);
export const newGetSalary =
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    try {
      
   
    let employee: EmployeeDocument | null = null;
    let jobProfile: JobProfileDocument | null = null;

    let {
      date,
      nextDate,
      groupName,
      departmentName,
      jobProfileName,
      employeeCodes,
      shifts,
      name,
      limit = 20,
      page = 1,
    } = req.body;

    limit = +limit;
    page = +page;
    const skip = (page - 1) * limit;

    let filterDate;
    let nextDay;
    if (typeof date === "string") {
      filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);              
      //filterDate.setHours(filterDate.getHours() +5.5);
    } else {
      filterDate = new Date();
      filterDate.setHours(0, 0, 0, 0);
      // filterDate.setHours(filterDate.getHours() - 6);
    }
    if (typeof nextDate === "string") {
      nextDay = new Date(nextDate);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setDate(nextDay.getDate() + 1);
      //nextDay.setHours(nextDay.getHours() - 6);
    } else {
      nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
     // nextDay.setHours(nextDay.getHours() + 5.5);
    }
    const filter: any = {};
    const filter1: any = {};
    let jobProfileIds: any = [];
    if (groupName && Array.isArray(groupName) &&
      groupName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyGroupNames = groupName.filter((name) => name.trim() !== "");
      const groups = await groupModel
        .find({ groupName: { $in: nonEmptyGroupNames } })
        .exec();
      const groupIds: any = groups.map((group) => group._id);
      filter.groupId = { $in: groupIds };
    }
    if (employeeCodes && Array.isArray(employeeCodes)) {
      const nonEmptyemployeeCode = employeeCodes.filter(
        (name) => name.trim() !== ""
      );
      const employeeCode: any = nonEmptyemployeeCode.map((emp) => emp);
      if (employeeCode && employeeCode.length > 0) {
        filter.employeeCode = { $in: employeeCode };
      }
    }

    // Add departmentName filter if provided and non-empty
    if (departmentName && Array.isArray(departmentName) &&
      departmentName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyDepartmentNames = departmentName.filter(
        (name) => name.trim() !== ""
      );
      const departments = await departmentModel
        .find({ departmentName: { $in: nonEmptyDepartmentNames } })
        .exec();
      const departmentIds: any = departments.map(
        (department) => department._id
      );
      const jobProfiles = await JobProfileModel.find({
        department: { $in: departmentIds },
      }).exec();
      const jobProfileIds: any = jobProfiles.map(
        (jobProfile) => jobProfile._id
      );
      filter.jobProfileId = { $in: jobProfileIds };
    }

    // Add jobProfileName filter if provided and non-empty
    if (jobProfileName && Array.isArray(jobProfileName) &&
      jobProfileName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyJobProfileNames = jobProfileName.filter(
        (name) => name.trim() !== ""
      );
      const jobProfiles = await JobProfileModel.find({
        jobProfileName: { $in: nonEmptyJobProfileNames },
      }).exec();
      const ids: any = jobProfiles.map((jobProfile) => jobProfile._id);
      jobProfileIds = [...jobProfileIds, ...ids];
      filter.jobProfileId = { $in: jobProfileIds };
    }

    if (name) {
      filter.$or = [{ name: name }, { employeeCode: name }];
      filter1.$or = [{ name: name }, { employeeCode: name }];
    }

    const employeeIds = await EmployeeModel.find(filter)
      .select({ _id: 1 })
      .exec();

    const employeeid = await EmployeeModel.find(filter)
      .select({ _id: 1 })
      .exec();
    const empids = employeeid.map((employee) => employee._id);

    const ids = employeeIds.map((employee) => employee._id);

    let documnetLength = await v2AttendanceModel.countDocuments({
      employeeId: { $in: empids },
      date: {
        $gte: filterDate,
        $lt: nextDay,
      },
    });
    let attendanceRecords: any = await v2AttendanceModel
      .find({
        employeeId: { $in: ids },
        date: {
          $gte: filterDate,
          $lt: nextDay,
        },
      }).select("-createdAt -updatedAt -__v")
      .skip(skip)
      .limit(limit)
      .populate({
        path: "remarks.by",
        model: "Employee",
      })
      .sort({ date: -1 })
      .populate({
        path: "approvedBy",
        select: "name",
      })
      .populate({
        path: "employeeId",
        select: [
          "jobProfileId",
          "groupId",
          "workingHours",
          "lunchTime",
          "employeeCode",
          "salary",
          "overTime",
          "contactNumber",
          "name",
          "role",
        ],
        populate: [
          {
            path: "jobProfileId",
            select: "jobProfileName",
            populate: {
              path: "department",
              select: "departmentName",
            },
          },
          {
            path: "groupId",
            select: "groupName",
          },
        ],
      })
      .populate({
        path: "punches",
        populate: [
          {
            path: "punchInBy",
            select: "name",
          },
          {
            path: "punchOutBy",
            select: "name",
          },
        ],
      })
      .exec();

    // Now, the "department" field within "jobProfileId" should be populated correctly.
    if (shifts && Array.isArray(shifts)) {
      const nonEmptyshift = shifts.filter((name) => name.trim() !== "");
      const shift = nonEmptyshift.map((emp) => emp.toLowerCase());
      if (shift && shift.length > 0) {
        attendanceRecords = await v2AttendanceModel
          .find({
            employeeId: { $in: ids },
            date: {
              $gte: filterDate,
              $lt: nextDay,
            },
            shift: { $in: shift },
          })
          .populate({
            path: "remarks.by",
            model: "Employee",
          })
          .sort({ date: -1 })
          .populate({
            path: "remarks.by",
            model: "Employee",
          })
          .sort({ date: -1 })
          .populate({
            path: "approvedBy",
            select: "name",
          })
          .populate({
            path: "employeeId",
            select: [
              "jobProfileId",
              "groupId",
              "workingHours",
              "lunchTime",
              "employeeCode",
              "salary",
              "overTime",
              "contactNumber",
              "name",
              "role",
            ],
            populate: [
              {
                path: "jobProfileId",
                select: "jobProfileName",
                populate: {
                  path: "department",
                  select: "departmentName",
                },
              },
              {
                path: "groupId",
                select: "groupName",
              },
            ],
          })
          .populate({
            path: "punches",
            populate: [
              {
                path: "punchInBy",
                select: "name",
              },
              {
                path: "punchOutBy",
                select: "name",
              },
            ],
          })
          .exec();
        documnetLength = await v2AttendanceModel.countDocuments({
          employeeId: { $in: empids },
          date: {
            $gte: filterDate,
            $lt: nextDay,
          },
          shift: { $in: shift },
        });
      }
    }

    let totalSalaryA = 0;
    let totalSalaryB = 0;
    let totalSalaryC = 0;
    let TotalfinalSalary=0

    let newRecords = [];
    let year = filterDate.getUTCFullYear();

    const allAttendance:any = await v2AttendanceModel
    .find({
      date: {
        $gte: filterDate,
        $lt: nextDay,
      },
    }).select({ employeeId: 1, punches: 1 })
    .populate("employeeId")
    .sort({ date: -1 })
    .lean();
    const attendanceStore:any = {};
    const month=filterDate.getMonth()+1;
    //console.log(month)

    const firstDate = new Date(year, month - 1, 1);

    // Create a new Date object for the last day of the month
    // To get the last day, set the day to 0 of the next month and subtract one day
    const lastDate = new Date(year, month, 0);
    console.log(firstDate)
    console.log(lastDate)
  
    

const salaryLog = await SalaryLogModel.find({
  applicableMonth: {
    $gte: firstDate,
    $lt: lastDate,
  },

});
    const salaryStore:any={};
    salaryLog.forEach((a:any)=>{
      if(a.employeeId){
        if(!salaryStore[a.employyeId])
        {
          salaryStore[a.employeeId]={
            data:[]
          }
        }
      }
      salaryStore[a.employeeId].data.push({...a});

    });

    allAttendance.forEach((a:any)=>{
      // console.log(a)
      if(a.employeeId){
      const employeeId = a.employeeId._id+"";
      if(!attendanceStore[employeeId]){
        attendanceStore[employeeId] = {
          data : []
        }
      };
      attendanceStore[employeeId].data.push({...a});
    };
    });
   
    // console.log(attendanceStore);
    let totalDutyHours=0
   let TotaloverTime=0
    const existingYearData = await workingDayModel.findOne({ year });
    const new_map = new Map();
    for (let id of ids) {
    //  console.log("id",id, "data " ,attendanceStore[id+""]);
      const data: any = attendanceStore[id+""]?.data || [];
      let totalDifference = 0;
      let totalactual = 0;
      let overTime = 0;
      let salaryTotalDiffrence = 0;

      let lunchPresnt=false
      if (data) {

        // Initialize a variable to accumulate the total difference

        for (let temp of data) {
          totalactual += temp.employeeId.workingHours;
          for (let p of temp.punches) {
            const punchInTT: any = p.punchIn;
            const punchOutTT: any = p.punchOut;
            
            if (punchInTT && punchOutTT) {
               const differ = Math.abs(punchOutTT - punchInTT);
              const timedd = differ / (1000 * 60 * 60);
              // const punchInHour = punchInTT.getUTCHours();
              // const punchOutHour = punchOutTT.getUTCHours();
              // const punchInMinute = punchInTT.getUTCMinutes();
              // const punchOutMinute = punchOutTT.getUTCMinutes();
              // // console.log(punchInHour)
              // // console.log(punchOutHour)
              // // console.log(punchInMinute)
              // // console.log(punchOutMinute)
              // if(punchOutHour>1 && punchInHour<=1){
              //   lunchPresnt=true
              // }
              // if(punchOutHour>13 && punchInHour<=13){
              //   lunchPresnt=true
              // }
              // if(punchOutHour==1 && punchOutMinute>=30){
              //   lunchPresnt=true
              // }
              // if(punchOutHour==13 && punchOutMinute>=30){
              //   lunchPresnt=true
              // }
               if (
                temp.employeeId.workingHours < timedd &&
                !temp.employeeId.overTime
              ) {
                salaryTotalDiffrence += temp.employeeId.workingHours;
              } else {
                salaryTotalDiffrence += timedd;
              }
            }
          }
        }
      }
      //console.log(id,lunchPresnt)
      new_map.set(id.toString(), {
        overTime: overTime,
        length: data?.length,
        totalactual: totalactual,
        salaryTotalDiffrence: salaryTotalDiffrence,
        lunchPresnt:lunchPresnt
      });
    }
   
    for (const rec of attendanceRecords) {
      const monthName = months[rec.punches[0].punchIn.getMonth()];
      let  punchInTime = rec.punches[0].punchIn;
      let punchOutTime = rec.punches[rec.punches.length - 1].punchOut;
      const originalpunchInTime = new Date(rec.punches[0].punchIn);
  const originalpunchOutTime = new Date(rec.punches[rec.punches.length - 1].punchOut);
  // console.log(originalpunchInTime);
  // console.log(originalpunchOutTime);
  const salarydata: any = salaryStore[rec.employeeId._id+""]?.data || [];
  const salaryDB=salarydata[salarydata.length-1]?._doc?.salary|| rec.employeeId.salary
  //console.log("Hiiii",salary)

      
        

      let hours = 0;
      if (punchInTime != null && punchOutTime !== null) {
        const punchInHour = punchInTime.getUTCHours();
        const punchOutHour = punchOutTime.getUTCHours();
        const punchInMinute = punchInTime.getUTCMinutes();
        const punchOutMinute = punchOutTime.getUTCMinutes();
       
        
        if(punchInHour<8){
          //console.log("HIII")
          punchInTime.setUTCHours(8);
          punchInTime.setUTCMinutes(0)

        }
        if(punchInHour===19 ){
          punchInTime.setUTCHours(20);
          punchInTime.setUTCMinutes(0)

        }
        // if(punchOutHour===16  && punchOutMinute>30){
        //   punchOutTime.setUTCHours(16);
        //   punchOutTime.setUTCMinutes(30);

        // }
        // if(punchOutHour===17  && punchOutMinute<=30){
        //   punchOutTime.setUTCHours(16);
        //   punchOutTime.setUTCMinutes(30);

        // }
        // if(punchOutHour>=19 && punchOutMinute>30 && punchInHour<19){
        //   punchOutTime.setUTCHours(19);
        //   punchOutTime.setUTCMinutes(30);
          
        // }

        const timeDifferenceMs = Math.abs(punchOutTime - punchInTime);
        //console.log(timeDifferenceMs)
        
        hours = timeDifferenceMs / (1000 * 60 * 60);
        if(hours<0){
          hours*=-1
        }
        
      }
      const tempdata = new_map.get(rec.employeeId._id.toString());

      if (existingYearData) {
        const month = existingYearData.month.filter(
          (month) => month.monthName === monthName
        );
        let totalWorkingHours = 0;
        let salaryPerHours = 0;
        if (month.length > 0) {
          if (month[0]?.workingDay) {
            totalWorkingHours =
              month[0].workingDay * rec.employeeId.workingHours;
            salaryPerHours =salaryDB / totalWorkingHours;
          }
        } else {
          totalWorkingHours = 30 * rec.employeeId.workingHours;
          salaryPerHours = salaryDB / totalWorkingHours;
        }
        let salary = 0;
        let overtime = 0;
        if (hours > 0.5) {
          // if(tempdata.lunchPresnt===true){
          hours = Math.abs(hours - rec.employeeId.lunchTime)
          //}
        }
        if(hours<0){
          hours=-1*hours
        }
        if(hours>1){
        salary = hours * salaryPerHours
        };
        //console.log(hours)
        //if (rec.employeeId.overTime) {
          
          // overtime = hours - rec.employeeId.workingHours;
          // if (overtime < 0) {
          //   overtime = 0;
          // }
        // } else {
        //   if (hours >= rec.employeeId.workingHours) {
        //     salary = rec.employeeId.workingHours * salaryPerHours;
        //   } else {
        //     salary = hours * salaryPerHours;
        //   }
        // }

        

        let overTime = 0;
        if (hours > rec.employeeId.workingHours) {
          overTime = overTime + (hours - rec.employeeId.workingHours);
        }
        // if (rec.employeeId.overTime) {
        //   overTime = tempdata.overTime;
        // }
        
        // const salaryB =
        //   rec.employeeId.workingHours * salaryPerHours +
        //   overtime * salaryPerHours;
          const salaryB =
          rec.employeeId.workingHours * salaryPerHours 
        totalSalaryB += salaryB;

        totalSalaryC += tempdata.salaryTotalDiffrence * salaryPerHours;
        let dutyHours = 0;
        if (hours >= rec.employeeId.workingHours) {
          dutyHours = rec.employeeId.workingHours;
        } else {
          dutyHours = hours;
        }
        let tt
        if(tempdata.lunchPresnt===true){
          if(tempdata.salaryTotalDiffrence>0.5){
            tt=tempdata.salaryTotalDiffrence-0.5
          }
        }
        totalSalaryA = totalSalaryA + salary;
        let finalSalary=rec.employeeId.overTime?salary:salaryB
        TotalfinalSalary+=finalSalary
        let object:any = {};
        object.name = rec?.employeeId?.name;
        object.groupName = rec?.employeeId?.groupId?.groupName;
        object.jobProfile = rec?.employeeId?.jobProfileId?.jobProfileName;
        object.department = rec?.employeeId?.jobProfileId?.department.departmentName;
        object.role = rec?.employeeId?.role;
        object.employeeCode = rec?.employeeId?.employeeCode;
        object.contactNumber = rec?.employeeId?.contactNumber;
        object.lunchTime = rec?.employeeId?.lunchTime;
        object.salary = rec?.employeeId?.salary;
        object.workingHours = rec?.employeeId?.workingHours;
        object.overTime = rec?.employeeId?.overTime;
        object.date = rec?.date;
        object.approvedBy = rec?.approvedBy ? rec.approvedBy.name : "null";
        object.approvedTime = rec?.approvedTime;
        object.status = rec?.status;
        object.shift = rec?.shift;
        object.FirstPunchIn = rec?.punches[0].punchIn;
        object.FirstPunchInBy = rec?.punches[0].punchInBy ? rec?.punches[0].punchInBy.name : "";
        object.LastPunchOut = rec.punches.length > 0 ? rec?.punches[rec.punches.length - 1]?.punchOut : "";
        object.LastPunchOutBy = rec.punches.length > 0 ? rec?.punches[rec.punches.length - 1]?.punchOutBy ? rec?.punches[rec.punches.length - 1]?.punchOutBy.name : "" : "";
        object.totalWorking = rec?.totalWorking;
        object.remarks = rec?.remarks;
        object.approvedImage = rec?.approvedImage;
        //console.log(originalpunchInTime)
        // console.log(originalpunchOutTime)
        totalDutyHours+=dutyHours
        TotaloverTime+=overTime

        newRecords.push({
          totalWorkingHours: totalWorkingHours,
          salaryPerHours: salaryPerHours,
          firstPunchIn: originalpunchInTime,
          lastPunchOut:originalpunchOutTime,
          effectivePunchIn:punchInTime,
          //effectivePunchOut:punchOutTime,

          attendance1: object,
          attendance: rec,
          SalaryInDay: salary,
          finalWorkingHours: hours,
          //actualWorkinghours: rec.employeeId.workingHours * tempdata.length,
          overTime: overTime,
          salaryA: salary,
          salaryB: salaryB,
          finalSalary:finalSalary,
          //salaryC: tempdata.salaryTotalDiffrence * salaryPerHours,
          actualworkingHoursbyRecord: tempdata.saralyTotalDiffrence,
          dutyHours: dutyHours,
          workingHours:tt
        });
      }
    }
    resp.status(200).json({
      success: true,
      message: "Employee Salary fetched successfully.",
      salaryRecords: newRecords,
      count: documnetLength,
      totalSalaryA: totalSalaryA,
      totalSalaryB: totalSalaryB,
      TotalfinalSalary:TotalfinalSalary,
      totalDutyHours: totalDutyHours,
      TotaloverTime:TotaloverTime
      //totalSalaryC: totalSalaryC,
    });
  } catch (error) {
      //console.log(error);
  }
  }

export const getMonthlySalary = catchErrorAsync(
  async (
    req: CustomRequest<EmployeeDocument>,
    resp: Response,
    next: NextFunction
  ) => {
    let employee: EmployeeDocument | null = null;
    let jobProfile: JobProfileDocument | null = null;

    let {
      date,
      nextDate,
      groupName,
      departmentName,
      jobProfileName,
      employeeCodes,
      shifts,
      name,
      limit = 20,
      page = 1,
    } = req.body;

    limit = +limit;
    page = +page;
    const skip = (page - 1) * limit;

    let filterDate;
    let nextDay;
    if (typeof date === "string") {
      filterDate = new Date(date);
      filterDate.setHours(0, 0, 0, 0);
      //filterDate.setHours(filterDate.getHours() +5.5);
      // filterDate.setHours(filterDate.getHours() - 6);
    } else {
      filterDate = new Date();
      filterDate.setHours(0, 0, 0, 0);
      //filterDate.setHours(filterDate.getHours() +5.5);
    }
    if (typeof nextDate === "string") {
      nextDay = new Date(nextDate);
      nextDay.setHours(0, 0, 0, 0);
      nextDay.setDate(nextDay.getDate() + 1);
      //filterDate.setHours(filterDate.getHours() +5.5);
    } else {
      nextDay = new Date(filterDate);
      nextDay.setDate(filterDate.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      //filterDate.setHours(filterDate.getHours() +5.5);
    }

    // const isHR = jobProfile?.jobProfileName.toLowerCase() === "hr";
    // const isAdmin = req.admin;
    const filter: any = {};
    const filter1: any = {};
    let jobProfileIds: any = [];
    if (
      groupName &&
      Array.isArray(groupName) &&
      groupName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyGroupNames = groupName.filter((name) => name.trim() !== "");
      const groups = await groupModel
        .find({ groupName: { $in: nonEmptyGroupNames } })
        .exec();
      const groupIds: any = groups.map((group) => group._id);
      filter.groupId = { $in: groupIds };
    }
    if (employeeCodes && Array.isArray(employeeCodes)) {
      const nonEmptyemployeeCode = employeeCodes.filter(
        (name) => name.trim() !== ""
      );
      const employeeCode: any = nonEmptyemployeeCode.map((emp) => emp);
      if (employeeCode && employeeCode.length > 0) {
        filter.employeeCode = { $in: employeeCode };
      }
    }

    // Add departmentName filter if provided and non-empty
    if (
      departmentName &&
      Array.isArray(departmentName) &&
      departmentName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyDepartmentNames = departmentName.filter(
        (name) => name.trim() !== ""
      );
      const departments = await departmentModel
        .find({ departmentName: { $in: nonEmptyDepartmentNames } })
        .exec();
      const departmentIds: any = departments.map(
        (department) => department._id
      );
      const jobProfiles = await JobProfileModel.find({
        department: { $in: departmentIds },
      }).exec();
      const jobProfileIds: any = jobProfiles.map(
        (jobProfile) => jobProfile._id
      );
      filter.jobProfileId = { $in: jobProfileIds };
    }

    // Add jobProfileName filter if provided and non-empty
    if (
      jobProfileName &&
      Array.isArray(jobProfileName) &&
      jobProfileName.some((name) => name.trim() !== "")
    ) {
      const nonEmptyJobProfileNames = jobProfileName.filter(
        (name) => name.trim() !== ""
      );
      const jobProfiles = await JobProfileModel.find({
        jobProfileName: { $in: nonEmptyJobProfileNames },
      }).exec();
      const ids: any = jobProfiles.map((jobProfile) => jobProfile._id);
      jobProfileIds = [...jobProfileIds, ...ids];
      filter.jobProfileId = { $in: jobProfileIds };
    }

    if (name) {
      filter.$or = [{ name: name }, { employeeCode: name }];
      filter1.$or = [{ name: name }, { employeeCode: name }];
    }
 
   
    const employeeIds = await EmployeeModel.find(filter)
     
      .skip(skip)
      .limit(limit)
      .populate("jobProfileId")
        .populate({
          path: "jobProfileId",
          populate: {
            path: "department",
          },
        })
        .populate("groupId")
        .exec();
      

    const employeeid = await EmployeeModel.find(filter)
      .select({ _id: 1 })
      .exec();
    const empids = employeeid.map((employee) => employee._id);

    const ids = employeeIds.map((employee) => employee._id);

    let documnetLength = employeeid.length;

    let newRecords = [];
    let year = filterDate.getUTCFullYear();
    const allAttendance:any = await v2AttendanceModel
    .find({
      employeeId: { $in: ids },
      date: {
        $gte: filterDate,
        $lt: nextDay,
      },
    }).select("-createdAt -updatedAt -__v")
    .select({ employeeId: 1, punches: 1 })
    .populate({
        path: "remarks.by",
        model: "Employee",
      })
      .sort({ date: -1 })
      .populate({
        path: "approvedBy",
        select: "name",
      })
      .populate({
        path: "employeeId",
        select: [
          "jobProfileId",
          "groupId",
          "workingHours",
          "lunchTime",
          "employeeCode",
          "salary",
          "overTime",
          "contactNumber",
          "name",
          "role",
        ],
        populate: [
          {
            path: "jobProfileId",
            select: "jobProfileName",
            populate: {
              path: "department",
              select: "departmentName",
            },
          },
          {
            path: "groupId",
            select: "groupName",
          },
        ],
      })
      .populate({
        path: "punches",
        populate: [
          {
            path: "punchInBy",
            select: "name",
          },
          {
            path: "punchOutBy",
            select: "name",
          },
        ],
      })
    .sort({ date: -1 })
    .lean();
    const attendanceStore:any = {};
   allAttendance.forEach((a:any)=>{
      // console.log(a)
      if(a.employeeId){
      const employeeId = a.employeeId._id+"";
      if(!attendanceStore[employeeId]){
        attendanceStore[employeeId] = {
          data : []
        }
      };
      attendanceStore[employeeId].data.push({...a});
    }
    })
    const month=filterDate.getMonth()+1;
    //console.log(month)

    const firstDate = new Date(year, month - 1, 1);

    
    const lastDate = new Date(year, month, 0);
    console.log(firstDate)
    console.log(lastDate)
  
    

const salaryLog = await SalaryLogModel.find({
  applicableMonth: {
    $gte: firstDate,
    $lt: lastDate,
  },

});
    const salaryStore:any={};
    salaryLog.forEach((a:any)=>{
      if(a.employeeId){
        if(!salaryStore[a.employyeId])
        {
          salaryStore[a.employeeId]={
            data:[]
          }
        }
      }
      salaryStore[a.employeeId].data.push({...a});

    });

    // console.log(attendanceStore);
    const existingYearData = await workingDayModel.findOne({ year });
    let GSalaryA=0;
      let GSalaryB=0;
      let GoverTime=0;
      let GDutyHours=0;
    const new_map = new Map();
    for (let emp of employeeIds) {
    //  console.log("id",id, "data " ,attendanceStore[id+""]);
      const data: any = attendanceStore[emp._id+""]?.data || [];
      const salarydata: any = salaryStore[emp._id+""]?.data || [];
  const salaryDB=salarydata[salarydata.length-1]?._doc?.salary|| emp.salary
      
     // console.log(data)
      let totalDifference = 0;
      let totalactual = 0;
      let overTime = 0;
      let salaryTotalDiffrence = 0;

      let numberofduty = 0;
      let approvedduty = 0;
      let totalWorkingHours = 0;
      let salaryPerHours = 0;
      let totalSalaryA = 0;
      
      let finalSalary=0
      let dutyPerMonth = 0;
      let totalHours=0
      let dutyHours = 0;
      //let overTime = 0
      
      if (data) {
        numberofduty = data.length;
        for (let temp of data) {
          //console.log(temp)
          totalactual += temp.employeeId.workingHours;
          const monthName = months[temp.punches[0].punchIn.getMonth()];
          const punchInT: any = temp.punches[0].punchIn;
          const punchOutT: any = temp.punches[temp.punches.length - 1].punchOut;
          let hours = 0;
          if (punchInT && punchOutT) {
            const punchInHour = punchInT.getUTCHours();
        const punchOutHour = punchOutT.getUTCHours();
        const punchInMinute =punchInT.getUTCMinutes();
        const punchOutMinute = punchOutT.getUTCMinutes();
        if(punchInHour<8){
          punchInT.setUTCHours(8);
          punchInT.setUTCMinutes(0)


        }
        if(punchInHour==19){
          punchInT.setUTCHours(20);
          punchInT.setUTCMinutes(0)

        }
        // if(punchOutHour==16  && punchOutMinute>30){
        //   punchOutT.setUTCHours(16);
        //   punchOutT.setUTCMinutes(30);

        // }
        // if(punchOutHour==17  && punchOutMinute<=30){
        //   punchOutT.setUTCHours(16);
        //   punchOutT.setUTCMinutes(30);

        // }
        // if(punchOutHour>=19 && punchOutMinute>30 && punchInHour<19){
        //   punchOutT.setUTCHours(16);
        //   punchOutT.setUTCMinutes(30);
          
        // }
            const diff = punchOutT - punchInT;
            //console.log("diff",diff)

            const timed = diff / (1000 * 60 * 60);
            hours = timed;
            if(hours<0){
              hours*=-1
            }
          

            if (
              temp.employeeId.workingHours < timed &&
              !temp.employeeId.overTime
            ) {
              totalDifference += temp.employeeId.workingHours;
            } else {
              totalDifference += timed;
              
            }
          }

          if (temp.status === "approved") {
            approvedduty += 1;
          }

         
          let lunchPresent=false
          for (let p of temp.punches) {
            const punchInTT: any = p.punchIn;
            const punchOutTT: any = p.punchOut;
            
            if (punchInTT && punchOutTT) {
              const punchInHour = punchInTT.getUTCHours();
              const punchOutHour = punchOutTT.getUTCHours();
              const punchInMinute = punchInTT.getUTCMinutes();
              const punchOutMinute = punchOutTT.getUTCMinutes();
              
              if(punchOutHour>1 && punchInHour<=1){
                lunchPresent=true
              }
              if(punchOutHour>13 && punchInHour<=13){
                lunchPresent=true
              }
              if(punchOutHour==1 && punchOutMinute>=30){
                lunchPresent=true
              }
              if(punchOutHour==13 && punchOutMinute>=30){
                lunchPresent=true
              }

              const differ = punchOutTT - punchInTT;

              const timedd = differ / (1000 * 60 * 60);

              if (
                temp.employeeId.workingHours < timedd &&
                !temp.employeeId.overTime
              ) {
                salaryTotalDiffrence += temp.employeeId.workingHours;
              } else {
                salaryTotalDiffrence += timedd;
              }
            }
          }
          if (existingYearData) {
            const month = existingYearData.month.filter(
              (month) => month.monthName === monthName
            );

            if (month.length > 0) {
              if (month[0]?.workingDay) {
                dutyPerMonth = month[0].workingDay;
                totalWorkingHours =
                  month[0].workingDay * temp.employeeId.workingHours;
                salaryPerHours = salaryDB/ totalWorkingHours;
              }
            } else {
              dutyPerMonth = 30;
              totalWorkingHours = 30 * temp.employeeId.workingHours;
              salaryPerHours = salaryDB / totalWorkingHours;
            }
            let salary = 0;
            
            if (hours > 0.5) {
              // if(lunchPresent){
                hours = Math.abs(hours - temp.employeeId.lunchTime)
              //}
            }
            // if (temp.employeeId.overTime) {
              if(hours<0){
                hours*=-1
              }
              if(hours>1){
              salary = hours * salaryPerHours;
              }
             
              //console.log(hours)
            totalHours+=hours
            if (hours > temp.employeeId.workingHours) {
              overTime = overTime + (hours - temp.employeeId.workingHours);
            }
            // } else {
            //   if (hours >= temp.employeeId.workingHours) {
            //     salary = temp.employeeId.workingHours * salaryPerHours;
            //     totalHours+=temp.employeeId.workingHours
            //   } else {
            //     salary = hours * salaryPerHours;
            //     totalHours+=hours
            //   }
            // }
            totalSalaryA += salary;
          }
          finalSalary=temp.employeeId.overTime?totalSalaryA:totalactual * salaryPerHours
         
          
        
        if (hours >= temp.employeeId.workingHours) {
          dutyHours= dutyHours+temp.employeeId.workingHours;
        } else {
          dutyHours = dutyHours+hours;
        }
        }
       
        
        if(numberofduty>0){
          GSalaryA+=totalSalaryA
          GSalaryB+=(totalactual * salaryPerHours)
          GDutyHours+=dutyHours
          GoverTime+=overTime

        newRecords.push({
          dutyPerMonth: dutyPerMonth,
          overTime: overTime,
          length: data.length,
          totalactual: totalactual,
          sumActualWorkingHours: totalactual,
          sumFinalWorkingHours: totalDifference,
          numberofduty: numberofduty,
          approvedduty: approvedduty,
          salaryA: totalSalaryA,
          salaryB: totalactual * salaryPerHours ,
          //salaryC: salaryTotalDiffrence * salaryPerHours,
          finalSalary:finalSalary,
          employee:emp,
          totalWorkingHours: totalWorkingHours,
          salaryPerHours: salaryPerHours,
          sumDutyHours: dutyHours,
          totalHours:totalHours
        });
      }
      }

    }

    resp.status(200).json({
      success: true,
      message: "Employee Salary fetched successfully.",
      salaryRecords: newRecords,
      GSalaryA:GSalaryA,
      GSalaryB:GSalaryB,
      GoverTime:GoverTime,
      GDutyHours:GDutyHours,
      count: documnetLength,
    });
  }
);
export const month = catchErrorAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getAllEmployee = await EmployeeModel.find({}).lean();

      // Create an array to store the salary log data
      const salaryLogs: any[] = [];

      for (let employee of getAllEmployee) {
        console.log(employee.name);
        const salaryLogData = {
          employeeId: employee._id,
          salary: employee.salary,
          applicableMonth: new Date("2023-10-01"), // Use a Date object for dates
          changedBy: "64a3f3353d41be4135d71b31",
        };
        // Push the salary log data into the array
        salaryLogs.push(salaryLogData);
      }

      // Create and save SalaryLogModel instances in bulk
      const savedSalaryLogs = await SalaryLogModel.create(salaryLogs);

      return res.json({
        status: "done",
        savedSalaryLogs,
      });
    } catch (error) {
      // Handle any errors here
      next(error);
    }
  }
);