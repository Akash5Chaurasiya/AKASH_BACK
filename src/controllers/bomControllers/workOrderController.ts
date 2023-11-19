import customerModel from "../../database/models/customerModel";
import FinishedItemModel from "../../database/models/finishedItemModel";
import globalProcessModel from "../../database/models/globalProcessModel";
import workOrderModel from "../../database/models/workOrderModel";
import catchErrorAsync from "../../utils/catchAsyncError";
import { NextFunction, Request, Response } from "express";
import { getBomItemWithQuantity } from "./finishedItemController";
import ChildPartModel from "../../database/models/childPartModel";
import GodownModel from "../../database/models/godownModel";
import ProductionSlipModel from "../../database/models/productionSlipModel";
import ShopModel from "../../database/models/shopModel";
import { EmployeeDocument } from "../../database/entities/employeeDocument";
import JobProfileModel from "../../database/models/jobProfileModel";

interface CustomRequest<T> extends Request {
  employee?: T;
  admin?: T;
}

export const addWorkOrder = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const id = req.params.finishedItemId;
    const { orderQuantity, orderNumber } = req.body;

    const finished = await FinishedItemModel.findById(id);
    
    if (finished?.bomCompleted == false) {
      return resp.status(400).json({
        success: false,
        message: "Finished Item is not completed.",
      });
    };

    const order = await workOrderModel.findOne({orderNumber:orderNumber.trim()});
    if(order){
      return resp.status(400).json({
        success:false,
        message:`Work order with number ${orderNumber} already present.`
      });
    };

    const childParts = await ChildPartModel.find({}).lean();
    const childPartStore: any = {};
    const godownStore: any = {};
    childParts.forEach((c) => {
      const id = c._id + "";
      childPartStore[id] = {
        ...c,
      };
    });
    const godowns = await GodownModel.find().lean();
    godowns.forEach((g) => {
      const id = g._id + "";
      godownStore[id] = {
        ...g,
      };
    });

    const data = await getBomItemWithQuantity(req, resp, id, orderQuantity);
    if (!data) {
      return resp.status(400).json({
        success: false,
        message: "Master Bom or finished Item not found.",
      });
    }
    const customer = await customerModel.findById({
      _id: data.customer,
    });
    if (!customer) {
      return resp.status(404).json({
        success: false,
        message: "Customer Not found.",
      });
    }

    const obj = {
      date: new Date(),
      orderNumber:orderNumber.trim(),
      customerId: customer._id,
      customerName: customer.customerName,
      finishedItemId: id,
      orderQuantity,
      finishItemName: data.finishedItemName,
      partCode: data.partCode,
      MCode: data.MCode,
      masterBom: data.items,
    };
    const workOrder = await workOrderModel.create({ ...obj });

    workOrder.masterBom.forEach((w) => {
      const id = w._id + "";
      const childPartDetail = childPartStore[id];
      const productionGodownId = childPartDetail.productionGodown + "";
      const godownDetails = godownStore[productionGodownId];
      w.productionGodownId = godownDetails._id;
      w.productionGodownName = godownDetails.godownName;
      w.newChild.forEach((d) => {
        const id = d._id + "";
        childPartDetail.consumedItem.forEach((c: any) => {

          const id1 = c.itemId + "";

          if (c.consumptionGodown) {
            const godownChild = godownStore[c.consumptionGodown];

            if (id == id1) {
              d.consumptionGodownId = godownChild._id;
              d.consumptionGodownName = godownChild.godownName;
              return;
            };
          };
        });
      });
    });

    await workOrder.save();
    resp.status(200).json({
      success:true,
      message:"Work Order created successfully", 
      workOrder,
      // masterBom: data.newFinishItem.items
     });
  }
);

