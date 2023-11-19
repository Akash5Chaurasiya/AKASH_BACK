import app, { server } from "./app";
import { config } from "dotenv";
import path from "path";
import { connectDB } from "./database/connection/connectDb";
import addQRCodeToRandomEntries from "./generateQRCode";

config({path:path.join(__dirname, "..", "public/.env")})







// addQRCodeToRandomEntries()1
// listen
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
    connectDB();
    const address = server.address();
    console.log(`Server and WebSocket Server running on ${JSON.stringify(address)}`);
});
//  new checking 
// app.listen(process.env.PORT,()=>{
//     //connecting database
//     
//     console.log(`server is running on port http://localhost:${process.env.PORT}`)
// })