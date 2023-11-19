import axios from "axios";
import { Request, Response } from "express"
import EmployeeModel from "../../database/models/employeeModel";

export const getOtp = async (req: Request, res: Response) => {
    let { phoneNumber }: any = req.query;
    phoneNumber = Number(phoneNumber);

    if (!phoneNumber) {
        
        return res.status(400).json({
            success:false,
            message:"Phone no. is not valid"
        })
    } else {
        const emp = await EmployeeModel.findOne({ contactNumber: phoneNumber });
        if (!emp) {
            return res.status(404).json({
                success: false,
                message: `Employee not Found by This ${phoneNumber}.`
            })
        }
        const { data } = await axios.get(`https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/${phoneNumber}/AUTOGEN/Temp1`)
        res.send({
            data: data,
            employee: emp
        });
    }
}

export const verifyOtp = async (req: Request, res: Response) => {
    let { otp, phoneNumber }: any = req.query;
    phoneNumber = Number(phoneNumber);
    otp = Number(otp);

    const { data } = await axios.get(
        `https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/VERIFY3/${phoneNumber}/${otp}`
    );
    if (data.Status === "Success") {
        const emp = await EmployeeModel.findOne({ contactNumber: phoneNumber });
        if (!emp) {
            return res.status(404).json({
                success: false,
                message: "Employee not found."
            })
        } else {
            emp.verified = true
            const employee = await emp.save();
            res.send({
                success: "true",
                message: "OTP verify Successfully",
                data: data,
                employee
            })
        }
    } else {
        res.send({
            success: "false",
            message: "OTP Not verified",
            data: data
        })
    }
}