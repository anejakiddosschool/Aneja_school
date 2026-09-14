// src/pages/ForgotPasswordPage.jsx
// WhatsApp-OTP based account recovery for BOTH staff and parents.
// Staff: recover username / reset password (User.phoneNumber)
// Parents: recover Student ID / reset password (Student.parentContact.phone)
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const ForgotPasswordPage = () => {
  const [accountType, setAccountType] = useState("staff"); // "staff" | "parent"
  const [mode, setMode] = useState("password"); // "password" | "username"
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: done
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [result, setResult] = useState(null); // { username, fullName, accounts[] }
  const [pendingStudentId, setPendingStudentId] = useState(""); // sibling picker
  const otpRefs = useRef([]);

  // ---- OTP input handling ----
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length) {
      e.preventDefault();
      setOtp(pasted.padEnd(6, "").split("").slice(0, 6));
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const t = setInterval(() => {
      setResendTimer((s) => {
        if (s <= 1) clearInterval(t);
        return s - 1;
      });
    }, 1000);
  };

  // ---- Step 1: send OTP ----
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (phoneNumber.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot/send-otp`, {
        phoneNumber,
        purpose: mode,
        accountType,
      });
      toast.success("OTP sent on WhatsApp! Check your messages.");
      setStep(2);
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 2 actions ----
  const handleRecoverUsername = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/forgot/recover-username`, {
        phoneNumber,
        otp: code,
        accountType,
      });
      setResult(res.data);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (studentIdOverride) => {
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit OTP.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/forgot/reset-password`, {
        phoneNumber,
        otp: code,
        newPassword,
        accountType,
        studentId: studentIdOverride || undefined,
      });
      if (res.data.needsStudentId) {
        // Siblings detected — show picker, keep OTP state intact
        setResult({ accounts: res.data.accounts });
        toast("Multiple students found. Please select the student.", { icon: "👨‍👩‍👧‍👦" });
        setLoading(false);
        return;
      }
      toast.success("Password reset successfully! Please log in.");
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 font-medium focus:outline-none focus:bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";
  const btnClass =
    "w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-violet-200/50 disabled:opacity-60 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-violet-50/30 to-white p-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="bg-white/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] w-full max-w-md border border-gray-100 relative">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-400 flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-violet-200/50">
            {step === 3 ? "✅" : "🔐"}
          </div>
          <h2 className="text-2xl font-black text-gray-900">
            {step === 1 && "Account Recovery"}
            {step === 2 && (mode === "password" ? "Set New Password" : "Verify OTP")}
            {step === 3 &&
              (mode === "password" ? "All Done!" : accountType === "parent" ? "Student ID(s)" : "Here's Your Username")}
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-1">
            {step === 1 && "Verify via WhatsApp OTP"}
            {step === 2 && `Code sent to +91 ${phoneNumber.slice(-10)}`}
            {step === 3 && "You can log in now"}
          </p>
        </div>

        {/* ---------- STEP 1 ---------- */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            {/* Account type selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("staff")}
                className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all ${
                  accountType === "staff"
                    ? "bg-violet-50 border-violet-300 text-violet-700 shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                👩‍🏫 Staff
              </button>
              <button
                type="button"
                onClick={() => setAccountType("parent")}
                className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all ${
                  accountType === "parent"
                    ? "bg-violet-50 border-violet-300 text-violet-700 shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                👨‍👩‍ child Parent
              </button>
            </div>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("password")}
                className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all ${
                  mode === "password"
                    ? "bg-violet-50 border-violet-300 text-violet-700 shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                🔑 Forgot Password
              </button>
              <button
                type="button"
                onClick={() => setMode("username")}
                className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all ${
                  mode === "username"
                    ? "bg-violet-50 border-violet-300 text-violet-700 shadow-sm"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                👤 Forgot {accountType === "parent" ? "Student ID" : "Username"}
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Registered Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="10-digit mobile number"
                  className={`${inputClass} pl-12 tracking-wide`}
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                {accountType === "parent"
                  ? "The parent's WhatsApp number registered with the school."
                  : "Your staff WhatsApp number registered by the admin."}
              </p>
            </div>

            <button type="submit" disabled={loading} className={btnClass}>
              {loading ? "Sending OTP..." : "Send OTP on WhatsApp"}
            </button>
          </form>
        )}

        {/* ---------- STEP 2 ---------- */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Sibling picker (parents only, when needed) */}
            {result?.accounts?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                  Select Student
                </p>
                <div className="space-y-2">
                  {result.accounts.map((acc) => (
                    <button
                      key={acc.studentId}
                      type="button"
                      onClick={() => {
                        setPendingStudentId(acc.studentId);
                        handleResetPassword(acc.studentId);
                      }}
                      disabled={loading}
                      className="w-full text-left bg-white border border-amber-200 hover:border-violet-300 hover:bg-violet-50 rounded-lg px-4 py-2.5 transition-all disabled:opacity-50"
                    >
                      <span className="font-bold text-gray-800 text-sm">{acc.fullName}</span>
                      <span className="block text-xs text-gray-400 font-mono">{acc.studentId}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center">
                Enter 6-Digit OTP
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 py-3 text-center text-xl font-black text-violet-700 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    maxLength={1}
                  />
                ))}
              </div>
            </div>

            {mode === "password" && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={inputClass}
                  />
                </div>
              </>
            )}

            <button
              onClick={
                mode === "password"
                  ? () => handleResetPassword(pendingStudentId || undefined)
                  : handleRecoverUsername
              }
              disabled={loading}
              className={btnClass}
            >
              {loading
                ? "Verifying..."
                : mode === "password"
                  ? "Reset Password"
                  : accountType === "parent"
                    ? "Show Student ID(s)"
                    : "Show My Username"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                onClick={() => {
                  setStep(1);
                  setResult(null);
                  setPendingStudentId("");
                }}
                className="font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSendOtp}
                disabled={resendTimer > 0 || loading}
                className="font-bold text-violet-600 hover:text-violet-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- STEP 3 ---------- */}
        {step === 3 && (
          <div className="space-y-5 text-center">
            {mode === "username" && result ? (
              result.accounts?.length > 0 ? (
                <div className="bg-violet-50 border-2 border-violet-100 rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Student ID(s) linked to this number
                  </p>
                  {result.accounts.map((acc) => (
                    <div key={acc.studentId} className="bg-white rounded-xl border border-violet-100 px-4 py-3">
                      <p className="text-lg font-black text-violet-700 font-mono">{acc.studentId}</p>
                      <p className="text-xs text-gray-500 font-semibold">{acc.fullName}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-violet-50 border-2 border-violet-100 rounded-2xl p-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Your Username
                  </p>
                  <p className="text-3xl font-black text-violet-700 tracking-wide break-all">
                    {result.username}
                  </p>
                </div>
              )
            ) : (
              <p className="text-gray-600 font-medium text-sm leading-relaxed">
                Your password has been changed successfully. Log in with your{" "}
                {accountType === "parent" ? "Student ID" : "username"} and the new password.
              </p>
            )}

            <Link
              to={accountType === "parent" ? "/parent-login" : "/login"}
              className="block w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-violet-200/50 text-center"
            >
              Go to {accountType === "parent" ? "Parent" : "Staff"} Login →
            </Link>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-6 font-medium">
          <Link to="/login" className="hover:text-violet-600 font-bold transition-colors">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
