// ReportCardPage.jsx - Highly Optimized and Bug-Free Version
import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import studentService from "../services/studentService";
import gradeService from "../services/gradeService";
import behavioralReportService from "../services/behavioralReportService";
import rankService from "../services/rankService";
import "./ReportCard.css";
import domtoimage from "dom-to-image";
import axios from "axios";

const LOGO_URL =
  "https://res.cloudinary.com/dityqhoqp/image/upload/v1757673591/UNMARK_LOGO_copy_1_nonp8j.png";

const EVALUATION_AREAS = [
  "Punctuality",
  "Attendance",
  "Responsibility",
  "Respect",
  "Cooperation",
  "Initiative",
  "Completes Work",
];

// --- PURE HELPER FUNCTIONS (Moved outside to improve React performance) ---
const isArtSubject = (subjectName) => {
  return !!String(subjectName || "")
    .trim()
    .match(/^(arts|art|art\s*and\s*craft|art\s*&\s*craft)$/i);
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "N/A";
  const birthDate = new Date(dateOfBirth);
  if (isNaN(birthDate)) return "N/A"; // Handle invalid date strings safely

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const gradeColorClass = (grade) => {
  if (!grade) return "grade-none";
  const g = String(grade).toUpperCase();
  if (
    g.includes("A1") ||
    g.includes("A2") ||
    g.includes("A+") ||
    g.includes("A-")
  )
    return "grade-excellent";
  if (
    g.includes("B1") ||
    g.includes("B2") ||
    g.includes("B+") ||
    g.includes("B-")
  )
    return "grade-good";
  if (
    g.includes("C1") ||
    g.includes("C2") ||
    g.includes("C+") ||
    g.includes("C-")
  )
    return "grade-average";
  if (g.includes("D")) return "grade-below";
  if (g.includes("E")) return "grade-poor";
  return "grade-none";
};

const formatScore = (num) => {
  if (num === null || num === undefined) return "-";
  return Number.isInteger(num) ? num.toString() : Number(num).toFixed(2);
};

// --- MAIN COMPONENT ---
const ReportCardPage = ({ studentId }) => {
  const { id: routeId } = useParams();
  const id = studentId || routeId;
  const API_URL = import.meta.env.VITE_API_URL;

  // --- state ---
  const [userRole, setUserRole] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [student, setStudent] = useState(null);
  const [allGrades, setAllGrades] = useState([]);
  const [allReports, setAllReports] = useState([]);

  // Ranks
  const [rank1stSem, setRank1stSem] = useState("-");
  const [rank2ndSem, setRank2ndSem] = useState("-");
  const [overallRank, setOverallRank] = useState("-");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [darkTheme, setDarkTheme] = useState(false);
  const [visible, setVisible] = useState(false);

  // View types: reportCard, classTest, ntseTest, ptTest
  const [viewType, setViewType] = useState("reportCard");

  // --- data fetching ---
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [studentRes, gradesRes, reportsRes] = await Promise.all([
          studentService.getStudentById(id),
          gradeService.getGradesByStudent(id),
          behavioralReportService.getReportsByStudent(id),
        ]);

        const studentData = studentRes?.data?.data || null;
        const gradesData = gradesRes?.data?.data || [];
        const reportsData = reportsRes?.data?.data || [];

        setStudent(studentData);
        setAllGrades(gradesData);
        setAllReports(reportsData);

        if (studentData) {
          const firstReport = reportsData.find(
            (r) => r.semester === "First Semester",
          );
          const secondReport = reportsData.find(
            (r) => r.semester === "Second Semester",
          );
          const academicYear = firstReport?.academicYear;
          const gradeLevel = studentData.gradeLevel;

          if (academicYear) {
            const rankPromises = [
              rankService.getRank({
                studentId: id,
                academicYear,
                semester: "First Semester",
                gradeLevel,
              }),
              secondReport
                ? rankService.getRank({
                    studentId: id,
                    academicYear,
                    semester: "Second Semester",
                    gradeLevel,
                  })
                : Promise.resolve(null),
              rankService.getOverallRank({
                studentId: id,
                academicYear,
                gradeLevel,
              }),
            ];

            const [rank1Res, rank2Res, overallRankRes] =
              await Promise.allSettled(rankPromises);

            setRank1stSem(
              rank1Res.status === "fulfilled"
                ? (rank1Res.value?.data?.rank ?? "N/A")
                : "N/A",
            );
            setRank2ndSem(
              rank2Res.status === "fulfilled" && rank2Res.value
                ? (rank2Res.value?.data?.rank ?? "N/A")
                : "N/A",
            );
            setOverallRank(
              overallRankRes.status === "fulfilled"
                ? (overallRankRes.value?.data?.rank ?? "N/A")
                : "N/A",
            );
          }
        }
      } catch (err) {
        console.error("fetchAllData error:", err);
        setError("Failed to load all necessary report card data.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAllData();
  }, [id]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUserRole(userObj.role);
        setTeacher(userObj.username);
      } catch (e) {
        console.warn("Failed to parse stored user:", e);
      }
    }
  }, []);

  useEffect(() => {
    setVisible(true);
  }, []);

  // --- FILTER GRADES BASED ON viewType ---
  const filteredGrades = useMemo(() => {
    if (!allGrades || allGrades.length === 0) return [];

    const isPTName = (name) => {
      const lower = name.toLowerCase();
      return (
        lower.includes("periodic") ||
        lower.includes("pt-") ||
        lower.includes("pt ")
      );
    };

    const mapped = allGrades.map((gradeRecord) => {
      const cloned = { ...gradeRecord };
      if (Array.isArray(cloned.assessments)) {
        cloned.assessments = cloned.assessments.filter((a) => {
          const name = a.assessmentType?.name ?? "";
          const isClassTest = /class\s*test/i.test(name);
          const isNTSE = /ntse/i.test(name);
          const isPT = isPTName(name);

          if (viewType === "classTest") return isClassTest;
          if (viewType === "ntseTest") return isNTSE;
          if (viewType === "ptTest") return isPT;

          return !isClassTest && !isNTSE; // Default reportCard
        });
      }
      return cloned;
    });

    if (
      viewType === "classTest" ||
      viewType === "ntseTest" ||
      viewType === "ptTest"
    ) {
      return mapped.filter(
        (g) => Array.isArray(g.assessments) && g.assessments.length > 0,
      );
    }
    return mapped;
  }, [allGrades, viewType]);

  // Extract unique assessment types and max marks safely
  const assessmentTypesByTerm = useMemo(() => {
    const term1Types = new Map();
    const term2Types = new Map();

    filteredGrades.forEach((gradeRecord) => {
      if (
        gradeRecord.assessments &&
        Array.isArray(gradeRecord.assessments) &&
        gradeRecord.semester
      ) {
        gradeRecord.assessments.forEach(({ assessmentType }) => {
          const name = assessmentType?.name;
          if (!name) return;
          const mapTarget =
            gradeRecord.semester === "First Semester" ? term1Types : term2Types;

          if (
            !mapTarget.has(name) ||
            (assessmentType.totalMarks &&
              assessmentType.totalMarks > mapTarget.get(name))
          ) {
            mapTarget.set(name, assessmentType.totalMarks ?? null);
          }
        });
      }
    });

    const sortOrder = [
      "Periodic Test-I",
      "Periodic Test-II",
      "Periodic Test-III",
      "Periodic Test-IV",
      "PT-I",
      "PT-I (20)",
      "PT-I (10)",
      "PT-I (5)",
      "PT-II",
      "PT-II (20)",
      "SA-I",
      "SA - I",
      "SA-I (80)",
      "SA-II",
      "SA - II",
      "SA-II (80)",
      "NTSE",
    ];

    const sortMap = (entries) =>
      Array.from(entries.entries()).sort(([a], [b]) => {
        const ia = sortOrder.findIndex((p) =>
          a.toLowerCase().includes(p.toLowerCase()),
        );
        const ib = sortOrder.findIndex((p) =>
          b.toLowerCase().includes(p.toLowerCase()),
        );
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

    return {
      term1: sortMap(term1Types),
      term2: sortMap(term2Types),
    };
  }, [filteredGrades]);

  // Group grades by subject & Filter out blanks (----)
  const groupedGrades = useMemo(() => {
    if (!filteredGrades || filteredGrades.length === 0) return [];
    const subjectMap = new Map();

    filteredGrades.forEach((gradeRecord) => {
      const subName = gradeRecord.subject?.name || "";
      // Safe check to avoid rendering garbage '----' subjects
      if (!subName || subName.replace(/-/g, "").trim() === "") return;

      const subjectId = gradeRecord.subject?._id ?? subName;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: gradeRecord.subject,
          semesters: { "First Semester": null, "Second Semester": null },
        });
      }
      const entry = subjectMap.get(subjectId);
      entry.semesters[gradeRecord.semester] = gradeRecord;
    });

    return Array.from(subjectMap.values());
  }, [filteredGrades]);

  // --- SAFE MARKS CALCULATOR HELPERS ---\n  
  const getDynamicAssessment = (subjectSemData, assessmentName) => {
    if (!subjectSemData || !subjectSemData.assessments) return null;
    return subjectSemData.assessments.find(
      (a) => a.assessmentType?.name === assessmentName,
    );
  };

  const getRowTotalAndMax = (semesterData, assessmentColumns) => {
    let total = 0;
    let max = 0;

    assessmentColumns.forEach(([name]) => {
      const assess = getDynamicAssessment(semesterData, name);
      // FIX: Rely on actual object's totalMarks/maxMarks, not the table column array
      if (assess) {
        const specificMax = assess.maxMarks ?? assess.assessmentType?.totalMarks ?? 0;
        
        if (
          assess.score !== null &&
          assess.score !== undefined &&
          assess.score !== ""
        ) {
          const scoreStr = String(assess.score).trim().toUpperCase();
          let scoreNum = Number(assess.score);

          if (isNaN(scoreNum)) {
            if (scoreStr === "AB" || scoreStr === "ABSENT") {
              scoreNum = 0;
            } else {
              return;
            }
          }

          total += scoreNum;
          max += Number(specificMax); // Use true specific subject maximum mark!
        }
      }
    });

    return { total, max };
  };

  // Grand totals for each term (Excludes Arts and Crafts)
  const grandTotals = useMemo(() => {
    let term1 = { obtained: 0, max: 0 };
    let term2 = { obtained: 0, max: 0 };

    groupedGrades.forEach(({ subject, semesters }) => {
      if (isArtSubject(subject?.name)) return; // SKIP Arts from grand total

      const s1Stats = getRowTotalAndMax(
        semesters["First Semester"],
        assessmentTypesByTerm.term1,
      );
      const s2Stats = getRowTotalAndMax(
        semesters["Second Semester"],
        assessmentTypesByTerm.term2,
      );

      term1.obtained += s1Stats.total;
      term1.max += s1Stats.max;

      term2.obtained += s2Stats.total;
      term2.max += s2Stats.max;
    });

    return { term1, term2 };
  }, [groupedGrades, assessmentTypesByTerm]);

  
  // Grand totals for each term (Excludes Arts and Crafts)


  // --- RENDERING HELPERS ---
  const renderScoreOrGrade = (score, maxScore, subjectName) => {
    if (score === "-" || score === null || score === undefined || score === "")
      return "-";

    const scoreStr = String(score).trim().toUpperCase();
    if (scoreStr === "AB" || scoreStr === "ABSENT") return "AB";

    const numScore = Number(score);
    if (isNaN(numScore)) return score;

    if (isArtSubject(subjectName) && maxScore) {
      const percent = (numScore / maxScore) * 100;
      if (percent >= 91) return "A+";
      if (percent >= 81) return "A-";
      if (percent >= 71) return "B+";
      if (percent >= 61) return "B-";
      if (percent >= 51) return "C+";
      if (percent >= 41) return "C-";
      if (percent >= 33) return "D";
      return "E";
    }

    return formatScore(numScore);
  };

  const calculateGrade = (totalScore, maxScore, subjectName) => {
    if (!maxScore || maxScore === 0) return "-";
    const percent = (totalScore / maxScore) * 100;

    if (isArtSubject(subjectName)) {
      if (percent >= 91) return "A+";
      if (percent >= 81) return "A-";
      if (percent >= 71) return "B+";
      if (percent >= 61) return "B-";
      if (percent >= 51) return "C+";
      if (percent >= 41) return "C-";
      if (percent >= 33) return "D";
      return "E";
    }

    if (percent >= 91) return "A1";
    if (percent >= 81) return "A2";
    if (percent >= 71) return "B1";
    if (percent >= 61) return "B2";
    if (percent >= 51) return "C1";
    if (percent >= 41) return "C2";
    if (percent >= 33) return "D";
    return "E";
  };

  // Safe formatting for Teacher Name
  const formattedTeacherName =
    teacher && teacher.trim() !== ""
      ? teacher.trim().charAt(0).toUpperCase() +
        teacher.trim().slice(1).toLowerCase()
      : "Admin";

  // --- ACTIONS ---
  const handlePrint = () => {
    const printableContent = document.getElementById("printableArea");
    if (!printableContent) return;
    const contentToPrint = printableContent.innerHTML;
    let styles = "";
    for (const sheet of document.styleSheets) {
      try {
        styles += Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch (e) {}
    }
    const printWindow = window.open("", "", "height=800,width=1000");
    if (!printWindow) return alert("Please allow pop-ups to print.");
    printWindow.document.write(
      `<html><head><title>Print Report Card</title><style>${styles}</style></head><body>${contentToPrint}</body></html>`,
    );
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 600);
  };

  const generateReportCardImage = async () => {
    const originalMeta = document.querySelector("meta[name=viewport]");
    const newMeta = document.createElement("meta");
    newMeta.name = "viewport";
    newMeta.content = "width=1100";
    document.head.appendChild(newMeta);
    if (originalMeta) originalMeta.remove();

    await new Promise((r) => setTimeout(r, 300));
    const node = document.getElementById("reportCard");

    const dataUrl = await domtoimage.toPng(node, {
      quality: 1,
      bgcolor: "white",
      width: node.scrollWidth * 2,
      height: node.scrollHeight * 2,
      style: {
        transform: "scale(2)",
        transformOrigin: "top left",
        width: `${node.scrollWidth}px`,
        height: `${node.scrollHeight}px`,
      },
    });

    document.head.removeChild(newMeta);
    if (originalMeta) document.head.appendChild(originalMeta);
    return dataUrl;
  };

  const handleCapture = async () => {
    try {
      const dataUrl = await generateReportCardImage();
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${student?.fullName || "report-card"}.png`;
      link.click();
    } catch (err) {
      console.error("Capture failed:", err);
    }
  };

  const saveReportCardToCloud = async (studentIdToSave) => {
    setUploading(true);
    try {
      const dataUrl = await generateReportCardImage();
      const blob = await (await fetch(dataUrl)).blob();
      const timestamp = new Date()
        .toLocaleString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        })
        .replace(/, /g, "_")
        .replace(/ /g, "_")
        .replace(/:/g, "");
      const studentName = (student?.fullName || "student").replace(/\s+/g, "_");
      const grade = (student?.gradeLevel || "grade").replace(/\s+/g, "_");

      const typeSuffix =
        viewType === "classTest"
          ? "class_test"
          : viewType === "ntseTest"
            ? "ntse_test"
            : viewType === "ptTest"
              ? "pt_test"
              : "report_card";
      const fileName = `${studentName}_${grade}_${typeSuffix}_${timestamp}.png`;

      const formData = new FormData();
      formData.append("file", blob, fileName);

      const endpoints = {
        classTest: "/class-test-report",
        ntseTest: "/ntse-report",
        ptTest: "/pt-report",
        reportCard: "/report-card",
      };

      await axios.post(
        `${API_URL}/students/${studentIdToSave}${endpoints[viewType]}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      alert("Report uploaded successfully!");
      window.location.reload();
    } catch (err) {
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteUploadedReport = async (studentIdToDelete) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    setUploading(true);
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const endpoints = {
        classTest: "/class-test-report",
        ntseTest: "/ntse-report",
        ptTest: "/pt-report",
        reportCard: "/report-card",
      };
      await axios.delete(
        `${API_URL}/students/${studentIdToDelete}${endpoints[viewType]}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Report deleted successfully.");
      window.location.reload();
    } catch (error) {
      alert("Failed to delete report.");
    }
    setUploading(false);
  };

  if (loading)
    return <p className="loading">Generating Authentic Report Card...</p>;
  if (error) return <p className="error">{error}</p>;

  const firstSemesterReport = allReports.find(
    (r) => r.semester === "First Semester",
  );
  const secondSemesterReport = allReports.find(
    (r) => r.semester === "Second Semester",
  );
  const hasTerm2Data = filteredGrades.some(
    (grade) => grade.semester === "Second Semester",
  );

  const dialogImageSrc =
    viewType === "classTest"
      ? student?.reportClassTestUrl
      : viewType === "ntseTest"
        ? student?.reportNTSEUrl
        : viewType === "ptTest"
          ? student?.reportPTUrl
          : student?.reportCardUrl;

  return (
    <div
      className={`report-card-container ${darkTheme ? "dark-theme" : "light-theme"}`}
    >
      <div
        className="controls no-print"
        style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}
      >
        <div
          className="right-controls"
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            alignItems: "center",
            width: "100%",
            maxWidth: 800,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className={`btn ${viewType === "reportCard" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewType("reportCard")}
            >
              Full Report
            </button>
            <button
              className={`btn ${viewType === "classTest" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewType("classTest")}
            >
              Class Test
            </button>
            <button
              className={`btn ${viewType === "ntseTest" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewType("ntseTest")}
            >
              🧠 NTSE
            </button>
            <button
              className={`btn ${viewType === "ptTest" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setViewType("ptTest")}
            >
              Periodic Test
            </button>
          </div>

          <button className="btn btn-outline" onClick={handlePrint}>
            🖨 Print
          </button>
          <button className="btn btn-outline" onClick={handleCapture}>
            📸 Save
          </button>

          {(userRole === "teacher" || userRole === "admin") && (
            <>
              {dialogImageSrc ? (
                <>
                  <button
                    className="btn btn-green"
                    disabled={uploading}
                    onClick={() => setDialogOpen(true)}
                  >
                    &#10003; Uploaded
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={uploading}
                    onClick={() => saveReportCardToCloud(id)}
                  >
                    {uploading ? "..." : "Re-upload"}
                  </button>
                  <button
                    className="btn btn-red"
                    disabled={uploading}
                    onClick={() => handleDeleteUploadedReport(student._id)}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  disabled={uploading}
                  onClick={() => saveReportCardToCloud(id)}
                >
                  ⬆ Upload Report
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {dialogOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            padding: "20px",
            overflowY: "auto",
          }}
          onClick={() => setDialogOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              padding: 20,
              width: "100%",
              maxWidth: 920,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Uploaded Report</h3>
            {dialogImageSrc ? (
              <img
                src={dialogImageSrc}
                alt="Report"
                style={{ maxWidth: "100%" }}
              />
            ) : (
              <p>No image</p>
            )}
            <button
              className="btn btn-primary"
              style={{ marginTop: 10, width: "100%" }}
              onClick={() => setDialogOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* REPORT CARD UI */}
      <div
        id="reportCard"
        className={`paper-wrap fade-in ${visible ? "visible" : ""}`}
      >
        <div id="printableArea" className="sheet-paper">
          <header className="rc-header">
            <div className="rc-left">
              <img src={LOGO_URL} alt="logo" className="rc-logo" />
            </div>
            <div className="rc-center">
              <div className="school-name">Aneja Kiddos School</div>
              <div className="school-sub">Ansal Town, Sector-19, Rewari</div>
              <div className="doc-title">
                {viewType === "reportCard"
                  ? "Progress Report Card"
                  : `${viewType.replace("Test", " Test").toUpperCase()} Report`}
              </div>
              <div className="session">
                Academic Year:{" "}
                {firstSemesterReport?.academicYear || "2025-2026"}
              </div>
            </div>
            <div className="rc-right">
              <div className="small-meta">
                <div>
                  <strong>Grade:</strong> {student?.gradeLevel || "-"}
                </div>
                <div>
                  <strong>ID:</strong> {student?.studentId || "-"}
                </div>
              </div>
            </div>
          </header>

          <section className="student-card">
            <div className="student-left">
              {student?.imageUrl ? (
                <img
                  src={student.imageUrl}
                  alt="student"
                  className="student-photo"
                />
              ) : (
                <div className="student-photo placeholder">Photo</div>
              )}
            </div>
            <div className="student-right">
              <div className="profile-grid">
                <div className="profile-item">
                  <span className="label">Student's Name</span>
                  <span className="value">{student?.fullName || "-"}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Father's Name</span>
                  <span className="value">
                    {student?.parentContact?.parentName || "-"}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="label">Class / Section</span>
                  <span className="value">
                    {student?.gradeLevel || "-"} / {student?.section || "-"}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="label">Date of Birth</span>
                  <span className="value">
                    {student?.dateOfBirth
                      ? new Date(student.dateOfBirth).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="label">Roll Number</span>
                  <span className="value">{student?.rollNumber || "-"}</span>
                </div>
                <div className="profile-item">
                  <span className="label">Mobile</span>
                  <span className="value">
                    {student?.parentContact?.phone || "-"}
                  </span>
                </div>
                <div className="profile-item">
                  <span className="label">Age</span>
                  <span className="value">
                    {calculateAge(student?.dateOfBirth)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="scholastic">
            <div className="section-header">
              <h4>Academic Results</h4>
            </div>
            <div className="table-scroll">
              <table className="rc-table">
                <thead>
                  <tr>
                    <th className="col-num">#</th>
                    <th className="col-sub">SUBJECTS</th>
                    <th
                      colSpan={assessmentTypesByTerm.term1.length + 2}
                      className="term-head"
                    >
                      TERM I
                    </th>
                    {hasTerm2Data && (
                      <th
                        colSpan={assessmentTypesByTerm.term2.length + 2}
                        className="term-head"
                      >
                        TERM II
                      </th>
                    )}
                  </tr>
                  <tr>
                    <th className="col-num subhead" />
                    <th className="col-sub subhead" />
                    {assessmentTypesByTerm.term1.map(([name], i) => (
                      <th key={`t1-head-${i}`} className="subhead">
                        {name}
                      </th>
                    ))}
                    <th className="subhead">Marks Obtained</th>
                    <th className="subhead">Grade</th>
                    {hasTerm2Data &&
                      assessmentTypesByTerm.term2.map(([name], i) => (
                        <th key={`t2-head-${i}`} className="subhead">
                          {name}
                        </th>
                      ))}
                    {hasTerm2Data && (
                      <th className="subhead">Marks Obtained</th>
                    )}
                    {hasTerm2Data && <th className="subhead">Grade</th>}
                  </tr>
                  <tr>
                    <th className="col-num">Total</th>
                    <th className="col-sub" />
                    {assessmentTypesByTerm.term1.map(([_, total], i) => (
                      <th key={`tm1-${i}`} className="sub-total">
                        {total ? `(${total})` : ""}
                      </th>
                    ))}
                    <th className="sub-total">Total</th>
                    <th className="sub-total" />
                    {hasTerm2Data &&
                      assessmentTypesByTerm.term2.map(([_, total], i) => (
                        <th key={`tm2-${i}`} className="sub-total">
                          {total ? `(${total})` : ""}
                        </th>
                      ))}
                    {hasTerm2Data && (
                      <>
                        <th className="sub-total" />
                        <th className="sub-total" />
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {groupedGrades.map(({ subject, semesters }, idx) => {
                    const s1Stats = getRowTotalAndMax(
                      semesters["First Semester"],
                      assessmentTypesByTerm.term1,
                    );
                    const s2Stats = hasTerm2Data
                      ? getRowTotalAndMax(
                          semesters["Second Semester"],
                          assessmentTypesByTerm.term2,
                        )
                      : null;

                    return (
                      <tr key={`row-${subject?._id ?? idx}`}>
                        <td className="col-num">{idx + 1}</td>
                        <td className="col-sub left">
                          <b>{subject?.name}</b>
                        </td>

                        {assessmentTypesByTerm.term1.map(
                          ([name, maxMarks], i) => {
                            const assess = getDynamicAssessment(
                              semesters["First Semester"],
                              name,
                            );
                                                       const actualMaxMarks = assess?.maxMarks ?? assess?.assessmentType?.totalMarks ?? maxMarks;
                            return (
                              <td key={`g1-${idx}-${i}`} className="score-cell">
                                {renderScoreOrGrade(
                                  assess ? assess.score : "-",
                                  maxMarks,
                                  subject?.name,
                                )}
                              </td>
                            );
                          },
                        )}

                        <td
                          className={`score-cell ${gradeColorClass(calculateGrade(s1Stats.total, s1Stats.max, subject?.name))}`}
                        >
                          {s1Stats.max > 0 ? formatScore(s1Stats.total) : "-"}
                        </td>
                        <td
                          className={`score-cell ${gradeColorClass(calculateGrade(s1Stats.total, s1Stats.max, subject?.name))}`}
                        >
                          {calculateGrade(
                            s1Stats.total,
                            s1Stats.max,
                            subject?.name,
                          )}
                        </td>

                        {hasTerm2Data && (
                          <>
                            {assessmentTypesByTerm.term2.map(
                              ([name, maxMarks], i) => {
                                const assess = getDynamicAssessment(
                                  semesters["Second Semester"],
                                  name,
                                );
                                                           const actualMaxMarks = assess?.maxMarks ?? assess?.assessmentType?.totalMarks ?? maxMarks;
                                return (
                                  <td
                                    key={`g2-${idx}-${i}`}
                                    className="score-cell"
                                  >
                                    {renderScoreOrGrade(
                                      assess ? assess.score : "-",
                                      maxMarks,
                                      subject?.name,
                                    )}
                                  </td>
                                );
                              },
                            )}
                            <td
                              className={`score-cell ${gradeColorClass(calculateGrade(s2Stats.total, s2Stats.max, subject?.name))}`}
                            >
                              {s2Stats.max > 0
                                ? formatScore(s2Stats.total)
                                : "-"}
                            </td>
                            <td
                              className={`score-cell ${gradeColorClass(calculateGrade(s2Stats.total, s2Stats.max, subject?.name))}`}
                            >
                              {calculateGrade(
                                s2Stats.total,
                                s2Stats.max,
                                subject?.name,
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {/* Empty rows filler (Ensures uniform layout) */}
                  {Array.from({
                    length: Math.max(0, 10 - groupedGrades.length),
                  }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="col-num">
                        {groupedGrades.length + i + 1}
                      </td>
                      <td className="col-sub left">&nbsp;</td>
                      {assessmentTypesByTerm.term1.map((_, j) => (
                        <td key={`e1-${i}-${j}`}>&nbsp;</td>
                      ))}
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      {hasTerm2Data &&
                        assessmentTypesByTerm.term2.map((_, j) => (
                          <td key={`e2-${i}-${j}`}>&nbsp;</td>
                        ))}
                      {hasTerm2Data && (
                        <>
                          <td>&nbsp;</td>
                          <td>&nbsp;</td>
                        </>
                      )}
                    </tr>
                  ))}

                  <tr className="totals-row">
                    <td colSpan="2" className="left">
                      <strong>Total</strong>
                    </td>
                    {assessmentTypesByTerm.term1.map((_, i) => (
                      <td key={`t1-space-${i}`} className="score-cell" />
                    ))}
                    <td className="score-cell">
                      <b>
                        {formatScore(grandTotals.term1.obtained)} /{" "}
                        {grandTotals.term1.max}
                      </b>
                    </td>
                    <td className="score-cell">
                      <b>
                        {grandTotals.term1.max > 0
                          ? (
                              (grandTotals.term1.obtained /
                                grandTotals.term1.max) *
                              100
                            ).toFixed(2)
                          : "0.00"}
                        %
                      </b>
                    </td>
                    {hasTerm2Data && (
                      <>
                        {assessmentTypesByTerm.term2.map((_, i) => (
                          <td key={`t2-space-${i}`} className="score-cell" />
                        ))}
                        <td className="score-cell">
                          <b>
                            {formatScore(grandTotals.term2.obtained)} /{" "}
                            {grandTotals.term2.max}
                          </b>
                        </td>
                        <td className="score-cell">
                          <b>
                            {grandTotals.term2.max > 0
                              ? (
                                  (grandTotals.term2.obtained /
                                    grandTotals.term2.max) *
                                  100
                                ).toFixed(2)
                              : "0.00"}
                            %
                          </b>
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {viewType === "reportCard" && (
            <section className="co-scholastic">
              <h4>Personality Traits & Skills</h4>
              <div className="traits-grid">
                <table className="traits-table">
                  <thead>
                    <tr>
                      <th>TRAITS</th>
                      <th>1st Sem</th>
                      {hasTerm2Data && <th>2nd Sem</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {EVALUATION_AREAS.map((area, i) => (
                      <tr key={`trait-${i}`}>
                        <td className="left">{area}</td>
                        <td>
                          {firstSemesterReport?.evaluations?.find(
                            (e) => e.area === area,
                          )?.result ?? "-"}
                        </td>
                        {hasTerm2Data && (
                          <td>
                            {secondSemesterReport?.evaluations?.find(
                              (e) => e.area === area,
                            )?.result ?? "-"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="co-cards">
                  <div className="co-card">
                    <h5>Teacher's Remark Ist Semester</h5>
                    <p>{firstSemesterReport?.teacherComment ?? "-"}</p>
                  </div>
                  {hasTerm2Data && (
                    <div className="co-card">
                      <h5>Teacher's Remark IInd Semester</h5>
                      <p>{secondSemesterReport?.teacherComment ?? "-"}</p>
                    </div>
                  )}
                  <div className="co-card">
                    <h5>Message to Parents</h5>
                    <p>
                      {firstSemesterReport?.messageToParents ??
                        "Please support your child's learning at home."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="signatures">
            <div className="sig-col">
              <div className="sig-box">
                <p className="sig-label">{formattedTeacherName}</p>
                <div className="sig-label">Class Teacher</div>
              </div>
            </div>
            <div className="sig-col">
              <div className="sig-box">
                <p className="sig-label">Nidhi Dhamija</p>
                <div className="sig-label">Principal</div>
              </div>
            </div>
            <div className="sig-col">
              <div className="sig-box">
                <p className="sig-label">
                  {student?.parentContact?.parentName || "Parent"}
                </p>
                <div className="sig-label">Parent / Guardian</div>
              </div>
            </div>
          </section>
          <footer className="rc-footer">
            <div className="footer-msg">
              You leaped and crossed the hindrances & put a flag of victory with
              great enthusiasm!
            </div>
            <div className="footer-sub">
              Wishing you a bright and successful future.
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ReportCardPage;