export const updateWorkOrder = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const { orderQuantity , status } = req.body as {orderQuantity:number; status:"pending"|"inProgress"|"completed"|"cancel"};
    const workOrder = await workOrderModel.findById(id);
    if (!workOrder) {
      return resp.status(404).json({
        success: false,
        message: "work order Not Found.",
      });
    };
    
    const oldQuantity = workOrder.orderQuantity===0 ? 1 : workOrder.orderQuantity;
   

    if(status){
      workOrder.status = status;
      if(status === "cancel"){
         const productionSlips = await ProductionSlipModel.find({workOrderId:workOrder._id});
         for(let p of productionSlips){
           if(p.itemProduced>0 ){
            return resp.status(400).json({
              success:false,
              message:`This workOrder's slip is producing item Slip Number ${p.productionSlipNumber}.`
            });
           };
         };
       };
     };

    if (orderQuantity !== undefined) {
      if(orderQuantity === 0){
        workOrder.masterBom.forEach((d) => {
          if (oldQuantity && d.numberOfItem) {
            d.numberOfItem = (d.numberOfItem / oldQuantity) * 1;
  
            if (d.newChild) {
              d.newChild.forEach((e) => {
                if (e.numberOfItem) {
                  e.numberOfItem = (e.numberOfItem / oldQuantity || 0 ) * 1;
                }
              });
            };
          };
        });
      }else{
      workOrder.masterBom.forEach((d) => {
        if (oldQuantity && d.numberOfItem) {
          d.numberOfItem = (d.numberOfItem / oldQuantity) * orderQuantity;

          if (d.newChild) {
            d.newChild.forEach((e) => {
              if (e.numberOfItem) {
                e.numberOfItem = (e.numberOfItem / oldQuantity) * orderQuantity;
              }
            });
          };
        };
      });
    }
      workOrder.orderQuantity = orderQuantity;
    };
   
    await workOrder.save();

    resp.status(200).json({
      success: true,
      message: "order quantity updated successFully.",
      workOrder,
    });
  }
);

export const updateInMasterBom = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const { childPartId, consumedItems } = req.body;
    const workOrder = await workOrderModel.findById(id).lean();

    const consumedItemStore: any = {};
    consumedItems.forEach((c: { _id: string; numberOfItem: number }) => {
      const id = c._id + "";
      consumedItemStore[id] = {
        ...c,
      };
    });

    let indexx;
    workOrder?.masterBom.forEach((w, index) => {
      if (w._id == childPartId) {
        const numberOfItem = w.numberOfItem;
        indexx = index;
        w.newChild.forEach((c) => {
          const id = c._id + "";
          const newChild = consumedItemStore[id];
          c.numberOfItem = newChild.numberOfItem * numberOfItem;
        });
      }
    });

    const workOrderBomRawStore: any = {};

    const lastId =
      workOrder?.masterBom[workOrder?.masterBom.length - 1]._id + "";
    workOrderBomRawStore[lastId] = {
      ...workOrder?.masterBom[workOrder?.masterBom.length - 1],
    };
    workOrder?.masterBom.forEach((m) => {
      if (m.newChild) {
        m.newChild.forEach((n) => {
          const id = n._id + "";
          workOrderBomRawStore[id] = {
            ...n,
          };
        });
      }
    });

    for (let i = indexx || 0; i >= 0; i--) {
      const data = workOrder?.masterBom[i];
      const id = data?._id + "";
      const rawStore = workOrderBomRawStore[id];

      const oldNumberOfItem = data?.numberOfItem || 1;
      const newNumberOfItem = rawStore.numberOfItem;

      if (data?.numberOfItem !== undefined) {
        data.numberOfItem = rawStore.numberOfItem;
      }

      if (data?.newChild) {
        data.newChild.forEach((d) => {
          const id = d._id + "";
          const storeData1 = workOrderBomRawStore[id];
          if (d.numberOfItem) {
            const numberOfItem =
              (d.numberOfItem / oldNumberOfItem) * newNumberOfItem;
            storeData1.numberOfItem = numberOfItem;

            workOrderBomRawStore[id].numberOfItem = numberOfItem;
            d.numberOfItem = numberOfItem;
          }
        });
      }
    }

    const newWorkOrder = await workOrderModel.findByIdAndUpdate(id, {
      masterBom: workOrder?.masterBom,
    });
    resp.status(200).json({
      success: true,
      message: "order quantity updated successFully.",
      newWorkOrder,
      workOrder,
      workOrderBomRawStore,
    });
  }
);

