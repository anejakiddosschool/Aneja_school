

// const pino = require("pino");
// const fs = require("fs");
// const path = require("path");

// let client = null;
// let io = null;
// let currentQrCode = null;
// let clientStatus = "connecting";

// const AUTH_FOLDER = "auth_info_baileys";

// // Helper function: Wipes the session directory so that Baileys thinks it's a completely new login
// function clearSessionData() {
//   try {
//     const sessionPath = path.resolve(process.cwd(), AUTH_FOLDER);
//     if (fs.existsSync(sessionPath)) {
//       fs.rmSync(sessionPath, { recursive: true, force: true });
//       console.log("🧹 Session data completely wiped out from disk.");
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
//       logger: pino({ level: "silent" }), // Supress noisy logs
//       browser: Browsers.macOS("Desktop"),
//       syncFullHistory: false, 
//       markOnlineOnConnect: true,
//       defaultQueryTimeoutMs: 60000 // Thoda time extra dete hain sync k liye
//     });

//     client.ev.on("creds.update", saveCreds);

//     // Ye flag connection loop issue ko rokk dega
//     let isConnected = false; 

//     client.ev.on("connection.update", async (update) => {
//       const { connection, lastDisconnect, qr } = update;

//       // Agar successfully connected hai, to kisi bhi haal me aage QR generate nahi hone dena
//       if (connection === "open") {
//         isConnected = true;
//         clientStatus = "connected";
//         currentQrCode = null;
//         console.log("✅ WhatsApp successfully connected & synced!");
//         if (io) io.emit("ready", "WhatsApp connected");
//       }

//       // QR tabhi handle hoga jab hum actually connected nahi hain
//       if (qr && !isConnected) {
//         currentQrCode = qr;
//         clientStatus = "qr";
//         console.log("QR Code generated for scanning.");
//         if (io) io.emit("qr", qr);
//       }

//       if (connection === "close") {
//         isConnected = false; // Connection band hua, to flag wapas false karo
//         const statusCode = lastDisconnect?.error?.output?.statusCode;
//         console.log(`Connection closed. Status code: ${statusCode}`);

//         const isLoggedOut = statusCode === DisconnectReason.loggedOut;

//         // Agar user ne phone se "Log out" dabaya ho
//         if (isLoggedOut) {
//           console.log("🚫 Logged out from WhatsApp completely.");
//           clientStatus = "disconnected";
//           currentQrCode = null;
          
//           if (io) io.emit("disconnected", "Session Logged Out");
          
//           clearSessionData();
          
//           // Wait for local cleanup before asking for a new QR loop
//           setTimeout(() => {
//               initWhatsApp(io);
//           }, 3000);
//         } else {
//           // Drops ya reconnecting events (408, 503, 428 etc.)
//           console.log("Reconnecting automatically without dropping auth state...");
//           clientStatus = "connecting";
          
//           // Automatic reconnect Baileys khud nahi kar pata achhe se, hum invoke kr rhe hn
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
//   console.log("Manual logout triggered from Frontend...");
  
//   if (client) {
//     try {
//         // Send true un-pairing command to phone server. Await properly
//         await client.logout();
//         console.log("Logout signal delivered and confirmed by server.");
//     } catch(err) {
//         console.log("Logout signal soft error (continuing local cleanup):", err.message);
//     }
//   }
  
//   // Wipe session from disk so it forgets memory logic
//   clientStatus = "disconnected";
//   currentQrCode = null;
//   clearSessionData();
  
//   if (io) io.emit("disconnected", "Logged out manually");

//   // Give enough time for server to clear out, then fetch fresh QR
//   setTimeout(() => {
//      initWhatsApp(io);
//   }, 3000);
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
const path = require("path");
const mongoose = require("mongoose");
const WhatsAppAuth = require("./models/WhatsAppAuth"); // 🌟 Naya DB Model Import

