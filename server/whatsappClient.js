// const { Client, LocalAuth } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');

// const client = new Client({
//   authStrategy: new LocalAuth(),
//   puppeteer: { headless: true }
// });

// client.on('qr', qr => {
//   qrcode.generate(qr, { small: true });
//   console.log('Scan the QR code above with WhatsApp mobile app.');
// });

// client.on('ready', () => {
//   console.log('WhatsApp client is ready!');
// });

// client.initialize();

// async function sendWhatsAppMessage(phoneNumber, message) {
//   try {
//     const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber.replace(/\D/g, '') : '91' + phoneNumber.replace(/\D/g, '');
//     const chatId = `${formattedPhone}@c.us`;
//     await client.sendMessage(chatId, message);
//   } catch (error) {
//     console.error('Error sending WhatsApp message:', error);
//     throw error;
//   }
// }

// module.exports = { client, sendWhatsAppMessage };


const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const puppeteer = require('puppeteer');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    executablePath: puppeteer.executablePath(), // use Puppeteer's Chromium
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu"
    ]
  }
});

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
  console.log('Scan the QR code above with WhatsApp mobile app.');
});

client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
});

client.initialize();

async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber.replace(/\D/g, '')
      : '91' + phoneNumber.replace(/\D/g, '');
    const chatId = `${formattedPhone}@c.us`;

    await client.sendMessage(chatId, message);
    console.log(`📩 Message sent to ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error.message);
    throw error;
  }
}

module.exports = { client, sendWhatsAppMessage };
