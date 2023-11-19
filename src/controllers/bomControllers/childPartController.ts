import ChildPartModel from "../../database/models/childPartModel";
import { Request, Response, NextFunction } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import GodownModel from "../../database/models/godownModel";
import {Schema} from "mongoose";

export const addChildPart = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { partName, productionGodown, consumedItem } = req.body;
    const godown = await GodownModel.findById(productionGodown);
    if (godown) {
      const childPart = await ChildPartModel.create({
        partName,
        consumedItem,
        productionGodown,
      });
      return resp.status(201).json({
        success: true,
        message: "Child Part created successfully",
        childPart,
      });
    } else {
      return resp.status(201).json({
        success: false,
        message: "godown not found",
      });
    }
  }
);

export const deleteChildPart = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const part = await ChildPartModel.findById(id);
    if (part) {
      const childPart = await ChildPartModel.findByIdAndDelete(id);
      return resp.status(201).json({
        success: true,
        message: "Child Part deleted successfully",
        childPart,
      });
    } else {
      return resp.status(400).json({
        success: false,
        message: "Child Part not found",
      });
    }
  }
);
export const getAllChildPart = catchErrorAsync(
  async (req: Request, resp: Response) => {

    // const allChild = await ChildPartModel.find({childPartType:undefined}).lean();
    const allChild = await ChildPartModel.find({}).lean();
    // const result:any = [];
    // allChild.forEach((c)=>{
    //  if( c.consumedItem &&c.consumedItem.length>0){
    //   result.push({...c})
    //  }
    // })
    return resp.status(201).json({
      success: true,
      message: "Getting all ChildPart successfully",
      childParts:allChild,
    });
});


// //single use
// export const deleteUnwanted = catchErrorAsync(async(req,resp,next)=>{
//   const data:any = await ChildPartModel.find({}).lean();
//   let count = 1;
//   for(let d of data){
   
//     if(d.ID){
//       const element:any = await ChildPartModel.findByIdAndDelete(d._id);
//       count++;
//     }
//   };
//   resp.status(200).json({
//     success:true,
//     count
//   })

// })


// get child part with Id
export const getChild = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const childPart = await ChildPartModel.findById(id);
    return resp.status(201).json({
      success: true,
      message: "Getting Child Part successfully",
      childPart,
    });
  }
);


// update ChildPart
export const updateChildPart = catchErrorAsync( 
  async (req: Request, resp: Response) => {
    const {productionGodown, itemConsumed,newName } = req.body;
    const {id} = req.params;
    const godown = await GodownModel.findById(productionGodown);
    if (!godown) {
      return resp.status(201).json({
        success: false,
        message: "godown not found",
      });
    }
    const childArray: any = [];
    const childPartStore :any ={}
    const childParts = await ChildPartModel.find().lean();
    childParts.forEach((c)=>{
      const name = c.partName+"";
      childPartStore[name]={
        ...c
      }
    })
    // for checking childPart present or not
    itemConsumed.forEach((i: any) => {
      const name = i.childPart;

      const part = childPartStore[name];
      if (!part) {
        return resp.status(404).json({
          success: false,
          message: `Child Part with Name ${name} not found.`,
        });
      }
    });
    const godownStore:any = {}

    const godowns = await GodownModel.find().lean();
    godowns.forEach((g)=>{
       const name = g.godownName+"";
       godownStore[name] = {
        ...g
       }
    })
  
    itemConsumed.forEach(async (i: any) => {
      const name = i.childPart;

      const part = childPartStore[name];

      if (!part) {
        return resp.status(404).json({
          success: false,
          message: `Child Part with Name ${name} not found.`,
        });
      }
      const godown = godownStore[i.consumptionGodown];
     

      childArray.push({
        ...part,
        quantity: i.quantity,
        consumptionGodown:godown._id,
      });
    });

     // updating the production according to consumptions 
   childArray.forEach(async (c:any)=>{
    const godown = c.consumptionGodown
    await ChildPartModel.findByIdAndUpdate({_id:c._id},{productionGodown:godown});
   })

    const newChildArray:{
      itemId: Schema.Types.ObjectId;
      itemName: string;
      itemType: string;
      consumedItemQuantity: number;
      consumptionGodown: Schema.Types.ObjectId;
    }[] =[];

    const newChildPart = await ChildPartModel.findById({_id:id});

     if(!newChildPart){
      return resp.status(404).json({
        success:false,
        message:"ChildPart not found."
      })
     }

    childArray.forEach((c: any) => {
      const itemId = c._id;
      const itemName = c.partName;
      const itemType = "child part";
      const consumedItemQuantity = c.quantity;
      // const consumptionGodown = c.productionGodown ? c.productionGodown : c.consumptionGodown;
      const consumptionGodown =  c.consumptionGodown;
      
      newChildArray.push({
        itemId,
        itemName,
        itemType,
        consumedItemQuantity,
        consumptionGodown,
      });
    });
    // console.log(newChildArray)
    newChildPart.consumedItem = newChildArray;
    newChildPart.productionGodown = godown._id;

    if(newName && newName.trim() !==newChildPart.partName){
      const newChildNamePart = await ChildPartModel.findOne({partName:newName});
      if(newChildNamePart){
        return resp.status(400).json({
          success:false,
          message:`ChildPart with name ${newName} already present.`
        })
      }
      newChildPart.partName = newName.trim();
    }

    await newChildPart.save();
    
    return resp.status(201).json({
        success: true,
        message: "Child Part updated successfully.",
        newChildPart
      });
  }
);

// edit childPart Name 

export const editChildPartName = catchErrorAsync(async (req:Request,resp:Response,next:NextFunction)=>{
  const {id} = req.params;
  const {newName} = req.body;

  const childPart = await ChildPartModel.findOne({_id:id});
  if(!childPart){
    return resp.status(404).json({
      success:false,
      message:`ChildPart with `
    })
  }
  const childPartWithName  = await ChildPartModel.findOne({partName:newName.trim()});
  if(childPartWithName){
    return resp.status(400).json({
      success:false,
      message:`ChildPart with ${newName.trim()} already present.`
    })
  }

  childPart.partName = newName.trim();
  await childPart.save();

  resp.status(200).json({
    success:true,
    message:"Child part updated successfully.",
    childPart

  })

})