let client = null;
let io = null;
let currentQrCode = null;
let clientStatus = "connecting";

// Helper function: Wipes the session completely from MongoDB Database
async function clearSessionData() {
  try {
    await WhatsAppAuth.deleteMany({});
    console.log("🧹 Session data completely wiped out from MongoDB.");
  } catch (err) {
    console.error("Failed to clear session data from DB:", err);
  }
}

async function initWhatsApp(ioInstance) {
  if (ioInstance) io = ioInstance;

  try {
    const baileysModule = await import("@whiskeysockets/baileys");
    const makeWASocket = baileysModule.default?.default || baileysModule.default || baileysModule.makeWASocket;
    const DisconnectReason = baileysModule.DisconnectReason;
    const fetchLatestBaileysVersion = baileysModule.fetchLatestBaileysVersion;
    const Browsers = baileysModule.Browsers;
    // BufferJSON aur proto ko directly module se nikala for MongoDB handling
    const { proto, BufferJSON, initAuthCreds } = baileysModule;

    // =========================================================
    // 🌟 CUSTOM MONGODB AUTH ADAPTER FOR BAILEYS 🌟
    // =========================================================
    async function useMongoDBAuthState() {
        const writeData = async (data, id) => {
            const informationToStore = JSON.stringify(data, BufferJSON.replacer);
            await WhatsAppAuth.updateOne(
                { _id: id },
                { $set: { data: informationToStore } },
                { upsert: true }
            );
        };

        const readData = async (id) => {
            try {
                const doc = await WhatsAppAuth.findOne({ _id: id });
                if (doc && doc.data) {
                    return JSON.parse(doc.data, BufferJSON.reviver);
                }
                return null;
            } catch (error) {
                return null;
            }
        };

        const removeData = async (id) => {
            try {
                await WhatsAppAuth.deleteOne({ _id: id });
            } catch (error) {}
        };

        const creds = (await readData('creds')) || initAuthCreds();

        return {
            state: {
                creds,
                keys: {
                    get: async (type, ids) => {
                        const data = {};
                        await Promise.all(
                            ids.map(async (id) => {
                                let value = await readData(`${type}-${id}`);
                                if (type === 'app-state-sync-key' && value) {
                                    value = proto.Message.AppStateSyncKeyData.fromObject(value);
                                }
                                data[id] = value;
                            })
                        );
                        return data;
                    },
                    set: async (data) => {
                        const tasks = [];
                        for (const category in data) {
                            for (const id in data[category]) {
                                const value = data[category][id];
                                const key = `${category}-${id}`;
                                if (value) {
                                    tasks.push(writeData(value, key));
                                } else {
                                    tasks.push(removeData(key));
                                }
                            }
                        }
                        await Promise.all(tasks);
                    }
                }
            },
            saveCreds: () => {
                return writeData(creds, 'creds');
            }
        };
    }

    // Call custom Auth
    const { state, saveCreds } = await useMongoDBAuthState();
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
        console.log("✅ WhatsApp successfully connected & synced to MongoDB!");
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
          
          // MongoDB clear karein
          await clearSessionData();
          
          // Wait for local cleanup before asking for a new QR loop
          setTimeout(() => {
              initWhatsApp(io);
          }, 3000);
        } else {
          // Drops ya reconnecting events (408, 503, 428 etc.)
          console.log("Reconnecting automatically without dropping auth state...");
          clientStatus = "connecting";
          
          // Automatic reconnect
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
        // Send true un-pairing command to phone server.
        await client.logout();
        console.log("Logout signal delivered and confirmed by server.");
    } catch(err) {
        console.log("Logout signal soft error (continuing local cleanup):", err.message);
    }
  }
  
  // Wipe session from DB
  clientStatus = "disconnected";
  currentQrCode = null;
  await clearSessionData();
  
  if (io) io.emit("disconnected", "Logged out manually");

  // Fetch fresh QR
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
