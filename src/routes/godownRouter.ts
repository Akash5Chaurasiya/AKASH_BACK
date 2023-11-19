import express from "express"
import { addGodown, deleteGodown, getAllGodown, getGodown, updateGodown } from "../controllers/bomControllers/godownController";
const godownRouter = express.Router()

godownRouter.route("/").get(getAllGodown);
godownRouter.route("/add").post(addGodown);
godownRouter.route("/:id").get(getGodown).delete(deleteGodown).patch(updateGodown);

export default godownRouter
