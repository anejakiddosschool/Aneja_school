
// // src/pages/ReportCardPage.js
// import React, { useState, useEffect, useMemo } from "react";
// import { useParams, Link } from "react-router-dom";
// import studentService from "../services/studentService";
// import gradeService from "../services/gradeService";
// import behavioralReportService from "../services/behavioralReportService";
// import rankService from "../services/rankService"; // Import the new rank service
// import "./ReportCard.css";
// import domtoimage from "dom-to-image";

// import axios from "axios";
// const ReportCardPage = ({ studentId }) => {
//   // const { id } = useParams();
//   const { id: routeId } = useParams();
//   const id = studentId || routeId; // use prop if passed, else fallback to route param

//   // States for data and page status
//   const [student, setStudent] = useState(null);
//   const [allGrades, setAllGrades] = useState([]);
//   const [allReports, setAllReports] = useState([]);
//   const [rank1stSem, setRank1stSem] = useState("-");
//   const [rank2ndSem, setRank2ndSem] = useState("-");
//   const [overallRank, setOverallRank] = useState("-");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // --- Data Fetching ---
//   useEffect(() => {
//     const fetchAllData = async () => {
//       setLoading(true);
//       try {
//         // Fetch primary data first
//         const [studentRes, gradesRes, reportsRes] = await Promise.all([
//           studentService.getStudentById(id),
//           gradeService.getGradesByStudent(id),
//           behavioralReportService.getReportsByStudent(id),
//         ]);

//         const studentData = studentRes.data.data;
//         const reportsData = reportsRes.data.data;

//         setStudent(studentData);
//         setAllGrades(gradesRes.data.data);
//         setAllReports(reportsData);

//         // If primary data is successful, fetch all the rank data in parallel
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

//             // Promise for 1st semester rank
//             rankPromises.push(
//               rankService.getRank({
//                 studentId: id,
//                 academicYear,
//                 semester: "First Semester",
//                 gradeLevel,
//               })
//             );

//             // Promise for 2nd semester rank (only if the report exists)
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
//               rankPromises.push(Promise.resolve(null)); // Add a placeholder if no 2nd sem
//             }

//             // Promise for Overall Rank
//             rankPromises.push(
//               rankService.getOverallRank({
//                 studentId: id,
//                 academicYear,
//                 gradeLevel,
//               })
//             );

//             // Await all rank promises
//             const [rank1Res, rank2Res, overallRankRes] =
//               await Promise.allSettled(rankPromises);

//             // Update states based on results
//             if (rank1Res.status === "fulfilled")
//               setRank1stSem(rank1Res.value.data.rank);
//             else setRank1stSem("N/A");
//             if (rank2Res.status === "fulfilled" && rank2Res.value)
//               setRank2ndSem(rank2Res.value.data.rank);
//             else setRank2ndSem("N/A");
//             if (overallRankRes.status === "fulfilled")
//               setOverallRank(overallRankRes.value.data.rank);
//             else setOverallRank("N/A");
//           }
//         }
//       } catch (err) {
//         setError("Failed to load all necessary report card data.");
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllData();
//   }, [id]);

//   // --- Data Processing for Subject Scores ---
//   const processedResults = useMemo(() => {
//     if (!allGrades || allGrades.length === 0) return [];
//     const subjectMap = new Map();
//     allGrades.forEach((grade) => {
//       const subjectId = grade.subject._id;
//       const subjectName = grade.subject.name;
//       if (!subjectMap.has(subjectId)) {
//         subjectMap.set(subjectId, {
//           subjectName,
//           firstSemester: null,
//           secondSemester: null,
//         });
//       }
//       const subjectEntry = subjectMap.get(subjectId);
//       if (grade.semester === "First Semester")
//         subjectEntry.firstSemester = grade.finalScore;
//       else if (grade.semester === "Second Semester")
//         subjectEntry.secondSemester = grade.finalScore;
//     });
//     subjectMap.forEach((subject) => {
//       const scores = [subject.firstSemester, subject.secondSemester].filter(
//         (s) => s !== null
//       );
//       subject.average =
//         scores.length > 0
//           ? scores.reduce((a, b) => a + b, 0) / scores.length
//           : null;
//     });
//     return Array.from(subjectMap.values());
//   }, [allGrades]);

//   // --- Data Processing for Final Summary ---
//   const finalSummary = useMemo(() => {
//     if (processedResults.length === 0) return null;
//     const summary = {
//       total1st: processedResults.reduce(
//         (sum, sub) => sum + (sub.firstSemester || 0),
//         0
//       ),
//       total2nd: processedResults.reduce(
//         (sum, sub) => sum + (sub.secondSemester || 0),
//         0
//       ),
//     };
//     const numSubjects = processedResults.length;
//     summary.average1st = numSubjects > 0 ? summary.total1st / numSubjects : 0;
//     summary.average2nd = numSubjects > 0 ? summary.total2nd / numSubjects : 0;
//     summary.overallAverage = (summary.average1st + summary.average2nd) / 2;
//     // Add the overall total calculation
//     summary.overallTotal = (summary.total1st + summary.total2nd) / 2;
//     summary.average1st = numSubjects > 0 ? summary.total1st / numSubjects : 0;
//     summary.average2nd = numSubjects > 0 ? summary.total2nd / numSubjects : 0;
//     // The overall average can also be calculated from the overall total
//     summary.overallAverage =
//       numSubjects > 0 ? summary.overallTotal / (numSubjects * 2) : 0;

//     return summary;
//   }, [processedResults]);

//   // --- Filter Reports for Each Semester ---
//   const firstSemesterReport = allReports.find(
//     (r) => r.semester === "First Semester"
//   );
//   const secondSemesterReport = allReports.find(
//     (r) => r.semester === "Second Semester"
//   );

//   // --- Helper Functions ---
//   const calculateAge = (dateOfBirth) => {
//     if (!dateOfBirth) return "N/A";
//     const today = new Date();
//     const birthDate = new Date(dateOfBirth);
//     let age = today.getFullYear() - birthDate.getFullYear();
//     const m = today.getMonth() - birthDate.getMonth();
//     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
//     return age;
//   };

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
//         console.warn("Could not read styles:", e);
//       }
//     }
//     const printWindow = window.open("", "", "height=600,width=800");
//     if (!printWindow) {
//       alert("Please allow pop-ups.");
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
//     }, 500);
//   };

//   const handleCapture = async () => {
//     const node = document.getElementById("printableArea");
//     if (!node) return;

//     try {
//       const dataUrl = await domtoimage.toPng(node, {
//         quality: 1,
//         bgcolor: "white",
//       });
//       const link = document.createElement("a");
//       link.href = dataUrl;
//       link.download = `${student?.fullName || "report-card"}.png`;
//       link.click();
//     } catch (err) {
//       console.error("Capture failed:", err);
//     }
//   };

//   // --- Render Logic ---
//   if (loading) return <p>Generating Authentic Report Card...</p>;
//   if (error) return <p style={{ color: "red" }}>{error}</p>;
//   const saveReportCardToCloud = async (studentId) => {
//     try {
//       const reportCardElement = document.getElementById("reportCard"); // wrap report with this ID

