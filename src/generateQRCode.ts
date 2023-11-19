
import qr from 'qrcode';
import BarCode from './database/models/barCodeModel';


async function addQRCodeToRandomEntries() {
    for (let i = 0; i < 500; i++) {
      const employeeNumber = i + 1;
      let qrCodeData = `EmployeeNumber: ${String(employeeNumber).padStart(4, '0')}`;
      let qrCodeImage = await generateUniqueQRCode(qrCodeData);
  
      await BarCode.create({ employeeNumber, barCode: qrCodeImage });
    }
  
    console.log('Random entries with QR codes created successfully.');
  }
  
  async function generateUniqueQRCode(qrCodeData: string): Promise<string> {
    let qrCodeImage = await qr.toDataURL(qrCodeData);
    let isDuplicate = await BarCode.exists({ barCode: qrCodeImage });
  
    while (isDuplicate) {
      qrCodeData = generateRandomQRCodeData();
      qrCodeImage = await qr.toDataURL(qrCodeData);
      isDuplicate = await BarCode.exists({ barCode: qrCodeImage });
    }
  
    return qrCodeImage;
  }
  
  function generateRandomQRCodeData(): string {
    // Implement your logic to generate random QR code data
    // This can be based on any specific requirements or patterns you want to follow
    // For example, you can generate a random string or include some random data based on your needs
    return 'RandomQRCodeData';
  }

export default addQRCodeToRandomEntries
