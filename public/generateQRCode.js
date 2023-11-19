"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const qrcode_1 = __importDefault(require("qrcode"));
const barCodeModel_1 = __importDefault(require("./database/models/barCodeModel"));
async function addQRCodeToRandomEntries() {
    for (let i = 0; i < 500; i++) {
        const employeeNumber = i + 1;
        let qrCodeData = `EmployeeNumber: ${String(employeeNumber).padStart(4, '0')}`;
        let qrCodeImage = await generateUniqueQRCode(qrCodeData);
        await barCodeModel_1.default.create({ employeeNumber, barCode: qrCodeImage });
    }
    console.log('Random entries with QR codes created successfully.');
}
async function generateUniqueQRCode(qrCodeData) {
    let qrCodeImage = await qrcode_1.default.toDataURL(qrCodeData);
    let isDuplicate = await barCodeModel_1.default.exists({ barCode: qrCodeImage });
    while (isDuplicate) {
        qrCodeData = generateRandomQRCodeData();
        qrCodeImage = await qrcode_1.default.toDataURL(qrCodeData);
        isDuplicate = await barCodeModel_1.default.exists({ barCode: qrCodeImage });
    }
    return qrCodeImage;
}
function generateRandomQRCodeData() {
    // Implement your logic to generate random QR code data
    // This can be based on any specific requirements or patterns you want to follow
    // For example, you can generate a random string or include some random data based on your needs
    return 'RandomQRCodeData';
}
exports.default = addQRCodeToRandomEntries;
