import express from "express";
import { getAllInventoryByWorkOrder, getDataInventory } from "../controllers/bomControllers/InventoryController";


const inventoryRouter = express.Router();


// get inventory data
inventoryRouter.route("/").post(getDataInventory);

// inventory 
inventoryRouter.route("/workOrder").post(getAllInventoryByWorkOrder);

// // testing
// inventoryRouter.route("/testing").get(testing);
// inventoryRouter.route("/").post();


export default inventoryRouter;