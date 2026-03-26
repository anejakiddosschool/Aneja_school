import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import studentService from "../services/studentService";
import authService from "../services/authService";
import userService from "../services/userService";
import * as Dialog from "@radix-ui/react-dialog";
import ReportCardPage from "./ReportCardPage";
import { socket } from "../components/socket";
import toast from "react-hot-toast";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const StudentListPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [allStudents, setAllStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(
    () => localStorage.getItem("selectedGrade") || "",
  );
  const [availableGrades, setAvailableGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportStudentId, setReportStudentId] = useState(null);

  // Status & Logic States
  const [sendStatuses, setSendStatuses] = useState({});
  const [customMessage, setCustomMessage] = useState("");
  const [whatsappReady, setWhatsappReady] = useState(false);
  const [personalMessageStudentId, setPersonalMessageStudentId] =
    useState(null);
  const [personalMessageContent, setPersonalMessageContent] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [hiddenStudentForReport, setHiddenStudentForReport] = useState(null);
  const [bulkActionType, setBulkActionType] = useState(""); // "upload" ya "print"

  // Helper for cleanly formatting dates
  const formatDate = (dateString) => {
    if (!dateString) return "No Data";
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-IN", options);
  };

  useEffect(() => {
    if (selectedGrade) localStorage.setItem("selectedGrade", selectedGrade);
    else localStorage.removeItem("selectedGrade");
  }, [selectedGrade]);

  // WhatsApp connection check
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/whatsapp/status`);
        const data = await res.json();
        setWhatsappReady(data.status === "connected");
      } catch (e) {
        setWhatsappReady(false);
      }
    };
    fetchStatus();

    socket.on("ready", () => setWhatsappReady(true));
    socket.on("disconnected", () => setWhatsappReady(false));
    socket.on("qr", () => setWhatsappReady(false));

    return () => {
      socket.off("ready");
      socket.off("disconnected");
      socket.off("qr");
    };
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const studentRes = await studentService.getAllStudents();
        const allFetchedStudents = studentRes.data.data;
        setAllStudents(allFetchedStudents);

        if (currentUser.role === "admin") {
          setAvailableGrades(
            [...new Set(allFetchedStudents.map((s) => s.gradeLevel))].sort(),
          );
        } else {
          const profileRes = await userService.getProfile();
          setAvailableGrades(
            [
              ...new Set(
                profileRes.data.subjectsTaught
                  .map((a) => a.subject?.gradeLevel)
                  .filter(Boolean),
              ),
            ].sort(),
          );
        }

        const initialStatuses = {};
        allFetchedStudents.forEach((s) => {
          initialStatuses[s._id] = "Idle";
        });
        setSendStatuses(initialStatuses);
      } catch (err) {
        setError("Failed to load initial student data.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [currentUser.role]);

  const filteredStudents = useMemo(() => {
    if (!selectedGrade) return [];
    return allStudents
      .filter((student) => student.gradeLevel === selectedGrade)
      .filter((student) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return (
          student.fullName.toLowerCase().includes(q) ||
          (student.studentId &&
            student.studentId.toString().toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [selectedGrade, allStudents, searchQuery]);

  const handleCheckboxChange = (id, checked) => {
    setSelectedStudentIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedStudentIds(checked ? filteredStudents.map((s) => s._id) : []);
  };

  const updateStatus = (id, status) => {
    setSendStatuses((prev) => ({ ...prev, [id]: status }));
  };

  // ==========================================
  // 🌟 NAYA: BULK AUTO GENERATE & UPLOAD LOGIC 🌟
  // ==========================================
  // ==========================================
  // 🌟 BULK AUTO GENERATE & UPLOAD LOGIC 🌟
  // ==========================================
  // ==========================================
  // 🌟 BULK AUTO GENERATE & UPLOAD LOGIC 🌟
  // ==========================================
  const handleBulkGenerateReports = async () => {
    const validStudents = filteredStudents.filter((s) =>
      selectedStudentIds.includes(s._id),
    );
    if (validStudents.length === 0)
      return toast.error("Please select at least one student!");
    if (
      !window.confirm(
        `Auto-Upload Report Cards for ${validStudents.length} students?`,
      )
    )
      return;

    // 🔒 NAYA: FORCE DESKTOP VIEWPORT FOR MOBILE
    const originalMeta = document.querySelector("meta[name=viewport]");
    const newMeta = document.createElement("meta");
    newMeta.name = "viewport";
    newMeta.content = "width=1200";
    document.head.appendChild(newMeta);
    if (originalMeta) originalMeta.remove();

    setBulkActionType("upload");
    setIsBulkUploading(true);
    setBulkProgress({ current: 0, total: validStudents.length });

    for (let i = 0; i < validStudents.length; i++) {
      const student = validStudents[i];
      setBulkProgress({ current: i + 1, total: validStudents.length });
      updateStatus(student._id, "Generating ⏳");

      setHiddenStudentForReport(student._id);

      let waitTime = 0;
      let btn = null;
      while (waitTime < 12000) {
        await new Promise((r) => setTimeout(r, 500));
        btn = document.getElementById(`trigger-upload-${student._id}`);
        if (btn) break;
        waitTime += 500;
      }

      if (btn) {
        updateStatus(student._id, "Uploading ☁️");
        await new Promise((r) => setTimeout(r, 1000));
        btn.click();
        await new Promise((r) => setTimeout(r, 6000));
        updateStatus(student._id, "Uploaded ✓");
      } else {
        updateStatus(student._id, "Failed ✗ (Timeout)");
      }

      setHiddenStudentForReport(null);
      await new Promise((r) => setTimeout(r, 500));
    }

    // 🔓 NAYA: UNLOCK VIEWPORT
    document.head.removeChild(newMeta);
    if (originalMeta) document.head.appendChild(originalMeta);

    toast.success("Bulk Upload Completed!");
    setIsBulkUploading(false);
    loadInitialData();
  };

  // ==========================================
  // 🖨️ NAYA: ALL REPORTS BULK PRINT LOGIC
  // ==========================================
  // ==========================================
  // 🖨️ ALL REPORTS BULK PRINT LOGIC
  // ==========================================
  const handleBulkPrint = async () => {
    const validStudents = filteredStudents.filter((s) =>
      selectedStudentIds.includes(s._id),
    );
    if (validStudents.length === 0)
      return toast.error("Please select students to print!");
    if (
      !window.confirm(
        `Generate Print Preview for ${validStudents.length} students?`,
      )
    )
      return;

    // 🔒 FORCE DESKTOP VIEWPORT
    const originalMeta = document.querySelector("meta[name=viewport]");
    const newMeta = document.createElement("meta");
    newMeta.name = "viewport";
    newMeta.content = "width=1200";
    document.head.appendChild(newMeta);
    if (originalMeta) originalMeta.remove();

    setBulkActionType("print");
    setIsBulkUploading(true);
    setBulkProgress({ current: 0, total: validStudents.length });

    let combinedHTML = "";

    for (let i = 0; i < validStudents.length; i++) {
      const student = validStudents[i];
      setBulkProgress({ current: i + 1, total: validStudents.length });
      updateStatus(student._id, "Preparing Print ⏳");

      setHiddenStudentForReport(student._id);

      let waitTime = 0;
      let printArea = null;
      while (waitTime < 10000) {
        await new Promise((r) => setTimeout(r, 500));
        printArea = document.getElementById(`printableArea-${student._id}`);
        if (printArea) break;
        waitTime += 500;
      }

      if (printArea) {
        await new Promise((r) => setTimeout(r, 1000)); // Layout set hone ka wait
        // NAYA: Page break add kiya hai perfect print ke liye
combinedHTML += `
  <div class="print-page-wrapper" style="page-break-after: always;">
    ${printArea.innerHTML}
  </div>
`;

        updateStatus(student._id, "Print Ready ✓");
      } else {
        updateStatus(student._id, "Failed ✗");
      }
      setHiddenStudentForReport(null);
      await new Promise((r) => setTimeout(r, 300));
    }

    // 🔓 UNLOCK VIEWPORT
    document.head.removeChild(newMeta);
    if (originalMeta) document.head.appendChild(originalMeta);

    setIsBulkUploading(false);

    if (combinedHTML) {
      let styles = "";
      for (const sheet of document.styleSheets) {
        try {
          styles += Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch (e) {}
      }
      const printWindow = window.open("", "", "height=800,width=1200");
      if (printWindow) {
        // NAYA: CSS me Print-Color-Adjust aur Force Width dali gayi hai
   printWindow.document.write(`
  <html>
    <head>
      <title>Bulk Print Reports</title>
      <meta name="viewport" content="width=900">
      <style>${styles}</style>
      <style>
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          width: 100%;
        }

        .print-page-wrapper {
          width: 900px !important;
          max-width: 900px !important;
          min-width: 900px !important;
          margin: 0 auto 0 auto !important;
          padding: 0 !important;
          background: #fff !important;
          overflow: hidden !important;
        }

        @page {
          size: A4 portrait;
          margin: 10mm;
        }

        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          body {
            width: auto !important;
          }

          .print-page-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            margin: 0 auto !important;
            padding: 0 !important;
            page-break-after: always !important;
          }

          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      ${combinedHTML}
    </body>
  </html>
