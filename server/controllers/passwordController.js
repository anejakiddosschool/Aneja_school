// server/controllers/passwordController.js
// WhatsApp-OTP based account recovery for STAFF (User model) and PARENTS (Student model).
//
//   accountType: "staff"  -> User.phoneNumber
//   accountType: "parent" -> Student.parentContact.phone (logs in with studentId)
//
// Security:
//   - OTP stored as SHA-256 hash, never plain text
//   - 10 min expiry, max 5 attempts
//   - 60s resend cooldown, max 3 OTPs/hour per phone
//   - Generic responses (no account enumeration)
//   - Siblings sharing a phone: password reset requires explicit studentId selection

const crypto = require("crypto");
const User = require("../models/User");
const Student = require("../models/Student");
const { sendWhatsAppMessage } = require("../whatsappClient");

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTPS_PER_HOUR = 3;

// phone -> { hash, expiresAt, attempts, purpose, accountType, lastSentAt, hourlyCount, hourStart }
const otpStore = new Map();

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "");
const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

const cleanupStore = () => {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) otpStore.delete(key);
  }
};

const GENERIC_OK =
  "If this number is registered, an OTP has been sent on WhatsApp.";

// @route  POST /api/auth/forgot/send-otp
// @body   { phoneNumber, purpose: "username"|"password", accountType: "staff"|"parent" }
exports.sendOtp = async (req, res) => {
  try {
    cleanupStore();

    const phone = normalizePhone(req.body.phoneNumber);
    const purpose = req.body.purpose === "username" ? "username" : "password";
    const accountType = req.body.accountType === "parent" ? "parent" : "staff";

    if (phone.length < 10) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid phone number." });
    }

    // Resolve the account behind this phone
    let accountLabel = "";
    if (accountType === "staff") {
      const user = await User.findOne({ phoneNumber: phone });
      if (!user) return res.status(200).json({ success: true, message: GENERIC_OK });
      accountLabel = user.fullName;
    } else {
      const students = await Student.find({ "parentContact.phone": phone }).limit(5);
      if (students.length === 0)
        return res.status(200).json({ success: true, message: GENERIC_OK });
      // Siblings: same OTP works; the exact account is picked at the final step
      accountLabel = students[0].fullName + (students.length > 1 ? ` (+${students.length - 1} more)` : "");
    }

    const now = Date.now();
    const existing = otpStore.get(phone + accountType);

    if (existing && now - existing.lastSentAt < SEND_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        message: "Please wait a minute before requesting another OTP.",
      });
    }

    const hourlyCount =
      existing && now - existing.hourStart < 60 * 60 * 1000 ? existing.hourlyCount : 0;
    if (hourlyCount >= MAX_OTPS_PER_HOUR) {
      return res.status(429).json({
        success: false,
        message: "Too many OTP requests. Please try again after an hour.",
      });
    }

    const code = String(crypto.randomInt(100000, 999999));

    otpStore.set(phone + accountType, {
      hash: hashCode(code),
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      purpose,
      accountType,
      lastSentAt: now,
      hourlyCount: hourlyCount + 1,
      hourStart: existing && now - existing.hourStart < 60 * 60 * 1000 ? existing.hourStart : now,
    });

    const msg =
      `🔐 *Aneja Kiddos School*\n\n` +
      `Your one-time verification code is:\n\n*${code}*\n\n` +
      `Valid for 10 minutes. Never share this code with anyone.\n\n` +
      (purpose === "username"
        ? accountType === "parent"
          ? "You requested the Student ID(s) linked to this number."
          : "You requested your username."
        : "You requested a password reset.");

    await sendWhatsAppMessage(phone, msg);

    return res.status(200).json({
      success: true,
      message: "OTP sent on WhatsApp. It is valid for 10 minutes.",
      _account: accountLabel ? "found" : "unknown", // hint only, no PII leaked
    });
  } catch (error) {
    console.error("sendOtp error:", error.message);
    const isWaDown = /not ready/i.test(error.message || "");
    return res.status(isWaDown ? 503 : 500).json({
      success: false,
      message: isWaDown
        ? "WhatsApp gateway is offline. Please ask the admin to connect it from the dashboard."
        : "Could not send OTP. Please try again.",
    });
  }
};

