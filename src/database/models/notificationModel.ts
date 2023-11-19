import mongoose, { model } from "mongoose";
import { NotificationDocument } from "../entities/notificationDocument";
import { notificationSchema } from "../schemas/notificationSchema";

const notificationModel = model<NotificationDocument>("Notification", notificationSchema);
export default notificationModel;