// add child part in master bom
export const addChildPartInMasterBom = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const workOrder = await workOrderModel.findById(id);
    const {
      processName,
      childPartName,
      productionGodown,
      itemConsumed,
      newIndex,
    } = req.body;

    const allChildPart = await ChildPartModel.find().lean();
    const childPartStore: any = {};
    allChildPart.forEach((a) => {
      const name = a.partName;
      childPartStore[name] = {
        ...a,
      };
    });

    if (!workOrder) {
      return resp.status(404).json({
        success: false,
        message: "Work order not found .",
      });
    }
    const childPart = await ChildPartModel.findOne({ partName: childPartName });
    if (!childPart) {
      return resp.status(400).json({
        success: false,
        message: "Child Part with this name already present.",
      });
    };
    
    const godown = await GodownModel.findOne({ godownName: productionGodown });
    if (!godown) {
      return resp.status(400).json({
        success: false,
        message: "Production godown not found.",
      });
    }

    const process = await globalProcessModel.findOne({
      processName: processName,
    });

    if (!process) {
      return resp.status(404).json({
        success: false,
        message: "Process not found.",
      });
    }

    const childArray: any = [];

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

    itemConsumed.forEach((i: any) => {
      const name = i.childPart;

      const part = childPartStore[name];
      if (!part) {
        return resp.status(404).json({
          success: false,
          message: `Child Part with Name ${name} not found.`,
        });
      }

      childArray.push({
        ...part,
        quantity: i.quantity,
        consumptionGodown: i.consumptionGodown,
      });
    });

    // const newChildPart = await ChildPartModel.create({
    //   partName: childPartName,
    //   productionGodown: godown?._id,
    //   numberOfItem: 1,
    // });

    // childArray.forEach((c: any) => {
    //   const itemId = c._id;
    //   const itemName = c.partName;
    //   const itemType = "child part";
    //   const consumedItemQuantity = c.quantity;
    //   const consumptionGodown = c.productionGodown;

    //   newChildPart.consumedItem.push({
    //     itemId,
    //     itemName,
    //     itemType,
    //     consumedItemQuantity,
    //     consumptionGodown,
    //   });
    // });

    // await newChildPart.save();
    const newChild: any = [];
    childPart.consumedItem.forEach((n) => {
      const obj = {
        _id: n.itemId,
        partName: n.itemName,
        numberOfItem: n.consumedItemQuantity,
      };
      newChild.push(obj);
    });


    const newItem = {
      _id: childPart._id,
      process: process.processName,
      partName: childPart.partName,
      numberOfItem: 1,
      itemProduced: 0,
      newChild:newChild,
    };

    if (newIndex >= 0 && newIndex <= workOrder.masterBom.length) {
      workOrder.masterBom.splice(newIndex , 0 , newItem);
    }

    // await workOrder.save();

    const data1 = await workOrderModel
      .findByIdAndUpdate(
        { _id: workOrder._id },
        { masterBom: workOrder.masterBom }
      ).exec();

    resp.status(200).json({
      success: true,
      message: "Added item in workOrder.",
      data1,
    });
});

