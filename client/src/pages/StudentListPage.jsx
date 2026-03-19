

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import studentService from "../services/studentService";
import authService from "../services/authService";
import userService from "../services/userService";
import * as Dialog from "@radix-ui/react-dialog";
import ReportCardPage from "./ReportCardPage";
import { socket } from "../components/socket"; // ðŸŒŸ Import socket from global

// Fix for Double Slash Issue if any
const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

const StudentListPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  const [allStudents, setAllStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(() => {
    return localStorage.getItem("selectedGrade") || null;
  });

  const [availableGrades, setAvailableGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportStudentId, setReportStudentId] = useState(null);

  const [reportCardSendStatuses, setReportCardSendStatuses] = useState({});
  const [customMessageSendStatuses, setCustomMessageSendStatuses] = useState(
    {},
  );
  const [personalMessageSendStatuses, setPersonalMessageSendStatuses] =
    useState({});
  const [classTestReportSendStatuses, setClassTestReportSendStatuses] =
    useState({});
  const [ntseReportSendStatuses, setNtseReportSendStatuses] = useState({});
  const [ptReportSendStatuses, setPtReportSendStatuses] = useState({});

  const [customMessage, setCustomMessage] = useState("");

  // ðŸŒŸ Naya WhatsApp Ready State ðŸŒŸ
  const [whatsappReady, setWhatsappReady] = useState(false);

  const [personalMessageStudentId, setPersonalMessageStudentId] =
    useState(null);
  const [personalMessageContent, setPersonalMessageContent] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Save selected grade
  useEffect(() => {
    if (selectedGrade) localStorage.setItem("selectedGrade", selectedGrade);
    else localStorage.removeItem("selectedGrade");
  }, [selectedGrade]);

  // ðŸŒŸ WhatsApp Status Listener logic (Ye line fix karegi buttons disable issue ko) ðŸŒŸ
  useEffect(() => {
    // Check current status API (remove double slash risk)
    const backendUrl = API_URL.replace("/api", "");
    fetch(`${backendUrl}/api/whatsapp/status`)
      .then((res) => res.json())
      .then((data) => {
        setWhatsappReady(data.status === "connected");
      })
      .catch(() => setWhatsappReady(false));

    // Listen live sockets
    const handleReady = () => setWhatsappReady(true);
    const handleDisconnect = () => setWhatsappReady(false);
    const handleQr = () => setWhatsappReady(false);

    socket.on("ready", handleReady);
    socket.on("disconnected", handleDisconnect);
    socket.on("qr", handleQr);

    return () => {
      socket.off("ready", handleReady);
      socket.off("disconnected", handleDisconnect);
      socket.off("qr", handleQr);
    };
  }, []);

  // Fetch initial student data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const studentRes = await studentService.getAllStudents();
        const allFetchedStudents = studentRes.data.data;
        setAllStudents(allFetchedStudents);

        if (currentUser.role === "admin") {
          const uniqueGrades = [
            ...new Set(allFetchedStudents.map((s) => s.gradeLevel)),
          ].sort();
          setAvailableGrades(uniqueGrades);
        } else if (
          currentUser.role === "teacher" ||
          currentUser.role === "hometeacher"
        ) {
          const profileRes = await userService.getProfile();
          const uniqueGrades = [
            ...new Set(
              profileRes.data.subjectsTaught
                .map((a) => a.subject?.gradeLevel)
                .filter(Boolean),
            ),
          ].sort();
          setAvailableGrades(uniqueGrades);
        }

        const initialStatuses = {};
        allFetchedStudents.forEach((s) => {
          initialStatuses[s._id] = "Idle";
        });
        setReportCardSendStatuses({ ...initialStatuses });
        setCustomMessageSendStatuses({ ...initialStatuses });
        setPersonalMessageSendStatuses({ ...initialStatuses });
        setClassTestReportSendStatuses({ ...initialStatuses });
        setNtseReportSendStatuses({ ...initialStatuses });
        setPtReportSendStatuses({ ...initialStatuses });
      } catch (err) {
        setError("Failed to load initial student data.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [currentUser.role]);

  // Filtering students
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
            student.studentId.toString().toLowerCase().includes(q)) ||
          (student.gender && student.gender.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [selectedGrade, allStudents, searchQuery]);

  const handleCheckboxChange = (studentId, checked) => {
    setSelectedStudentIds((ids) =>
      checked ? [...ids, studentId] : ids.filter((id) => id !== studentId),
    );
  };

  const handleSelectAll = (checked) => {
    if (!checked) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s._id));
    }
  };

  // ðŸ’¬ Messaging Functions
  const sendCustomMessageToParents = async () => {
    if (!customMessage.trim()) return alert("Please enter a message first.");
    const studentsToSend = filteredStudents.filter((s) =>
      selectedStudentIds.includes(s._id),
    );
    if (studentsToSend.length === 0) return alert("No students selected.");
    if (
      !window.confirm(
        `Send your custom message to all ${studentsToSend.length} parents?`,
      )
    )
      return;

    const newStatuses = { ...customMessageSendStatuses };
    for (const student of studentsToSend) {
      try {
        newStatuses[student._id] = "Sending...";
        setCustomMessageSendStatuses({ ...newStatuses });
        const payload = {
          students: [
            {
              id: student._id,
              parentPhone: student.parentContact?.phone,
              message: customMessage.trim(),
            },
          ],
        };
        const response = await fetch(
          `${API_URL}/whatsapp/send-custom-message`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        newStatuses[student._id] = response.ok ? "Sent âœ“" : "Failed âœ—";
        setCustomMessageSendStatuses({ ...newStatuses });
      } catch {
        newStatuses[student._id] = "Failed âœ—";
        setCustomMessageSendStatuses({ ...newStatuses });
      }
    }
    alert("Finished sending custom messages.");
  };

  const sendReportCardsToParents = async () => {
    const studentsToSend = filteredStudents.filter(
      (s) =>
        selectedStudentIds.includes(s._id) &&
        s.reportCardUrl &&
        s.reportCardUrl.trim() !== "",
    );
    if (studentsToSend.length === 0)
      return alert("No students have uploaded report cards or are selected.");
    if (
      !window.confirm(
        `Send report card links to ${studentsToSend.length} selected parents?`,
      )
    )
      return;

    const newStatuses = { ...reportCardSendStatuses };
    for (const student of studentsToSend) {
      try {
        newStatuses[student._id] = "Sending...";
        setReportCardSendStatuses({ ...newStatuses });
        const reportCardMessage =
          `Dear ${student.parentContact?.parentName || "Parent"},\n\n` +
          `Greetings from Aneja Kiddos School.\n\n` +
          `We are pleased to share the academic report card for your ward, *${student.fullName}*.\n\n` +
          `*Student Details:*\n` +
          `• Class: ${student.gradeLevel || "N/A"}\n` +
          `• Section: ${student.section || "N/A"}\n\n` +
          `Please find the detailed report card attached with this message. We encourage you to review the academic progress and reach out to the class teacher for any queries.\n\n` +
          `Warm regards,\n*Administration*\n*Aneja Kiddos School*`;

        const payload = {
          students: [
            {
              id: student._id,
              fullName: student.fullName,
              parentContact: student.parentContact,
              parentPhone: student.parentContact?.phone,
              reportLink: student.reportCardUrl,
              reportType: "reportCard",
              message: reportCardMessage,
            },
          ],
        };

        const response = await fetch(`${API_URL}/whatsapp/send-report-links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        newStatuses[student._id] = response.ok ? "Sent âœ“" : "Failed âœ—";
        setReportCardSendStatuses({ ...newStatuses });
      } catch {
        newStatuses[student._id] = "Failed âœ—";
        setReportCardSendStatuses({ ...newStatuses });
      }
    }
    alert("Finished sending report cards.");
  };

  const sendClassTestReportsToParents = async () => {
    const studentsToSend = filteredStudents.filter(
      (s) =>
        selectedStudentIds.includes(s._id) &&
        s.reportClassTestUrl &&
        s.reportClassTestUrl.trim() !== "",
    );
    if (studentsToSend.length === 0)
      return alert(
        "No students have uploaded class test reports or are selected.",
      );
    if (
      !window.confirm(
        `Send class test reports to ${studentsToSend.length} selected parents?`,
      )
    )
      return;

    const newStatuses = { ...classTestReportSendStatuses };
    for (const student of studentsToSend) {
      try {
        newStatuses[student._id] = "Sending...";
        setClassTestReportSendStatuses({ ...newStatuses });
        const msg =
          `Dear ${student.parentContact?.parentName || "Parent"},\n\n` +
          `Greetings from Aneja Kiddos School.\n\n` +
          `Please find attached the recent *Class Test Report* for your ward.\n\n` +
          `*Student Details:*\n` +
          `• Name: *${student.fullName}*\n` +
          `• Class: ${student.gradeLevel || "N/A"}\n` +
          `• Section: ${student.section || "N/A"}\n\n` +
          `We encourage you to review the scores to track their continuous academic progress. If you have any concerns, please feel free to connect with the respective subject teachers.\n\n` +
          `Warm regards,\n*Administration*\n*Aneja Kiddos School*`;

        const payload = {
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

        const response = await fetch(`${API_URL}/whatsapp/send-report-links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        newStatuses[student._id] = response.ok ? "Sent âœ“" : "Failed âœ—";
        setClassTestReportSendStatuses({ ...newStatuses });
      } catch {
        newStatuses[student._id] = "Failed âœ—";
        setClassTestReportSendStatuses({ ...newStatuses });
      }
    }
    alert("Finished sending class test reports.");
  };

  const sendNtseReportsToParents = async () => {
    const studentsToSend = filteredStudents.filter(
      (s) =>
        selectedStudentIds.includes(s._id) &&
        s.reportNTSEUrl &&
        s.reportNTSEUrl.trim() !== "",
    );
    if (studentsToSend.length === 0)
      return alert("No students have uploaded NTSE reports or are selected.");
    if (
      !window.confirm(
        `Send NTSE report links to ${studentsToSend.length} selected parents?`,
      )
    )
      return;

    const newStatuses = { ...ntseReportSendStatuses };
    for (const student of studentsToSend) {
      try {
        newStatuses[student._id] = "Sending...";
        setNtseReportSendStatuses({ ...newStatuses });
        const msg =
          `Dear ${student.parentContact?.parentName || "Parent"},\n\n` +
          `Greetings from Aneja Kiddos School.\n\n` +
          `We are sharing the attached *NTSE (National Talent Search Examination) Report* for your ward.\n\n` +
          `*Student Details:*\n` +
          `• Name: *${student.fullName}*\n` +
          `• Class: ${student.gradeLevel || "N/A"}\n` +
          `• Section: ${student.section || "N/A"}\n\n` +
          `This assessment helps us gauge their aptitude for competitive environments. Kindly go through the detailed report attached herewith.\n\n` +
          `Warm regards,\n*Administration*\n*Aneja Kiddos School*`;

        const payload = {
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

        const response = await fetch(`${API_URL}/whatsapp/send-report-links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        newStatuses[student._id] = response.ok ? "Sent âœ“" : "Failed âœ—";
        setNtseReportSendStatuses({ ...newStatuses });
      } catch {
        newStatuses[student._id] = "Failed âœ—";
        setNtseReportSendStatuses({ ...newStatuses });
      }
    }
    alert("Finished sending NTSE reports.");
  };

  const sendPtReportsToParents = async () => {
    const studentsToSend = filteredStudents.filter(
      (s) =>
        selectedStudentIds.includes(s._id) &&
        s.reportPTUrl &&
        s.reportPTUrl.trim() !== "",
    );
    if (studentsToSend.length === 0)
      return alert(
        "No students have uploaded Periodic Test reports or are selected.",
      );
    if (
      !window.confirm(
        `Send Periodic Test report links to ${studentsToSend.length} selected parents?`,
      )
    )
      return;

    const newStatuses = { ...ptReportSendStatuses };
    for (const student of studentsToSend) {
      try {
        newStatuses[student._id] = "Sending...";
        setPtReportSendStatuses({ ...newStatuses });
        const msg =
          `Dear ${student.parentContact?.parentName || "Parent"},\n\n` +
          `Greetings from Aneja Kiddos School.\n\n` +
          `Please find attached the *Periodic Test (PT) Report* for your ward.\n\n` +
          `*Student Details:*\n` +
          `• Name: *${student.fullName}*\n` +
          `• Class: ${student.gradeLevel || "N/A"}\n` +
          `• Section: ${student.section || "N/A"}\n\n` +
          `Periodic assessments are crucial for identifying areas of improvement and strengths. We request you to review the attached document and guide them accordingly at home.\n\n` +
          `Warm regards,\n*Administration*\n*Aneja Kiddos School*`;

        const payload = {
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

        const response = await fetch(`${API_URL}/whatsapp/send-report-links`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        newStatuses[student._id] = response.ok ? "Sent âœ“" : "Failed âœ—";
        setPtReportSendStatuses({ ...newStatuses });
      } catch {
        newStatuses[student._id] = "Failed âœ—";
        setPtReportSendStatuses({ ...newStatuses });
      }
    }
    alert("Finished sending Periodic Test reports.");
  };

  const sendPersonalMessage = async (student) => {
    if (!personalMessageContent.trim()) return;
    const newStatuses = { ...personalMessageSendStatuses };
    try {
      newStatuses[student._id] = "Sending...";
      setPersonalMessageSendStatuses({ ...newStatuses });
      const payload = {
        students: [
          {
            id: student._id,
            parentPhone: student.parentContact?.phone,
            message: personalMessageContent.trim(),
          },
        ],
      };
      const response = await fetch(
        `${API_URL}/whatsapp/send-personal-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (response.ok) {
        newStatuses[student._id] = "Sent âœ“";
        setPersonalMessageStudentId(null);
        setPersonalMessageContent("");
      } else {
        newStatuses[student._id] = "Failed âœ—";
      }
    } catch {
      newStatuses[student._id] = "Failed âœ—";
    }
    setPersonalMessageSendStatuses({ ...newStatuses });
  };

  // UI Classes
  const gradeButton =
    "px-4 py-2 rounded-full transition duration-150 text-sm font-semibold";
  const selectedGradeButton =
    "bg-pink-600 text-white shadow-md border border-pink-600";
  const deselectedGradeButton =
    "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200";
  const tableHeader =
    "px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider";
  const tableCell = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading)
    return <p className="text-center text-lg mt-12">Loading student data...</p>;
  if (error)
    return (
      <p className="text-center text-red-600 mt-12 font-semibold">{error}</p>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">
              Students List
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
              Manage students, send report links and messages via WhatsApp
              {/* WhatsApp connection indicator next to title */}
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${whatsappReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {whatsappReady ? "WA Connected" : "WA Disconnected"}
              </span>
            </p>
          </div>
          {currentUser.role === "admin" && (
            <div className="flex gap-3">
              <Link
                to="/students/add"
                className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
              >
                Add New Student
              </Link>
              <Link
                to="/students/import"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow"
              >
                Import from Excel
              </Link>
            </div>
          )}
        </div>

        {/* Grade Selection */}
        <section className="mb-6 bg-white p-5 rounded-xl shadow-sm border">
          <h2 className="text-md font-semibold text-gray-700 mb-3">
            Select Grade Level to View Students
          </h2>
          <div className="flex flex-wrap gap-2">
            {availableGrades.length > 0 ? (
              availableGrades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`${gradeButton} ${selectedGrade === grade ? selectedGradeButton : deselectedGradeButton}`}
                >
                  {grade}
                </button>
              ))
            ) : (
              <p className="text-gray-400 italic">No assigned grade levels.</p>
            )}
            {selectedGrade && (
              <button
                onClick={() => setSelectedGrade(null)}
                className="ml-3 text-sm text-gray-500 hover:underline self-center"
              >
                Clear Selection
              </button>
            )}
          </div>
        </section>

        {/* Custom Message input */}
        <div className="mb-4 bg-white p-5 rounded-xl shadow-sm border">
          <label
            htmlFor="customMessage"
            className="block mb-2 font-semibold text-gray-700"
          >
            Custom Message to Parents (optional)
          </label>
          <textarea
            id="customMessage"
            rows={4}
            placeholder="Write any information (holidays, functions, notices)..."
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        {/* ðŸŒŸ ACTION BUTTONS (Logic Fixed: Requires whatsappReady AND selected students) ðŸŒŸ */}
        <div className="flex flex-wrap gap-4 mb-6 justify-end">
          <button
            onClick={sendCustomMessageToParents}
            disabled={
              !customMessage.trim() ||
              !whatsappReady ||
              selectedStudentIds.length === 0
            }
            className={`bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-shadow ${!customMessage.trim() || !whatsappReady || selectedStudentIds.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Send Custom Message
          </button>

          <button
            onClick={sendReportCardsToParents}
            disabled={selectedStudentIds.length === 0 || !whatsappReady}
            className={`bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-shadow ${selectedStudentIds.length === 0 || !whatsappReady ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Send Report Cards
          </button>

          <button
            onClick={sendClassTestReportsToParents}
            disabled={selectedStudentIds.length === 0 || !whatsappReady}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-shadow ${selectedStudentIds.length === 0 || !whatsappReady ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Send Class Test Reports
          </button>

          <button
            onClick={sendNtseReportsToParents}
            disabled={selectedStudentIds.length === 0 || !whatsappReady}
            className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-shadow ${selectedStudentIds.length === 0 || !whatsappReady ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Send NTSE Reports
          </button>

          <button
            onClick={sendPtReportsToParents}
            disabled={selectedStudentIds.length === 0 || !whatsappReady}
            className={`inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow ${selectedStudentIds.length === 0 || !whatsappReady ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Send Periodic Test Reports
          </button>
        </div>

        {selectedGrade && (
          <div className="mb-4 flex justify-end">
            <input
              type="text"
              className="w-full md:w-1/3 px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-pink-400 focus:outline-none text-sm"
              placeholder="Search by name, ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Students Table */}
        {selectedGrade && (
          <div className="overflow-x-auto rounded-xl shadow border border-gray-200 bg-white">
            <table className="min-w-full bg-white divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className={tableHeader}>
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={
                        filteredStudents.length > 0 &&
                        filteredStudents.every((s) =>
                          selectedStudentIds.includes(s._id),
                        )
                      }
                    />
                  </th>
                  <th className={tableHeader}>Roll No</th>
                  <th className={tableHeader}>Student ID</th>
                  <th className={tableHeader}>Full Name</th>
                  <th className={tableHeader}>Gender</th>
                  <th className={tableHeader}>Report</th>
                  <th className={tableHeader}>Custom Msg</th>
                  <th className={tableHeader}>Personal Msg</th>
                  <th className={tableHeader}>Class Test</th>
                  <th className={tableHeader}>NTSE</th>
                  <th className={tableHeader}>Personal Message</th>
                  <th className={tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => {
                    const hasReport =
                      student.reportCardUrl &&
                      student.reportCardUrl.trim() !== "";
                    return (
                      <tr
                        key={student._id}
                        className={`hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} transition-colors`}
                      >
                        <td className={tableCell}>
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                student._id,
                                e.target.checked,
                              )
                            }
                          />
                        </td>
                        <td className={`${tableCell} text-pink-600 font-mono`}>
                          {student.rollNumber}
                        </td>
                        <td className={`${tableCell} text-pink-600 font-mono`}>
                          {student.studentId}
                        </td>
                        <td
                          className={`${tableCell} font-semibold text-gray-900`}
                        >
                          <Link
                            to={`/students/${student._id}`}
                            className="hover:underline text-pink-600"
                          >
                            {student.fullName}
                          </Link>
                        </td>
                        <td className={`${tableCell} text-gray-600`}>
                          {student.gender}
                        </td>
                        <td className={tableCell}>
                          <StatusBadge
                            status={
                              reportCardSendStatuses[student._id] || "Idle"
                            }
                          />
                        </td>
                        <td className={tableCell}>
                          <StatusBadge
                            status={
                              customMessageSendStatuses[student._id] || "Idle"
                            }
                          />
                        </td>
                        <td className={tableCell}>
                          <StatusBadge
                            status={
                              personalMessageSendStatuses[student._id] || "Idle"
                            }
                          />
                        </td>
                        <td className={tableCell}>
                          <StatusBadge
                            status={
                              classTestReportSendStatuses[student._id] || "Idle"
                            }
                          />
                        </td>
                        <td className={tableCell}>
                          <StatusBadge
                            status={
                              ntseReportSendStatuses[student._id] || "Idle"
                            }
                          />
                        </td>
                        <td className={tableCell}>
                          {personalMessageStudentId === student._id ? (
                            <div className="flex flex-col space-y-2">
                              <textarea
                                rows={3}
                                value={personalMessageContent}
                                placeholder={`Message to ${student.fullName}'s parent`}
                                onChange={(e) =>
                                  setPersonalMessageContent(e.target.value)
                                }
                                className="border border-gray-300 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
                              />
                              <div className="flex gap-2">
                                {/* Disabled if NO connection or empty message */}
                                <button
                                  onClick={() => sendPersonalMessage(student)}
                                  disabled={
                                    !personalMessageContent.trim() ||
                                    !whatsappReady
                                  }
                                  className="bg-blue-600 text-white px-4 py-1 rounded-md disabled:opacity-50"
                                >
                                  Send
                                </button>
                                <button
                                  onClick={() => {
                                    setPersonalMessageStudentId(null);
                                    setPersonalMessageContent("");
                                  }}
                                  className="bg-gray-300 px-4 py-1 rounded-md"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setPersonalMessageStudentId(student._id);
                                setPersonalMessageContent("");
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm"
                            >
                              Send Personal Msg
                            </button>
                          )}
                        </td>
                        <td className={`${tableCell} flex items-center gap-3`}>
                          {hasReport ? (
                            <span
                              title="Report Card Uploaded"
                              className="flex items-center gap-1 text-green-600 font-semibold"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Uploaded
                            </span>
                          ) : (
                            <span
                              title="Report Card Not Uploaded"
                              className="flex items-center gap-1 text-red-600 font-semibold"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Not Uploaded
                            </span>
                          )}
                          <Dialog.Root
                            open={reportStudentId === student._id}
                            onOpenChange={(open) =>
                              setReportStudentId(open ? student._id : null)
                            }
                          >
                            <Dialog.Trigger asChild>
                              <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm">
                                View Report Card
                              </button>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                              <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
                              <Dialog.Content className="fixed inset-0 md:inset-10 bg-white rounded-lg shadow-xl overflow-y-auto z-50 p-6">
                                <Dialog.Title className="text-lg font-bold mb-4">
                                  Report Card - {student.fullName}
                                </Dialog.Title>
                                <ReportCardPage studentId={student._id} />
                                <div className="mt-4 flex justify-end">
                                  <Dialog.Close asChild>
                                    <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                                      Close
                                    </button>
                                  </Dialog.Close>
                                </div>
                              </Dialog.Content>
                            </Dialog.Portal>
                          </Dialog.Root>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={12}
                      className="text-center py-6 text-gray-500 italic"
                    >
                      No students found for this grade.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const baseClasses =
    "inline-block px-2 py-0.5 rounded-full text-xs font-semibold";
  const colors = {
    Idle: "bg-gray-200 text-gray-700",
    "Sending...": "bg-yellow-100 text-yellow-800",
    "Sent âœ“": "bg-green-100 text-green-800",
    "Failed âœ—": "bg-red-100 text-red-800",
  };
  return (
    <span className={`${baseClasses} ${colors[status] || ""}`}>{status}</span>
  );
};

export default StudentListPage;
