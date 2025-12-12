// // ReportCardPage.jsx - Complete code with NTSE Class Test added
// import React, { useState, useEffect, useMemo } from "react";
// import { useParams, Link } from "react-router-dom";
// import studentService from "../services/studentService";
// import gradeService from "../services/gradeService";
// import behavioralReportService from "../services/behavioralReportService";
// import rankService from "../services/rankService";
// import "./ReportCard.css";
// import domtoimage from "dom-to-image";
// import axios from "axios";

// const LOGO_URL =
//   "https://res.cloudinary.com/dityqhoqp/image/upload/v1757673591/UNMARK_LOGO_copy_1_nonp8j.png";

// const ReportCardPage = ({ studentId }) => {
//   const { id: routeId } = useParams();
//   const id = studentId || routeId;
//   const API_URL = import.meta.env.VITE_API_URL;

//   // --- state ---
//   const [userRole, setUserRole] = useState(null);
//   const [teacher, setTeacher] = useState(null);
//   const [student, setStudent] = useState(null);
//   const [allGrades, setAllGrades] = useState([]);
//   const [allReports, setAllReports] = useState([]);
//   const [rank1stSem, setRank1stSem] = useState("-");
//   const [rank2ndSem, setRank2ndSem] = useState("-");
//   const [overallRank, setOverallRank] = useState("-");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [uploading, setUploading] = useState(false);
//   const [dialogOpen, setDialogOpen] = useState(false);

//   // Theme toggle: false = light, true = dark
//   const [darkTheme, setDarkTheme] = useState(false);

//   // Fade-in animation trigger
//   const [visible, setVisible] = useState(false);

//   // View toggle options: reportCard, classTest, ntseTest
//   const [viewType, setViewType] = useState("reportCard");

//   // Digital signatures (Base64 data URLs)
//   const [signatures, setSignatures] = useState({
//     classTeacher: null,
//     principal: null,
//     parent: null,
//   });

//   // ---------- Art grade calculation ----------
//   const getArtGrade = (score) => {
//     if (score >= 91) return "A+";
//     if (score >= 81) return "A-";
//     if (score >= 71) return "B+";
//     if (score >= 61) return "B-";
//     if (score >= 51) return "C+";
//     if (score >= 41) return "C-";
//     if (score >= 33) return "D";
//     return "E";
//   };

//   // Render numeric score or Arts grade based on subject
//   const renderScoreOrGrade = (score, subjectName) => {
//     if (
//       subjectName === "Arts" ||
//       subjectName === "Art" ||
//       subjectName === "Art and Craft" ||
//       subjectName === "Art &Craft" ||
//       subjectName === "Art & Craft"
//     ) {
//       return getArtGrade(score);
//     }
//     return score !== null && score !== undefined ? score.toFixed(2) : "-";
//   };

//   // --- data fetching ---
//   useEffect(() => {
//     const fetchAllData = async () => {
//       setLoading(true);
//       try {
//         const [studentRes, gradesRes, reportsRes] = await Promise.all([
//           studentService.getStudentById(id),
//           gradeService.getGradesByStudent(id),
//           behavioralReportService.getReportsByStudent(id),
//         ]);

//         const studentData = studentRes?.data?.data || null;
//         const gradesData = gradesRes?.data?.data || [];
//         const reportsData = reportsRes?.data?.data || [];

//         setStudent(studentData);
//         setAllGrades(gradesData);
//         setAllReports(reportsData);

//         if (studentData) {
//           const firstReport = reportsData.find(
//             (r) => r.semester === "First Semester"
//           );
//           const secondReport = reportsData.find(
//             (r) => r.semester === "Second Semester"
//           );
//           const academicYear = firstReport?.academicYear;
//           const gradeLevel = studentData.gradeLevel;

//           if (academicYear) {
//             const rankPromises = [];

//             rankPromises.push(
//               rankService.getRank({
//                 studentId: id,
//                 academicYear,
//                 semester: "First Semester",
//                 gradeLevel,
//               })
//             );
//             if (secondReport) {
//               rankPromises.push(
//                 rankService.getRank({
//                   studentId: id,
//                   academicYear,
//                   semester: "Second Semester",
//                   gradeLevel,
//                 })
//               );
//             } else {
//               rankPromises.push(Promise.resolve(null));
//             }
//             rankPromises.push(
//               rankService.getOverallRank({
//                 studentId: id,
//                 academicYear,
//                 gradeLevel,
//               })
//             );

//             const [rank1Res, rank2Res, overallRankRes] =
//               await Promise.allSettled(rankPromises);

//             setRank1stSem(
//               rank1Res.status === "fulfilled"
//                 ? rank1Res.value?.data?.rank ?? "N/A"
//                 : "N/A"
//             );
//             setRank2ndSem(
//               rank2Res.status === "fulfilled" && rank2Res.value
//                 ? rank2Res.value?.data?.rank ?? "N/A"
//                 : "N/A"
//             );
//             setOverallRank(
//               overallRankRes.status === "fulfilled"
//                 ? overallRankRes.value?.data?.rank ?? "N/A"
//                 : "N/A"
//             );
//           }
//         }
//       } catch (err) {
//         console.error("fetchAllData error:", err);
//         setError("Failed to load all necessary report card data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) fetchAllData();
//   }, [id]);

