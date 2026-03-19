import { io } from "socket.io-client";
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";

export const socket = io(BACKEND, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