//       const blob = await domtoimage.toBlob(reportCardElement);

//       const formData = new FormData();
//       formData.append("file", blob, "report-card.png");

//       await axios.post(
//         `http://localhost:5001/api/students/${studentId}/report-card`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );

//       alert("Report card uploaded successfully!");
//     } catch (error) {
//       console.error("Error saving report card:", error);
//     }
//   };

//   return (
//     <div className="report-card-container">
//       <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center justify-between gap-4 border-t-4 border-pink-500">
//         <Link
//           // to={`/students/${id}`}
//           to={"/"}
//           className="text-gray-600 hover:text-black font-semibold transition-colors duration-200 flex items-center text-sm"
//         >
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             className="h-5 w-5 mr-1"
//             viewBox="0 0 20 20"
//             fill="currentColor"
//           >
//             <path
//               fillRule="evenodd"
//               d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
//               clipRule="evenodd"
//             />
//           </svg>
//           Back to Details
//         </Link>
//         <h3 className="text-lg font-bold text-gray-800 hidden md:block">
//           Report Card Controls
//         </h3>
//         <button
//           onClick={handlePrint}
//           className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
//         >
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             className="h-5 w-5"
//             viewBox="0 0 20 20"
//             fill="currentColor"
//           >
//             <path
//               fillRule="evenodd"
//               d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
//               clipRule="evenodd"
//             />
//           </svg>
//           Print
//         </button>
//         <button
//           onClick={handleCapture}
//           className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
//         >
//           📸 Capture
//         </button>
//         <button
//           className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
//           onClick={() => saveReportCardToCloud(studentId)}
//         >
//           Upload Report Card
//         </button>
//       </div>
//       <div id="reportCard">
//         <div id="printableArea">
//           {/* ===== FRONT PAGE ===== */}
//           <div className="report-card sheet">
//             <div className="front-page-grid">
//               <div className="front-right-col">
//                 <div className="front-comment-box large-comment">
//                   <h4>Parent's Comment</h4>
//                   <div className="comment-space"></div>
//                   <p>Name: _________________________ Signature: __________</p>
//                 </div>
//                 <div className="front-comment-box small-comment">
//                   <h4>Homeroom Teacher's Comment (1st Sem)</h4>
//                   <div className="comment-space">
//                     <p>{firstSemesterReport?.teacherComment}</p>
//                   </div>
//                   <p>
//                     Name:{" "}
//                     <b>
//                       {firstSemesterReport?.createdBy?.fullName ||
//                         "_________________"}
//                     </b>{" "}
//                     Signature: __________
//                   </p>
//                 </div>
//                 <div className="front-comment-box small-comment">
//                   <h4>Homeroom Teacher's Comment (2nd Sem)</h4>
//                   <div className="comment-space">
//                     <p>{secondSemesterReport?.teacherComment}</p>
//                   </div>
//                   <p>
//                     Name:{" "}
//                     <b>
//                       {firstSemesterReport?.createdBy?.fullName ||
//                         "_________________"}
//                     </b>{" "}
//                     Signature: __________
//                   </p>
//                 </div>
//                 <div className="message-to-parents">
//                   <h4>Message to parents</h4>
//                   <p>
//                     The above report card primarily focuses on your child's
//                     behavioral development in various aspects, but it cannot
//                     encompass everything about your child. These are keys to
//                     your child's academic success. We would like you to pay
//                     attention to this progress report card and assess your child
//                     at home. Thank you.
//                   </p>
//                   <hr className="bilingual-divider" />
//                 </div>
//               </div>
//               <div className="front-left-col">
//                 <header className="card-header">
//                   <h2>Aneja Kiddos School</h2>
//                 </header>
//                 <div className="flex w-100% justify-center mb-4">
//                   {student?.imageUrl && (
//                     <img
//                       src={student.imageUrl}
//                       alt={`${student.fullName}'s profile`}
//                       className="student-profile-photo "
//                       style={{
//                         width: "150px",
//                         height: "200px",
//                         objectFit: "cover",
//                         borderRadius: "8px",
//                         border: "2px solid #ccc",
//                         marginBottom: "1rem",
//                       }}
//                     />
//                   )}
//                 </div>

//                 <div className="front-info-item">
//                   <span>Student's Name:</span>
//                   <p>{student?.fullName}</p>
//                 </div>
//                 <div className="front-info-item">
//                   <span>Academic Year:</span>
//                   <p>{firstSemesterReport?.academicYear || "N/A"}</p>
//                 </div>
//                 <div className="front-info-item">
//                   <span>Grade:</span>
//                   <p>{student?.gradeLevel}</p>
//                 </div>
//                 <div className="front-info-item">
//                   <span>Promoted to:</span>
//                   <p>{student?.promotionStatus}</p>
//                 </div>
//                 <div className="front-info-item">
//                   <span>Sex:</span>
//                   <p>{student?.gender}</p>
//                 </div>
//                 <div className="front-info-item">
//                   <span>Age:</span>
//                   <p>{calculateAge(student?.dateOfBirth)}</p>
//                 </div>
//                 <div className="front-info-item">
//                   <span>ID No:</span>
//                   <p>{student?.studentId}</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* ===== BACK PAGE ===== */}
//           <div className="report-card sheet">
//             <div className="back-page-grid">
//               <div className="back-left-col">
//                 <div className="academic-results">
//                   <h4>ACADEMIC RESULTS</h4>
//                   <table>
//                     <thead className="bg-rose-600 text-cyan-100">
//                       <tr>
//                         <th>SUBJECT</th>
//                         <th>1ST SEM</th>
//                         <th>2ND SEM</th>
//                         <th>AVG.</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {processedResults.map((r, i) => (
//                         <tr key={i}>
//                           <td className="bg-rose-600 text-cyan-100">
//                             {r.subjectName}
//                           </td>
//                           <td>{r.firstSemester ?? "-"}</td>
//                           <td>{r.secondSemester ?? "-"}</td>
//                           <td>{r.average?.toFixed(2) ?? "-"}</td>
//                         </tr>
//                       ))}
//                     </tbody>

//                     <tfoot>
//                       <tr>
//                         <td className="bg-rose-600 text-cyan-100">
//                           <strong>Total</strong>
//                         </td>
//                         <td>
//                           <strong>{finalSummary?.total1st.toFixed(2)}</strong>
//                         </td>
//                         <td>
//                           <strong>{finalSummary?.total2nd.toFixed(2)}</strong>
//                         </td>
//                         <td>
//                           <strong>
//                             {finalSummary?.overallTotal.toFixed(2)}
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td className="bg-rose-600 text-cyan-100">
//                           <strong>Average</strong>
//                         </td>
//                         <td>
//                           <strong>{finalSummary?.average1st.toFixed(2)}</strong>
//                         </td>
//                         <td>
//                           <strong>{finalSummary?.average2nd.toFixed(2)}</strong>
//                         </td>
//                         <td>
//                           <strong>
//                             {finalSummary?.overallAverage.toFixed(2)}
//                           </strong>
//                         </td>
//                       </tr>
//                       <tr>
//                         <td className="bg-rose-600 text-cyan-100">
//                           <strong>Rank</strong>
//                         </td>
//                         <td>
//                           <strong>{rank1stSem}</strong>
//                         </td>
//                         <td>
//                           <strong>{rank2ndSem}</strong>
//                         </td>
//                         <td>
//                           <strong>{overallRank}</strong>
//                         </td>
//                       </tr>

