// // // src/pages/StudentDetailPage.js
// // import React, { useState, useEffect } from "react";
// // import { useParams, Link, useNavigate } from "react-router-dom";
// // import studentService from "../services/studentService";
// // import gradeService from "../services/gradeService";
// // import behavioralReportService from "../services/behavioralReportService";
// // import authService from "../services/authService";
// // import * as Dialog from "@radix-ui/react-dialog";
// // import ReportCardPage from "./ReportCardPage";

// // // Import the new EditGradeModal component
// // import EditGradeModal from "../components/EditGradeModal";

// // const StudentDetailPage = () => {
// //   // --- State Management ---
// //   const [currentUser] = useState(authService.getCurrentUser());
// //   const [student, setStudent] = useState(null);
// //   const [grades, setGrades] = useState([]);
// //   const [reports, setReports] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
  
// //   const { id } = useParams();
// //   const navigate = useNavigate();

// //   // Dialog state for report card modal
// //   const [isReportOpen, setIsReportOpen] = useState(false);

// //   // State for currently editing grade ID (opens modal)
// //   const [editingGradeId, setEditingGradeId] = useState(null);

// //   // --- Data Fetching ---
// //   useEffect(() => {
// //     const fetchAllData = async () => {
// //       setLoading(true);
// //       setError(null);
// //       try {
// //         const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
// //           studentService.getStudentById(id),
// //           gradeService.getGradesByStudent(id),
// //           behavioralReportService.getReportsByStudent(id),
// //         ]);

// //         if (studentRes.status === "fulfilled") {
// //           setStudent(studentRes.value.data.data);
// //         } else {
// //           throw new Error("Failed to fetch student details.");
// //         }

// //         if (gradesRes.status === "fulfilled") setGrades(gradesRes.value.data.data);
// //         else setGrades([]);

// //         if (reportsRes.status === "fulfilled") setReports(reportsRes.value.data.data);
// //         else setReports([]);
// //       } catch (err) {
// //         setError(err.message || "An unexpected error occurred.");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchAllData();
// //   }, [id]);

// //   // --- Action Handlers ---
// //   const handleStudentDelete = async () => {
// //     if (window.confirm("Are you sure you want to delete this student?")) {
// //       try {
// //         await studentService.deleteStudent(id);
// //         alert("Student deleted successfully.");
// //         navigate("/students");
// //       } catch (err) {
// //         alert("Failed to delete student.");
// //       }
// //     }
// //   };

// //   const handleGradeDelete = async (gradeId) => {
// //     if (window.confirm("Are you sure you want to delete this grade entry?")) {
// //       try {
// //         await gradeService.deleteGrade(gradeId);
// //         setGrades(grades.filter((g) => g._id !== gradeId));
// //       } catch (err) {
// //         alert("Failed to delete grade.");
// //       }
// //     }
// //   };

// //   const handleReportDelete = async (reportId) => {
// //     if (window.confirm("Are you sure you want to delete this report?")) {
// //       try {
// //         await behavioralReportService.deleteReport(reportId);
// //         setReports(reports.filter((r) => r._id !== reportId));
// //       } catch (err) {
// //         alert("Failed to delete report.");
// //       }
// //     }
// //   };

// //   // --- Permission calculation ---
// //   const isAdmin = currentUser && currentUser.role === "admin";
// //   const isHomeroomTeacher =
// //     currentUser &&
// //     currentUser.role === "teacher" &&
// //     currentUser.homeroomGrade === student?.gradeLevel;

// //   // --- Helper: refresh grades list after update ---
// //   const refreshGrades = async () => {
// //     try {
// //       const refreshedGrades = await gradeService.getGradesByStudent(id);
// //       setGrades(refreshedGrades.data.data);
// //     } catch {
// //       // Optionally handle refresh error
// //     }
// //   };