export const updateConsumedItemInMasterBomb = async (
  req: Request,
  resp: Response,
  next:NextFunction
) => {
  try {
    const { id } = req.params;
    const { childPartId,childPartName, consumedItems } = req.body;
    const workOrder = await workOrderModel.findById(id).lean();

    const childPartStore: any = {};
    const childParts = await ChildPartModel.find().lean();

    childParts.forEach((c) => {
      const id = c._id + "";
      childPartStore[id] = {
        ...c,
      };
    });

    consumedItems.forEach((c:{ _id: string; numberOfItem: number })=>{
       if(c._id+"" === childPartId+""){
        return resp.status(400).json({
          success:false,
          message:`Child Part is consumming itself.`
        })
       };
    });

    const childPart = await ChildPartModel.findById(childPartId);

    if(childPartName){
      if(childPart){
      childPart.partName = childPartName;
      await childPart.save();
      };
    };
    console.log(consumedItems);

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // const productionSlip = await ProductionSlipModel.find({
    //   workOrderId: workOrder?._id,
    //   "part._id": childPartId,
    // }).lean();

    // productionSlip.forEach(async (p) => {
    //   const id = p._id + "";
    //   const numberOfItems = p.numberOfItems;
    //   const result: any = [];
    //   p.consumedItem.forEach((c) => {
    //     const id = c._id + "";
    //     consumedItems.forEach((i: { _id: string; numberOfItem: number }) => {
    //       const id1 = i._id + "";

    //       if (id === id1) {
    //         const obj = { ...c };
    //         obj.numberOfItem = numberOfItems * i.numberOfItem;
    //         result.push(obj);
    //       }
    //     });
    //   });

         
      
    //   const prd = await ProductionSlipModel.findByIdAndUpdate(
    //     { _id: id },
    //     { consumedItem: result } 
    //   );

    //   if(childPartName){
    //     if(prd){
    //     prd.part.partName = childPartName;
    //    };
    //   };
    // });
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    const arr: any = [];
    const consumedItemStore: any = {};
    consumedItems.forEach((c: { _id: string; numberOfItem: number }) => {
      const id = c._id + "";
      consumedItemStore[id] = {
        ...c,
      };
      const obj = {
        ...consumedItemStore[id],
        ...childPartStore[id],
      };
      arr.push(obj);
    });

    let indexx;
    workOrder?.masterBom.forEach((w, index) => {
      if (w._id == childPartId) {
        const numberOfItem = w.numberOfItem;

        indexx = index;

        arr.forEach((c: any) => {
          const id = c._id + "";
          const newChild = consumedItemStore[id];
          c.numberOfItem = newChild.numberOfItem * numberOfItem;
        });
        w.newChild = arr;
      };
    });

    const workOrderBomRawStore: any = {};

    const lastId = workOrder?.masterBom[workOrder?.masterBom.length - 1]._id + "";
    workOrderBomRawStore[lastId] = {
      ...workOrder?.masterBom[workOrder?.masterBom.length - 1],
    };
    workOrder?.masterBom.forEach((m) => {
      if (m.newChild) {
        m.newChild.forEach((n) => {
          const id = n._id + "";
          workOrderBomRawStore[id] = {
            ...n,
          };
        });
      };
    });

    for (let i = indexx || 0; i >= 0; i--) {
      const data = workOrder?.masterBom[i];
      const id = data?._id + "";

      if (!workOrderBomRawStore[id]) {
        continue;
      };
      const rawStore = workOrderBomRawStore[id];
      const oldNumberOfItem = data?.numberOfItem || 1;
      const newNumberOfItem = rawStore?.numberOfItem;

      if (data?.numberOfItem !== undefined) {
        data.numberOfItem = rawStore.numberOfItem || oldNumberOfItem;
      };

      if (data?.newChild) {
        data.newChild.forEach((d) => {
          const id = d._id + "";
          const storeData1 = workOrderBomRawStore[id];
          if (d.numberOfItem) {
            const numberOfItem = (d.numberOfItem / oldNumberOfItem) * newNumberOfItem;
            storeData1.numberOfItem = numberOfItem;
            workOrderBomRawStore[id].numberOfItem = numberOfItem;
            d.numberOfItem = numberOfItem;
          };
        });
      };
    };

    const newWorkOrder = await workOrderModel.findByIdAndUpdate(id, {
      masterBom: workOrder?.masterBom,
    });

    let newChilds;

    newWorkOrder?.masterBom.forEach((m)=>{
      if(m._id+"" === childPartId+""){
      newChilds = m.newChild;
      };

    });

    const productionSlips = await ProductionSlipModel.find({
      workOrderId: workOrder?._id,
      "part._id": childPartId,
    }).lean();

    for(let i of productionSlips){
      await ProductionSlipModel.findByIdAndUpdate(i._id , {consumedItem:newChilds});
    };


    resp.status(200).json({
      success: true,
      message: "work order updated successFully.",
      workOrder,
    });
  } catch (error) {
    console.log(error);
    resp.json({
      error: error,
    });
  }
};

export const deleteWorkOrder = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const workOrder = await workOrderModel.findById(id);
    if (workOrder) {
      const workOrder = await workOrderModel.findByIdAndDelete(id);
      return resp.status(201).json({
        success: true,
        message: "work order delete successfully",
      });
    } else {
      return resp.status(201).json({
        success: false,
        message: "work order not found",
      });
    };
  }
);