`);

        printWindow.document.close();
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 2000); // Taki font/images render ho sakein
      } else {
        alert("Popup blocked! Please allow popups in your browser.");
      }
    }
  };

  // Generic Broadcaster Logic
  const processBroadcast = async (reportType, labelName, payloadFn) => {
    const validStudents = filteredStudents.filter((s) =>
      selectedStudentIds.includes(s._id),
    );
    if (validStudents.length === 0) return toast.error("No students selected.");
    if (
      !window.confirm(`Send ${labelName} to ${validStudents.length} parents?`)
    )
      return;

    for (const student of validStudents) {
      try {
        updateStatus(student._id, `${labelName}: Sending...`);
        const payload = payloadFn(student);
        const route =
          reportType === "custom"
            ? "/whatsapp/send-custom-message"
            : "/whatsapp/send-report-links";
        const res = await fetch(`${API_URL}${route}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        updateStatus(
          student._id,
          res.ok ? `${labelName}: Sent ✓` : `${labelName}: Failed ✗`,
        );
      } catch {
        updateStatus(student._id, `${labelName}: Failed ✗`);
      }
    }
    toast.success(`${labelName} Processed!`);
  };

  // --- DETAILED BROADCAST TRIGGERS ---
  const sendReportCardsToParents = () => {
    processBroadcast("reportCard", "Report Card", (student) => {
      const msg = `Dear ${student.parentContact?.parentName || "Parent"},\n\nGreetings from Aneja Kiddos School.\n\nWe are pleased to share the academic report card for your ward, *${student.fullName}*.\n\n*Student Details:*\n• Class: ${student.gradeLevel || "N/A"}\n• Section: ${student.section || "N/A"}\n\nPlease find the detailed report card attached with this message. We encourage you to review the academic progress and reach out to the class teacher for any queries.\n\nWarm regards,\n*Administration*\n*Aneja Kiddos School*`;
      return {
        students: [
          {
            id: student._id,
            fullName: student.fullName,
            parentContact: student.parentContact,
            parentPhone: student.parentContact?.phone,
            reportLink: student.reportCardUrl,
            reportType: "reportCard",
            message: msg,
          },
        ],
      };
    });
  };

  const sendClassTestReportsToParents = () => {
    processBroadcast("classTest", "Class Test", (student) => {
      const msg = `Dear ${student.parentContact?.parentName || "Parent"},\n\nGreetings from Aneja Kiddos School.\n\nPlease find attached the recent *Class Test Report* for your ward.\n\n*Student Details:*\n• Name: *${student.fullName}*\n• Class: ${student.gradeLevel || "N/A"}\n• Section: ${student.section || "N/A"}\n\nWe encourage you to review the scores to track their continuous academic progress. If you have any concerns, please feel free to connect with the respective subject teachers.\n\nWarm regards,\n*Administration*\n*Aneja Kiddos School*`;
      return {
        students: [
          {
            id: student._id,
            parentPhone: student.parentContact?.phone,
            reportLink: student.reportClassTestUrl,
            reportType: "classTest",
            message: msg,
          },
        ],
      };
    });
  };

  const sendNtseReportsToParents = () => {
    processBroadcast("ntse", "NTSE", (student) => {
      const msg = `Dear ${student.parentContact?.parentName || "Parent"},\n\nGreetings from Aneja Kiddos School.\n\nWe are sharing the attached *NTSE (National Talent Search Examination) Report* for your ward.\n\n*Student Details:*\n• Name: *${student.fullName}*\n• Class: ${student.gradeLevel || "N/A"}\n• Section: ${student.section || "N/A"}\n\nThis assessment helps us gauge their aptitude for competitive environments. Kindly go through the detailed report attached herewith.\n\nWarm regards,\n*Administration*\n*Aneja Kiddos School*`;
      return {
        students: [
          {
            id: student._id,
            parentPhone: student.parentContact?.phone,
            reportLink: student.reportNTSEUrl,
            reportType: "ntse",
            message: msg,
          },
        ],
      };
    });
  };

  const sendPtReportsToParents = () => {
    processBroadcast("ptTest", "PT Test", (student) => {
      const msg = `Dear ${student.parentContact?.parentName || "Parent"},\n\nGreetings from Aneja Kiddos School.\n\nPlease find attached the *Periodic Test (PT) Report* for your ward.\n\n*Student Details:*\n• Name: *${student.fullName}*\n• Class: ${student.gradeLevel || "N/A"}\n• Section: ${student.section || "N/A"}\n\nPeriodic assessments are crucial for identifying areas of improvement and strengths. We request you to review the attached document and guide them accordingly at home.\n\nWarm regards,\n*Administration*\n*Aneja Kiddos School*`;
      return {
        students: [
          {
            id: student._id,
            parentPhone: student.parentContact?.phone,
            reportLink: student.reportPTUrl,
            reportType: "ptTest",
            message: msg,
          },
        ],
      };
    });
  };

  const sendCustomBulk = () => {
    if (!customMessage.trim())
      return toast.error("Please enter a custom message!");
    processBroadcast("custom", "Custom Msg", (student) => ({
      students: [
        {
          id: student._id,
          parentPhone: student.parentContact?.phone,
          message: customMessage.trim(),
        },
      ],
    }));
  };

  const sendPersonalMsg = async (student) => {
    if (!personalMessageContent.trim()) return;
    try {
      updateStatus(student._id, "Personal: Sending...");
      const payload = {
        students: [
          {
            id: student._id,
            parentPhone: student.parentContact?.phone,
            message: personalMessageContent.trim(),
          },
        ],
      };
      const res = await fetch(`${API_URL}/whatsapp/send-personal-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      updateStatus(
        student._id,
        res.ok ? "Personal: Sent ✓" : "Personal: Failed ✗",
      );
      if (res.ok) {
        setPersonalMessageStudentId(null);
        setPersonalMessageContent("");
        toast.success("Sent");
      }
    } catch {
      updateStatus(student._id, "Personal: Failed ✗");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center mt-20">
        <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-3 md:p-8 animate-fade-in">
     {hiddenStudentForReport && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: "-99999px",
      zIndex: -999,
      width: "900px",
      minWidth: "900px",
      maxWidth: "900px",
      backgroundColor: "white",
      overflow: "hidden",
    }}
  >
    <ReportCardPage
      studentId={hiddenStudentForReport}
      isAutoUploadMode={true}
    />
  </div>
)}


      {/* 🌟 2. LOADING PROGRESS OVERLAY 🌟 */}
      {isBulkUploading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center text-white">
          <div className="bg-white p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full">
            <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-gray-900 font-extrabold text-xl mb-1">
              {bulkActionType === "upload"
                ? "Uploading Reports..."
                : "Preparing Print..."}
            </h3>
            <p className="text-gray-500 font-medium text-sm mb-4">
              Please do not close this window.
            </p>

            <div className="bg-gray-100 rounded-full h-3 w-full overflow-hidden mb-2">
              <div
                className="bg-pink-600 h-full transition-all duration-300"
                style={{
                  width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-pink-600 font-extrabold text-md">
              {bulkProgress.current} / {bulkProgress.total} Processed
            </p>
          </div>
        </div>
      )}

      <div className="max-w-[1300px] mx-auto space-y-4 md:space-y-6">
        {/* HEADER (Responsive) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-800">
              Student Directory
            </h1>
            <div
              className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${whatsappReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {whatsappReady ? "● WA Online" : "● WA Offline"}
            </div>
          </div>

          <div className="flex flex-row w-full sm:w-auto gap-2">
            {currentUser.role === "admin" && (
              <>
                <Link
                  to="/students/add"
                  className="flex-1 sm:flex-none text-center bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold py-2 md:py-1.5 px-4 rounded-lg transition-all"
                >
                  + Add
                </Link>
                <Link
                  to="/students/import"
                  className="flex-1 sm:flex-none text-center bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold py-2 md:py-1.5 px-4 rounded-lg transition-all"
                >
                  📊 Import
                </Link>
              </>
            )}
          </div>
        </div>

        {/* TOP FILTER BAR (Responsive) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-bold text-gray-500 uppercase whitespace-nowrap">
              Class:
            </span>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="w-full md:w-40 border border-gray-300 rounded-lg p-2.5 md:p-2 text-sm font-semibold focus:ring-2 focus:ring-pink-500 outline-none cursor-pointer bg-gray-50"
            >
              <option value="">-- Select --</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {selectedGrade && (
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Search Name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2.5 md:py-2 px-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none bg-gray-50"
              />
            </div>
          )}
        </div>

        {/* ACTION BAR (Responsive - Horizontal Scroll on Mobile) */}
        {selectedGrade && selectedStudentIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <span className="text-indigo-800 font-bold text-xs bg-white px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap border border-indigo-100">
                {selectedStudentIds.length} Selected
              </span>

              {/* Select All Checkbox for Mobile inside action bar */}
              <label className="sm:hidden flex items-center gap-2 text-xs font-bold text-indigo-700">
                <input
                  type="checkbox"
                  className="rounded text-pink-600 focus:ring-pink-500"
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  checked={
                    filteredStudents.length > 0 &&
                    filteredStudents.every((s) =>
                      selectedStudentIds.includes(s._id),
                    )
                  }
                />
                Select All
              </label>
            </div>

            {/* 🌟 NAYA BULK UPLOAD BUTTON YAHAN AAYEGA 🌟 */}

            <div className="flex flex-row overflow-x-auto w-full pb-2 sm:pb-0 gap-2 hide-scrollbar">
              {/* 🌟 NAYA BULK PRINT BUTTON */}
              <button
                onClick={handleBulkPrint}
                disabled={isBulkUploading}
                className="bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap shadow-sm border border-gray-200 flex items-center gap-1"
              >
                🖨️ Bulk Print
              </button>

              {/* 🌟 UPLOAD BUTTON */}
              <button
                onClick={handleBulkGenerateReports}
                disabled={isBulkUploading}
                className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap shadow-sm border border-gray-900 flex items-center gap-1"
              >
                ⚡ Auto-Upload
              </button>

              <div className="w-px bg-indigo-200 shrink-0 mx-1 hidden sm:block h-6"></div>
              <input
                type="text"
                placeholder="Type custom msg..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-w-[150px] border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={sendCustomBulk}
                disabled={!whatsappReady}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                💬 Send
              </button>
              <div className="w-px bg-indigo-200 shrink-0 mx-1 hidden sm:block"></div>
              <button
                onClick={sendReportCardsToParents}
                disabled={!whatsappReady}
                className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                Report Card
              </button>
              <button
                onClick={sendClassTestReportsToParents}
                disabled={!whatsappReady}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                Class Test
              </button>
              <button
                onClick={sendNtseReportsToParents}
                disabled={!whatsappReady}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                NTSE
              </button>
              <button
                onClick={sendPtReportsToParents}
                disabled={!whatsappReady}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                PT
              </button>
            </div>
          </div>
        )}

        {/* MAIN DATA SECTION */}
        {selectedGrade ? (
          <>
            {/* --- DESKTOP VIEW (Hidden on Mobile) --- */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every((s) =>
                            selectedStudentIds.includes(s._id),
                          )
                        }
                        className="cursor-pointer rounded text-pink-600 focus:ring-pink-500"
                      />
                    </th>
                    <th className="py-3 px-4 font-bold text-gray-700">
                      Student Detail
                    </th>
                    <th className="py-3 px-4 font-bold text-gray-700 text-center">
                      Attached Documents
                    </th>
                    <th className="py-3 px-2 font-bold text-gray-700 text-center w-32">
                      WA Status
                    </th>
                    <th className="py-3 px-4 font-bold text-gray-700 text-right">
                      Quick Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => {
                      const hasReportCard = !!student.reportCardUrl;
                      const hasClassTest = !!student.reportClassTestUrl;
                      const hasNtse = !!student.reportNTSEUrl;
                      const hasPt = !!student.reportPTUrl;
                      const hasAnyDoc =
                        hasReportCard || hasClassTest || hasNtse || hasPt;
                      const currentStatus = sendStatuses[student._id];

                      return (
                        <tr
                          key={student._id}
                          className="hover:bg-pink-50/50 transition-colors"
                        >
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student._id)}
                              onChange={(e) =>
                                handleCheckboxChange(
                                  student._id,
                                  e.target.checked,
                                )
                              }
                              className="cursor-pointer rounded text-pink-600 focus:ring-pink-500 w-4 h-4"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <Link
                              to={`/students/${student._id}`}
                              className="font-bold text-gray-900 hover:text-pink-600 block text-[15px]"
                            >
                              {student.fullName}
                            </Link>
                            <div className="text-xs text-gray-500 font-mono mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded">
                              ID: {student.studentId} • Roll:{" "}
                              {student.rollNumber || "-"}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col gap-1 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-2 min-w-[140px]">
                              {hasAnyDoc ? (
                                <>
                                  <div className="flex flex-wrap justify-center gap-1 w-full">
                                    {hasReportCard && (
                                      <span
                                        className="bg-pink-100 text-pink-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-pink-200"
                                        title="Report Card"
                                      >
                                        RC
                                      </span>
                                    )}
                                    {hasClassTest && (
                                      <span
                                        className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200"
                                        title="Class Test"
                                      >
                                        CT
                                      </span>
                                    )}
                                    {hasNtse && (
                                      <span
                                        className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200"
                                        title="NTSE Report"
                                      >
                                        NTSE
                                      </span>
                                    )}
                                    {hasPt && (
                                      <span
                                        className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-teal-200"
                                        title="Periodic Test"
                                      >
                                        PT
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium mt-1">
                                    🗓️ {formatDate(student.updatedAt)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400 text-[11px] italic py-1">
                                  No Docs Uploaded
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            {currentStatus && currentStatus !== "Idle" && (
                              <span
                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${currentStatus.includes("Sent") ? "bg-green-50 text-green-700 border-green-200" : currentStatus.includes("Failed") ? "bg-red-50 text-red-700 border-red-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}
                              >
                                {currentStatus}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {personalMessageStudentId === student._id ? (
                              <div className="flex items-center gap-1 justify-end">
                                <input
                                  type="text"
                                  value={personalMessageContent}
                                  onChange={(e) =>
                                    setPersonalMessageContent(e.target.value)
                                  }
                                  placeholder="Type..."
                                  className="text-[11px] border border-pink-300 rounded px-2 py-1.5 w-32 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => sendPersonalMsg(student)}
                                  disabled={
                                    !personalMessageContent.trim() ||
                                    !whatsappReady
                                  }
                                  className="bg-green-100 text-green-700 border border-green-200 rounded font-bold px-2 py-1 text-xs hover:bg-green-200"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => {
                                    setPersonalMessageStudentId(null);
                                    setPersonalMessageContent("");
                                  }}
                                  className="bg-red-100 text-red-700 border border-red-200 rounded font-bold px-2 py-1 text-xs hover:bg-red-200"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() =>
                                    setPersonalMessageStudentId(student._id)
                                  }
                                  className="text-gray-500 hover:text-blue-600 bg-gray-50 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 p-2 rounded-lg transition shadow-sm"
                                  title="Message"
                                >
                                  💬
                                </button>
                                <Dialog.Root
                                  open={reportStudentId === student._id}
                                  onOpenChange={(open) =>
                                    setReportStudentId(
                                      open ? student._id : null,
                                    )
                                  }
                                >
                                  <Dialog.Trigger asChild>
                                    <button
                                      disabled={!hasReportCard}
                                      className={`p-2 rounded-lg transition shadow-sm border ${hasReportCard ? "text-gray-500 hover:text-green-600 bg-gray-50 border-gray-200 hover:border-green-300 hover:bg-green-50" : "text-gray-300 bg-gray-50 border-gray-100 cursor-not-allowed"}`}
                                      title="View Report Card"
                                    >
                                      📄
                                    </button>
                                  </Dialog.Trigger>
                                  <Dialog.Portal>
                                    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
                                    <Dialog.Content className="fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
                                      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                                        <Dialog.Title className="text-lg font-bold text-gray-800">
                                          Report Card: {student.fullName}
                                        </Dialog.Title>
                                        <Dialog.Close asChild>
                                          <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm transition">
                                            ✕ Close
                                          </button>
                                        </Dialog.Close>
                                      </div>
                                      <div className="flex-1 overflow-y-auto p-4">
                                        <ReportCardPage
                                          studentId={student._id}
                                        />
                                      </div>
                                    </Dialog.Content>
                                  </Dialog.Portal>
                                </Dialog.Root>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-20 text-gray-400 font-medium"
                      >
                        <div className="text-4xl mb-3">📭</div>No students
                        found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- MOBILE VIEW (Hidden on Desktop) --- */}
            <div className="md:hidden flex flex-col gap-3">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const hasReportCard = !!student.reportCardUrl;
                  const hasClassTest = !!student.reportClassTestUrl;
                  const hasNtse = !!student.reportNTSEUrl;
                  const hasPt = !!student.reportPTUrl;
                  const hasAnyDoc =
                    hasReportCard || hasClassTest || hasNtse || hasPt;
                  const currentStatus = sendStatuses[student._id];
                  const isSelected = selectedStudentIds.includes(student._id);

                  return (
                    <div
                      key={student._id}
                      className={`bg-white rounded-xl shadow-sm border p-4 transition-colors ${isSelected ? "border-pink-400 bg-pink-50/20" : "border-gray-200"}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) =>
                              handleCheckboxChange(
                                student._id,
                                e.target.checked,
                              )
                            }
                            className="mt-1 w-5 h-5 cursor-pointer rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                          />
                          <div>
                            <Link
                              to={`/students/${student._id}`}
                              className="font-bold text-gray-900 text-[16px] leading-tight block"
                            >
                              {student.fullName}
                            </Link>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                              ID: {student.studentId} • Roll:{" "}
                              {student.rollNumber || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 mb-3 flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                            Docs Attached
                          </span>
                          {hasAnyDoc ? (
                            <div className="flex gap-1">
                              {hasReportCard && (
                                <span className="bg-pink-100 text-pink-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-pink-200">
                                  RC
                                </span>
                              )}
                              {hasClassTest && (
                                <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                                  CT
                                </span>
                              )}
                              {hasNtse && (
                                <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-200">
                                  NTSE
                                </span>
                              )}
                              {hasPt && (
                                <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-teal-200">
                                  PT
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">
                              None
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-gray-400 block mb-0.5">
                            Last Updated
                          </span>
                          <span className="text-[11px] font-medium text-gray-600">
                            {formatDate(student.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {currentStatus && currentStatus !== "Idle" && (
                        <div className="mb-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full ${currentStatus.includes("Sent") ? "bg-green-50 text-green-700" : currentStatus.includes("Failed") ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}
                          >
                            Status: {currentStatus}
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() =>
                            setPersonalMessageStudentId(student._id)
                          }
                          className="flex-1 flex justify-center items-center gap-1 text-blue-600 bg-blue-50 hover:bg-blue-100 py-2 rounded-lg text-sm font-bold transition"
                        >
                          💬 Msg
                        </button>
                        <Dialog.Root
                          open={reportStudentId === student._id}
                          onOpenChange={(open) =>
                            setReportStudentId(open ? student._id : null)
                          }
                        >
                          <Dialog.Trigger asChild>
                            <button
                              disabled={!hasReportCard}
                              className={`flex-1 flex justify-center items-center gap-1 py-2 rounded-lg text-sm font-bold transition ${hasReportCard ? "text-green-600 bg-green-50 hover:bg-green-100" : "text-gray-400 bg-gray-50 cursor-not-allowed"}`}
                            >
                              📄 Report
                            </button>
                          </Dialog.Trigger>
                          <Dialog.Portal>
                            <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
                            <Dialog.Content className="fixed inset-2 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col">
                              <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                                <Dialog.Title className="text-sm font-bold text-gray-800 truncate pr-2">
                                  Report: {student.fullName}
                                </Dialog.Title>
                                <Dialog.Close asChild>
                                  <button className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                                    ✕ Close
                                  </button>
                                </Dialog.Close>
                              </div>
                              <div className="flex-1 overflow-y-auto p-2">
                                <ReportCardPage studentId={student._id} />
                              </div>
                            </Dialog.Content>
                          </Dialog.Portal>
                        </Dialog.Root>
                      </div>

                      {/* Mobile Personal Message Inline Box */}
                      {personalMessageStudentId === student._id && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col gap-2">
                          <input
                            type="text"
                            value={personalMessageContent}
                            onChange={(e) =>
                              setPersonalMessageContent(e.target.value)
                            }
                            placeholder="Type a message to parent..."
                            className="w-full text-sm border border-blue-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setPersonalMessageStudentId(null);
                                setPersonalMessageContent("");
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-white border border-gray-200 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => sendPersonalMsg(student)}
                              disabled={
                                !personalMessageContent.trim() || !whatsappReady
                              }
                              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded disabled:opacity-50"
                            >
                              Send Message
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-xl border border-gray-200">
                  <div className="text-4xl mb-3">📭</div>
                  No students found for this class.
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center py-16 md:py-20">
            <span className="text-5xl md:text-6xl text-gray-300">🎓</span>
            <h2 className="text-lg md:text-xl font-bold text-gray-700 mt-4">
              Select a Class
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Please select a class from the top dropdown to view students,
              check document status, and manage WhatsApp reporting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentListPage;
