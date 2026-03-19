// const pino = require("pino");
// const fs = require("fs");
// const path = require("path");

// let client = null;
// let io = null;
// let currentQrCode = null;
// let clientStatus = "connecting";

// const AUTH_FOLDER = "auth_info_baileys";

// // Helper function: To force clear session from disk completely
// function clearSessionData() {
//   try {
//     const sessionPath = path.resolve(process.cwd(), AUTH_FOLDER);
//     if (fs.existsSync(sessionPath)) {
//       fs.rmSync(sessionPath, { recursive: true, force: true });
//       console.log("🧹 Session data completely wiped out.");
//     }
//   } catch (err) {
//     console.error("Failed to clear session data:", err);
//   }
// }

// async function initWhatsApp(ioInstance) {
//   if (ioInstance) io = ioInstance;

//   try {
//     const baileysModule = await import("@whiskeysockets/baileys");
//     const makeWASocket = baileysModule.default?.default || baileysModule.default || baileysModule.makeWASocket;
//     const useMultiFileAuthState = baileysModule.useMultiFileAuthState;
//     const DisconnectReason = baileysModule.DisconnectReason;
//     const fetchLatestBaileysVersion = baileysModule.fetchLatestBaileysVersion;
//     const Browsers = baileysModule.Browsers;

//     if (!useMultiFileAuthState) {
//         throw new Error("useMultiFileAuthState could not be extracted.");
//     }

//     const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
//     const { version } = await fetchLatestBaileysVersion();

//     client = makeWASocket({
//       version,
//       auth: state,
//       printQRInTerminal: false,
//       logger: pino({ level: "silent" }), // keep silent so it doesn't spam
//       browser: Browsers.macOS("Desktop"),
//       syncFullHistory: false, // Save memory
//       markOnlineOnConnect: true // helps establish solid connection state
//     });

//     // 🌟 FIX 1: Ensure credentials are saved instantly upon update
//     client.ev.on("creds.update", saveCreds);

//     client.ev.on("connection.update", async (update) => {
//       const { connection, lastDisconnect, qr } = update;

//       // 🌟 FIX 2: Only show QR if we are actually NOT connected
//       if (qr && connection !== "open") {
//         currentQrCode = qr;
//         clientStatus = "qr";
//         console.log("QR Code generated.");
//         if (io) io.emit("qr", qr);
//       }

//       if (connection === "open") {
//         clientStatus = "connected";
//         currentQrCode = null; // Clear QR immediately
//         console.log("✅ WhatsApp successfully connected & synced!");
//         if (io) io.emit("ready", "WhatsApp connected");
//       }

//       if (connection === "close") {
//         // Find exact reason why it disconnected
//         const statusCode = lastDisconnect?.error?.output?.statusCode;
//         console.log(`Connection closed. Status code: ${statusCode}`);

//         // If it's explicitly a "logged out" event (like user removed it from phone)
//         const isLoggedOut = statusCode === DisconnectReason.loggedOut;

//         if (isLoggedOut) {
//           console.log("🚫 Logged out from WhatsApp completely.");
//           clientStatus = "disconnected";
//           currentQrCode = null;
          
//           if (io) io.emit("disconnected", "Session Logged Out");
          
//           clearSessionData(); // Force wipe folder
          
//           // Wait a moment then restart fresh
//           setTimeout(() => {
//               initWhatsApp(io);
//           }, 3000);
//         } else {
//           // If connection just dropped (internet issue, or Baileys internal restart)
//           console.log("Reconnecting automatically...");
//           clientStatus = "connecting";
          
//           // Reconnect without clearing auth so phone stays logged in
//           setTimeout(() => {
//               initWhatsApp(io);
//           }, 3000);
//         }
//       }
//     });

//   } catch (error) {
//     console.error("Failed to initialize WhatsApp (Baileys):", error);
//   }
// }

// async function logoutWhatsApp() {
//   console.log("Manual logout triggered...");
//   if (client) {
//     try {
//         // Sends actual logout signal to WhatsApp Server
//         await client.logout();
//         console.log("Logout signal sent to server.");
//     } catch(err) {
//         console.log("Logout signal error (ignored):", err.message);
//     }
//   }
  
//   // 🌟 FIX 3: Force kill connection and wipe disk session
//   clientStatus = "disconnected";
//   clearSessionData();
  
//   if (io) io.emit("disconnected", "Logged out manually");

//   // Restart client so it generates a fresh QR for next time
//   setTimeout(() => {
//      initWhatsApp(io);
//   }, 2000);
// }

// async function sendWhatsAppMessage(phoneNumber, message) {
//   if (clientStatus !== "connected" || !client) {
//     throw new Error("WhatsApp client not ready.");
//   }
//   const formattedPhone = phoneNumber.replace(/\D/g, "");
//   const jid = `${formattedPhone.startsWith("91") ? formattedPhone : "91" + formattedPhone}@s.whatsapp.net`;
  
//   await client.sendMessage(jid, { text: message });
//   console.log(`📩 Message sent to ${formattedPhone}`);
// }

