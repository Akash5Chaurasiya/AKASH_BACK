import mongoose from "mongoose";
import { adminSchema } from "../schemas/adminSchema";
import { AdminDocument } from "../entities/adminDocument";

const AdminModel = mongoose.model<AdminDocument>("Admin",adminSchema);

export default AdminModel;