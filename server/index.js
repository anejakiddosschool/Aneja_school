require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("./config/webPushConfig");
const { initWhatsApp } = require("./whatsappClient");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const User = require("./models/User");

// --- 1. Import ALL your routes first ---
const studentRoutes = require("./routes/studentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const gradeRoutes = require("./routes/gradeRoutes");
const reportRoutes = require("./routes/behavioralReportRoutes");
const authRoutes = require("./routes/authRoutes");
const rankRoutes = require("./routes/rankRoutes");
const rosterRoutes = require("./routes/rosterRoutes");
const assessmentTypeRoutes = require("./routes/assessmentTypeRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const studentAuthRoutes = require("./routes/studentAuthRoutes");
const notificationsRoutes = require("./routes/notificationRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const customMessageRoutes = require("./routes/customMessageRoutes");
const personalMessageRoutes = require("./routes/personalMessageRoutes");

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONT_URL,
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();
io.on("connection", (socket) => {
  socket.on("addNewUser", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("addParentUser", (studentId) => {
    onlineUsers.set(studentId, socket.id);
  });

  socket.on("disconnect", () => {
    onlineUsers.forEach((socketId, userId) => {
      if (socketId === socket.id) onlineUsers.delete(userId);
    });
  });
});
// initialize WhatsApp client (after Socket.IO is ready)
  initWhatsApp(io);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/students", studentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/ranks", rankRoutes);
app.use("/api/rosters", rosterRoutes);
app.use("/api/assessment-types", assessmentTypeRoutes);
app.use("/api/student-auth", studentAuthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/whatsapp", customMessageRoutes);
app.use("/api/whatsapp", personalMessageRoutes);
const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("Admin user already exists. Seeding not required.");
      return;
    }

    console.log("No admin user found. Creating default admin...");

    await User.create({
      fullName: "Default Admin",
      username: process.env.ADMIN_USERNAME || "admin",
      password: process.env.ADMIN_PASSWORD || "admin@123",
      role: "admin",
    });

    console.log("Default admin user created successfully!");
  } catch (error) {
    console.error("Error during admin user seeding:", error);
  }
};

const PORT = process.env.PORT || 5001;
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  seedAdminUser();
});

app.set("socketio", io);
app.set("onlineUsers", onlineUsers);