// //   // --- Tailwind CSS class strings ---
// //   const sectionWrapper = "bg-white p-6 rounded-lg shadow-md mb-8";
// //   const sectionTitle = "text-xl font-bold text-gray-800";
// //   const buttonBase =
// //     "py-2 px-4 rounded-md font-semibold transition-colors duration-200 text-sm shadow-sm";
// //   const greenButton = `${buttonBase} bg-green-500 hover:bg-green-600 text-white`;
// //   const blueButton = `${buttonBase} bg-blue-500 hover:bg-blue-600 text-white`;
// //   const yellowButton = `${buttonBase} bg-yellow-500 hover:bg-yellow-600 text-white`;
// //   const redButton = `${buttonBase} bg-red-500 hover:bg-red-600 text-white`;
// //   const tableHeader =
// //     "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
// //   const tableCell = "px-6 py-4 whitespace-nowrap text-sm";

// //   // --- Render Logic ---
// //   if (loading)
// //     return <p className="text-center text-lg mt-8">Loading full student report...</p>;
// //   if (error)
// //     return <p className="text-center text-red-500 mt-8">{error}</p>;
// //   if (!student)
// //     return <p className="text-center text-lg mt-8">Student not found.</p>;

// //   return (
// //     <div className="space-y-8">
// //       {/* Student Info and Actions Section */}
// //       <div className={sectionWrapper}>
// //         <div className="flex flex-col sm:flex-row justify-between items-start">
// //           <div>
// //             <h2 className="text-2xl font-bold text-gray-800">{student.fullName}</h2>
// //             <p className="text-gray-500 mt-1">
// //               ID: {student.studentId} | Gender: {student.gender} | Grade: {student.gradeLevel}
// //             </p>
// //           </div>
// //           {isAdmin && (
// //             <div className="flex gap-2 mt-4 sm:mt-0">
// //               <Link to={`/students/edit/${student._id}`} className={yellowButton}>Edit Info</Link>
// //               <button onClick={handleStudentDelete} className={redButton}>Delete Student</button>
// //             </div>
// //           )}
// //         </div>

// //         <div className="mt-6 border-t pt-4">
// //           <button onClick={() => setIsReportOpen(true)} className={`${greenButton} text-base`}>
// //             Generate Full Report Card
// //           </button>
// //         </div>
// //       </div>

// //       {/* Academic Grades Section */}
// //       <div className={sectionWrapper}>
// //         <div className="flex justify-between items-center mb-4">
// //           <h3 className={sectionTitle}>Academic Grades</h3>
// //         </div>
// //         {grades.length > 0 ? (
// //           <div className="overflow-x-auto">
// //             <table className="min-w-full divide-y divide-gray-200">
// //               <thead className="bg-gray-50">
// //                 <tr>
// //                   <th className={tableHeader}>Subject</th>
// //                   <th className={tableHeader}>Semester</th>
// //                   <th className={tableHeader}>Year</th>
// //                   <th className={tableHeader}>Score</th>
// //                   <th className={tableHeader}>Actions</th>
// //                 </tr>
// //               </thead>
// //               <tbody className="bg-white divide-y divide-gray-200">
// //                 {grades.map((grade) => (
// //                   <tr key={grade._id} className="hover:bg-gray-50">
// //                     <td className={`${tableCell} font-medium text-gray-900`}>
// //                       {grade.subject.name}
// //                     </td>
// //                     <td className={`${tableCell} text-gray-500`}>{grade.semester}</td>
// //                     <td className={`${tableCell} text-gray-500`}>{grade.academicYear}</td>
// //                     <td className={`${tableCell} font-bold text-gray-800`}>
// //                       {grade.finalScore}
// //                     </td>
// //                     <td className={`${tableCell} flex gap-2`}>
// //                       {/* Edit opens modal */}
// //                       <button onClick={() => setEditingGradeId(grade._id)} className={yellowButton}>Edit</button>
// //                       <button onClick={() => handleGradeDelete(grade._id)} className={redButton}>Delete</button>
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           </div>
// //         ) : (
// //           <p className="text-gray-500 text-center py-4">No academic grades have been entered yet.</p>
// //         )}
// //       </div>

