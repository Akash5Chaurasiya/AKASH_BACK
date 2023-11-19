"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
const connectDb_1 = require("./database/connection/connectDb");
(0, dotenv_1.config)({ path: path_1.default.join(__dirname, "..", "public/.env") });
// addQRCodeToRandomEntries()1
// listen
const PORT = process.env.PORT || 5050;
app_1.server.listen(PORT, () => {
    (0, connectDb_1.connectDB)();
    const address = app_1.server.address();
    console.log(`Server and WebSocket Server running on ${JSON.stringify(address)}`);
});
//  new checking 
// app.listen(process.env.PORT,()=>{
//     //connecting database
//     
//     console.log(`server is running on port http://localhost:${process.env.PORT}`)
// })