//                       <tr>
//                         <td className="bg-rose-600 text-cyan-100">
//                           <strong>Conduct</strong>
//                         </td>
//                         <td>{firstSemesterReport?.conduct ?? "-"}</td>
//                         <td>{secondSemesterReport?.conduct ?? "-"}</td>
//                         <td>-</td>
//                       </tr>
//                     </tfoot>
//                   </table>
//                 </div>
//                 <div className="director-signature">
//                   <p>
//                     <strong>Director's Name:</strong> _________________________
//                   </p>
//                   <p>
//                     <strong>Signature:</strong> __________
//                   </p>
//                 </div>
//               </div>
//               <div className="back-right-col">
//                 <div className="personality-skills">
//                   <h4>PERSONALITY TRAITS & SKILLS</h4>
//                   <table className="traits-table">
//                     <thead className="bg-rose-600 text-cyan-100">
//                       <tr>
//                         <th>TRAITS</th>
//                         <th>1ST SEM</th>
//                         <th>2ND SEM</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {EVALUATION_AREAS.map((area) => (
//                         <tr key={area}>
//                           <td className="bg-rose-600 text-cyan-100">{area}</td>
//                           <td>
//                             {firstSemesterReport?.evaluations.find(
//                               (e) => e.area === area
//                             )?.result ?? "-"}
//                           </td>
//                           <td>
//                             {secondSemesterReport?.evaluations.find(
//                               (e) => e.area === area
//                             )?.result ?? "-"}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                   <div className="grading-key">
//                     <h4>GRADING KEY</h4>
//                     <table>
//                       <tbody>
//                         <tr>
//                           <td>E</td>
//                           <td>Excellent</td>
//                         </tr>
//                         <tr>
//                           <td>VG</td>
//                           <td>Very Good</td>
//                         </tr>
//                         <tr>
//                           <td>G</td>
//                           <td>Good</td>
//                         </tr>
//                         <tr>
//                           <td>NI</td>
//                           <td>Needs Improvement</td>
//                         </tr>
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
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

// src/pages/ReportCardPage.js
import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import studentService from "../services/studentService";
import gradeService from "../services/gradeService";
import behavioralReportService from "../services/behavioralReportService";
import rankService from "../services/rankService";
import "./ReportCard.css";
import domtoimage from "dom-to-image";
import axios from "axios";