// //       {/* Behavioral & Skills Assessment Section */}
// //       <div className={sectionWrapper}>
// //         <div className="flex justify-between items-center mb-4">
// //           <h3 className={sectionTitle}>Behavioral & Skills Assessment</h3>
// //           {(isHomeroomTeacher || isAdmin) && (
// //             <Link to={`/reports/add/${student._id}`} className={blueButton}>Add New Report</Link>
// //           )}
// //         </div>
// //         {reports.length > 0 ? (
// //           <div className="space-y-4">
// //             {reports.map((report) => (
// //               <div key={report._id} className="bg-gray-50 p-4 rounded-lg border">
// //                 <div className="flex justify-between items-center">
// //                   <h4 className="font-bold text-gray-700">{report.semester} - {report.academicYear}</h4>
// //                   {(isHomeroomTeacher || isAdmin) && (
// //                     <div className="flex gap-2">
// //                       <Link to={`/reports/edit/${report._id}`} className={yellowButton}>Edit</Link>
// //                       <button onClick={() => handleReportDelete(report._id)} className={redButton}>Delete</button>
// //                     </div>
// //                   )}
// //                 </div>
// //                 <p className="mt-2 text-gray-600"><strong>Comment:</strong> {report.teacherComment || "N/A"}</p>
// //                 <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
// //                   {report.evaluations.map((ev, i) => (
// //                     <li key={i}>{ev.area}: <strong>{ev.result}</strong></li>
// //                   ))}
// //                 </ul>
// //               </div>
// //             ))}
// //           </div>
// //         ) : (
// //           <p className="text-gray-500 text-center py-4">No behavioral reports have been entered yet.</p>
// //         )}
// //       </div>

// //       <Link to="/students" className="text-pink-500 hover:underline">← Back to Students List</Link>

// //       {/* Report Card Modal */}
// //       <Dialog.Root open={isReportOpen} onOpenChange={setIsReportOpen}>
// //         <Dialog.Portal>
// //           <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
// //           <Dialog.Content className="fixed inset-0 md:inset-10 bg-white rounded-lg shadow-xl overflow-y-auto z-50 p-6">
// //             <Dialog.Title className="text-lg font-bold mb-4">Report Card</Dialog.Title>
// //             <ReportCardPage id={student._id} />
// //             <div className="mt-4 flex justify-end">
// //               <Dialog.Close asChild>
// //                 <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Close</button>
// //               </Dialog.Close>
// //             </div>
// //           </Dialog.Content>
// //         </Dialog.Portal>
// //       </Dialog.Root>

// //       {/* Edit Grade Modal */}
// //       {editingGradeId && (
// //         <EditGradeModal
// //           gradeId={editingGradeId}
// //           onClose={() => setEditingGradeId(null)}
// //           onUpdate={refreshGrades}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // export default StudentDetailPage;


// // src/pages/StudentDetailPage.js
// import React, { useState, useEffect } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import studentService from "../services/studentService";
// import gradeService from "../services/gradeService";
// import behavioralReportService from "../services/behavioralReportService";
// import authService from "../services/authService";
// import * as Dialog from "@radix-ui/react-dialog";
// import ReportCardPage from "./ReportCardPage";

// // Import the new EditGradeModal component
// import EditGradeModal from "../components/EditGradeModal";

// const StudentDetailPage = () => {
//   // --- State Management ---
//   const [currentUser] = useState(authService.getCurrentUser());
//   const [student, setStudent] = useState(null);
//   const [grades, setGrades] = useState([]);
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   const { id } = useParams();
//   const navigate = useNavigate();

//   // Dialog state for report card modal
//   const [isReportOpen, setIsReportOpen] = useState(false);

//   // State for currently editing grade ID (opens modal)
//   const [editingGradeId, setEditingGradeId] = useState(null);

//   // --- Data Fetching ---
//   useEffect(() => {
//     const fetchAllData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
//           studentService.getStudentById(id),
//           gradeService.getGradesByStudent(id),
//           behavioralReportService.getReportsByStudent(id),
//         ]);

//         if (studentRes.status === "fulfilled") {
//           setStudent(studentRes.value.data.data);
//         } else {
//           throw new Error("Failed to fetch student details.");
//         }

//         if (gradesRes.status === "fulfilled") setGrades(gradesRes.value.data.data);
//         else setGrades([]);