// function getClient() {
//   return client;
// }

// module.exports = { 
//   initWhatsApp, 
//   sendWhatsAppMessage, 
//   getQrCode: () => currentQrCode, 
//   getClientStatus: () => clientStatus, 
//   logoutWhatsApp,
//   getClient
// };


const pino = require("pino");
const fs = require("fs");
const path = require("path");

let client = null;
let io = null;
let currentQrCode = null;
let clientStatus = "connecting";

const AUTH_FOLDER = "auth_info_baileys";

// Helper function: Wipes the session directory so that Baileys thinks it's a completely new login
function clearSessionData() {
  try {
    const sessionPath = path.resolve(process.cwd(), AUTH_FOLDER);
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log("🧹 Session data completely wiped out from disk.");
    }
  } catch (err) {
    console.error("Failed to clear session data:", err);
  }
}

async function initWhatsApp(ioInstance) {
  if (ioInstance) io = ioInstance;

  try {
    const baileysModule = await import("@whiskeysockets/baileys");
    const makeWASocket = baileysModule.default?.default || baileysModule.default || baileysModule.makeWASocket;
    const useMultiFileAuthState = baileysModule.useMultiFileAuthState;
    const DisconnectReason = baileysModule.DisconnectReason;
    const fetchLatestBaileysVersion = baileysModule.fetchLatestBaileysVersion;
    const Browsers = baileysModule.Browsers;

    if (!useMultiFileAuthState) {
        throw new Error("useMultiFileAuthState could not be extracted.");
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    client = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }), // Supress noisy logs
      browser: Browsers.macOS("Desktop"),
      syncFullHistory: false, 
      markOnlineOnConnect: true,
      defaultQueryTimeoutMs: 60000 // Thoda time extra dete hain sync k liye
    });

    client.ev.on("creds.update", saveCreds);

    // Ye flag connection loop issue ko rokk dega
    let isConnected = false; 

    client.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Agar successfully connected hai, to kisi bhi haal me aage QR generate nahi hone dena
      if (connection === "open") {
        isConnected = true;
        clientStatus = "connected";
        currentQrCode = null;
        console.log("✅ WhatsApp successfully connected & synced!");
        if (io) io.emit("ready", "WhatsApp connected");
      }

      // QR tabhi handle hoga jab hum actually connected nahi hain
      if (qr && !isConnected) {
        currentQrCode = qr;
        clientStatus = "qr";
        console.log("QR Code generated for scanning.");
        if (io) io.emit("qr", qr);
      }

      if (connection === "close") {
        isConnected = false; // Connection band hua, to flag wapas false karo
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.log(`Connection closed. Status code: ${statusCode}`);

        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        // Agar user ne phone se "Log out" dabaya ho
        if (isLoggedOut) {
          console.log("🚫 Logged out from WhatsApp completely.");
          clientStatus = "disconnected";
          currentQrCode = null;
          
          if (io) io.emit("disconnected", "Session Logged Out");
          
          clearSessionData();
          
          // Wait for local cleanup before asking for a new QR loop
          setTimeout(() => {
              initWhatsApp(io);
          }, 3000);
        } else {
          // Drops ya reconnecting events (408, 503, 428 etc.)
          console.log("Reconnecting automatically without dropping auth state...");
          clientStatus = "connecting";
          
          // Automatic reconnect Baileys khud nahi kar pata achhe se, hum invoke kr rhe hn
          setTimeout(() => {
              initWhatsApp(io);
          }, 3000);
        }
      }
    });

  } catch (error) {
    console.error("Failed to initialize WhatsApp (Baileys):", error);
  }
}

async function logoutWhatsApp() {
  console.log("Manual logout triggered from Frontend...");
  
  if (client) {
    try {
        // Send true un-pairing command to phone server. Await properly
        await client.logout();
        console.log("Logout signal delivered and confirmed by server.");
    } catch(err) {
        console.log("Logout signal soft error (continuing local cleanup):", err.message);
    }
  }
  
  // Wipe session from disk so it forgets memory logic
  clientStatus = "disconnected";
  currentQrCode = null;
  clearSessionData();
  
  if (io) io.emit("disconnected", "Logged out manually");

  // Give enough time for server to clear out, then fetch fresh QR
  setTimeout(() => {
     initWhatsApp(io);
  }, 3000);
}

async function sendWhatsAppMessage(phoneNumber, message) {
  if (clientStatus !== "connected" || !client) {
    throw new Error("WhatsApp client not ready.");
  }
  
  const formattedPhone = phoneNumber.replace(/\D/g, "");
  const jid = `${formattedPhone.startsWith("91") ? formattedPhone : "91" + formattedPhone}@s.whatsapp.net`;
  
  await client.sendMessage(jid, { text: message });
  console.log(`📩 Message sent to ${formattedPhone}`);
}

function getClient() {
  return client;
}

module.exports = { 
  initWhatsApp, 
  sendWhatsAppMessage, 
  getQrCode: () => currentQrCode, 
  getClientStatus: () => clientStatus, 
  logoutWhatsApp,
  getClient
};