export const getWorkOrder = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const workOrder :any = await workOrderModel.findById(id);
    const processes = await globalProcessModel.find().lean();
    const processStore:any = {};
    processes.forEach((p)=>{
      const id = p._id+"";
      processStore[id]={
        ...p
      }
    });
    

    const childParts = await ChildPartModel.find().lean();
    const childPartStore:any = {};
    childParts.forEach((c:any)=>{
     const id = c._id+"";
     childPartStore[id] = {
      ...c
    } 
    });
    if(!workOrder){
      return resp.status(404).json({
        success:false,
        message:`Work order not found with ${id}.`
      });
    };

      const productionSlips = await ProductionSlipModel.find({workOrderId:workOrder._id}).lean();
      const productionSlipStore:any = {};

      productionSlips.forEach((p)=>{
        
        const id = p.part._id+"";
        if(!productionSlipStore[id]){
          productionSlipStore[id] = {
            itemProduced:0
          };
        };
        productionSlipStore[id].itemProduced += p.itemProduced;
      });
       

      workOrder.masterBom.forEach((m:any)=>{
        const partId = m._id+"";
        const partDetails = childPartStore[partId];
        const processId = m.processId+"";
        const processDetails = processStore[processId];

        if(processDetails){
          m.process = processDetails.processName;
        };

        if(partDetails){
          m.partName = partDetails.partName;
        };

        m.newChild.forEach((n:any)=>{
          const partId = n._id+"";
          const partDetails = childPartStore[partId];
          if(partDetails){
          n.partName = partDetails.partName;
         };
      });
    });
    
    await workOrder.save();

    const newWorkOrder:any = await workOrderModel.findById(workOrder._id).lean();
    newWorkOrder.masterBom.forEach((m:any)=>{
       const id = m._id+"";
       const remainingItems =(m.numberOfItem - productionSlipStore[id]?.itemProduced || 0 );
       m.remainingItems = remainingItems;
    });


    resp.status(200).json({
      success:true,
      message:`Getting work order successfully.`,
      workOrder : newWorkOrder
    });
});