const verifyOtpInternal = (key, code) => {
  cleanupStore();
  const entry = otpStore.get(key);
  if (!entry) return { ok: false, reason: "No OTP requested. Please request a new code." };

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return { ok: false, reason: "OTP expired. Please request a new code." };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { ok: false, reason: "Too many wrong attempts. Please request a new code." };
  }

  if (entry.hash !== hashCode(code)) {
    entry.attempts += 1;
    return { ok: false, reason: "Incorrect OTP. Please try again." };
  }

  return { ok: true, entry };
};

// @route  POST /api/auth/forgot/recover-username
// @body   { phoneNumber, otp, accountType }
// Staff  -> returns username.  Parent -> returns linked studentId(s).
exports.recoverUsername = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phoneNumber);
    const code = String(req.body.otp || "").trim();
    const accountType = req.body.accountType === "parent" ? "parent" : "staff";
    const key = phone + accountType;

    const result = verifyOtpInternal(key, code);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    if (accountType === "staff") {
      const user = await User.findOne({ phoneNumber: phone });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "No staff account found for this number." });
      }
      otpStore.delete(key);
      return res.status(200).json({
        success: true,
        username: user.username,
        fullName: user.fullName,
        message: "Username recovered successfully.",
      });
    }

    // Parent: return all student IDs linked to this phone (siblings supported)
    const students = await Student.find({ "parentContact.phone": phone }).select(
      "studentId fullName"
    );
    if (students.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No student account found for this number." });
    }
    otpStore.delete(key);
    return res.status(200).json({
      success: true,
      parentMode: true,
      accounts: students.map((s) => ({ studentId: s.studentId, fullName: s.fullName })),
      username: students[0].studentId, // backward-friendly single value
      fullName: students[0].fullName,
      message: "Student ID(s) recovered successfully.",
    });
  } catch (error) {
    console.error("recoverUsername error:", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};

// @route  POST /api/auth/forgot/reset-password
// @body   { phoneNumber, otp, newPassword, accountType, studentId? }
exports.resetPassword = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phoneNumber);
    const code = String(req.body.otp || "").trim();
    const { newPassword, studentId } = req.body;
    const accountType = req.body.accountType === "parent" ? "parent" : "staff";
    const key = phone + accountType;

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const result = verifyOtpInternal(key, code);
    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    let account;
    if (accountType === "staff") {
      account = await User.findOne({ phoneNumber: phone }).select("+password");
      if (!account) {
        return res
          .status(404)
          .json({ success: false, message: "No staff account found for this number." });
      }
      account.password = newPassword;
      await account.save();
    } else {
      let students = await Student.find({ "parentContact.phone": phone }).select("+password");

      if (students.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No student account found for this number." });
      }

      // Siblings share a phone — require an explicit choice
      if (students.length > 1 && !studentId) {
        return res.status(409).json({
          success: false,
          needsStudentId: true,
          accounts: students.map((s) => ({ studentId: s.studentId, fullName: s.fullName })),
          message: "Multiple students are linked to this number. Please select the student.",
        });
      }

      account = studentId
        ? students.find((s) => s.studentId === studentId)
        : students[0];
      if (!account) {
        return res
          .status(404)
          .json({ success: false, message: "Selected student does not match this number." });
      }

      account.password = newPassword;
      account.isInitialPassword = false; // OTP-verified reset should not force another change
      await account.save();
    }

    otpStore.delete(key);

    // Security alert on WhatsApp
    try {
      await sendWhatsAppMessage(
        phone,
        `🔔 *Aneja Kiddos School*\n\nPassword for *${accountType === "staff" ? account.username : account.studentId}* was just reset successfully.\n\nIf this was NOT you, contact the school immediately.`
      );
    } catch (e) {
      console.log("Password-change notification skipped:", e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("resetPassword error:", error.message);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
};