//         if (reportsRes.status === "fulfilled") setReports(reportsRes.value.data.data);
//         else setReports([]);
//       } catch (err) {
//         setError(err.message || "An unexpected error occurred.");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAllData();
//   }, [id]);

//   // --- Action Handlers ---
//   const handleStudentDelete = async () => {
//     if (window.confirm("Are you sure you want to delete this student?")) {
//       try {
//         await studentService.deleteStudent(id);
//         alert("Student deleted successfully.");
//         navigate("/students");
//       } catch (err) {
//         alert("Failed to delete student.");
//       }
//     }
//   };

//   const handleGradeDelete = async (gradeId) => {
//     if (window.confirm("Are you sure you want to delete this grade entry?")) {
//       try {
//         await gradeService.deleteGrade(gradeId);
//         setGrades(grades.filter((g) => g._id !== gradeId));
//       } catch (err) {
//         alert("Failed to delete grade.");
//       }
//     }
//   };

//   const handleReportDelete = async (reportId) => {
//     if (window.confirm("Are you sure you want to delete this report?")) {
//       try {
//         await behavioralReportService.deleteReport(reportId);
//         setReports(reports.filter((r) => r._id !== reportId));
//       } catch (err) {
//         alert("Failed to delete report.");
//       }
//     }
//   };

//   // --- Permission calculation ---
//   const isAdmin = currentUser && currentUser.role === "admin";
//   const isHomeroomTeacher =
//     currentUser &&
//     currentUser.role === "teacher" &&
//     currentUser.homeroomGrade === student?.gradeLevel;

//   // --- Helper: refresh grades list after update ---
//   const refreshGrades = async () => {
//     try {
//       const refreshedGrades = await gradeService.getGradesByStudent(id);
//       setGrades(refreshedGrades.data.data);
//     } catch {
//       // Optionally handle refresh error
//     }
//   };

//   // --- Tailwind CSS class strings ---
//   const sectionWrapper = "bg-white p-6 rounded-lg shadow-md mb-8";
//   const sectionTitle = "text-xl font-bold text-gray-800";
//   const buttonBase =
//     "py-2 px-4 rounded-md font-semibold transition-colors duration-200 text-sm shadow-sm";
//   const greenButton = `${buttonBase} bg-green-500 hover:bg-green-600 text-white`;
//   const blueButton = `${buttonBase} bg-blue-500 hover:bg-blue-600 text-white`;
//   const yellowButton = `${buttonBase} bg-yellow-500 hover:bg-yellow-600 text-white`;
//   const redButton = `${buttonBase} bg-red-500 hover:bg-red-600 text-white`;
//   const tableHeader =
//     "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
//   const tableCell = "px-6 py-4 whitespace-nowrap text-sm";

//   // --- Render Logic ---
//   if (loading)
//     return <p className="text-center text-lg mt-8">Loading full student report...</p>;
//   if (error)
//     return <p className="text-center text-red-500 mt-8">{error}</p>;
//   if (!student)
//     return <p className="text-center text-lg mt-8">Student not found.</p>;

//   return (
//     <div className="space-y-8">
//       {/* Student Info and Actions Section */}
//       <div className={sectionWrapper}>
//         <div className="flex flex-col sm:flex-row justify-between items-start">
//           <div>
//             <h2 className="text-2xl font-bold text-gray-800">{student.fullName}</h2>
//             <p className="text-gray-500 mt-1">
//               ID: {student.studentId} | Gender: {student.gender} | Grade: {student.gradeLevel}
//             </p>
//           </div>
//           {isAdmin && (
//             <div className="flex gap-2 mt-4 sm:mt-0">
//               <Link to={`/students/edit/${student._id}`} className={yellowButton}>Edit Info</Link>
//               <button onClick={handleStudentDelete} className={redButton}>Delete Student</button>
//             </div>
//           )}
//         </div>

//         <div className="mt-6 border-t pt-4">
//           <button onClick={() => setIsReportOpen(true)} className={`${greenButton} text-base`}>
//             Generate Full Report Card
//           </button>
//         </div>
//       </div>