//   // Read user role from localStorage
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser) {
//       try {
//         const userObj = JSON.parse(storedUser);
//         setUserRole(userObj.role);
//         setTeacher(userObj.username);
//       } catch (e) {
//         console.warn("Failed to parse stored user:", e);
//       }
//     }
//   }, []);

//   // Trigger fade-in after mount
//   useEffect(() => {
//     setVisible(true);
//   }, []);

//   // --- FILTER GRADES BASED ON viewType ---
//   // reportCard: exclude Class Test & NTSE assessments
//   // classTest: keep only Class Test assessments
//   // ntseTest: keep only NTSE assessments
//   const filteredGrades = useMemo(() => {
//     if (!allGrades || allGrades.length === 0) return [];

//     const mapGrades = allGrades.map((gradeRecord) => {
//       const cloned = { ...gradeRecord };
//       if (Array.isArray(cloned.assessments)) {
//         cloned.assessments = cloned.assessments.filter((a) => {
//           const name = a.assessmentType?.name ?? "";
//           const isClassTest = /class\s*test/i.test(name);
//           const isNTSE = /ntse/i.test(name);

//           if (viewType === "classTest") return isClassTest;
//           if (viewType === "ntseTest") return isNTSE;
//           // reportCard: exclude both
//           return !isClassTest && !isNTSE;
//         });
//       }
//       return cloned;
//     });

//     // For classTest/ntseTest views, remove gradeRecords with no remaining assessments
//     if (viewType === "classTest" || viewType === "ntseTest") {
//       return mapGrades.filter(
//         (g) => Array.isArray(g.assessments) && g.assessments.length > 0
//       );
//     }
//     // For full report, keep all gradeRecords (with class tests/NTSE removed)
//     return mapGrades;
//   }, [allGrades, viewType]);

//   // Group grades by subject with semester buckets (uses filteredGrades now)
//   const groupedGrades = useMemo(() => {
//     if (!filteredGrades || filteredGrades.length === 0) return [];
//     const subjectMap = new Map();
//     filteredGrades.forEach((gradeRecord) => {
//       const subjectId =
//         gradeRecord.subject?._id ?? gradeRecord.subject?.name ?? Math.random();
//       if (!subjectMap.has(subjectId)) {
//         subjectMap.set(subjectId, {
//           subject: gradeRecord.subject || { name: "----" },
//           semesters: {
//             "First Semester": null,
//             "Second Semester": null,
//           },
//         });
//       }
//       const entry = subjectMap.get(subjectId);
//       entry.semesters[gradeRecord.semester] = gradeRecord;
//     });
//     return Array.from(subjectMap.values());
//   }, [filteredGrades]);

//   const grandTotals = useMemo(() => {
//     let term1 = { obtained: 0, max: 0 };
//     let term2 = { obtained: 0, max: 0 };
//     groupedGrades.forEach(({ semesters }) => {
//       const s1 = semesters["First Semester"];
//       const s2 = semesters["Second Semester"];
//       if (s1?.assessments) {
//         s1.assessments.forEach((a) => {
//           term1.obtained += Number(a.score || 0);
//           term1.max += Number(a.assessmentType?.totalMarks || 0);
//         });
//       }
//       if (s2?.assessments) {
//         s2.assessments.forEach((a) => {
//           term2.obtained += Number(a.score || 0);
//           term2.max += Number(a.assessmentType?.totalMarks || 0);
//         });
//       }
//     });
//     return { term1, term2 };
//   }, [groupedGrades]);

//   // Extract unique assessment types and totals per term (uses filteredGrades)
//   const assessmentTypesByTerm = useMemo(() => {
//     const term1Types = new Map();
//     const term2Types = new Map();

//     filteredGrades.forEach((gradeRecord) => {
//       if (
//         gradeRecord.assessments &&
//         Array.isArray(gradeRecord.assessments) &&
//         gradeRecord.semester
//       ) {
//         gradeRecord.assessments.forEach(({ assessmentType }) => {
//           const name = assessmentType?.name;
//           if (!name) return;
//           const mapTarget =
//             gradeRecord.semester === "First Semester" ? term1Types : term2Types;
//           if (!mapTarget.has(name)) {
//             mapTarget.set(name, assessmentType.totalMarks ?? null);
//           }
//         });
//       }
//     });

//     const sortOrder = [
//       "PT-I",
//       "PT-I (20)",
//       "PT-I (10)",
//       "PT-I (5)",
//       "PT-II",
//       "PT-II (20)",
//       "SA-I",
//       "SA - I",
//       "SA-I (80)",
//       "SA-II",
//       "SA - II",
//       "SA-II (80)",
//       "NTSE", // Added NTSE to sort order
//     ];
//     const sortMap = (entries) =>
//       Array.from(entries.entries()).sort(([a], [b]) => {
//         const ia = sortOrder.findIndex((p) =>
//           a.toLowerCase().includes(p.toLowerCase())
//         );
//         const ib = sortOrder.findIndex((p) =>
//           b.toLowerCase().includes(p.toLowerCase())
//         );
//         if (ia === -1 && ib === -1) return a.localeCompare(b);
//         if (ia === -1) return 1;
//         if (ib === -1) return -1;
//         return ia - ib;
//       });

//     return {
//       term1: sortMap(term1Types),
//       term2: sortMap(term2Types),
//     };
//   }, [filteredGrades]);

//   // Compute totals and averages for footer summary
//   const totalsAndAverages = useMemo(() => {
//     const totals = {
//       term1: new Map(),
//       term2: new Map(),
//       term1FinalTotal: 0,
//       term1FinalCount: 0,
//       term2FinalTotal: 0,
//       term2FinalCount: 0,
//     };
//     const counts = {
//       term1: new Map(),
//       term2: new Map(),
//     };

//     assessmentTypesByTerm.term1.forEach(([name]) => {
//       totals.term1.set(name, 0);
//       counts.term1.set(name, 0);
//     });
//     assessmentTypesByTerm.term2.forEach(([name]) => {
//       totals.term2.set(name, 0);
//       counts.term2.set(name, 0);
//     });

//     groupedGrades.forEach(({ semesters }) => {
//       ["First Semester", "Second Semester"].forEach((sem) => {
//         const semesterData = semesters[sem];
//         if (!semesterData) return;
//         const termKey = sem === "First Semester" ? "term1" : "term2";
//         if (Array.isArray(semesterData.assessments)) {
//           semesterData.assessments.forEach(({ assessmentType, score }) => {
//             const name = assessmentType?.name;
//             if (!name) return;
//             if (totals[termKey].has(name)) {
//               totals[termKey].set(
//                 name,
//                 totals[termKey].get(name) + (score ?? 0)
//               );
//               counts[termKey].set(name, counts[termKey].get(name) + 1);
//             }
//           });
//         }
//         if (typeof semesterData.finalScore === "number") {
//           if (termKey === "term1") {
//             totals.term1FinalTotal += semesterData.finalScore;
//             totals.term1FinalCount++;
//           } else {
//             totals.term2FinalTotal += semesterData.finalScore;
//             totals.term2FinalCount++;
//           }
//         }
//       });
//     });

//     const averages = { term1: new Map(), term2: new Map() };

//     assessmentTypesByTerm.term1.forEach(([name]) => {
//       averages.term1.set(
//         name,
//         counts.term1.get(name)
//           ? totals.term1.get(name) / counts.term1.get(name)
//           : 0
//       );
//     });
//     assessmentTypesByTerm.term2.forEach(([name]) => {
//       averages.term2.set(
//         name,
//         counts.term2.get(name)
//           ? totals.term2.get(name) / counts.term2.get(name)
//           : 0
//       );
//     });

//     return {
//       totals,
//       counts,
//       averages,
//       term1FinalAverage:
//         totals.term1FinalCount === 0
//           ? 0
//           : totals.term1FinalTotal / totals.term1FinalCount,
//       term2FinalAverage:
//         totals.term2FinalCount === 0
//           ? 0
//           : totals.term2FinalTotal / totals.term2FinalCount,
//     };
//   }, [groupedGrades, assessmentTypesByTerm]);

//   // --- Helpers ---

//   // Grade color coding class
//   const gradeColorClass = (grade) => {
//     switch (grade) {
//       case "A1":
//       case "A2":
//         return "grade-excellent"; // green
//       case "B1":
//       case "B2":
//         return "grade-good"; // blue
//       case "C1":
//       case "C2":
//         return "grade-average"; // yellow
//       case "D":
//         return "grade-below"; // orange
//       case "E":
//         return "grade-poor"; // red
//       default:
//         return "grade-none";
//     }
//   };

//   // Convert score and max to grade letter
//   const calculateGrade = (score, maxScore) => {
//     if (maxScore === 0) return "-";
//     const percent = (score / maxScore) * 100;

//     if (percent >= 91) return "A1";
//     if (percent >= 81) return "A2";
//     if (percent >= 71) return "B1";
//     if (percent >= 61) return "B2";
//     if (percent >= 51) return "C1";
//     if (percent >= 41) return "C2";
//     if (percent >= 33) return "D";
//     return "E";
//   };

//   // Sum total marks obtained this semester
//   const calculateTotalMarks = (semesterData) => {
//     if (!semesterData || !semesterData.assessments) return 0;
//     return semesterData.assessments.reduce((acc, a) => acc + (a.score ?? 0), 0);
//   };

//   // Sum max marks this semester
//   const calculateMaxMarks = (semesterData) => {
//     if (!semesterData || !semesterData.assessments) return 0;
//     return semesterData.assessments.reduce(
//       (acc, a) => acc + (a.assessmentType?.totalMarks ?? 0),
//       0
//     );
//   };

//   // Get individual assessment score by name
//   const getDynamicScore = (subjectSemData, assessmentName) => {
//     if (!subjectSemData || !subjectSemData.assessments) return "-";
//     const assess = subjectSemData.assessments.find(
//       (a) => a.assessmentType?.name === assessmentName
//     );
//     return assess ? assess.score ?? "-" : "-";
//   };

//   // Calculate age from DOB
//   const calculateAge = (dateOfBirth) => {
//     if (!dateOfBirth) return "N/A";
//     const today = new Date();
//     const birthDate = new Date(dateOfBirth);
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const m = today.getMonth() - birthDate.getMonth();
//     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
//     return age;
//   };

//   // Handle signature picture upload
//   const handleSignatureChange = (e, key) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setSignatures((prev) => ({ ...prev, [key]: reader.result }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // Theme toggle handler
//   const toggleTheme = () => setDarkTheme((prev) => !prev);

//   // Helper to capture consistent desktop layout even on mobile
//   const generateReportCardImage = async () => {
//     // Temporarily force desktop layout
//     const originalMeta = document.querySelector("meta[name=viewport]");
//     const newMeta = document.createElement("meta");
//     newMeta.name = "viewport";
//     newMeta.content = "width=1100"; // force desktop width
//     document.head.appendChild(newMeta);
//     if (originalMeta) originalMeta.remove();

//     // Wait for layout re-render
//     await new Promise((r) => setTimeout(r, 300));

//     const node = document.getElementById("reportCard");
//     if (!node) throw new Error("Report card element not found");

//     // Capture full-quality image
//     const dataUrl = await domtoimage.toPng(node, {
//       quality: 1,
//       bgcolor: "white",
//       width: node.scrollWidth * 2,
//       height: node.scrollHeight * 2,
//       style: {
//         transform: "scale(2)",
//         transformOrigin: "top left",
//         width: `${node.scrollWidth}px`,
//         height: `${node.scrollHeight}px`,
//       },
//     });

//     // Restore viewport
//     document.head.removeChild(newMeta);
//     if (originalMeta) document.head.appendChild(originalMeta);

//     return dataUrl;
//   };

//   // Print function
//   const handlePrint = () => {
//     const printableContent = document.getElementById("printableArea");
//     if (!printableContent) return;
//     const contentToPrint = printableContent.innerHTML;
//     let styles = "";
//     for (const sheet of document.styleSheets) {
//       try {
//         styles += Array.from(sheet.cssRules)
//           .map((rule) => rule.cssText)
//           .join("\n");
//       } catch (e) {
//         // ignore cross-origin styles
//       }
//     }
//     const printWindow = window.open("", "", "height=800,width=1000");
//     if (!printWindow) {
//       alert("Please allow pop-ups to print.");
//       return;
//     }
//     printWindow.document.write(
//       `<html><head><title>Print Report Card</title><style>${styles}</style></head><body>${contentToPrint}</body></html>`
//     );
//     printWindow.document.close();
//     setTimeout(() => {
//       printWindow.focus();
//       printWindow.print();
//       printWindow.close();
//     }, 600);
//   };

//   // Download as PNG (consistent layout)
//   const handleCapture = async () => {
//     try {
//       const dataUrl = await generateReportCardImage();
//       const link = document.createElement("a");
//       link.href = dataUrl;
//       link.download = `${student?.fullName || "report-card"}.png`;
//       link.click();
//     } catch (err) {
//       console.error("Capture failed:", err);
//     }
//   };

//   // Save to Cloud (works for report card, class test, and NTSE reports)
//   const saveReportCardToCloud = async (studentIdToSave) => {
//     setUploading(true);
//     try {
//       const dataUrl = await generateReportCardImage();
//       const blob = await (await fetch(dataUrl)).blob();

//       const now = new Date();
//       const timestamp = now
//         .toLocaleString("en-IN", {
//           year: "numeric",
//           month: "short",
//           day: "2-digit",
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: false,
//           timeZone: "Asia/Kolkata",
//         })
//         .replace(/, /g, "_")
//         .replace(/ /g, "_")
//         .replace(/:/g, "");

//       const studentName = (student?.fullName || "student").replace(/\s+/g, "_");
//       const grade = (student?.gradeLevel || "grade").replace(/\s+/g, "_");
//       const year = (
//         allReports.find((r) => r.semester === "First Semester")?.academicYear ||
//         "year"
//       ).replace(/\s+/g, "_");

//       const typeSuffix =
//         viewType === "classTest"
//           ? "class_test"
//           : viewType === "ntseTest"
//           ? "ntse_test"
//           : "report_card";
//       const fileName = `${studentName}_${grade}_${typeSuffix}_${timestamp}.png`;

//       console.log("Uploading file:", fileName);
//       const formData = new FormData();
//       formData.append("file", blob, fileName);

//       const endpoint =
//         viewType === "classTest"
//           ? `${API_URL}/students/${studentIdToSave}/class-test-report`
//           : viewType === "ntseTest"
//           ? `${API_URL}/students/${studentIdToSave}/ntse-report`
//           : `${API_URL}/students/${studentIdToSave}/report-card`;

//       await axios.post(endpoint, formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       alert(
//         `${
//           viewType === "classTest"
//             ? "Class test report"
//             : viewType === "ntseTest"
//             ? "NTSE test report"
//             : "Report card"
//         } uploaded successfully!`
//       );
//       window.location.reload();
//     } catch (err) {
//       console.error("Upload error:", err);
//       alert("Upload failed!");
//     } finally {
//       setUploading(false);
//     }
//   };

//   if (loading)
//     return <p className="loading">Generating Authentic Report Card...</p>;
//   if (error) return <p className="error">{error}</p>;

//   const firstSemesterReport = allReports.find(
//     (r) => r.semester === "First Semester"
//   );
//   const secondSemesterReport = allReports.find(
//     (r) => r.semester === "Second Semester"
//   );

//   // Check if Term II data exists to conditionally render (based on filteredGrades)
//   const hasTerm2Data = filteredGrades.some(
//     (grade) => grade.semester === "Second Semester"
//   );

//   // Delete uploaded report (works for all types)
//   const handleDeleteUploadedReport = async (studentIdToDelete) => {
//     const label =
//       viewType === "classTest"
//         ? "class test report"
//         : viewType === "ntseTest"
//         ? "NTSE test report"
//         : "report card";
//     if (!window.confirm(`Are you sure you want to delete this ${label}?`))
//       return;

//     setUploading(true);
//     try {
//       const userData = localStorage.getItem("user");
//       const token = userData ? JSON.parse(userData).token : null;

//       const endpoint =
//         viewType === "classTest"
//           ? `${API_URL}/students/${studentIdToDelete}/class-test-report`
//           : viewType === "ntseTest"
//           ? `${API_URL}/students/${studentIdToDelete}/ntse-report`
//           : `${API_URL}/students/${studentIdToDelete}/report-card`;

//       await axios.delete(endpoint, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       alert(`${label} deleted successfully.`);
//       window.location.reload();
//     } catch (error) {
//       console.error(error);
//       alert(`Failed to delete ${label}.`);
//     }
//     setUploading(false);
//   };

//   // Dialog image source depending on viewType
//   const dialogImageSrc =
//     viewType === "classTest"
//       ? student?.reportClassTestUrl
//       : viewType === "ntseTest"
//       ? student?.reportNTSEUrl
//       : student?.reportCardUrl;

//   return (
//     <div
//       className={`report-card-container ${
//         darkTheme ? "dark-theme" : "light-theme"
//       }`}
//     >
//       {/* Controls */}
//       <div
//         className="controls no-print"
//         style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}
//       >
//         <div className="left-controls" style={{ display: "none" }}>
//           {/* Hidden Back Link for now */}
//         </div>
//         <div
//           className="right-controls"
//           style={{
//             display: "flex",
//             gap: 8,
//             flexWrap: "wrap",
//             justifyContent: "flex-end",
//             alignItems: "center",
//             width: "100%",
//             maxWidth: 800,
//             marginLeft: "auto",
//             marginRight: "auto",
//           }}
//         >
//           {/* VIEW TOGGLE - Now includes NTSE */}
//           <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
//             <button
//               className={`btn ${
//                 viewType === "reportCard" ? "btn-primary" : "btn-outline"
//               }`}
//               onClick={() => setViewType("reportCard")}
//               type="button"
//               title="Show full report card (excludes class test & NTSE assessments)"
//             >
//               Full Report Card
//             </button>
//             <button
//               className={`btn ${
//                 viewType === "classTest" ? "btn-primary" : "btn-outline"
//               }`}
//               onClick={() => setViewType("classTest")}
//               type="button"
//               title="Show class test report (only class test assessments)"
//             >
//               Class Test Report
//             </button>
//             <button
//               className={`btn ${
//                 viewType === "ntseTest" ? "btn-primary" : "btn-outline"
//               }`}
//               onClick={() => setViewType("ntseTest")}
//               type="button"
//               title="Show NTSE test report (only NTSE assessments)"
//             >
//               🧠 NTSE Report
//             </button>
//           </div>

//           <button
//             className="btn btn-outline"
//             onClick={handlePrint}
//             style={{
//               flex: "1 1 auto",
//               minWidth: 60,
//               fontSize: "0.85rem",
//               padding: "6px 8px",
//             }}
//             title="Print Report Card"
//             type="button"
//           >
//             🖨 Print
//           </button>

//           <button
//             className="btn btn-outline"
//             onClick={handleCapture}
//             style={{
//               flex: "1 1 auto",
//               minWidth: 60,
//               fontSize: "0.85rem",
//               padding: "6px 8px",
//             }}
//             title="Save as Image"
//             type="button"
//           >
//             📸 Save
//           </button>

//           {(userRole === "teacher" || userRole === "admin") && (
//             <>
//               {viewType === "reportCard" ? (
//                 <>
//                   {student?.reportCardUrl ? (
//                     <>
//                       <button
//                         className="btn btn-green"
//                         disabled={uploading}
//                         onClick={() => setDialogOpen(true)}
//                         style={{
//                           flex: "1 1 auto",
//                           minWidth: 80,
//                           fontSize: "0.85rem",
//                           padding: "6px 8px",
//                         }}
//                         title="View Uploaded Report Card"
//                         type="button"
//                       >
//                         <span
//                           style={{
//                             fontSize: "1.05em",
//                             color: "#28a745",
//                             marginRight: 4,
//                           }}
//                         >
//                           &#10003;
//                         </span>
//                         Uploaded
//                       </button>

//                       <button
//                         className="btn btn-primary"
//                         disabled={uploading}
//                         onClick={() => saveReportCardToCloud(id)}
//                         style={{
//                           flex: "1 1 auto",
//                           minWidth: 90,
//                           fontSize: "0.85rem",
//                           padding: "6px 8px",
//                         }}
//                         title="Re-upload Report Card"
//                         type="button"
//                       >
//                         {uploading ? <span className="spin" /> : "Re-upload"}
//                       </button>
//                     </>
//                   ) : (
//                     <button
//                       className="btn btn-primary"
//                       disabled={uploading}
//                       onClick={() => saveReportCardToCloud(id)}
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: 130,
//                         fontSize: "0.85rem",
//                         padding: "6px 8px",
//                       }}
//                       title="Upload Report Card"
//                       type="button"
//                     >
//                       {uploading ? (
//                         <span className="spin" />
//                       ) : (
//                         "⬆ Upload Report Card"
//                       )}
//                     </button>
//                   )}
//                   {student?.reportCardUrl && (
//                     <button
//                       className="btn btn-red"
//                       disabled={uploading}
//                       onClick={() => handleDeleteUploadedReport(student._id)}
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: 70,
//                         fontSize: "0.85rem",
//                         padding: "6px 8px",
//                       }}
//                       title="Delete Uploaded Report Card"
//                       type="button"
//                     >
//                       Delete
//                     </button>
//                   )}
//                 </>
//               ) : viewType === "classTest" ? (
//                 <>
//                   {student?.reportClassTestUrl ? (
//                     <>
//                       <button
//                         className="btn btn-green"
//                         disabled={uploading}
//                         onClick={() => setDialogOpen(true)}
//                         style={{
//                           flex: "1 1 auto",
//                           minWidth: 80,
//                           fontSize: "0.85rem",
//                           padding: "6px 8px",
//                         }}
//                         title="View Uploaded Class Test Report"
//                         type="button"
//                       >
//                         <span
//                           style={{
//                             fontSize: "1.05em",
//                             color: "#28a745",
//                             marginRight: 4,
//                           }}
//                         >
//                           &#10003;
//                         </span>
//                         Uploaded
//                       </button>

//                       <button
//                         className="btn btn-primary"
//                         disabled={uploading}
//                         onClick={() => saveReportCardToCloud(id)}
//                         style={{
//                           flex: "1 1 auto",
//                           minWidth: 90,
//                           fontSize: "0.85rem",
//                           padding: "6px 8px",
//                         }}
//                         title="Re-upload Class Test Report"
//                         type="button"
//                       >
//                         {uploading ? <span className="spin" /> : "Re-upload"}
//                       </button>
//                     </>
//                   ) : (
//                     <button
//                       className="btn btn-primary"
//                       disabled={uploading}
//                       onClick={() => saveReportCardToCloud(id)}
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: 150,
//                         fontSize: "0.85rem",
//                         padding: "6px 8px",
//                       }}
//                       title="Upload Class Test Report"
//                       type="button"
//                     >
//                       {uploading ? (
//                         <span className="spin" />
//                       ) : (
//                         "⬆ Upload Class Test"
//                       )}
//                     </button>
//                   )}
//                   {student?.reportClassTestUrl && (
//                     <button
//                       className="btn btn-red"
//                       disabled={uploading}
//                       onClick={() => handleDeleteUploadedReport(student._id)}
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: 70,
//                         fontSize: "0.85rem",
//                         padding: "6px 8px",
//                       }}
//                       title="Delete Uploaded Class Test Report"
//                       type="button"
//                     >
//                       Delete
//                     </button>
//                   )}
//                 </>
//               ) : (
//                 // NTSE Test buttons
//                 <>
//                   {student?.reportNTSEUrl ? (
//                     <>
//                       <button
//                         className="btn btn-green"
//                         disabled={uploading}
//                         onClick={() => setDialogOpen(true)}
//                         style={{
//                           flex: "1 1 auto",
//                           minWidth: 80,
//                           fontSize: "0.85rem",
//                           padding: "6px 8px",
//                         }}
//                         title="View Uploaded NTSE Report"
//                         type="button"
//                       >
//                         <span
//                           style={{
//                             fontSize: "1.05em",
//                             color: "#28a745",
//                             marginRight: 4,
//                           }}
//                         >
//                           &#10003;
//                         </span>
//                         Uploaded
//                       </button>

//                       <button
//                         className="btn btn-primary"
//                         disabled={uploading}
//                         onClick={() => saveReportCardToCloud(id)}
//                         style={{
//                           flex: "1 1 auto",
//                           minWidth: 90,
//                           fontSize: "0.85rem",
//                           padding: "6px 8px",
//                         }}
//                         title="Re-upload NTSE Report"
//                         type="button"
//                       >
//                         {uploading ? <span className="spin" /> : "Re-upload"}
//                       </button>
//                     </>
//                   ) : (
//                     <button
//                       className="btn btn-primary"
//                       disabled={uploading}
//                       onClick={() => saveReportCardToCloud(id)}
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: 120,
//                         fontSize: "0.85rem",
//                         padding: "6px 8px",
//                       }}
//                       title="Upload NTSE Report"
//                       type="button"
//                     >
//                       {uploading ? <span className="spin" /> : "⬆ Upload NTSE"}
//                     </button>
//                   )}
//                   {student?.reportNTSEUrl && (
//                     <button
//                       className="btn btn-red"
//                       disabled={uploading}
//                       onClick={() => handleDeleteUploadedReport(student._id)}
//                       style={{
//                         flex: "1 1 auto",
//                         minWidth: 70,
//                         fontSize: "0.85rem",
//                         padding: "6px 8px",
//                       }}
//                       title="Delete Uploaded NTSE Report"
//                       type="button"
//                     >
//                       Delete
//                     </button>
//                   )}
//                 </>
//               )}
//             </>
//           )}
//         </div>
//       </div>

//       {/* Dialog for viewing uploaded images */}
//       {dialogOpen && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             zIndex: 9999,
//             background: "rgba(0,0,0,0.6)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "flex-start",
//             padding: "20px",
//             overflowY: "auto",
//           }}
//           onClick={() => setDialogOpen(false)}
//         >
//           <div
//             style={{
//               background: "#fff",
//               borderRadius: 8,
//               boxShadow: "0 3px 16px #444",
//               maxWidth: 920,
//               width: "100%",
//               padding: 20,
//               position: "relative",
//             }}
//             onClick={(e) => e.stopPropagation()}
//           >
//             <h3 style={{ marginTop: 0 }}>
//               {viewType === "classTest"
//                 ? "Uploaded Class Test Report"
//                 : viewType === "ntseTest"
//                 ? "Uploaded NTSE Test Report"
//                 : "Uploaded Report Card"}
//             </h3>
//             {dialogImageSrc ? (
//               <img
//                 src={dialogImageSrc}
//                 alt={
//                   viewType === "classTest"
//                     ? "Uploaded Class Test Report"
//                     : viewType === "ntseTest"
//                     ? "Uploaded NTSE Test Report"
//                     : "Uploaded Report Card"
//                 }
//                 style={{
//                   maxHeight: 600,
//                   maxWidth: "100%",
//                   borderRadius: 6,
//                   display: "block",
//                   margin: "10px auto",
//                 }}
//               />
//             ) : (
//               <p style={{ textAlign: "center" }}>
//                 No uploaded image available.
//               </p>
//             )}
//             <button
//               className="btn btn-primary"
//               style={{ marginTop: 10, width: "100%" }}
//               onClick={() => setDialogOpen(false)}
//               type="button"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Report card content with fade-in animation */}
//       <div
//         id="reportCard"
//         className={`paper-wrap fade-in ${visible ? "visible" : ""}`}
//       >
//         <div id="printableArea" className="sheet-paper">
//           {/* Header */}
//           <header className="rc-header">
//             <div className="rc-left">
//               <img src={LOGO_URL} alt="logo" className="rc-logo" />
//             </div>
//             <div className="rc-center">
//               <div className="school-name">Aneja Kiddos School</div>
//               <div className="school-sub">Ansal Town, Sector-19, Rewari</div>
//               <div className="doc-title">
//                 {viewType === "classTest"
//                   ? "Class Test Report"
//                   : viewType === "ntseTest"
//                   ? "NTSE Test Report"
//                   : "Progress Report Card"}
//               </div>
//               <div className="session">
//                 Academic Year:{" "}
//                 {firstSemesterReport?.academicYear ||
//                   `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
//               </div>
//             </div>
//             <div className="rc-right">
//               <div className="small-meta">
//                 <div>
//                   <strong>Grade:</strong> {student?.gradeLevel || "-"}
//                 </div>
//                 <div>
//                   <strong>ID:</strong> {student?.studentId || "-"}
//                 </div>
//               </div>
//             </div>
//           </header>

//           {/* Student & meta row */}
//           <section className="student-card">
//             <div className="student-left">
//               {student?.imageUrl ? (
//                 <img
//                   src={student.imageUrl}
//                   alt="student"
//                   className="student-photo"
//                 />
//               ) : (
//                 <div className="student-photo placeholder">Photo</div>
//               )}
//             </div>
//             <div className="student-right">
//               <div className="profile-grid">
//                 <div className="profile-item">
//                   <span className="label">Student's Name</span>
//                   <span className="value">{student?.fullName || "-"}</span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="label">Father's Name</span>
//                   <span className="value">
//                     {student?.parentContact?.parentName || "-"}
//                   </span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="label">Class / Section</span>
//                   <span className="value">
//                     {student?.gradeLevel || "-"} / {student?.section || "-"}
//                   </span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="label">Date of Birth</span>
//                   <span className="value">
//                     {student?.dateOfBirth
//                       ? new Date(student.dateOfBirth).toLocaleDateString()
//                       : "-"}
//                   </span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="label">Roll Number</span>
//                   <span className="value">{student?.rollNumber || "-"}</span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="label">Mobile</span>
//                   <span className="value">
//                     {student?.parentContact?.phone || "-"}
//                   </span>
//                 </div>
//                 {viewType === "reportCard" && (
//                   <div className="profile-item">
//                     <span className="label">Promotion Status</span>
//                     <span className="value">
//                       {student?.promotionStatus || "-"}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </section>

//           {/* Scholastic results */}
//           <section className="scholastic">
//             <div className="section-header">
//               <h4>
//                 {viewType === "classTest"
//                   ? "Class Test Results"
//                   : viewType === "ntseTest"
//                   ? "NTSE Test Results"
//                   : "Academic Results"}
//               </h4>
//             </div>

//             <div className="table-scroll">
//               <table className="rc-table">
//                 <thead>
//                   <tr>
//                     <th className="col-num">#</th>
//                     <th className="col-sub">SUBJECTS</th>

//                     <th
//                       colSpan={assessmentTypesByTerm.term1.length + 2}
//                       className="term-head"
//                     >
//                       TERM I
//                     </th>

//                     {hasTerm2Data && (
//                       <th
//                         colSpan={assessmentTypesByTerm.term2.length + 2}
//                         className="term-head"
//                       >
//                         TERM II
//                       </th>
//                     )}
//                   </tr>

//                   <tr>
//                     <th className="col-num subhead"></th>
//                     <th className="col-sub subhead"></th>

//                     {assessmentTypesByTerm.term1.map(([name], idx) => (
//                       <th key={`t1-${idx}`} className="subhead">
//                         {name}
//                       </th>
//                     ))}
//                     <th className="subhead">Marks Obtained</th>
//                     <th className="subhead">Grade</th>

//                     {hasTerm2Data &&
//                       assessmentTypesByTerm.term2.map(([name], idx) => (
//                         <th key={`t2-${idx}`} className="subhead">
//                           {name}
//                         </th>
//                       ))}
//                     {hasTerm2Data && (
//                       <th className="subhead">Marks Obtained</th>
//                     )}
//                     {hasTerm2Data && <th className="subhead">Grade</th>}
//                   </tr>

//                   <tr>
//                     <th className="col-num">Total</th>
//                     <th className="col-sub"></th>

//                     {assessmentTypesByTerm.term1.map(([_, total], idx) => (
//                       <th key={`tm1-${idx}`} className="sub-total">
//                         {total ? `(${total})` : ""}
//                       </th>
//                     ))}
//                     <th className="sub-total">Total</th>
//                     <th className="sub-total"></th>

//                     {hasTerm2Data &&
//                       assessmentTypesByTerm.term2.map(([_, total], idx) => (
//                         <th key={`tm2-${idx}`} className="sub-total">
//                           {total ? `(${total})` : ""}
//                         </th>
//                       ))}
//                     {hasTerm2Data && <th className="sub-total"></th>}
//                     {hasTerm2Data && <th className="sub-total"></th>}
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {groupedGrades.map(({ subject, semesters }, idx) => (
//                     <tr key={subject._id ?? subject.name ?? idx}>
//                       <td className="col-num">{idx + 1}</td>
//                       <td className="col-sub left">{subject?.name}</td>

//                       {assessmentTypesByTerm.term1.map(([name], j) => (
//                         <td key={`g-t1-${idx}-${j}`} className="score-cell">
//                           {getDynamicScore(semesters["First Semester"], name)}
//                         </td>
//                       ))}

//                       <td
//                         className={`score-cell ${gradeColorClass(
//                           calculateGrade(
//                             calculateTotalMarks(semesters["First Semester"]),
//                             calculateMaxMarks(semesters["First Semester"])
//                           )
//                         )}`}
//                       >
//                         {calculateTotalMarks(
//                           semesters["First Semester"]
//                         ).toFixed(2)}
//                       </td>

//                       <td
//                         className={`score-cell ${gradeColorClass(
//                           calculateGrade(
//                             calculateTotalMarks(semesters["First Semester"]),
//                             calculateMaxMarks(semesters["First Semester"])
//                           )
//                         )}`}
//                       >
//                         {calculateGrade(
//                           calculateTotalMarks(semesters["First Semester"]),
//                           calculateMaxMarks(semesters["First Semester"])
//                         )}
//                       </td>

//                       {hasTerm2Data && (
//                         <>
//                           {assessmentTypesByTerm.term2.map(([name], j) => (
//                             <td key={`g-t2-${idx}-${j}`} className="score-cell">
//                               {getDynamicScore(
//                                 semesters["Second Semester"],
//                                 name
//                               )}
//                             </td>
//                           ))}

//                           <td
//                             className={`score-cell ${gradeColorClass(
//                               calculateGrade(
//                                 calculateTotalMarks(
//                                   semesters["Second Semester"]
//                                 ),
//                                 calculateMaxMarks(semesters["Second Semester"])
//                               )
//                             )}`}
//                           >
//                             {calculateTotalMarks(
//                               semesters["Second Semester"]
//                             ).toFixed(2)}
//                           </td>

//                           <td
//                             className={`score-cell ${gradeColorClass(
//                               calculateGrade(
//                                 calculateTotalMarks(
//                                   semesters["Second Semester"]
//                                 ),
//                                 calculateMaxMarks(semesters["Second Semester"])
//                               )
//                             )}`}
//                           >
//                             {calculateGrade(
//                               calculateTotalMarks(semesters["Second Semester"]),
//                               calculateMaxMarks(semesters["Second Semester"])
//                             )}
//                           </td>
//                         </>
//                       )}
//                     </tr>
//                   ))}

//                   {Array.from({
//                     length: Math.max(0, 10 - groupedGrades.length),
//                   }).map((_, i) => (
//                     <tr key={`empty-${i}`}>
//                       <td className="col-num">
//                         {groupedGrades.length + i + 1}
//                       </td>
//                       <td className="col-sub left">&nbsp;</td>

//                       {assessmentTypesByTerm.term1.map((__, j) => (
//                         <td key={`e1-${i}-${j}`}>&nbsp;</td>
//                       ))}
//                       <td>&nbsp;</td>
//                       <td>&nbsp;</td>

//                       {hasTerm2Data &&
//                         assessmentTypesByTerm.term2.map((__, j) => (
//                           <td key={`e2-${i}-${j}`}>&nbsp;</td>
//                         ))}
//                       {hasTerm2Data && <td>&nbsp;</td>}
//                       {hasTerm2Data && <td>&nbsp;</td>}
//                     </tr>
//                   ))}

//                   <tr className="totals-row">
//                     <td colSpan="2" className="left">
//                       <strong>Total</strong>
//                     </td>

//                     {/* Term 1 Assessments */}
//                     {assessmentTypesByTerm.term1.map(() => (
//                       <td className="score-cell"></td>
//                     ))}

//                     {/* Term 1 Total */}
//                     <td className="score-cell">
//                       <b>
//                         {grandTotals.term1.obtained.toFixed(2)} /{" "}
//                         {grandTotals.term1.max.toFixed(2)}
//                       </b>
//                     </td>

//                     {/* Term 1 Percentage */}
//                     <td className="score-cell">
//                       <b>
//                         {grandTotals.term1.max > 0
//                           ? (
//                               (grandTotals.term1.obtained /
//                                 grandTotals.term1.max) *
//                               100
//                             ).toFixed(2)
//                           : "0.00"}
//                         %
//                       </b>
//                     </td>

//                     {/* If Term 2 exists */}
//                     {hasTerm2Data && (
//                       <>
//                         {assessmentTypesByTerm.term2.map(() => (
//                           <td className="score-cell"></td>
//                         ))}

//                         {/* Term 2 Total */}
//                         <td className="score-cell">
//                           <b>
//                             {grandTotals.term2.obtained.toFixed(2)} /{" "}
//                             {grandTotals.term2.max.toFixed(2)}
//                           </b>
//                         </td>

//                         {/* Term 2 Percentage */}
//                         <td className="score-cell">
//                           <b>
//                             {grandTotals.term2.max > 0
//                               ? (
//                                   (grandTotals.term2.obtained /
//                                     grandTotals.term2.max) *
//                                   100
//                                 ).toFixed(2)
//                               : "0.00"}
//                             %
//                           </b>
//                         </td>
//                       </>
//                     )}
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </section>

//           {viewType === "reportCard" && (
//             <section className="co-scholastic">
//               <h4>Personality Traits & Skills</h4>
//               <div className="traits-grid">
//                 <table className="traits-table">
//                   <thead>
//                     <tr>
//                       <th>TRAITS</th>
//                       <th>1st Sem</th>
//                       {hasTerm2Data && <th>2nd Sem</th>}
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {EVALUATION_AREAS.map((area) => (
//                       <tr key={area}>
//                         <td className="left">{area}</td>
//                         <td>
//                           {firstSemesterReport?.evaluations?.find(
//                             (e) => e.area === area
//                           )?.result ?? "-"}
//                         </td>
//                         {hasTerm2Data && (
//                           <td>
//                             {secondSemesterReport?.evaluations?.find(
//                               (e) => e.area === area
//                             )?.result ?? "-"}
//                           </td>
//                         )}
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>

//                 <div className="co-cards">
//                   <div className="co-card">
//                     <h5>Teacher's Remark Ist Semester</h5>
//                     <p>{firstSemesterReport?.teacherComment ?? "-"}</p>
//                   </div>
//                   {hasTerm2Data && (
//                     <div className="co-card">
//                       <h5>Teacher's Remark IInd Semester</h5>
//                       <p>{secondSemesterReport?.teacherComment ?? "-"}</p>
//                     </div>
//                   )}
//                   <div className="co-card">
//                     <h5>Message to Parents</h5>
//                     <p>
//                       {firstSemesterReport?.messageToParents ??
//                         "Please support your child's learning at home."}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </section>
//           )}

//           {/* Signatures */}
//           <section className="signatures">
//             <div className="sig-col">
//               <div className="sig-box">
//                 <p className="sig-label">
//                   {teacher
//                     ? teacher.charAt(0).toUpperCase() +
//                       teacher.slice(1).toLowerCase()
//                     : ""}
//                 </p>
//                 <div className="sig-label">Class Teacher</div>
//               </div>
//             </div>

//             <div className="sig-col">
//               <div className="sig-box">
//                 <p className="sig-label">Nidhi Dhamija</p>
//                 <div className="sig-label">Principal</div>
//               </div>
//             </div>

//             <div className="sig-col">
//               <div className="sig-box">
//                 <p className="sig-label">
//                   {student?.parentContact?.parentName}
//                 </p>
//                 <div className="sig-label">Parent / Guardian</div>
//               </div>
//             </div>
//           </section>

//           {/* Footer */}
//           <footer className="rc-footer">
//             <div className="footer-msg">
//               You leaped and crossed the hindrances & put a flag of victory with
//               great enthusiasm!
//             </div>
//             <div className="footer-sub">
//               Wishing you a bright and successful future.
//             </div>
//           </footer>
//         </div>
//       </div>
//     </div>
//   );
// };

// const EVALUATION_AREAS = [
//   "Punctuality",
//   "Attendance",
//   "Responsibility",
//   "Respect",
//   "Cooperation",
//   "Initiative",
//   "Completes Work",
// ];

// export default ReportCardPage;

// ReportCardPage.jsx - with Class Test, NTSE and Periodic Test report views
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
  const [rank1stSem, setRank1stSem] = useState("-");
  const [rank2ndSem, setRank2ndSem] = useState("-");
  const [overallRank, setOverallRank] = useState("-");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [darkTheme, setDarkTheme] = useState(false);
  const [visible, setVisible] = useState(false);

  // View types: full report, class test, NTSE, Periodic Test
  const [viewType, setViewType] = useState("reportCard");

  // Digital signatures (Base64 data URLs) – optional
  const [signatures, setSignatures] = useState({
    classTeacher: null,
    principal: null,
    parent: null,
  });

  // ---------- Art grade calculation ----------
  const getArtGrade = (score) => {
    if (score >= 91) return "A+";
    if (score >= 81) return "A-";
    if (score >= 71) return "B+";
    if (score >= 61) return "B-";
    if (score >= 51) return "C+";
    if (score >= 41) return "C-";
    if (score >= 33) return "D";
    return "E";
  };

  const renderScoreOrGrade = (score, subjectName) => {
    if (
      subjectName === "Arts" ||
      subjectName === "Art" ||
      subjectName === "Art and Craft" ||
      subjectName === "Art &Craft" ||
      subjectName === "Art & Craft"
    ) {
      return getArtGrade(score);
    }
    return score !== null && score !== undefined ? score.toFixed(2) : "-";
  };

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
            (r) => r.semester === "First Semester"
          );
          const secondReport = reportsData.find(
            (r) => r.semester === "Second Semester"
          );
          const academicYear = firstReport?.academicYear;
          const gradeLevel = studentData.gradeLevel;

          if (academicYear) {
            const rankPromises = [];

            rankPromises.push(
              rankService.getRank({
                studentId: id,
                academicYear,
                semester: "First Semester",
                gradeLevel,
              })
            );
            if (secondReport) {
              rankPromises.push(
                rankService.getRank({
                  studentId: id,
                  academicYear,
                  semester: "Second Semester",
                  gradeLevel,
                })
              );
            } else {
              rankPromises.push(Promise.resolve(null));
            }
            rankPromises.push(
              rankService.getOverallRank({
                studentId: id,
                academicYear,
                gradeLevel,
              })
            );

            const [rank1Res, rank2Res, overallRankRes] =
              await Promise.allSettled(rankPromises);

            setRank1stSem(
              rank1Res.status === "fulfilled"
                ? rank1Res.value?.data?.rank ?? "N/A"
                : "N/A"
            );
            setRank2ndSem(
              rank2Res.status === "fulfilled" && rank2Res.value
                ? rank2Res.value?.data?.rank ?? "N/A"
                : "N/A"
            );
            setOverallRank(
              overallRankRes.status === "fulfilled"
                ? overallRankRes.value?.data?.rank ?? "N/A"
                : "N/A"
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

  // Read user role from localStorage
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
  // reportCard: exclude Class Test & NTSE (keeps PT + SA, etc.)
  // classTest: only Class Test assessments
  // ntseTest: only NTSE assessments
  // ptTest: only Periodic Test-I..IV
  const filteredGrades = useMemo(() => {
    if (!allGrades || allGrades.length === 0) return [];

    const isPTName = (name) =>
      name === "Periodic Test-I" ||
      name === "Periodic Test-II" ||
      name === "Periodic Test-III" ||
      name === "Periodic Test-IV";

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

          // full reportCard mode: hide class test & NTSE only
          return !isClassTest && !isNTSE;
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
        (g) => Array.isArray(g.assessments) && g.assessments.length > 0
      );
    }
    return mapped;
  }, [allGrades, viewType]);

  // Group grades by subject with semester buckets
  const groupedGrades = useMemo(() => {
    if (!filteredGrades || filteredGrades.length === 0) return [];
    const subjectMap = new Map();
    filteredGrades.forEach((gradeRecord) => {
      const subjectId =
        gradeRecord.subject?._id ?? gradeRecord.subject?.name ?? Math.random();
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: gradeRecord.subject || { name: "----" },
          semesters: {
            "First Semester": null,
            "Second Semester": null,
          },
        });
      }
      const entry = subjectMap.get(subjectId);
      entry.semesters[gradeRecord.semester] = gradeRecord;
    });
    return Array.from(subjectMap.values());
  }, [filteredGrades]);

  // Grand totals for each term
  const grandTotals = useMemo(() => {
    let term1 = { obtained: 0, max: 0 };
    let term2 = { obtained: 0, max: 0 };
    groupedGrades.forEach(({ semesters }) => {
      const s1 = semesters["First Semester"];
      const s2 = semesters["Second Semester"];
      if (s1?.assessments) {
        s1.assessments.forEach((a) => {
          term1.obtained += Number(a.score || 0);
          term1.max += Number(a.assessmentType?.totalMarks || 0);
        });
      }
      if (s2?.assessments) {
        s2.assessments.forEach((a) => {
          term2.obtained += Number(a.score || 0);
          term2.max += Number(a.assessmentType?.totalMarks || 0);
        });
      }
    });
    return { term1, term2 };
  }, [groupedGrades]);

  // Assessment types by term
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
          if (!mapTarget.has(name)) {
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
          a.toLowerCase().includes(p.toLowerCase())
        );
        const ib = sortOrder.findIndex((p) =>
          b.toLowerCase().includes(p.toLowerCase())
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

  const totalsAndAverages = useMemo(() => {
    const totals = {
      term1: new Map(),
      term2: new Map(),
      term1FinalTotal: 0,
      term1FinalCount: 0,
      term2FinalTotal: 0,
      term2FinalCount: 0,
    };
    const counts = {
      term1: new Map(),
      term2: new Map(),
    };

    assessmentTypesByTerm.term1.forEach(([name]) => {
      totals.term1.set(name, 0);
      counts.term1.set(name, 0);
    });
    assessmentTypesByTerm.term2.forEach(([name]) => {
      totals.term2.set(name, 0);
      counts.term2.set(name, 0);
    });

    groupedGrades.forEach(({ semesters }) => {
      ["First Semester", "Second Semester"].forEach((sem) => {
        const semesterData = semesters[sem];
        if (!semesterData) return;
        const termKey = sem === "First Semester" ? "term1" : "term2";
        if (Array.isArray(semesterData.assessments)) {
          semesterData.assessments.forEach(({ assessmentType, score }) => {
            const name = assessmentType?.name;
            if (!name) return;
            if (totals[termKey].has(name)) {
              totals[termKey].set(
                name,
                totals[termKey].get(name) + (score ?? 0)
              );
              counts[termKey].set(name, counts[termKey].get(name) + 1);
            }
          });
        }
        if (typeof semesterData.finalScore === "number") {
          if (termKey === "term1") {
            totals.term1FinalTotal += semesterData.finalScore;
            totals.term1FinalCount++;
          } else {
            totals.term2FinalTotal += semesterData.finalScore;
            totals.term2FinalCount++;
          }
        }
      });
    });

    const averages = { term1: new Map(), term2: new Map() };

    assessmentTypesByTerm.term1.forEach(([name]) => {
      averages.term1.set(
        name,
        counts.term1.get(name)
          ? totals.term1.get(name) / counts.term1.get(name)
          : 0
      );
    });
    assessmentTypesByTerm.term2.forEach(([name]) => {
      averages.term2.set(
        name,
        counts.term2.get(name)
          ? totals.term2.get(name) / counts.term2.get(name)
          : 0
      );
    });

    return {
      totals,
      counts,
      averages,
      term1FinalAverage:
        totals.term1FinalCount === 0
          ? 0
          : totals.term1FinalTotal / totals.term1FinalCount,
      term2FinalAverage:
        totals.term2FinalCount === 0
          ? 0
          : totals.term2FinalTotal / totals.term2FinalCount,
    };
  }, [groupedGrades, assessmentTypesByTerm]);

    // --- Helpers ---
  const gradeColorClass = (grade) => {
    switch (grade) {
      case "A1":
      case "A2":
        return "grade-excellent";
      case "B1":
      case "B2":
        return "grade-good";
      case "C1":
      case "C2":
        return "grade-average";
      case "D":
        return "grade-below";
      case "E":
        return "grade-poor";
      default:
        return "grade-none";
    }
  };

  const calculateGrade = (score, maxScore) => {
    if (maxScore === 0) return "-";
    const percent = (score / maxScore) * 100;
    if (percent >= 91) return "A1";
    if (percent >= 81) return "A2";
    if (percent >= 71) return "B1";
    if (percent >= 61) return "B2";
    if (percent >= 51) return "C1";
    if (percent >= 41) return "C2";
    if (percent >= 33) return "D";
    return "E";
  };

  const calculateTotalMarks = (semesterData) => {
    if (!semesterData || !semesterData.assessments) return 0;
    return semesterData.assessments.reduce((acc, a) => acc + (a.score ?? 0), 0);
  };

  const calculateMaxMarks = (semesterData) => {
    if (!semesterData || !semesterData.assessments) return 0;
    return semesterData.assessments.reduce(
      (acc, a) => acc + (a.assessmentType?.totalMarks ?? 0),
      0
    );
  };

  const getDynamicScore = (subjectSemData, assessmentName) => {
    if (!subjectSemData || !subjectSemData.assessments) return "-";
    const assess = subjectSemData.assessments.find(
      (a) => a.assessmentType?.name === assessmentName
    );
    return assess ? assess.score ?? "-" : "-";
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const handleSignatureChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatures((prev) => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTheme = () => setDarkTheme((prev) => !prev);

  // Capture report as image
  const generateReportCardImage = async () => {
    const originalMeta = document.querySelector("meta[name=viewport]");
    const newMeta = document.createElement("meta");
    newMeta.name = "viewport";
    newMeta.content = "width=1100";
    document.head.appendChild(newMeta);
    if (originalMeta) originalMeta.remove();

    await new Promise((r) => setTimeout(r, 300));

    const node = document.getElementById("reportCard");
    if (!node) throw new Error("Report card element not found");

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
    if (!printWindow) {
      alert("Please allow pop-ups to print.");
      return;
    }
    printWindow.document.write(
      `<html><head><title>Print Report Card</title><style>${styles}</style></head><body>${contentToPrint}</body></html>`
    );
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 600);
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

      const now = new Date();
      const timestamp = now
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

      const studentName = (student?.fullName || "student").replace(
        /\s+/g,
        "_"
      );
      const grade = (student?.gradeLevel || "grade").replace(/\s+/g, "_");
      const year = (
        allReports.find((r) => r.semester === "First Semester")?.academicYear ||
        "year"
      ).replace(/\s+/g, "_");

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

      const endpoint =
        viewType === "classTest"
          ? `${API_URL}/students/${studentIdToSave}/class-test-report`
          : viewType === "ntseTest"
          ? `${API_URL}/students/${studentIdToSave}/ntse-report`
          : viewType === "ptTest"
          ? `${API_URL}/students/${studentIdToSave}/pt-report`
          : `${API_URL}/students/${studentIdToSave}/report-card`;

      await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(
        `${
          viewType === "classTest"
            ? "Class test report"
            : viewType === "ntseTest"
            ? "NTSE test report"
            : viewType === "ptTest"
            ? "Periodic test report"
            : "Report card"
        } uploaded successfully!`
      );
      window.location.reload();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return <p className="loading">Generating Authentic Report Card...</p>;
  if (error) return <p className="error">{error}</p>;

  const firstSemesterReport = allReports.find(
    (r) => r.semester === "First Semester"
  );
  const secondSemesterReport = allReports.find(
    (r) => r.semester === "Second Semester"
  );

  const hasTerm2Data = filteredGrades.some(
    (grade) => grade.semester === "Second Semester"
  );

  const handleDeleteUploadedReport = async (studentIdToDelete) => {
    const label =
      viewType === "classTest"
        ? "class test report"
        : viewType === "ntseTest"
        ? "NTSE test report"
        : viewType === "ptTest"
        ? "Periodic test report"
        : "report card";
    if (!window.confirm(`Are you sure you want to delete this ${label}?`))
      return;

    setUploading(true);
    try {
      const userData = localStorage.getItem("user");
      const token = userData ? JSON.parse(userData).token : null;

      const endpoint =
        viewType === "classTest"
          ? `${API_URL}/students/${studentIdToDelete}/class-test-report`
          : viewType === "ntseTest"
          ? `${API_URL}/students/${studentIdToDelete}/ntse-report`
          : viewType === "ptTest"
          ? `${API_URL}/students/${studentIdToDelete}/pt-report`
          : `${API_URL}/students/${studentIdToDelete}/report-card`;

      await axios.delete(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert(`${label} deleted successfully.`);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert(`Failed to delete ${label}.`);
    }
    setUploading(false);
  };

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
      className={`report-card-container ${
        darkTheme ? "dark-theme" : "light-theme"
      }`}
    >
      {/* Controls */}
      <div
        className="controls no-print"
        style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}
      >
        <div className="left-controls" style={{ display: "none" }} />
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
              className={`btn ${
                viewType === "reportCard" ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => setViewType("reportCard")}
              type="button"
            >
              Full Report Card
            </button>
            <button
              className={`btn ${
                viewType === "classTest" ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => setViewType("classTest")}
              type="button"
            >
              Class Test Report
            </button>
            <button
              className={`btn ${
                viewType === "ntseTest" ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => setViewType("ntseTest")}
              type="button"
            >
              🧠 NTSE Report
            </button>
            <button
              className={`btn ${
                viewType === "ptTest" ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => setViewType("ptTest")}
              type="button"
            >
              Periodic Test Report
            </button>
          </div>
{/* 
          <button
            className="btn btn-outline"
            onClick={toggleTheme}
            style={{
              flex: "1 1 auto",
              minWidth: 60,
              fontSize: "0.85rem",
              padding: "6px 8px",
            }}
            type="button"
          >
            {darkTheme ? "Light" : "Dark"}
          </button> */}

          <button
            className="btn btn-outline"
            onClick={handlePrint}
            style={{
              flex: "1 1 auto",
              minWidth: 60,
              fontSize: "0.85rem",
              padding: "6px 8px",
            }}
            type="button"
          >
            🖨 Print
          </button>

          <button
            className="btn btn-outline"
            onClick={handleCapture}
            style={{
              flex: "1 1 auto",
              minWidth: 60,
              fontSize: "0.85rem",
              padding: "6px 8px",
            }}
            type="button"
          >
            📸 Save
          </button>

          {(userRole === "teacher" || userRole === "admin") && (
            <>
              {viewType === "reportCard" ? (
                <>
                  {student?.reportCardUrl ? (
                    <>
                      <button
                        className="btn btn-green"
                        disabled={uploading}
                        onClick={() => setDialogOpen(true)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 80,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        <span
                          style={{
                            fontSize: "1.05em",
                            color: "#28a745",
                            marginRight: 4,
                          }}
                        >
                          &#10003;
                        </span>
                        Uploaded
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={uploading}
                        onClick={() => saveReportCardToCloud(id)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 90,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        {uploading ? <span className="spin" /> : "Re-upload"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={uploading}
                      onClick={() => saveReportCardToCloud(id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 130,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      {uploading ? (
                        <span className="spin" />
                      ) : (
                        "⬆ Upload Report Card"
                      )}
                    </button>
                  )}
                  {student?.reportCardUrl && (
                    <button
                      className="btn btn-red"
                      disabled={uploading}
                      onClick={() => handleDeleteUploadedReport(student._id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 70,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </>
              ) : viewType === "classTest" ? (
                <>
                  {student?.reportClassTestUrl ? (
                    <>
                      <button
                        className="btn btn-green"
                        disabled={uploading}
                        onClick={() => setDialogOpen(true)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 80,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        <span
                          style={{
                            fontSize: "1.05em",
                            color: "#28a745",
                            marginRight: 4,
                          }}
                        >
                          &#10003;
                        </span>
                        Uploaded
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={uploading}
                        onClick={() => saveReportCardToCloud(id)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 90,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        {uploading ? <span className="spin" /> : "Re-upload"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={uploading}
                      onClick={() => saveReportCardToCloud(id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 150,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      {uploading ? (
                        <span className="spin" />
                      ) : (
                        "⬆ Upload Class Test"
                      )}
                    </button>
                  )}
                  {student?.reportClassTestUrl && (
                    <button
                      className="btn btn-red"
                      disabled={uploading}
                      onClick={() => handleDeleteUploadedReport(student._id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 70,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </>
              ) : viewType === "ntseTest" ? (
                <>
                  {student?.reportNTSEUrl ? (
                    <>
                      <button
                        className="btn btn-green"
                        disabled={uploading}
                        onClick={() => setDialogOpen(true)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 80,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        <span
                          style={{
                            fontSize: "1.05em",
                            color: "#28a745",
                            marginRight: 4,
                          }}
                        >
                          &#10003;
                        </span>
                        Uploaded
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={uploading}
                        onClick={() => saveReportCardToCloud(id)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 90,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        {uploading ? <span className="spin" /> : "Re-upload"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={uploading}
                      onClick={() => saveReportCardToCloud(id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 120,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      {uploading ? <span className="spin" /> : "⬆ Upload NTSE"}
                    </button>
                  )}
                  {student?.reportNTSEUrl && (
                    <button
                      className="btn btn-red"
                      disabled={uploading}
                      onClick={() => handleDeleteUploadedReport(student._id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 70,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </>
              ) : (
                // Periodic Test view
                <>
                  {student?.reportPTUrl ? (
                    <>
                      <button
                        className="btn btn-green"
                        disabled={uploading}
                        onClick={() => setDialogOpen(true)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 80,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        <span
                          style={{
                            fontSize: "1.05em",
                            color: "#28a745",
                            marginRight: 4,
                          }}
                        >
                          &#10003;
                        </span>
                        Uploaded
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={uploading}
                        onClick={() => saveReportCardToCloud(id)}
                        style={{
                          flex: "1 1 auto",
                          minWidth: 90,
                          fontSize: "0.85rem",
                          padding: "6px 8px",
                        }}
                        type="button"
                      >
                        {uploading ? <span className="spin" /> : "Re-upload"}
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn btn-primary"
                      disabled={uploading}
                      onClick={() => saveReportCardToCloud(id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 150,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      {uploading ? (
                        <span className="spin" />
                      ) : (
                        "⬆ Upload Periodic Test"
                      )}
                    </button>
                  )}
                  {student?.reportPTUrl && (
                    <button
                      className="btn btn-red"
                      disabled={uploading}
                      onClick={() => handleDeleteUploadedReport(student._id)}
                      style={{
                        flex: "1 1 auto",
                        minWidth: 70,
                        fontSize: "0.85rem",
                        padding: "6px 8px",
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      {/* Dialog for viewing uploaded images */}
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
              boxShadow: "0 3px 16px #444",
              maxWidth: 920,
              width: "100%",
              padding: 20,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>
              {viewType === "classTest"
                ? "Uploaded Class Test Report"
                : viewType === "ntseTest"
                ? "Uploaded NTSE Test Report"
                : viewType === "ptTest"
                ? "Uploaded Periodic Test Report"
                : "Uploaded Report Card"}
            </h3>
            {dialogImageSrc ? (
              <img
                src={dialogImageSrc}
                alt={
                  viewType === "classTest"
                    ? "Uploaded Class Test Report"
                    : viewType === "ntseTest"
                    ? "Uploaded NTSE Test Report"
                    : viewType === "ptTest"
                    ? "Uploaded Periodic Test Report"
                    : "Uploaded Report Card"
                }
                style={{
                  maxHeight: 600,
                  maxWidth: "100%",
                  borderRadius: 6,
                  display: "block",
                  margin: "10px auto",
                }}
              />
            ) : (
              <p style={{ textAlign: "center" }}>
                No uploaded image available.
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ marginTop: 10, width: "100%" }}
              onClick={() => setDialogOpen(false)}
              type="button"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Report card content */}
      <div
        id="reportCard"
        className={`paper-wrap fade-in ${visible ? "visible" : ""}`}
      >
        <div id="printableArea" className="sheet-paper">
          {/* Header */}
          <header className="rc-header">
            <div className="rc-left">
              <img src={LOGO_URL} alt="logo" className="rc-logo" />
            </div>
            <div className="rc-center">
              <div className="school-name">Aneja Kiddos School</div>
              <div className="school-sub">Ansal Town, Sector-19, Rewari</div>
              <div className="doc-title">
                {viewType === "classTest"
                  ? "Class Test Report"
                  : viewType === "ntseTest"
                  ? "NTSE Test Report"
                  : viewType === "ptTest"
                  ? "Periodic Test Report"
                  : "Progress Report Card"}
              </div>
              <div className="session">
                Academic Year:{" "}
                {firstSemesterReport?.academicYear ||
                  `${new Date().getFullYear()}-${
                    new Date().getFullYear() + 1
                  }`}
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
                {/* <div>
                  <strong>Rank I:</strong> {rank1stSem}
                </div>
                <div>
                  <strong>Rank II:</strong> {rank2ndSem}
                </div>
                <div>
                  <strong>Overall:</strong> {overallRank}
                </div> */}
              </div>
            </div>
          </header>

          {/* Student & meta row */}
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
                {viewType === "reportCard" && (
                  <div className="profile-item">
                    <span className="label">Promotion Status</span>
                    <span className="value">
                      {student?.promotionStatus || "-"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Scholastic results */}
          <section className="scholastic">
            <div className="section-header">
              <h4>
                {viewType === "classTest"
                  ? "Class Test Results"
                  : viewType === "ntseTest"
                  ? "NTSE Test Results"
                  : viewType === "ptTest"
                  ? "Periodic Test Results"
                  : "Academic Results"}
              </h4>
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
                    {assessmentTypesByTerm.term1.map(([name], idx) => (
                      <th key={`t1-${idx}`} className="subhead">
                        {name}
                      </th>
                    ))}
                    <th className="subhead">Marks Obtained</th>
                    <th className="subhead">Grade</th>
                    {hasTerm2Data &&
                      assessmentTypesByTerm.term2.map(([name], idx) => (
                        <th key={`t2-${idx}`} className="subhead">
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
                    {assessmentTypesByTerm.term1.map(([_, total], idx) => (
                      <th key={`tm1-${idx}`} className="sub-total">
                        {total ? `(${total})` : ""}
                      </th>
                    ))}
                    <th className="sub-total">Total</th>
                    <th className="sub-total" />
                    {hasTerm2Data &&
                      assessmentTypesByTerm.term2.map(([_, total], idx) => (
                        <th key={`tm2-${idx}`} className="sub-total">
                          {total ? `(${total})` : ""}
                        </th>
                      ))}
                    {hasTerm2Data && <th className="sub-total" />}
                    {hasTerm2Data && <th className="sub-total" />}
                  </tr>
                </thead>
                <tbody>
                  {groupedGrades.map(({ subject, semesters }, idx) => (
                    <tr key={subject._id ?? subject.name ?? idx}>
                      <td className="col-num">{idx + 1}</td>
                      <td className="col-sub left">{subject?.name}</td>
                      {assessmentTypesByTerm.term1.map(([name], j) => (
                        <td key={`g-t1-${idx}-${j}`} className="score-cell">
                          {getDynamicScore(semesters["First Semester"], name)}
                        </td>
                      ))}
                      <td
                        className={`score-cell ${gradeColorClass(
                          calculateGrade(
                            calculateTotalMarks(semesters["First Semester"]),
                            calculateMaxMarks(semesters["First Semester"])
                          )
                        )}`}
                      >
                        {calculateTotalMarks(
                          semesters["First Semester"]
                        ).toFixed(2)}
                      </td>
                      <td
                        className={`score-cell ${gradeColorClass(
                          calculateGrade(
                            calculateTotalMarks(semesters["First Semester"]),
                            calculateMaxMarks(semesters["First Semester"])
                          )
                        )}`}
                      >
                        {calculateGrade(
                          calculateTotalMarks(semesters["First Semester"]),
                          calculateMaxMarks(semesters["First Semester"])
                        )}
                      </td>

                      {hasTerm2Data && (
                        <>
                          {assessmentTypesByTerm.term2.map(([name], j) => (
                            <td
                              key={`g-t2-${idx}-${j}`}
                              className="score-cell"
                            >
                              {getDynamicScore(
                                semesters["Second Semester"],
                                name
                              )}
                            </td>
                          ))}
                          <td
                            className={`score-cell ${gradeColorClass(
                              calculateGrade(
                                calculateTotalMarks(
                                  semesters["Second Semester"]
                                ),
                                calculateMaxMarks(semesters["Second Semester"])
                              )
                            )}`}
                          >
                            {calculateTotalMarks(
                              semesters["Second Semester"]
                            ).toFixed(2)}
                          </td>
                          <td
                            className={`score-cell ${gradeColorClass(
                              calculateGrade(
                                calculateTotalMarks(
                                  semesters["Second Semester"]
                                ),
                                calculateMaxMarks(semesters["Second Semester"])
                              )
                            )}`}
                          >
                            {calculateGrade(
                              calculateTotalMarks(
                                semesters["Second Semester"]
                              ),
                              calculateMaxMarks(semesters["Second Semester"])
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {Array.from({
                    length: Math.max(0, 10 - groupedGrades.length),
                  }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="col-num">
                        {groupedGrades.length + i + 1}
                      </td>
                      <td className="col-sub left">&nbsp;</td>
                      {assessmentTypesByTerm.term1.map((__, j) => (
                        <td key={`e1-${i}-${j}`}>&nbsp;</td>
                      ))}
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      {hasTerm2Data &&
                        assessmentTypesByTerm.term2.map((__, j) => (
                          <td key={`e2-${i}-${j}`}>&nbsp;</td>
                        ))}
                      {hasTerm2Data && <td>&nbsp;</td>}
                      {hasTerm2Data && <td>&nbsp;</td>}
                    </tr>
                  ))}

                  <tr className="totals-row">
                    <td colSpan="2" className="left">
                      <strong>Total</strong>
                    </td>
                    {assessmentTypesByTerm.term1.map(() => (
                      <td className="score-cell" key={Math.random()} />
                    ))}
                    <td className="score-cell">
                      <b>
                        {grandTotals.term1.obtained.toFixed(2)} /{" "}
                        {grandTotals.term1.max.toFixed(2)}
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
                        {assessmentTypesByTerm.term2.map(() => (
                          <td className="score-cell" key={Math.random()} />
                        ))}
                        <td className="score-cell">
                          <b>
                            {grandTotals.term2.obtained.toFixed(2)} /{" "}
                            {grandTotals.term2.max.toFixed(2)}
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

          {(viewType === "reportCard") && (
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
                    {EVALUATION_AREAS.map((area) => (
                      <tr key={area}>
                        <td className="left">{area}</td>
                        <td>
                          {firstSemesterReport?.evaluations?.find(
                            (e) => e.area === area
                          )?.result ?? "-"}
                        </td>
                        {hasTerm2Data && (
                          <td>
                            {secondSemesterReport?.evaluations?.find(
                              (e) => e.area === area
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

          {/* Signatures */}
          <section className="signatures">
            <div className="sig-col">
              <div className="sig-box">
                <p className="sig-label">
                  {teacher
                    ? teacher.charAt(0).toUpperCase() +
                      teacher.slice(1).toLowerCase()
                    : ""}
                </p>
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
                  {student?.parentContact?.parentName}
                </p>
                <div className="sig-label">Parent / Guardian</div>
              </div>
            </div>
          </section>

          <footer className="rc-footer">
            <div className="footer-msg">
              You leaped and crossed the hindrances & put a flag of victory
              with great enthusiasm!
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