const ReportCardPage = ({ studentId }) => {
  const { id: routeId } = useParams();
  const id = studentId || routeId;
  const [userRole, setUserRole] = useState(null);
  const [student, setStudent] = useState(null);
  const [allGrades, setAllGrades] = useState([]);
  const [allReports, setAllReports] = useState([]);
  const [rank1stSem, setRank1stSem] = useState("-");
  const [rank2ndSem, setRank2ndSem] = useState("-");
  const [overallRank, setOverallRank] = useState("-");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [studentRes, gradesRes, reportsRes] = await Promise.all([
          studentService.getStudentById(id),
          gradeService.getGradesByStudent(id),
          behavioralReportService.getReportsByStudent(id),
        ]);

        const studentData = studentRes.data.data;
        const reportsData = reportsRes.data.data;

        setStudent(studentData);
        setAllGrades(gradesRes.data.data);
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

            setRank1stSem(rank1Res.status === "fulfilled" ? rank1Res.value.data.rank : "N/A");
            setRank2ndSem(
              rank2Res.status === "fulfilled" && rank2Res.value
                ? rank2Res.value.data.rank
                : "N/A"
            );
            setOverallRank(
              overallRankRes.status === "fulfilled"
                ? overallRankRes.value.data.rank
                : "N/A"
            );
          }
        }
      } catch (err) {
        setError("Failed to load all necessary report card data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);



  useEffect(() => {
    // On mount, read user info from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        setUserRole(userObj.role);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
      }
    }
  }, []);


  // Group grades by subject and semester
  const groupedGrades = useMemo(() => {
    if (!allGrades || allGrades.length === 0) return [];
    const subjectMap = new Map();

    allGrades.forEach((gradeRecord) => {
      const subjectId = gradeRecord.subject._id;
      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject: gradeRecord.subject,
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
  }, [allGrades]);

  // Extract unique assessment types and their total marks dynamically by term
  const assessmentTypesByTerm = useMemo(() => {
    const term1Types = new Map();
    const term2Types = new Map();

    allGrades.forEach((gradeRecord) => {
      if (
        gradeRecord.assessments &&
        Array.isArray(gradeRecord.assessments) &&
        gradeRecord.semester
      ) {
        gradeRecord.assessments.forEach(({ assessmentType }) => {
          if (!assessmentType || !assessmentType.name) return;
          const mapTarget = gradeRecord.semester === "First Semester" ? term1Types : term2Types;
          if (!mapTarget.has(assessmentType.name)) {
            mapTarget.set(assessmentType.name, assessmentType.totalMarks);
          }
        });
      }
    });

    const sortOrder = ["PT-I", "PT-II", "SA-I", "SA-II"];
    const sortedTerm1 = Array.from(term1Types.entries()).sort(
      ([a], [b]) => {
        const ia = sortOrder.indexOf(a);
        const ib = sortOrder.indexOf(b);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
    );
    const sortedTerm2 = Array.from(term2Types.entries()).sort(
      ([a], [b]) => {
        const ia = sortOrder.indexOf(a);
        const ib = sortOrder.indexOf(b);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      }
    );

    return {
      term1: sortedTerm1,
      term2: sortedTerm2,
    };
  }, [allGrades]);

  // Calculate totals and averages dynamically for each term and assessment
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

    // Initialize totals and counts for assessments for both terms
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
        if (semesterData) {
          const termKey = sem === "First Semester" ? "term1" : "term2";

          semesterData.assessments.forEach(({ assessmentType, score }) => {
            if (
              assessmentType &&
              assessmentType.name &&
              totals[termKey].has(assessmentType.name)
            ) {
              totals[termKey].set(
                assessmentType.name,
                totals[termKey].get(assessmentType.name) + score
              );
              counts[termKey].set(
                assessmentType.name,
                counts[termKey].get(assessmentType.name) + 1
              );
            }
          });

          if (
            typeof semesterData.finalScore === "number" &&
            semesterData.finalScore >= 0
          ) {
            if (termKey === "term1") {
              totals.term1FinalTotal += semesterData.finalScore;
              totals.term1FinalCount++;
            } else {
              totals.term2FinalTotal += semesterData.finalScore;
              totals.term2FinalCount++;
            }
          }
        }
      });
    });

    // Calculate averages, handle division by zero
    const averages = { term1: new Map(), term2: new Map() };

    assessmentTypesByTerm.term1.forEach(([name]) => {
      averages.term1.set(
        name,
        counts.term1.get(name) ? totals.term1.get(name) / counts.term1.get(name) : 0
      );
    });
    assessmentTypesByTerm.term2.forEach(([name]) => {
      averages.term2.set(
        name,
        counts.term2.get(name) ? totals.term2.get(name) / counts.term2.get(name) : 0
      );
    });

    return {
      totals,
      counts,
      averages,
      term1FinalAverage: totals.term1FinalCount ? totals.term1FinalTotal / totals.term1FinalCount : 0,
      term2FinalAverage: totals.term2FinalCount ? totals.term2FinalTotal / totals.term2FinalCount : 0,
    };
  }, [groupedGrades, assessmentTypesByTerm]);

  // Helper to get dynamic score for subject-semester-assessmentType
  const getDynamicScore = (subjectSemData, assessmentName) => {
    if (!subjectSemData || !subjectSemData.assessments) return "-";
    const assess = subjectSemData.assessments.find(
      (a) => a.assessmentType.name === assessmentName
    );
    return assess ? assess.score : "-";
  };

  // Helper to get final score (marks obtained) for subject-semester
  const getFinalScore = (subjectSemData) =>
    subjectSemData && typeof subjectSemData.finalScore === "number"
      ? subjectSemData.finalScore
      : "-";

  // Helper to get grade for subject-semester
  const getGrade = (subjectSemData) => (subjectSemData?.grade ? subjectSemData.grade : "-");

  const firstSemesterReport = allReports.find(
    (r) => r.semester === "First Semester"
  );
  const secondSemesterReport = allReports.find(
    (r) => r.semester === "Second Semester"
  );

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "N/A";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
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
      } catch (e) {
        console.warn("Could not read styles:", e);
      }
    }
    const printWindow = window.open("", "", "height=600,width=800");
    if (!printWindow) {
      alert("Please allow pop-ups.");
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
    }, 500);
  };

  const handleCapture = async () => {
    const node = document.getElementById("printableArea");
    if (!node) return;

    try {
      const dataUrl = await domtoimage.toPng(node, {
        quality: 1,
        bgcolor: "white",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${student?.fullName || "report-card"}.png`;
      link.click();
    } catch (err) {
      console.error("Capture failed:", err);
    }
  };

  const saveReportCardToCloud = async (studentId) => {
    try {
      const reportCardElement = document.getElementById("reportCard");
      const blob = await domtoimage.toBlob(reportCardElement);
      const formData = new FormData();
      formData.append("file", blob, "report-card.png");

      await axios.post(
        `http://localhost:5001/api/students/${studentId}/report-card`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      alert("Report card uploaded successfully!");
    } catch (error) {
      console.error("Error saving report card:", error);
    }
  };

  if (loading) return <p>Generating Authentic Report Card...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="report-card-container">
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-center justify-between gap-4 border-t-4 border-pink-500">
        <Link
          to={"/"}
          className="text-gray-600 hover:text-black font-semibold transition-colors duration-200 flex items-center text-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Back to Details
        </Link>
        <h3 className="text-lg font-bold text-gray-800 hidden md:block">
          Report Card Controls
        </h3>
        <button
          onClick={handlePrint}
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
              clipRule="evenodd"
            />
          </svg>
          Print
        </button>
        <button
          onClick={handleCapture}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
        >
          📸 Capture
        </button>
         {userRole === "teacher" || userRole === "admin" ? (
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-lg transform hover:-translate-y-0.5"
          onClick={() => saveReportCardToCloud(studentId)}
        >
          Upload Report Card
        </button>
      ) : null}
      </div>

      <div id="reportCard">
        <div id="printableArea">
          {/* FRONT PAGE */}
          <div className="report-card sheet">
            <div className="front-page-grid">
              <div className="front-right-col">
                <div className="front-comment-box large-comment">
                  <h4>Parent's Comment</h4>
                  <div className="comment-space"></div>
                  <p>Name: _________________________ Signature: __________</p>
                </div>
                <div className="front-comment-box small-comment">
                  <h4>Homeroom Teacher's Comment (1st Sem)</h4>
                  <div className="comment-space">
                    <p>{firstSemesterReport?.teacherComment}</p>
                  </div>
                  <p>
                    Name:{" "}
                    <b>
                      {firstSemesterReport?.createdBy?.fullName ||
                        "_________________"}
                    </b>{" "}
                    Signature: __________
                  </p>
                </div>
                <div className="front-comment-box small-comment">
                  <h4>Homeroom Teacher's Comment (2nd Sem)</h4>
                  <div className="comment-space">
                    <p>{secondSemesterReport?.teacherComment}</p>
                  </div>
                  <p>
                    Name:{" "}
                    <b>
                      {secondSemesterReport?.createdBy?.fullName ||
                        "_________________"}
                    </b>{" "}
                    Signature: __________
                  </p>
                </div>
                <div className="message-to-parents">
                  <h4>Message to parents</h4>
                  <p>
                    The above report card primarily focuses on your child's
                    behavioral development in various aspects, but it cannot
                    encompass everything about your child. These are keys to
                    your child's academic success. We would like you to pay
                    attention to this progress report card and assess your child
                    at home. Thank you.
                  </p>
                  <hr className="bilingual-divider" />
                </div>
              </div>
              <div className="front-left-col">
                <header className="card-header">
                  <h2>Aneja Kiddos School</h2>
                </header>
                <div className="flex w-100% justify-center mb-4">
                  {student?.imageUrl && (
                    <img
                      src={student.imageUrl}
                      alt={`${student.fullName}'s profile`}
                      className="student-profile-photo "
                      style={{
                        width: "150px",
                        height: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "2px solid #ccc",
                        marginBottom: "1rem",
                      }}
                    />
                  )}
                </div>

                <div className="front-info-item">
                  <span>Student's Name:</span>
                  <p>{student?.fullName}</p>
                </div>
                <div className="front-info-item">
                  <span>Academic Year:</span>
                  <p>{firstSemesterReport?.academicYear || "N/A"}</p>
                </div>
                <div className="front-info-item">
                  <span>Grade:</span>
                  <p>{student?.gradeLevel}</p>
                </div>
                <div className="front-info-item">
                  <span>Promoted to:</span>
                  <p>{student?.promotionStatus}</p>
                </div>
                <div className="front-info-item">
                  <span>Sex:</span>
                  <p>{student?.gender}</p>
                </div>
                <div className="front-info-item">
                  <span>Age:</span>
                  <p>{calculateAge(student?.dateOfBirth)}</p>
                </div>
                <div className="front-info-item">
                  <span>ID No:</span>
                  <p>{student?.studentId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* BACK PAGE */}
          <div className="report-card sheet">
            <div className="back-page-grid">
              {/* ACADEMIC RESULTS */}
              <div className="back-left-col">
                <div className="academic-results">
                  <h4>ACADEMIC RESULTS</h4>
                  <table>
                    <thead>
                      <tr>
                        <th rowSpan="3" style={{ border: "1px solid black" }}>
                          Sr No.
                        </th>
                        <th rowSpan="3" style={{ border: "1px solid black" }}>
                          Subjects
                        </th>
                        <th colSpan={assessmentTypesByTerm.term1.length + 2} style={{ border: "1px solid black" }}>
                          TERM I
                        </th>
                        <th colSpan={assessmentTypesByTerm.term2.length + 2} style={{ border: "1px solid black" }}>
                          TERM II
                        </th>
                      </tr>
                      <tr>
                        {assessmentTypesByTerm.term1.map(([name]) => (
                          <th key={`th1-${name}`} style={{ border: "1px solid black" }}>
                            {name}
                          </th>
                        ))}
                        <th style={{ border: "1px solid black" }}>Marks Obtained</th>
                        <th style={{ border: "1px solid black" }}>Grade</th>

                        {assessmentTypesByTerm.term2.map(([name]) => (
                          <th key={`th2-${name}`} style={{ border: "1px solid black" }}>
                            {name}
                          </th>
                        ))}
                        <th style={{ border: "1px solid black" }}>Marks Obtained</th>
                        <th style={{ border: "1px solid black" }}>Grade</th>
                      </tr>
                      <tr>
                        {assessmentTypesByTerm.term1.map(([_, totalMarks]) => (
                          <th key={`tm1-${_}`} style={{ border: "1px solid black", fontWeight: 'normal', fontSize: '0.75rem' }}>
                            {`(${totalMarks})`}
                          </th>
                        ))}
                        <th style={{ border: "1px solid black" }}>(100)</th>
                        <th style={{ border: "1px solid black" }}></th>

                        {assessmentTypesByTerm.term2.map(([_, totalMarks]) => (
                          <th key={`tm2-${_}`} style={{ border: "1px solid black", fontWeight: 'normal', fontSize: '0.75rem' }}>
                             {`(${totalMarks})`}
                          </th>
                        ))}
                        <th style={{ border: "1px solid black" }}>(100)</th>
                        <th style={{ border: "1px solid black" }}></th>
                      </tr>
                    </thead>

                    <tbody>
                      {groupedGrades.map(({ subject, semesters }, idx) => (
                        <tr key={subject._id}>
                          <td style={{ border: "1px solid black", textAlign: "center" }}>{idx + 1}</td>
                          <td style={{ border: "1px solid black", paddingLeft: "8px" }}>{subject.name}</td>

                          {/* TERM I Dynamic Scores */}
                          {assessmentTypesByTerm.term1.map(([name]) => (
                            <td key={`score1-${subject._id}-${name}`} style={{ border: "1px solid black", textAlign: 'center' }}>
                              {getDynamicScore(semesters["First Semester"], name)}
                            </td>
                          ))}
                          <td style={{ border: "1px solid black", textAlign: "center" }}>
                            {getFinalScore(semesters["First Semester"])}
                          </td>
                          <td style={{ border: "1px solid black", textAlign: "center" }}>
                            {getGrade(semesters["First Semester"])}
                          </td>

                          {/* TERM II Dynamic Scores */}
                          {assessmentTypesByTerm.term2.map(([name]) => (
                            <td key={`score2-${subject._id}-${name}`} style={{ border: "1px solid black", textAlign: 'center' }}>
                              {getDynamicScore(semesters["Second Semester"], name)}
                            </td>
                          ))}
                          <td style={{ border: "1px solid black", textAlign: "center" }}>
                            {getFinalScore(semesters["Second Semester"])}
                          </td>
                          <td style={{ border: "1px solid black", textAlign: "center" }}>
                            {getGrade(semesters["Second Semester"])}
                          </td>
                        </tr>
                      ))}

                      {/* Totals row */}
                      <tr>
                        <td colSpan="2" style={{ border: "1px solid black", fontWeight: "bold" }}>
                          Total
                        </td>
                        {assessmentTypesByTerm.term1.map(([name]) => (
                          <td key={`totalt1-${name}`} style={{ border: "1px solid black", textAlign: 'center' }}>
                            {totalsAndAverages.totals.term1.get(name).toFixed(2)}
                          </td>
                        ))}
                        <td style={{ border: "1px solid black", textAlign: "center" }}>
                          {totalsAndAverages.totals.term1FinalTotal.toFixed(2)}
                        </td>
                        <td style={{ border: "1px solid black" }}>-</td>

                        {assessmentTypesByTerm.term2.map(([name]) => (
                          <td key={`totalt2-${name}`} style={{ border: "1px solid black", textAlign: 'center' }}>
                            {totalsAndAverages.totals.term2.get(name).toFixed(2)}
                          </td>
                        ))}
                        <td style={{ border: "1px solid black", textAlign: "center" }}>
                          {totalsAndAverages.totals.term2FinalTotal.toFixed(2)}
                        </td>
                        <td style={{ border: "1px solid black" }}>-</td>
                      </tr>

                      {/* Averages row */}
                      {/* <tr>
                        <td colSpan="2" style={{ border: "1px solid black", fontWeight: "bold" }}>
                          Average
                        </td>
                        {assessmentTypesByTerm.term1.map(([name]) => (
                          <td key={`avgt1-${name}`} style={{ border: "1px solid black", textAlign: 'center' }}>
                            {totalsAndAverages.averages.term1.get(name).toFixed(2)}
                          </td>
                        ))}
                        <td style={{ border: "1px solid black", textAlign: "center" }}>
                          {totalsAndAverages.term1FinalAverage.toFixed(2)}
                        </td>
                        <td style={{ border: "1px solid black" }}>-</td>

                        {assessmentTypesByTerm.term2.map(([name]) => (
                          <td key={`avgt2-${name}`} style={{ border: "1px solid black", textAlign: 'center' }}>
                            {totalsAndAverages.averages.term2.get(name).toFixed(2)}
                          </td>
                        ))}
                        <td style={{ border: "1px solid black", textAlign: "center" }}>
                          {totalsAndAverages.term2FinalAverage.toFixed(2)}
                        </td>
                        <td style={{ border: "1px solid black" }}>-</td>
                      </tr> */}

                      {/* Rank row */}
                      <tr>
                        <td colSpan="2" style={{ border: "1px solid black", fontWeight: "bold" }}>
                          Rank
                        </td>
                        <td colSpan={assessmentTypesByTerm.term1.length + 2} style={{ border: "1px solid black", textAlign: "center" }}>
                          {rank1stSem}
                          
                        </td>
                        <td colSpan={assessmentTypesByTerm.term2.length + 2} style={{ border: "1px solid black", textAlign: "center" }}>
                          {rank2ndSem}
                        </td>
                      </tr>

                      {/* Conduct row */}
                      <tr>
                        <td colSpan="2" style={{ border: "1px solid black", fontWeight: "bold" }}>
                          Conduct
                        </td>
                        <td colSpan={assessmentTypesByTerm.term1.length + 2} style={{ border: "1px solid black", textAlign: "center" }}>
                          {firstSemesterReport?.conduct ?? "-"}
                        </td>
                        <td colSpan={assessmentTypesByTerm.term2.length + 2} style={{ border: "1px solid black", textAlign: "center" }}>
                          {secondSemesterReport?.conduct ?? "-"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="director-signature" style={{ marginTop: "1rem" }}>
                  <p>
                    <strong>Director's Name:</strong> _________________________
                  </p>
                  <p>
                    <strong>Signature:</strong> __________
                  </p>
                </div>
              </div>

              {/* PERSONALITY TRAITS & SKILLS */}
              <div className="back-right-col">
                <div className="personality-skills">
                  <h4>PERSONALITY TRAITS & SKILLS</h4>
                  <table className="traits-table">
                    <thead className="bg-rose-600 text-cyan-100">
                      <tr>
                        <th>TRAITS</th>
                        <th>1ST SEM</th>
                        <th>2ND SEM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EVALUATION_AREAS.map((area) => (
                        <tr key={area}>
                          <td className="bg-rose-600 text-cyan-100">{area}</td>
                          <td>
                            {firstSemesterReport?.evaluations.find(
                              (e) => e.area === area
                            )?.result ?? "-"}
                          </td>
                          <td>
                            {secondSemesterReport?.evaluations.find(
                              (e) => e.area === area
                            )?.result ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="grading-key">
                    <h4>GRADING KEY</h4>
                    <table>
                      <tbody>
                        <tr>
                          <td>E</td>
                          <td>Excellent</td>
                        </tr>
                        <tr>
                          <td>VG</td>
                          <td>Very Good</td>
                        </tr>
                        <tr>
                          <td>G</td>
                          <td>Good</td>
                        </tr>
                        <tr>
                          <td>NI</td>
                          <td>Needs Improvement</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EVALUATION_AREAS = [
  "Punctuality",
  "Attendance",
  "Responsibility",
  "Respect",
  "Cooperation",
  "Initiative",
  "Completes Work",
];

export default ReportCardPage;


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

//   // Digital signatures (Base64 data URLs)
//   const [signatures, setSignatures] = useState({
//     classTeacher: null,
//     principal: null,
//     parent: null,
//   });

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

//   console.log("ranks:", { rank1stSem, rank2ndSem, overallRank });

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

//   // Group grades by subject with semester buckets
//   const groupedGrades = useMemo(() => {
//     if (!allGrades || allGrades.length === 0) return [];
//     const subjectMap = new Map();
//     allGrades.forEach((gradeRecord) => {
//       const subjectId =
//         gradeRecord.subject?._id ?? gradeRecord.subject?.name ?? Math.random();
//       if (!subjectMap.has(subjectId)) {
//         subjectMap.set(subjectId, {
//           subject: gradeRecord.subject || { name: "Unknown" },
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
//   }, [allGrades]);

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

//   // Extract unique assessment types and totals per term
//   const assessmentTypesByTerm = useMemo(() => {
//     const term1Types = new Map();
//     const term2Types = new Map();

//     allGrades.forEach((gradeRecord) => {
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
//   }, [allGrades]);

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
//                 termKey === "term1" ? name : name,
//                 totals[termKey].get(name) + (score ?? 0)
//               );
//               counts[termKey].set(
//                 termKey === "term1" ? name : name,
//                 counts[termKey].get(name) + 1
//               );
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

//   // Print function — unchanged
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

//   // Capture image function — unchanged
//   const handleCapture = async () => {
//     const node = document.getElementById("reportCard");
//     if (!node) return;
//     try {
//       const dataUrl = await domtoimage.toPng(node, {
//         quality: 1,
//         bgcolor: "white",
//       });
//       const link = document.createElement("a");
//       link.href = dataUrl;
//       link.download = `${student?.fullName || "report-card"}.png`;
//       link.click();
//     } catch (err) {
//       console.error("Capture failed:", err);
//     }
//   };

//   const saveReportCardToCloud = async (studentIdToSave) => {
//     setUploading(true);
//     try {
//       const reportCardElement = document.getElementById("reportCard");
//       const blob = await domtoimage.toBlob(reportCardElement, {
//         quality: 1,
//         bgcolor: "white",
//         width: reportCardElement.scrollWidth * 2,
//         height: reportCardElement.scrollHeight * 2,
//         style: {
//           transform: "scale(2)",
//           transformOrigin: "top left",
//           width: `${reportCardElement.scrollWidth}px`,
//           height: `${reportCardElement.scrollHeight}px`,
//         },
//       });

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

//       const fileName = `${studentName}_${grade}_${timestamp}.png`;

//       console.log("Uploading file:", fileName);
//       const formData = new FormData();
//       formData.append("file", blob, fileName);

//       await axios.post(
//         `http://localhost:5001/api/students/${studentIdToSave}/report-card`,
//         formData,
//         {
//           headers: { "Content-Type": "multipart/form-data" },
//         }
//       );

//       alert("Report card uploaded successfully!");
//       window.location.reload();
//     } catch {
//       alert("Upload failed!");
//     }
//     setUploading(false);
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

//   const handleDeleteReportCard = async (studentId) => {
//     if (!window.confirm("Are you sure you want to delete this report card?"))
//       return;

//     setUploading(true);
//     try {
//       const userData = localStorage.getItem("user");
//       const token = userData ? JSON.parse(userData).token : null;

//       await axios.delete(
//         `http://localhost:5001/api/students/${studentId}/report-card`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       alert("Report card deleted successfully.");
//       // Refresh data after deletion (or reload)
//       window.location.reload();
//     } catch (error) {
//       console.error(error);
//       alert("Failed to delete report card.");
//     }
//     setUploading(false);
//   };

//   return (
//     <div
//       className={`report-card-container ${
//         darkTheme ? "dark-theme" : "light-theme"
//       }`}
//     >
//       {/* Controls */}
//     <div className="controls no-print" style={{ gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
//   <div className="left-controls" style={{ display: "none" }}>
//     {/* Hidden Back Link for now */}
//   </div>
//   <div
//     className="right-controls"
//     style={{
//       display: "flex",
//       gap: 8,
//       flexWrap: "wrap",
//       justifyContent: "flex-end",
//       alignItems: "center",
//       width: "100%",
//       maxWidth: 600,
//       marginLeft: "auto",
//       marginRight: "auto",
//     }}
//   >
//     {/* <button
//       className="btn btn-outline"
//       onClick={toggleTheme}
//       style={{ flex: "1 1 auto", minWidth: 90, fontSize: "0.85rem", padding: "6px 8px" }}
//       title="Toggle light/dark theme"
//       type="button"
//     >
//       {darkTheme ? "Light Theme" : "Dark Theme"}
//     </button> */}

//     <button
//       className="btn btn-outline"
//       onClick={handlePrint}
//       style={{ flex: "1 1 auto", minWidth: 60, fontSize: "0.85rem", padding: "6px 8px" }}
//       title="Print Report Card"
//       type="button"
//     >
//       🖨 Print
//     </button>

//     <button
//       className="btn btn-outline"
//       onClick={handleCapture}
//       style={{ flex: "1 1 auto", minWidth: 60, fontSize: "0.85rem", padding: "6px 8px" }}
//       title="Save as Image"
//       type="button"
//     >
//       📸 Save
//     </button>

//     {(userRole === "teacher" || userRole === "admin") && (
//       <>
//         {student?.reportCardUrl ? (
//           <>
//             <button
//               className="btn btn-green"
//               disabled={uploading}
//               onClick={() => setDialogOpen(true)}
//               style={{ flex: "1 1 auto", minWidth: 80, fontSize: "0.85rem", padding: "6px 8px" }}
//               title="View Uploaded Report Card"
//               type="button"
//             >
//               <span style={{ fontSize: "1.05em", color: "#28a745", marginRight: 4 }}>
//                 &#10003;
//               </span>
//               Uploaded
//             </button>

//             <button
//               className="btn btn-primary"
//               disabled={uploading}
//               onClick={() => saveReportCardToCloud(id)}
//               style={{ flex: "1 1 auto", minWidth: 90, fontSize: "0.85rem", padding: "6px 8px" }}
//               title="Re-upload Report Card"
//               type="button"
//             >
//               {uploading ? <span className="spin" /> : "Re-upload"}
//             </button>
//           </>
//         ) : (
//           <button
//             className="btn btn-primary"
//             disabled={uploading}
//             onClick={() => saveReportCardToCloud(id)}
//             style={{ flex: "1 1 auto", minWidth: 130, fontSize: "0.85rem", padding: "6px 8px" }}
//             title="Upload Report Card"
//             type="button"
//           >
//             {uploading ? <span className="spin" /> : "⬆ Upload Report Card"}
//           </button>
//         )}

//         <button
//           className="btn btn-red"
//           disabled={uploading}
//           onClick={() => handleDeleteReportCard(student._id)}
//           style={{ flex: "1 1 auto", minWidth: 70, fontSize: "0.85rem", padding: "6px 8px" }}
//           title="Delete Uploaded Report Card"
//           type="button"
//         >
//           Delete
//         </button>
//       </>
//     )}
//   </div>

//   {dialogOpen && (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         zIndex: 9999,
//         background: "rgba(0,0,0,0.6)",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "flex-start",
//         padding: "20px",
//         overflowY: "auto",
//       }}
//       onClick={() => setDialogOpen(false)}
//     >
//       <div
//         style={{
//           background: "#fff",
//           borderRadius: 8,
//           boxShadow: "0 3px 16px #444",
//           maxWidth: 420,
//           width: "100%",
//           padding: 20,
//           position: "relative",
//         }}
//         onClick={(e) => e.stopPropagation()}
//       >
//         <h3 style={{ marginTop: 0 }}>Previous Uploaded Report Card</h3>
//         <img
//           src={student.reportCardUrl}
//           alt="Uploaded Report Card"
//           style={{
//             maxHeight: 400,
//             maxWidth: "100%",
//             borderRadius: 6,
//             display: "block",
//             margin: "10px auto",
//           }}
//         />
//         <button
//           className="btn btn-primary"
//           style={{ marginTop: 10, width: "100%" }}
//           onClick={() => setDialogOpen(false)}
//           type="button"
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   )}
// </div>


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
//               <div className="doc-title">Progress Report Card</div>
//               <div className="session">
//                 Academic Year: {firstSemesterReport?.academicYear || "-"}
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
//                   <span className="value">
//                     {/* {calculateAge(student?.dateOfBirth)} */}
//                      {student?.rollNumber || "-"}
//                   </span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="label">Mobile</span>
//                   <span className="value">
//                     {student?.parentContact?.phone || "-"}
//                   </span>
//                 </div>
//                 <div className="profile-item">
//                   <span className="label">Promotion Status</span>
//                   <span className="value">
//                     {student?.promotionStatus || "-"}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* Scholastic results */}
//           <section className="scholastic">
//             <div className="section-header">
//               <h4>Academic Results</h4>
//               <div className="rank-badges">
//                 <div className="badge">
//                   Rank (1st Sem): <strong>{rank1stSem}</strong>
//                 </div>
//                 <div className="badge">
//                   Rank (2nd Sem): <strong>{rank2ndSem}</strong>
//                 </div>
//                 <div className="badge overall">
//                   Overall: <strong>{overallRank}</strong>
//                 </div>
//               </div>
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

//                     <th
//                       colSpan={assessmentTypesByTerm.term2.length + 2}
//                       className="term-head"
//                     >
//                       TERM II
//                     </th>
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

//                     {assessmentTypesByTerm.term2.map(([name], idx) => (
//                       <th key={`t2-${idx}`} className="subhead">
//                         {name}
//                       </th>
//                     ))}
//                     <th className="subhead">Marks Obtained</th>
//                     <th className="subhead">Grade</th>
//                   </tr>

//                   <tr>
//                     <th className="col-num"></th>
//                     <th className="col-sub"></th>

//                     {assessmentTypesByTerm.term1.map(([_, total], idx) => (
//                       <th key={`tm1-${idx}`} className="sub-total">
//                         {total ? `(${total})` : ""}
//                       </th>
//                     ))}
//                     <th className="sub-total"></th>
//                     <th className="sub-total"></th>

//                     {assessmentTypesByTerm.term2.map(([_, total], idx) => (
//                       <th key={`tm2-${idx}`} className="sub-total">
//                         {total ? `(${total})` : ""}
//                       </th>
//                     ))}
//                     <th className="sub-total"></th>
//                     <th className="sub-total"></th>
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

//                       {assessmentTypesByTerm.term2.map(([name], j) => (
//                         <td key={`g-t2-${idx}-${j}`} className="score-cell">
//                           {getDynamicScore(semesters["Second Semester"], name)}
//                         </td>
//                       ))}

//                       <td
//                         className={`score-cell ${gradeColorClass(
//                           calculateGrade(
//                             calculateTotalMarks(semesters["Second Semester"]),
//                             calculateMaxMarks(semesters["Second Semester"])
//                           )
//                         )}`}
//                       >
//                         {calculateTotalMarks(
//                           semesters["Second Semester"]
//                         ).toFixed(2)}
//                       </td>

//                       <td
//                         className={`score-cell ${gradeColorClass(
//                           calculateGrade(
//                             calculateTotalMarks(semesters["Second Semester"]),
//                             calculateMaxMarks(semesters["Second Semester"])
//                           )
//                         )}`}
//                       >
//                         {calculateGrade(
//                           calculateTotalMarks(semesters["Second Semester"]),
//                           calculateMaxMarks(semesters["Second Semester"])
//                         )}
//                       </td>
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
//                       {assessmentTypesByTerm.term2.map((__, j) => (
//                         <td key={`e2-${i}-${j}`}>&nbsp;</td>
//                       ))}
//                       <td>&nbsp;</td>
//                       <td>&nbsp;</td>
//                     </tr>
//                   ))}

//                   {/* <tr className="totals-row">
//                     <td colSpan="2" className="left"><strong>Total</strong></td>
//                     {assessmentTypesByTerm.term1.map(([name], i) => (
//                       <td key={`tot1-${i}`} className="score-cell">
//                         {totalsAndAverages.totals.term1.get(name)?.toFixed(2) ?? "0.00"}
//                       </td>
//                     ))}
//                     <td className="score-cell">{totalsAndAverages.totals.term1FinalTotal?.toFixed(2) ?? "0.00"}</td>
//                     <td className="score-cell">-</td>
//                     {assessmentTypesByTerm.term2.map(([name], i) => (
//                       <td key={`tot2-${i}`} className="score-cell">
//                         {totalsAndAverages.totals.term2.get(name)?.toFixed(2) ?? "0.00"}
//                       </td>
//                     ))}
//                     <td className="score-cell">{totalsAndAverages.totals.term2FinalTotal?.toFixed(2) ?? "0.00"}</td>
//                     <td className="score-cell">-</td>
//                   </tr> */}
//                   <tr className="totals-row">
//                     <td colSpan="2" className="left">
//                       <strong>Total</strong>
//                     </td>
//                     {assessmentTypesByTerm.term1.map(() => (
//                       <td className="score-cell"></td>
//                     ))}
//                     <td className="score-cell">
//                       <b>
//                         {grandTotals.term1.max.toFixed(2)} /{" "}
//                         {grandTotals.term1.obtained.toFixed(2)}
//                       </b>
//                     </td>
//                     <td className="score-cell"></td>
//                     {assessmentTypesByTerm.term2.map(() => (
//                       <td className="score-cell"></td>
//                     ))}
//                     <td className="score-cell">
//                       <b>
//                         {grandTotals.term2.max.toFixed(2)} /{" "}
//                         {grandTotals.term2.obtained.toFixed(2)}
//                       </b>
//                     </td>
//                     <td className="score-cell"></td>
//                   </tr>

//                   {/* <tr className="averages-row">
//                     <td colSpan="2" className="left">
//                       <strong>Average</strong>
//                     </td>
//                     {assessmentTypesByTerm.term1.map(([name], i) => (
//                       <td key={`avg1-${i}`} className="score-cell">
//                         {totalsAndAverages.averages.term1
//                           .get(name)
//                           ?.toFixed(2) ?? "0.00"}
//                       </td>
//                     ))}
//                     <td className="score-cell">
//                       {totalsAndAverages.term1FinalAverage.toFixed(2)}
//                     </td>
//                     <td className="score-cell">-</td>
//                     {assessmentTypesByTerm.term2.map(([name], i) => (
//                       <td key={`avg2-${i}`} className="score-cell">
//                         {totalsAndAverages.averages.term2
//                           .get(name)
//                           ?.toFixed(2) ?? "0.00"}
//                       </td>
//                     ))}
//                     <td className="score-cell">
//                       {totalsAndAverages.term2FinalAverage.toFixed(2)}
//                     </td>
//                     <td className="score-cell">-</td>
//                   </tr> */}

//                   <tr>
//                     <td colSpan="2" className="left">
//                       <strong>Rank</strong>
//                     </td>
//                     <td
//                       colSpan={assessmentTypesByTerm.term1.length + 1}
//                       className="score-cell"
//                       style={{ textAlign: "center" }}
//                     >
//                       <strong>{rank1stSem}</strong>
//                     </td>
//                     <td className="score-cell">-</td>
//                     <td
//                       colSpan={assessmentTypesByTerm.term2.length + 1}
//                       className="score-cell"
//                       style={{ textAlign: "center" }}
//                     >
//                       <strong>{rank2ndSem}</strong>
//                     </td>
//                     <td className="score-cell">-</td>
//                   </tr>

//                   <tr>
//                     <td colSpan="2" className="left">
//                       <strong>Conduct</strong>
//                     </td>
//                     <td
//                       colSpan={assessmentTypesByTerm.term1.length + 1}
//                       className="score-cell"
//                       style={{ textAlign: "center" }}
//                     >
//                       {firstSemesterReport?.conduct ?? "-"}
//                     </td>
//                     <td className="score-cell">-</td>
//                     <td
//                       colSpan={assessmentTypesByTerm.term2.length + 1}
//                       className="score-cell"
//                       style={{ textAlign: "center" }}
//                     >
//                       {secondSemesterReport?.conduct ?? "-"}
//                     </td>
//                     <td className="score-cell">-</td>
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//           </section>

//           {/* Personality / Co-Scholastic */}
//           <section className="co-scholastic">
//             <h4>Personality Traits & Skills</h4>
//             <div className="traits-grid">
//               <table className="traits-table">
//                 <thead>
//                   <tr>
//                     <th>TRAITS</th>
//                     <th>1st Sem</th>
//                     <th>2nd Sem</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {EVALUATION_AREAS.map((area) => (
//                     <tr key={area}>
//                       <td className="left">{area}</td>
//                       <td>
//                         {firstSemesterReport?.evaluations?.find(
//                           (e) => e.area === area
//                         )?.result ?? "-"}
//                       </td>
//                       <td>
//                         {secondSemesterReport?.evaluations?.find(
//                           (e) => e.area === area
//                         )?.result ?? "-"}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>

//               <div className="co-cards">
//                 <div className="co-card">
//                   <h5>Teacher's Remark Ist Semester</h5>
//                   <p>{firstSemesterReport?.teacherComment ?? "-"}</p>
//                 </div>
//                 <div className="co-card">
//                   <h5>Teacher's Remark IInd Semester</h5>
//                   <p>{secondSemesterReport?.teacherComment ?? "-"}</p>
//                 </div>
//                 <div className="co-card">
//                   <h5>Message to Parents</h5>
//                   <p>
//                     {firstSemesterReport?.messageToParents ??
//                       "Please support your child's learning at home."}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* Signatures with digital upload */}
//           {/* <section className="signatures">
//             {["classTeacher", "principal", "parent"].map((roleKey) => (
//               <div className="sig-col" key={roleKey}>
//                 <div className="sig-box">
//                   <div className="sig-label">
//                     {roleKey === "classTeacher" ? "Class Teacher" : roleKey === "principal" ? "Principal" : "Parent / Guardian"}
//                   </div>
//                   {signatures[roleKey] ? (
//                     <img src={signatures[roleKey]} alt={`${roleKey} signature`} className="sig-image" />
//                   ) : (
//                     <>
//                       <div className="sig-line" />
//                       <input
//                         type="file"
//                         accept="image/*"
//                         onChange={(e) => handleSignatureChange(e, roleKey)}
//                       />
//                     </>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </section> */}

//           {/* Signatures */}
//           <section className="signatures">
//             <div className="sig-col">
//               <div className="sig-box">
//                 <p className="sig-label">{teacher}</p>
//                 <div className="sig-label">Class Teacher</div>
//                 {/* <div className="sig-line" /> */}
//               </div>
//             </div>

//             <div className="sig-col">
//               <div className="sig-box">
//                 <p className="sig-label">Nidhi Dhamija</p>
//                 <div className="sig-label">Principal</div>

//                 {/* <div className="sig-line" /> */}
//               </div>
//             </div>

//             <div className="sig-col">
//               <div className="sig-box">
//                 <p className="sig-label">
//                   {student?.parentContact?.parentName}
//                 </p>
//                 <div className="sig-label">Parent / Guardian</div>
//                 {/* <div className="sig-line" /> */}
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
//   // "Co-Curricular Activities ",
//   // "Art Education (Visual & Performing Arts) ",
//   // "Class decorum (Discipline)"
// ];

// export default ReportCardPage;