//       {/* Academic Grades Section */}
//       <div className={sectionWrapper}>
//         <div className="flex justify-between items-center mb-4">
//           <h3 className={sectionTitle}>Academic Grades</h3>
//         </div>
//         {grades.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className={tableHeader}>Subject</th>
//                   <th className={tableHeader}>Semester</th>
//                   <th className={tableHeader}>Year</th>
//                   <th className={tableHeader}>Score</th>
//                   <th className={tableHeader}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {grades.map((grade) => (
//                   <tr key={grade._id} className="hover:bg-gray-50">
//                     <td className={`${tableCell} font-medium text-gray-900`}>
//                       {/* FIX HERE: Using optional chaining ?.name with fallback */}
//                       {grade.subject?.name || "Deleted / Unknown Subject"}
//                     </td>
//                     <td className={`${tableCell} text-gray-500`}>{grade.semester}</td>
//                     <td className={`${tableCell} text-gray-500`}>{grade.academicYear}</td>
//                     <td className={`${tableCell} font-bold text-gray-800`}>
//                       {grade.finalScore ?? "-"}
//                     </td>
//                     <td className={`${tableCell} flex gap-2`}>
//                       {/* Edit opens modal */}
//                       <button onClick={() => setEditingGradeId(grade._id)} className={yellowButton}>Edit</button>
//                       <button onClick={() => handleGradeDelete(grade._id)} className={redButton}>Delete</button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <p className="text-gray-500 text-center py-4">No academic grades have been entered yet.</p>
//         )}
//       </div>

//       {/* Behavioral & Skills Assessment Section */}
//       <div className={sectionWrapper}>
//         <div className="flex justify-between items-center mb-4">
//           <h3 className={sectionTitle}>Behavioral & Skills Assessment</h3>
//           {(isHomeroomTeacher || isAdmin) && (
//             <Link to={`/reports/add/${student._id}`} className={blueButton}>Add New Report</Link>
//           )}
//         </div>
//         {reports.length > 0 ? (
//           <div className="space-y-4">
//             {reports.map((report) => (
//               <div key={report._id} className="bg-gray-50 p-4 rounded-lg border">
//                 <div className="flex justify-between items-center">
//                   <h4 className="font-bold text-gray-700">{report.semester} - {report.academicYear}</h4>
//                   {(isHomeroomTeacher || isAdmin) && (
//                     <div className="flex gap-2">
//                       <Link to={`/reports/edit/${report._id}`} className={yellowButton}>Edit</Link>
//                       <button onClick={() => handleReportDelete(report._id)} className={redButton}>Delete</button>
//                     </div>
//                   )}
//                 </div>
//                 <p className="mt-2 text-gray-600"><strong>Comment:</strong> {report.teacherComment || "N/A"}</p>
//                 <ul className="mt-2 list-disc list-inside text-sm text-gray-500">
//                   {report.evaluations?.map((ev, i) => (
//                     <li key={i}>{ev.area}: <strong>{ev.result}</strong></li>
//                   ))}
//                 </ul>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-gray-500 text-center py-4">No behavioral reports have been entered yet.</p>
//         )}
//       </div>

//       <Link to="/students" className="text-pink-500 hover:underline">← Back to Students List</Link>

//       {/* Report Card Modal */}
//       <Dialog.Root open={isReportOpen} onOpenChange={setIsReportOpen}>
//         <Dialog.Portal>
//           <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
//           <Dialog.Content className="fixed inset-0 md:inset-10 bg-white rounded-lg shadow-xl overflow-y-auto z-50 p-6">
//             <Dialog.Title className="text-lg font-bold mb-4">Report Card</Dialog.Title>
//             <ReportCardPage id={student._id} />
//             <div className="mt-4 flex justify-end">
//               <Dialog.Close asChild>
//                 <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Close</button>
//               </Dialog.Close>
//             </div>
//           </Dialog.Content>
//         </Dialog.Portal>
//       </Dialog.Root>

//       {/* Edit Grade Modal */}
//       {editingGradeId && (
//         <EditGradeModal
//           gradeId={editingGradeId}
//           onClose={() => setEditingGradeId(null)}
//           onUpdate={refreshGrades}
//         />
//       )}
//     </div>
//   );
// };

