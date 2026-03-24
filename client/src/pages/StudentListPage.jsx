// src/pages/StudentListPage.js
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

  // --- DETAILED BROADCAST TRIGGERS RESTORED ---
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 md:p-8 animate-fade-in">
      <div className="max-w-[1300px] mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-gray-800">
              Student Directory
            </h1>
            <div
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${whatsappReady ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {whatsappReady ? "● WA Online" : "● WA Offline"}
            </div>
          </div>

          <div className="flex gap-2">
            {currentUser.role === "admin" && (
              <>
                <Link
                  to="/students/add"
                  className="bg-pink-600 hover:bg-pink-700 text-white text-sm font-bold py-1.5 px-4 rounded-lg transition-all"
                >
                  + Add Student
                </Link>
                <Link
                  to="/students/import"
                  className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold py-1.5 px-4 rounded-lg transition-all"
                >
                  📊 Import Excel
                </Link>
              </>
            )}
          </div>
        </div>

        {/* TOP FILTER BAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <span className="text-sm font-bold text-gray-500 uppercase">
              Class:
            </span>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setSelectedStudentIds([]);
              }}
              className="border border-gray-300 rounded-lg p-2 text-sm font-semibold focus:ring-2 focus:ring-pink-500 outline-none w-40 cursor-pointer bg-gray-50"
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
                className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-pink-500 outline-none bg-gray-50"
              />
            </div>
          )}
        </div>

        {/* COMPACT ACTION BAR (Only shows if students are selected) */}
        {selectedGrade && selectedStudentIds.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-wrap items-center justify-between gap-4 animate-fade-in">
            <span className="text-indigo-800 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">
              {selectedStudentIds.length} Selected
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Type custom msg here..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="border border-indigo-200 rounded px-3 py-1.5 text-sm w-48 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={sendCustomBulk}
                disabled={!whatsappReady}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition"
              >
                💬 Send
              </button>
              <span className="text-indigo-200 mx-1">|</span>
              <button
                onClick={sendReportCardsToParents}
                disabled={!whatsappReady}
                className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition"
              >
                Report Card
              </button>
              <button
                onClick={sendClassTestReportsToParents}
                disabled={!whatsappReady}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition"
              >
                Class Test
              </button>
              <button
                onClick={sendNtseReportsToParents}
                disabled={!whatsappReady}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition"
              >
                NTSE
              </button>
              <button
                onClick={sendPtReportsToParents}
                disabled={!whatsappReady}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded transition"
              >
                PT
              </button>
            </div>
          </div>
        )}

        {/* MAIN TABLE */}
        {selectedGrade ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-gray-600 uppercase tracking-wider text-[11px]">
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
                  <th className="py-3 px-4 font-bold">Student Detail</th>
                  <th className="py-3 px-4 font-bold text-center">
                    Attached Documents
                  </th>
                  <th className="py-3 px-2 font-bold text-center w-32">
                    WA Status
                  </th>
                  <th className="py-3 px-4 font-bold text-right">
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
                        className="hover:bg-pink-50/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student._id)}
                            onChange={(e) =>
                              handleCheckboxChange(
                                student._id,
                                e.target.checked,
                              )
                            }
                            className="cursor-pointer rounded text-pink-600 focus:ring-pink-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/students/${student._id}`}
                            className="font-bold text-gray-900 hover:text-pink-600 block text-base"
                          >
                            {student.fullName}
                          </Link>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {student.studentId} • Roll:{" "}
                            {student.rollNumber || "-"}
                          </div>
                        </td>

                        {/* 🌟 PROPER DOCUMENT MENTION SECTION 🌟 */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col gap-1 items-center justify-center bg-gray-50 border border-gray-100 rounded-lg p-2 min-w-[140px]">
                            {hasAnyDoc ? (
                              <>
                                <div className="flex flex-wrap justify-center gap-1 w-full">
                                  {hasReportCard && (
                                    <span
                                      className="bg-pink-100 text-pink-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-pink-200"
                                      title="Report Card"
                                    >
                                      RC
                                    </span>
                                  )}
                                  {hasClassTest && (
                                    <span
                                      className="bg-blue-100 text-blue-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-200"
                                      title="Class Test"
                                    >
                                      CT
                                    </span>
                                  )}
                                  {hasNtse && (
                                    <span
                                      className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-200"
                                      title="NTSE Report"
                                    >
                                      NTSE
                                    </span>
                                  )}
                                  {hasPt && (
                                    <span
                                      className="bg-teal-100 text-teal-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-teal-200"
                                      title="Periodic Test"
                                    >
                                      PT
                                    </span>
                                  )}
                                </div>
                                <span
                                  className="text-[9px] text-gray-500 flex items-center gap-1 font-medium mt-0.5"
                                  title="Last Updated Date"
                                >
                                  🗓️ Updated: {formatDate(student.updatedAt)}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400 text-[11px] italic py-1">
                                No Docs Uploaded
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-2 text-center">
                          {currentStatus && currentStatus !== "Idle" && (
                            <span
                              className={`text-[9px] font-bold px-2 py-1 rounded-full ${currentStatus.includes("Sent") ? "bg-green-100 text-green-700" : currentStatus.includes("Failed") ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                            >
                              {currentStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {personalMessageStudentId === student._id ? (
                            <div className="flex items-center gap-1 justify-end">
                              <input
                                type="text"
                                value={personalMessageContent}
                                onChange={(e) =>
                                  setPersonalMessageContent(e.target.value)
                                }
                                placeholder="Type..."
                                className="text-[11px] border rounded px-2 py-1 w-32 focus:outline-none focus:border-pink-500"
                                autoFocus
                              />
                              <button
                                onClick={() => sendPersonalMsg(student)}
                                disabled={
                                  !personalMessageContent.trim() ||
                                  !whatsappReady
                                }
                                className="text-green-600 font-bold px-1 text-sm hover:scale-110"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => {
                                  setPersonalMessageStudentId(null);
                                  setPersonalMessageContent("");
                                }}
                                className="text-red-500 font-bold px-1 text-sm hover:scale-110"
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
                                className="text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-100 p-2 rounded-lg transition"
                                title="Message"
                              >
                                💬
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
                                    className={`p-2 rounded-lg transition ${hasReportCard ? "text-gray-500 hover:text-green-600 bg-gray-100 hover:bg-green-100" : "text-gray-300 bg-gray-50 cursor-not-allowed"}`}
                                    title={
                                      hasReportCard
                                        ? "View Generated Report Card"
                                        : "No Default Report Card"
                                    }
                                  >
                                    📄
                                  </button>
                                </Dialog.Trigger>
                                <Dialog.Portal>
                                  <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
                                  <Dialog.Content className="fixed inset-4 md:inset-10 bg-white rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col">
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
                                      <ReportCardPage studentId={student._id} />
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
                      className="text-center py-16 text-gray-400 font-medium"
                    >
                      <div className="text-4xl mb-3">📭</div>
                      No students found. Try changing the search or class
                      filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center py-20">
            <span className="text-6xl text-gray-300">🎓</span>
            <h2 className="text-xl font-bold text-gray-700 mt-4">
              Select a Class
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Please select a class from the top dropdown to view students,
              their last document updates, and manage WhatsApp reporting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentListPage;