export const getAllWorkOrder = catchErrorAsync(
  async (req: CustomRequest<EmployeeDocument>, resp: Response) => {
    const { name, status, customer, sort, process, shop , date,nextDate } = req.query as { name :string; status:string; customer:string; sort:string; process:string; shop :string; date:string;nextDate:string } ;

    const query: any = {};
    const processStore: any = {};

    if(date){
       const newDate = new Date(date);
       if(nextDate){
         const newNextDate =  new Date(nextDate);
         newNextDate.setDate(newNextDate.getDate()+1);
         query.createdAt ={
          $gt:newDate,
          $lte:newNextDate
         };
       }else{
        const newNextDate =  new Date(newDate);
        newNextDate.setDate(newNextDate.getDate()+1);
        query.createdAt ={
         $gt:newDate,
         $lte:newNextDate
        };
       };
    };

    if (shop) {
      const shopDetails = await ShopModel.findOne({ shopName: shop });
      const process = await globalProcessModel
        .find({ "shop.shopId": shopDetails?._id })
        .lean();
      if(!query["masterBom.processId"]){
        query["masterBom.processId"] = {$in :[]}
      }  
      process.forEach((p) => {
        const id = p.processName + "";
        query["masterBom.processId"].$in.push(p._id);
        processStore[id] = {
          _id: id,
        };
      });
    };

    if (process) {
      const processDetails = await globalProcessModel.findOne({
        processName: process,
      });
      if(!query["masterBom.processId.$in"]){
        query["masterBom.processId"] = {$in : []}
      }  
      const id = processDetails?._id + "";
      query["masterBom.processId"].$in.push(processDetails?._id);
      processStore[id] = {
        _id: id,
      };
    };

    if (name) {
      query.$or = [
        { finishItemName: { $regex: name, $options: "i" } },
        { MCode: { $regex: name, $options: "i" } },
        { partCode: { $regex: name, $options: "i" } },
        { orderNumber: { $regex: name, $options: "i" } },
      ];
    };

    if (status) {
      query.status = status;
    } ;

    if (customer) {
      query.customerName = customer;
    };
    const allProductionSlips = await ProductionSlipModel.find({status:{$in : ["completed","manual","cnc"]}}).lean();
    const workOrderSlipStore:any = {};
    allProductionSlips.forEach((a)=>{
      const id = a.workOrderId+"";
      if(!workOrderSlipStore[id]){
         workOrderSlipStore[id] = {
          slips : []
        }
      }
      workOrderSlipStore[id].slips.push({...a});
    });
    if (req.employee || req.admin) {
      let jobProfile
      if(req.employee){
       jobProfile = await JobProfileModel.findOne({
        _id: req.employee?.jobProfileId,
      });
      
      if (!jobProfile) {
        return resp.status(404).json({
          success: false,
          message: `Job profile not found with ID ${req.employee?.jobProfileId}.`,
        });
      }};

      if (req.employee && jobProfile?.jobProfileName.toLowerCase() !== "hr") {
        const shop = await ShopModel.findOne({
          "jobProfile.jobProfileId": jobProfile?._id,
        });

        if (!shop) {
          return resp.status(404).json({
            success: false,
            message: `Shop not found for JobProfile ${jobProfile?.jobProfileName}`,
          });
        };

        const processes = await globalProcessModel
          .find({ "shop.shopId": shop._id })
          .lean();

        if (processes.length === 0) {
          return resp.status(404).json({
            success: false,
            message: `Processes not found for shop ${shop.shopName}`,
          });
        };

        const processStore: any = {};
        processes.forEach((p) => {
          const id = p._id + "";
          processStore[id] = {
            ...p,
          };
        });

        let workOrders;
        if (sort === "old") {
          workOrders = await workOrderModel.find(query).sort({ date: 1 }).lean();
        } else if (sort === "new") {
          workOrders = await workOrderModel
            .find(query)
            .sort({ date: -1 })
            .lean();
        } else {
          workOrders = await workOrderModel
            .find(query)
            .sort({ date: -1 })
            .lean();
        }
       
        const result: any = [];

        workOrders.forEach((w) => {
          const id = w._id+"";
          const masterBom: any = [];
          const length =  w.masterBom.length-2;
          let totalFinishItem = 0;
          let totalLoading = 0;
          w.masterBom.forEach((m , i) => {
            const partId = m._id+"";
            if(i===length){
              const productionSlips = workOrderSlipStore[id]?.slips;
              
              if(productionSlips){
                productionSlips.forEach((p:any)=>{
                  if(partId === p.part._id+""){
                  totalFinishItem += p.itemProduced || 0;
                 };
              });
            };
          }else if(i===length+1){
              const productionSlips = workOrderSlipStore[id]?.slips;
              if(productionSlips){
                productionSlips.forEach((p:any)=>{
                  if(partId === p.part._id+""){
                    totalLoading += p.itemProduced || 0;
                  };
                });
              };
            };
            const processId = m.processId + "";
            if (processStore[processId]) {
              masterBom.push({ ...m });
            }
          });
          
          const obj = {
            ...w,totalFinishItem,totalLoading
          }; 

          obj.masterBom = masterBom;
          if(obj.masterBom.length > 0){
          result.push(obj);
        }
        });

        return resp.status(200).json({
          success: true,
          message: "getting work order successfully",
          workOrder: result,
          processes
        });
        
      } else {
        //------------------- Condition For admin-----------------//
        let workOrder;
        if (sort === "old") {
          workOrder = await workOrderModel.find(query).sort({ date: 1 }).lean();
        } else if (sort === "new") {
          workOrder = await workOrderModel
            .find(query)
            .sort({ date: -1 })
            .lean();
        } else {
          workOrder = await workOrderModel
            .find(query)
            .sort({ date: -1 })
            .lean();
        }
        const result:any = [];
        workOrder.forEach((w) => {
          const id = w._id+"";
          const masterBom: any = [];
          const length =  w.masterBom.length-2;
          let totalFinishItem = 0;
          let totalLoading = 0;
          w.masterBom.forEach((m , i) => {
            const partId = m._id+"";
            if(i===length){
              const productionSlips = workOrderSlipStore[id]?.slips;
              
              if(productionSlips){
                productionSlips.forEach((p:any)=>{
                  if(partId === p.part._id+""){
                  totalFinishItem += p.itemProduced || 0;
                }
                })
              }
              
            }else if(i===length+1){
              const productionSlips = workOrderSlipStore[id]?.slips;
              if(productionSlips){
                productionSlips.forEach((p:any)=>{
                  if(partId === p.part._id+""){
                    totalLoading += p.itemProduced || 0;
                  }
                })
              }
            }
          });
          
          const obj = {
            ...w,totalFinishItem,totalLoading
          };
          result.push(obj);
        });

        return resp.status(200).json({
          success: true,
          message: "getting work order successfully",
          workOrder: result,
        });
      };
    } else {
      return resp.status(403).json({
        success: false,
        message: `Login First.`,
      });
    };
  }
);