// export default StudentDetailPage;


// src/pages/StudentDetailPage.js
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import studentService from "../services/studentService";
import gradeService from "../services/gradeService";
import behavioralReportService from "../services/behavioralReportService";
import authService from "../services/authService";
import * as Dialog from "@radix-ui/react-dialog";
import ReportCardPage from "./ReportCardPage";
import EditGradeModal from "../components/EditGradeModal";

const StudentDetailPage = () => {
  // --- State Management ---
  const [currentUser] = useState(authService.getCurrentUser());
  const [student, setStudent] = useState(null);
  const [grades, setGrades] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { id } = useParams();
  const navigate = useNavigate();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState(null);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [studentRes, gradesRes, reportsRes] = await Promise.allSettled([
          studentService.getStudentById(id),
          gradeService.getGradesByStudent(id),
          behavioralReportService.getReportsByStudent(id),
        ]);

        if (studentRes.status === "fulfilled") {
          setStudent(studentRes.value.data.data);
        } else {
          throw new Error("Failed to fetch student details.");
        }

        if (gradesRes.status === "fulfilled") setGrades(gradesRes.value.data.data);
        else setGrades([]);

        if (reportsRes.status === "fulfilled") setReports(reportsRes.value.data.data);
        else setReports([]);
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [id]);

  // --- Action Handlers ---
  const handleStudentDelete = async () => {
    if (window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      try {
        await studentService.deleteStudent(id);
        navigate("/students");
      } catch (err) {
        alert("Failed to delete student.");
      }
    }
  };

  const handleGradeDelete = async (gradeId) => {
    if (window.confirm("Delete this grade entry?")) {
      try {
        await gradeService.deleteGrade(gradeId);
        setGrades(grades.filter((g) => g._id !== gradeId));
      } catch (err) {
        alert("Failed to delete grade.");
      }
    }
  };

  const handleReportDelete = async (reportId) => {
    if (window.confirm("Delete this behavioral report?")) {
      try {
        await behavioralReportService.deleteReport(reportId);
        setReports(reports.filter((r) => r._id !== reportId));
      } catch (err) {
        alert("Failed to delete report.");
      }
    }
  };

  // --- Permission calculation ---
  const isAdmin = currentUser && currentUser.role === "admin";
  const isHomeroomTeacher = currentUser && currentUser.role === "teacher" && currentUser.homeroomGrade === student?.gradeLevel;

  // --- Helper: refresh grades list after update ---
  const refreshGrades = async () => {
    try {
      const refreshedGrades = await gradeService.getGradesByStudent(id);
      setGrades(refreshedGrades.data.data);
    } catch { }
  };

  // --- Render Logic ---
  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div></div>;
  if (error) return <p className="text-center text-red-500 mt-8 font-semibold bg-red-50 p-4 rounded-xl max-w-lg mx-auto">{error}</p>;
  if (!student) return <p className="text-center text-lg mt-8 text-gray-500">Student not found.</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in pb-20">
        
      {/* Top Navigation */}
      <Link to="/students" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-pink-600 transition-colors">
        <span className="mr-1">←</span> Back to Directory
      </Link>

      {/* STUDENT PROFILE HEADER CARD */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        <div className="flex items-center gap-5 z-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {student.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 className="text-2xl font-extrabold text-gray-800">{student.fullName}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600 font-medium">
                    <span className="bg-gray-100 px-2.5 py-0.5 rounded-md">ID: <span className="text-gray-900">{student.studentId}</span></span>
                    <span className="bg-gray-100 px-2.5 py-0.5 rounded-md">Class: <span className="text-gray-900">{student.gradeLevel}</span></span>
                    <span className="bg-gray-100 px-2.5 py-0.5 rounded-md">Gender: <span className="text-gray-900">{student.gender}</span></span>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:w-auto z-10">
            <button onClick={() => setIsReportOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
                📄 Generate Report Card
            </button>
            {isAdmin && (
                <div className="flex gap-2">
                    <Link to={`/students/edit/${student._id}`} className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-4 rounded-lg text-sm transition-all">
                        Edit Profile
                    </Link>
                    <button onClick={handleStudentDelete} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-4 rounded-lg text-sm transition-all border border-red-100">
                        Delete
                    </button>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACADEMIC GRADES (Takes up 2/3 space) */}
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>📊</span> Academic Records</h3>
                </div>
                
                {grades.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-white border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-5 font-bold">Subject</th>
                        <th className="py-3 px-4 font-bold">Term / Year</th>
                        <th className="py-3 px-4 font-bold text-center">Score</th>
                        <th className="py-3 px-4 font-bold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {grades.map((grade) => (
                        <tr key={grade._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-5 font-bold text-gray-800">
                            {grade.subject?.name || <span className="text-red-400 italic">Deleted Subject</span>}
                            </td>
                            <td className="py-3 px-4">
                                <div className="text-gray-900 font-medium">{grade.semester}</div>
                                <div className="text-[10px] text-gray-400 font-bold tracking-wide">{grade.academicYear}</div>
                            </td>
                            <td className="py-3 px-4 text-center">
                                <span className="bg-green-50 text-green-700 font-extrabold px-3 py-1 rounded-lg border border-green-100">
                                    {grade.finalScore ?? "-"}
                                </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingGradeId(grade._id)} className="text-blue-500 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold transition">Edit</button>
                                    <button onClick={() => handleGradeDelete(grade._id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition">Delete</button>
                                </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                ) : (
                <div className="p-8 text-center text-gray-400">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-sm">No academic grades have been entered yet.</p>
                </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: BEHAVIORAL REPORTS (Takes up 1/3 space) */}
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>🧠</span> Behaviors</h3>
                    {(isHomeroomTeacher || isAdmin) && (
                        <Link to={`/reports/add/${student._id}`} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition text-xs font-bold" title="Add Report">
                            + Add
                        </Link>
                    )}
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto bg-gray-50/30">
                    {reports.length > 0 ? (
                    <div className="space-y-4">
                        {reports.map((report) => (
                        <div key={report._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{report.semester}</h4>
                                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{report.academicYear}</span>
                                </div>
                                {(isHomeroomTeacher || isAdmin) && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white border rounded shadow-sm">
                                        <Link to={`/reports/edit/${report._id}`} className="text-blue-500 hover:bg-blue-50 px-2 py-1 text-xs font-bold rounded-l">✎</Link>
                                        <div className="w-px bg-gray-200"></div>
                                        <button onClick={() => handleReportDelete(report._id)} className="text-red-500 hover:bg-red-50 px-2 py-1 text-xs font-bold rounded-r">✕</button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-xs text-gray-600 mt-2 bg-yellow-50/50 p-2 rounded border border-yellow-100/50">
                                <span className="font-bold text-yellow-800 block mb-1">Remarks:</span> 
                                {report.teacherComment || "No remarks provided."}
                            </div>
                            
                            {report.evaluations && report.evaluations.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    {report.evaluations.map((ev, i) => (
                                        <div key={i} className="text-[10px] bg-gray-50 border border-gray-100 p-1.5 rounded flex justify-between">
                                            <span className="text-gray-500 truncate mr-1" title={ev.area}>{ev.area}</span>
                                            <strong className="text-gray-800">{ev.result}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                        <div className="text-3xl mb-2">🌱</div>
                        <p className="text-sm text-center px-4">No behavioral assessments found.</p>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* MODALS */}

      {/* 1. Report Card Modal */}
      <Dialog.Root open={isReportOpen} onOpenChange={setIsReportOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all" />
          <Dialog.Content className="fixed inset-4 md:inset-10 bg-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-fade-in">
            <div className="p-4 md:p-5 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
              <Dialog.Title className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span className="text-pink-600">📄</span> Report Card
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-transparent hover:border-red-100">
                    ✕ Close
                </button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-6">
                <ReportCardPage studentId={student._id} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* 2. Edit Grade Modal */}
      {editingGradeId && (
        <EditGradeModal
          gradeId={editingGradeId}
          onClose={() => setEditingGradeId(null)}
          onUpdate={refreshGrades}
        />
      )}
      
    </div>
  );
};

export default StudentDetailPage;
