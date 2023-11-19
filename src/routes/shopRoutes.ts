import express from "express";
import { addShop, deleteShop, getAllShop, getSingleShop, updateShop } from "../controllers/bomControllers/shopController";

const shopRouter = express.Router();

shopRouter.route("/add").post(addShop);

shopRouter.route("/").get(getAllShop);

shopRouter.route("/:id").get(getSingleShop).patch(updateShop).delete(deleteShop);



export default shopRouter;