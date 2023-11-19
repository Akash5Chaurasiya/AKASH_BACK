import express from "express"
import { addGlobalProcess, deleteGlobalProcess, getAllGlobalProcess, getGlobalProcess, updateGlobalProcess } from "../controllers/bomControllers/globalProcessController";
const globalProcessRouter = express.Router()

globalProcessRouter.route("/").post(getAllGlobalProcess);  // added shop WIse filter and name search where search by processName , code or shopName
globalProcessRouter.route("/add").post(addGlobalProcess);
globalProcessRouter.route("/:id").delete(deleteGlobalProcess).patch(updateGlobalProcess).get(getGlobalProcess);

export default globalProcessRouter;