export const getAllWorkOrderWithProductionSlip = async (
  req: Request,
  resp: Response,
  next: NextFunction
) => {
  const workOrders = await workOrderModel.find().lean();
  const allProductionSlip = await ProductionSlipModel.find().lean();
  const productionSlipStore: any = {};

  allProductionSlip.forEach((a) => {
    const workOrderId = a.workOrderId + "";
    if (productionSlipStore[workOrderId]) {
      productionSlipStore[workOrderId].data.push({
        productionSlipNumber: a.productionSlipNumber,
        productionSlipId: a._id,
        workOrderId: workOrderId,
        status: a.status,
      });
    }
    productionSlipStore[workOrderId] = {
      data: [
        {
          productionSlipNumber: a.productionSlipNumber,
          productionSlipId: a._id,
          workOrderId: workOrderId,
          status: a.status,
        },
      ],
    };
  });

  const workOrderDetails: any = [];

  workOrders.forEach((w) => {
    const id = w._id + "";
    const productionSlips = productionSlipStore[id];
    const obj = {
      workOrder: w.finishItemName,
      workOrderNumber: w.orderNumber,
      quantity: w.orderQuantity,
      productionSlips,
    };
    workOrderDetails.push(obj);
  });

  resp.status(200).json({
    success: true,
    message: "Getting data successfully.",
    workOrderDetails,
  });
};


// change process in workorder

export const updateProcessInWorkOrder = catchErrorAsync(async(req,resp,next)=>{
  const {id} = req.params;
  const {newProcessName,childPartId} = req.body;

  const newProcess = await globalProcessModel.findOne({processName:newProcessName});
  if(!newProcess){
    return resp.status(404).json({
      success:false,
      message:`process not found ${newProcessName}`
    })
  };

  const workOrder = await workOrderModel.findById(id);

  if(!workOrder){
    return resp.status(404).json({
      success:false,
      message:`Work order not found with id ${id}.`
    })
  };

  workOrder.masterBom.forEach((w)=>{
    
    if(w._id+"" === childPartId+""){
       w.process = newProcess.processName;
       w.processId = newProcess._id;
    }
  })
  await workOrder.save();

  const productionSlips = await ProductionSlipModel.find({workOrderId:workOrder._id,"part._id":childPartId}).lean();
  
  for(let i of productionSlips){
     const productionSlip = await ProductionSlipModel.findByIdAndUpdate(i._id,{"process.processId":newProcess._id , "process.processName":newProcess.processName});
  }

  resp.status(200).json({
    success:true,
    message:`Work order with number ${workOrder.orderNumber} updated.`,
    workOrder
  });
});




export const changeWorkOrderInProductionSlip = catchErrorAsync(async (req,resp,next)=>{


  const {oldWorkOrder,newWorkOrder} = req.body;
  const newOrder = await workOrderModel.findOne({_id:newWorkOrder});
  
  if(!newOrder){
     return resp.status(404).json({
      success:false,
      message:`work order not found.`
     });
  };
  const workOrderId = newOrder._id;

  const productionSlips = await ProductionSlipModel.find({workOrderId:oldWorkOrder});

  for(let p of productionSlips){

   await ProductionSlipModel.findByIdAndUpdate({_id : p._id} ,{workOrderId});

  }
  resp.status(200).json({
    success:true
  })

})