import customerModel from "../../database/models/customerModel";
import FinishedItemModel from "../../database/models/finishedItemModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import { Request, Response } from "express";

export const addCustomer = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { customerName, code, date } = req.body;
    const newDate = new Date(date);
    const customer = await customerModel.create({ customerName, code, date: newDate });
    return resp.status(201).json({
      success: true,
      message: "customer created successfully",
      customer
    });
  }
);

export const updateCoustomer = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    let { customerName, code } = req.body;
    const customer = await customerModel.findById(id);
    if (customer) {
      const customer = await customerModel.findByIdAndUpdate({ _id: id }, { customerName, code });
      return resp.status(201).json({
        success: true,
        message: "customer updated successfully",
      });
    } else {
      return resp.status(400).json({
        success: false,
        message: "customer not found",
      });
    }
  }
);


// delete customer 
export const deleteCustomer = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const customer = await customerModel.findById(id);
    if(!customer){
      return resp.status(404).json({
        success:false,
        message:"Customer not Found."
      })
    }
    const customerId = customer._id+"";
    const finishedItems = await FinishedItemModel.find().lean();
    const foundArray :string[] = []

    finishedItems.forEach((f)=>{
      const id = f.customer+"";
      if(id == customerId){
        const string = `The Customer ${customer.customerName} is used in FinishedItem ${f.itemName}.`
        foundArray.push(string);
      }
    })

    if(foundArray.length>0){
      return resp.status(405).json({
        success:false,
        message:"Found some items where customer is used.",
        foundArray
      })
    }else{
      await customerModel.findByIdAndDelete(id);
      return resp.status(202).json({
        success:true,
        message:`Customer ${customer.customerName} deleted successfully.`
      })
    }
});


// get customer 
export const getCustomer = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const customer = await customerModel.findById(id);
    if (customer) {
      return resp.status(201).json({
        success: true,
        message: "getting customer successfully",
        customer: customer,
      });
    } else {
      return resp.status(400).json({
        success: false,
        message: "customer not found",
      });
    }
  }
);

export const getAllCustomer = catchErrorAsync(
  async (req: Request, resp: Response) => {

    const {name , code,sort} = req.query;

    const query:any = {};
    if(name){
      query.$or = [
        {customerName:{$regex:name , $options:"i"}},
        {code:{$regex:name , $options:"i" }}
      ]
    };
    if(code){
      query.code=code;
    }

    let customer = await customerModel.find({...query});

    if(sort){
      if(sort === "asc"){
        customer = await customerModel.find({...query}).sort({customerName:1}).lean();
      }else if(sort === "dec"){
        customer = await customerModel.find({...query}).sort({customerName:-1}).lean();
      }else{
        customer = await customerModel.find({...query}).sort({customerName:1}).lean();
      }
    }else{
      customer = await customerModel.find({...query});
    }

    if (customer) {
      return resp.status(201).json({
        success: true,
        message: "getting all customer successfully",
        customer: customer,
      });
    } else {
      return resp.status(400).json({
        success: false,
        message: "customer not found",
      });
    }
  }
);
