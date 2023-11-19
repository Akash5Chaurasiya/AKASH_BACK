import mongoose, { Document } from "mongoose";

interface customerDocument extends Document {
  customerName: string;
  code: string;
  date: Date;
}
export default customerDocument;
