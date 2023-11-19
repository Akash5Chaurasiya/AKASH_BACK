import globalProcessModel from "../../database/models/globalProcessModel";
import JobProfileModel from "../../database/models/jobProfileModel";
import ShopModel from "../../database/models/shopModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import {Request,Response,NextFunction} from "express"; 


// add a shop
export const addShop = catchErrorAsync(async (req:Request,resp:Response,next:NextFunction)=>{
    let {shopName,shopCode,jobProfileName} = req.body;
    shopName = shopName.trim();
    shopCode = shopCode.trim();
    
    const jobProfile = await JobProfileModel.findOne({jobProfileName});
    if(!jobProfile){
        return resp.status(404).json({
            success:false,
            message:"Job Profile not found."
        })
    }
    const shop = await ShopModel.findOne({shopName});
    if(shop){
        return resp.status(400).json({
            success:false,
            message:"Shop with same name is already presesnt."
        })
    }
    const newShop = await ShopModel.create({shopName,shopCode,jobProfile:{
        jobProfileId:jobProfile._id,
    jobProfileName:jobProfile.jobProfileName}})

    resp.status(201).json({
        success:true,
        message:"Shop created successfully.",
        newShop
    })

})

// get all shops
export const getAllShop = catchErrorAsync(async (req:Request,resp:Response,next:NextFunction)=>{
    
    const shops = await ShopModel.find();
    
    resp.status(200).json({
        success:true,
        message:"Getting all Shops successfully.",
        shops
    })

})
// get single shops
export const getSingleShop = catchErrorAsync(async (req:Request,resp:Response,next:NextFunction)=>{
    
    const {id} = req.params;
    const shop = await ShopModel.findById({_id:id});
    
    resp.status(200).json({
        success:true,
        message:"Getting Shop successfully.",
        shop
    })

})

// get update shops
export const updateShop = catchErrorAsync(async (req:Request,resp:Response,next:NextFunction)=>{
    
    const {id} = req.params;
    const {shopName,shopCode,jobProfileName} = req.body ;
    let jobProfile;
    let shop;
    shop = await ShopModel.findById({_id:id});
    if(!shop){
        return resp.status(404).json({
            success:false,
            message:"Shop not found."
        })
    }
    if(shopName){
        shop.shopName = shopName;
    }
    if(shopCode){
        shop.shopCode = shopCode;
    }

    if(jobProfileName){
     jobProfile = await JobProfileModel.findOne({jobProfileName});

    if(!jobProfile){
        return resp.status(400).json({
            success:false,
            message:"Jobprofile not found."
        })
    }
    shop.jobProfile = {
        jobProfileId:jobProfile._id,
        jobProfileName:jobProfile.jobProfileName
    };

    }

    await shop.save();
    resp.status(200).json({
        success:true,
        message:"Getting Shop successfully.",
        shop
    });

});

// delete shop 
export const deleteShop = catchErrorAsync(async (req:Request,resp:Response,next:NextFunction)=>{

    const {id} = req.params;

    const shop = await ShopModel.findById(id);

    if(!shop){
        return resp.status(404).json({
            success:false,
            message:`Shop with Id ${id} not found.`
        })
    }

    const alreadyUsed:string[] = [];
    const processes = await globalProcessModel.find({shop});
    if(processes.length > 0){
        processes.forEach((p)=>{
            const string = p.processName;
            alreadyUsed.push(string);
        })
    }
    if(alreadyUsed.length>0){
        return resp.status(405).json({
           success:false,
           message:"Shop is used in processes.",
           alreadyUsed
        })
    }else{
        const shop = await ShopModel.findByIdAndDelete({_id:id});
        return resp.json({
            success:true,
            message:`Shop with name ${shop?.shopName} deleted.`
        })
    }

})
