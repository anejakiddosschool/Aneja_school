const { Client, LocalAuth } = require("whatsapp-web.js");

let io = null;
let currentQrCode = null;

// Optimized Puppeteer flags
const puppeteerOptions = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu",
    "--single-process",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-extensions",
    "--disable-sync",
    "--metrics-recording-only",
    "--disable-default-apps",
  ],
};

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(), // caches session
  puppeteer: puppeteerOptions,
});

// QR Code event
client.on("qr", (qr) => {
  currentQrCode = qr;
  console.log("QR received, emitting to frontend");
  if (io) io.emit("qr", qr);
});

// Ready event
client.on("ready", () => {
  console.log("✅ WhatsApp client ready");
  if (io) io.emit("ready", "WhatsApp connected");
});

// Auth failure
client.on("auth_failure", (msg) => {
  console.error("Auth failure:", msg);
  if (io) io.emit("auth_failure", msg);
});

// Disconnected event
client.on("disconnected", (reason) => {
  console.log("WhatsApp disconnected:", reason);
  if (io) io.emit("disconnected", reason);
});

// Initialize client and socket.io instance
function initWhatsApp(ioInstance) {
  io = ioInstance;
  client.initialize();
}

// Send WhatsApp message (optimized formatting)
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const formattedPhone = phoneNumber.startsWith("+")
      ? phoneNumber.replace(/\D/g, "")
      : "91" + phoneNumber.replace(/\D/g, "");
    const chatId = `${formattedPhone}@c.us`;

    await client.sendMessage(chatId, message);
    console.log(`📩 Message sent to ${phoneNumber}`);
  } catch (error) {
    console.error("❌ Error sending WhatsApp message:", error.message);
    throw error;
  }
}

// Get latest QR
function getQrCode() {
  return currentQrCode;
}

module.exports = { initWhatsApp, client, sendWhatsAppMessage, getQrCode };



// const { Client, LocalAuth } = require("whatsapp-web.js");

// let io = null;
// let currentQrCode = null;

// const client = new Client({
//   authStrategy: new LocalAuth(),
//   puppeteer: {
//     headless: true,
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--disable-gpu",
//     ],
//   },
// });

// client.on("qr", (qr) => {
//   currentQrCode = qr; // store qr code for later retrieval
//   console.log("QR received, emitting to frontend");
//   if (io) io.emit("qr", qr);
// });

// client.on("ready", () => {
//   console.log("✅ WhatsApp client ready");
//   if (io) io.emit("ready", "WhatsApp connected");
// });

// client.on("auth_failure", (msg) => {
//   console.error("Auth failure:", msg);
//   if (io) io.emit("auth_failure", msg);
// });

// client.on("disconnected", (reason) => {
//   console.log("WhatsApp disconnected:", reason);
//   if (io) io.emit("disconnected", reason);
// });

// function initWhatsApp(ioInstance) {
//   io = ioInstance;
//   client.initialize();
// }

// async function sendWhatsAppMessage(phoneNumber, message) {
//   try {
//     const formattedPhone = phoneNumber.startsWith("+")
//       ? phoneNumber.replace(/\D/g, "")
//       : "91" + phoneNumber.replace(/\D/g, "");
//     const chatId = `${formattedPhone}@c.us`;

//     await client.sendMessage(chatId, message);
//     console.log(`📩 Message sent to ${phoneNumber}`);
//   } catch (error) {
//     console.error("❌ Error sending WhatsApp message:", error.message);
//     throw error;
//   }
// }

// function getQrCode() {
//   return currentQrCode;
// }

// module.exports = { initWhatsApp, client, sendWhatsAppMessage, getQrCode };
