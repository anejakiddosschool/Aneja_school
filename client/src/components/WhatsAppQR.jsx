// frontend/src/WhatsAppQR.jsx
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { QRCodeCanvas } from "qrcode.react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://3.95.220.206:5001";
const socket = io(BACKEND);

export default function WhatsAppQR() {
  const [qr, setQr] = useState("");
  const [status, setStatus] = useState("Waiting for QR...");

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("qr", (qrString) => {
      setQr(qrString);
      setStatus("Scan this QR with WhatsApp");
    });

    socket.on("ready", (msg) => {
      setQr("");
      setStatus(msg || "WhatsApp connected");
    });

    socket.on("auth_failure", (msg) => {
      setStatus("Auth failure — check server logs");
      console.error("auth_failure:", msg);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.off("qr");
      socket.off("ready");
      socket.off("auth_failure");
    };
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h2>{status}</h2>
      {qr ? (
        <div style={{ display: "inline-block", padding: 12, border: "1px solid #eee" }}>
          <QRCodeCanvas value={qr} size={280} />
        </div>
      ) : null}
    </div>
  );
}
