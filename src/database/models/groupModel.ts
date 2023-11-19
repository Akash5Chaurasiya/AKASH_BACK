import mongoose, { model } from "mongoose";

import { groupSchema } from "../schemas/groupSchema";
import { groupDocument } from "../entities/groupDocument";

const groupModel = model<groupDocument>("Group", groupSchema);
export default groupModel;

