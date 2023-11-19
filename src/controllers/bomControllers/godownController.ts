import GodownModel from "../../database/models/godownModel";
import { Request, Response } from "express";
import catchErrorAsync from "../../utils/catchAsyncError";
import ChildPartModel from "../../database/models/childPartModel";

// add godown
export const addGodown = catchErrorAsync(
  async (req: Request, resp: Response) => {
    let { godownName, godownCode } = req.body;

    godownName = godownName.trim();
    godownCode = godownCode.trim();
    
    
    const godown = await GodownModel.create({ godownName, godownCode });
    return resp.status(201).json({
      success: true,
      message: "Godown created successfully",
      godown
    });
  }
);

// delete godown
export const deleteGodown = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;

    const Godown = await GodownModel.findById(id);

    if (!Godown) {
      return resp.status(404).json({
        success: false,
        message: `Godown with id ${id} not found.`,
      });
    }
    const godownId = Godown._id + "";

    const childParts = await ChildPartModel.find().lean();

    const foundArray: string[] = [];
    childParts.forEach((c) => {
      const id = c.productionGodown + "";
      if (godownId == id) {
        const string = `Child Part ${c.partName} in Production using this ${Godown.godownName} .`;
        foundArray.push(string);
      }
      c.consumedItem.forEach((i) => {
        const id = i.consumptionGodown + "";
        if (godownId == id) {
          const string = `Child Part ${c.partName}'s part ${i.itemName} consumption godown using this ${Godown.godownName} .`;
          foundArray.push(string);
        }
      });
    });

    if (foundArray.length > 0) {
      return resp.status(405).json({
        success: false,
        message: "Found Godown somewhere",
        foundArray,
      });
    } else {
      await GodownModel.findByIdAndDelete(id);

      return resp.status(202).json({
        success: true,
        message: `${Godown.godownName} deleted successfully.`,
      });
    }
  }
);

// get all godown
export const getAllGodown = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { name, sort } = req.query;
    const query: any = {};

    if (name) {
      query.$or = [
        { godownName: { $regex: name, $options: "i" } },
        { godownCode: { $regex: name, $options: "i" } },
      ];
    }
    let allGodown;
    if (sort) {
      if (sort === "asc") {
        allGodown = await GodownModel.find({ ...query })
          .sort({ godownName: 1 })
          .lean();
      } else if (sort === "dec") {
        allGodown = await GodownModel.find({ ...query })
          .sort({ godownName: -1 })
          .lean();
      } else {
        allGodown = await GodownModel.find({ ...query })
          .sort({ godownName: 1 })
          .lean();
      }
    } else {
      allGodown = await GodownModel.find({ ...query }).lean();
    }

    return resp.status(200).json({
      success: true,
      message: "Getting all godown successfully",
      allgodown: allGodown,
    });
  }
);

export const getGodown = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const godown = await GodownModel.findById(id);
    return resp.status(201).json({
      success: true,
      message: "Getting godown successfully",
      godown: godown,
    });
  }
);

export const updateGodown = catchErrorAsync(
  async (req: Request, resp: Response) => {
    const { id } = req.params;
    const { godownName, godownCode } = req.body;
    const godown = await GodownModel.findByIdAndUpdate(
      { _id: id },
      { godownName, godownCode }
    );
    return resp.status(201).json({
      success: true,
      message: "Getting godown successfully",
      godown: godown,
    });
  }
);
