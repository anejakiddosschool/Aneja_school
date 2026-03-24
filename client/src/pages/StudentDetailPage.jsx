
// import React, { useState, useEffect } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import studentService from "../services/studentService";
// import gradeService from "../services/gradeService";
// import behavioralReportService from "../services/behavioralReportService";
// import authService from "../services/authService";
// import * as Dialog from "@radix-ui/react-dialog";
// import ReportCardPage from "./ReportCardPage";
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

//   const [isReportOpen, setIsReportOpen] = useState(false);
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
//     if (window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
//       try {
//         await studentService.deleteStudent(id);
//         navigate("/students");
//       } catch (err) {
//         alert("Failed to delete student.");
//       }
//     }
//   };

//   const handleGradeDelete = async (gradeId) => {
//     if (window.confirm("Delete this grade entry?")) {
//       try {
//         await gradeService.deleteGrade(gradeId);
//         setGrades(grades.filter((g) => g._id !== gradeId));
//       } catch (err) {
//         alert("Failed to delete grade.");
//       }
//     }
//   };

//   const handleReportDelete = async (reportId) => {
//     if (window.confirm("Delete this behavioral report?")) {
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
//   const isHomeroomTeacher = currentUser && currentUser.role === "teacher" && currentUser.homeroomGrade === student?.gradeLevel;

//   // --- Helper: refresh grades list after update ---
//   const refreshGrades = async () => {
//     try {
//       const refreshedGrades = await gradeService.getGradesByStudent(id);
//       setGrades(refreshedGrades.data.data);
//     } catch { }
//   };

//   // --- Render Logic ---
//   if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600"></div></div>;
//   if (error) return <p className="text-center text-red-500 mt-8 font-semibold bg-red-50 p-4 rounded-xl max-w-lg mx-auto">{error}</p>;
//   if (!student) return <p className="text-center text-lg mt-8 text-gray-500">Student not found.</p>;

//   return (
//     <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in pb-20">
        
//       {/* Top Navigation */}
//       <Link to="/students" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-pink-600 transition-colors">
//         <span className="mr-1">←</span> Back to Directory
//       </Link>

//       {/* STUDENT PROFILE HEADER CARD */}
//       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
//         {/* Decorative background blur */}
//         <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
//         <div className="flex items-center gap-5 z-10">
//             <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white text-2xl font-bold shadow-md">
//                 {student.fullName.charAt(0).toUpperCase()}
//             </div>
//             <div>
//                 <h2 className="text-2xl font-extrabold text-gray-800">{student.fullName}</h2>
//                 <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600 font-medium">
//                     <span className="bg-gray-100 px-2.5 py-0.5 rounded-md">ID: <span className="text-gray-900">{student.studentId}</span></span>
//                     <span className="bg-gray-100 px-2.5 py-0.5 rounded-md">Class: <span className="text-gray-900">{student.gradeLevel}</span></span>
//                     <span className="bg-gray-100 px-2.5 py-0.5 rounded-md">Gender: <span className="text-gray-900">{student.gender}</span></span>
//                 </div>
//             </div>
//         </div>

//         <div className="flex flex-col gap-2 w-full md:w-auto z-10">
//             <button onClick={() => setIsReportOpen(true)} className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2">
//                 📄 Generate Report Card
//             </button>
//             {isAdmin && (
//                 <div className="flex gap-2">
//                     <Link to={`/students/edit/${student._id}`} className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-1.5 px-4 rounded-lg text-sm transition-all">
//                         Edit Profile
//                     </Link>
//                     <button onClick={handleStudentDelete} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-4 rounded-lg text-sm transition-all border border-red-100">
//                         Delete
//                     </button>
//                 </div>
//             )}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
//         {/* LEFT COLUMN: ACADEMIC GRADES (Takes up 2/3 space) */}
//         <div className="lg:col-span-2 space-y-4">
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
//                 <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
//                     <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>📊</span> Academic Records</h3>
//                 </div>
                
//                 {grades.length > 0 ? (
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-left text-sm border-collapse">
//                     <thead>
//                         <tr className="bg-white border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px]">
//                         <th className="py-3 px-5 font-bold">Subject</th>
//                         <th className="py-3 px-4 font-bold">Term / Year</th>
//                         <th className="py-3 px-4 font-bold text-center">Score</th>
//                         <th className="py-3 px-4 font-bold text-right">Action</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-50">
//                         {grades.map((grade) => (
//                         <tr key={grade._id} className="hover:bg-gray-50/50 transition-colors">
//                             <td className="py-3 px-5 font-bold text-gray-800">
//                             {grade.subject?.name || <span className="text-red-400 italic">Deleted Subject</span>}
//                             </td>
//                             <td className="py-3 px-4">
//                                 <div className="text-gray-900 font-medium">{grade.semester}</div>
//                                 <div className="text-[10px] text-gray-400 font-bold tracking-wide">{grade.academicYear}</div>
//                             </td>
//                             <td className="py-3 px-4 text-center">
//                                 <span className="bg-green-50 text-green-700 font-extrabold px-3 py-1 rounded-lg border border-green-100">
//                                     {grade.finalScore ?? "-"}
//                                 </span>
//                             </td>
//                             <td className="py-3 px-4 text-right">
//                                 <div className="flex justify-end gap-2">
//                                     <button onClick={() => setEditingGradeId(grade._id)} className="text-blue-500 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold transition">Edit</button>
//                                     <button onClick={() => handleGradeDelete(grade._id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition">Delete</button>
//                                 </div>
//                             </td>
//                         </tr>
//                         ))}
//                     </tbody>
//                     </table>
//                 </div>
//                 ) : (
//                 <div className="p-8 text-center text-gray-400">
//                     <div className="text-3xl mb-2">📝</div>
//                     <p className="text-sm">No academic grades have been entered yet.</p>
//                 </div>
//                 )}
//             </div>
//         </div>

//         {/* RIGHT COLUMN: BEHAVIORAL REPORTS (Takes up 1/3 space) */}
//         <div className="lg:col-span-1 space-y-4">
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
//                 <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
//                     <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>🧠</span> Behaviors</h3>
//                     {(isHomeroomTeacher || isAdmin) && (
//                         <Link to={`/reports/add/${student._id}`} className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-md transition text-xs font-bold" title="Add Report">
//                             + Add
//                         </Link>
//                     )}
//                 </div>
                
//                 <div className="p-4 flex-1 overflow-y-auto bg-gray-50/30">
//                     {reports.length > 0 ? (
//                     <div className="space-y-4">
//                         {reports.map((report) => (
//                         <div key={report._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
//                             <div className="flex justify-between items-start mb-2">
//                                 <div>
//                                     <h4 className="font-bold text-gray-800 text-sm">{report.semester}</h4>
//                                     <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{report.academicYear}</span>
//                                 </div>
//                                 {(isHomeroomTeacher || isAdmin) && (
//                                     <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white border rounded shadow-sm">
//                                         <Link to={`/reports/edit/${report._id}`} className="text-blue-500 hover:bg-blue-50 px-2 py-1 text-xs font-bold rounded-l">✎</Link>
//                                         <div className="w-px bg-gray-200"></div>
//                                         <button onClick={() => handleReportDelete(report._id)} className="text-red-500 hover:bg-red-50 px-2 py-1 text-xs font-bold rounded-r">✕</button>
//                                     </div>
//                                 )}
//                             </div>
                            
//                             <div className="text-xs text-gray-600 mt-2 bg-yellow-50/50 p-2 rounded border border-yellow-100/50">
//                                 <span className="font-bold text-yellow-800 block mb-1">Remarks:</span> 
//                                 {report.teacherComment || "No remarks provided."}
//                             </div>
                            
//                             {report.evaluations && report.evaluations.length > 0 && (
//                                 <div className="mt-3 grid grid-cols-2 gap-2">
//                                     {report.evaluations.map((ev, i) => (
//                                         <div key={i} className="text-[10px] bg-gray-50 border border-gray-100 p-1.5 rounded flex justify-between">
//                                             <span className="text-gray-500 truncate mr-1" title={ev.area}>{ev.area}</span>
//                                             <strong className="text-gray-800">{ev.result}</strong>
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                         ))}
//                     </div>
//                     ) : (
//                     <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
//                         <div className="text-3xl mb-2">🌱</div>
//                         <p className="text-sm text-center px-4">No behavioral assessments found.</p>
//                     </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//       </div>

//       {/* MODALS */}

//       {/* 1. Report Card Modal */}
//       <Dialog.Root open={isReportOpen} onOpenChange={setIsReportOpen}>
//         <Dialog.Portal>
//           <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all" />
//           <Dialog.Content className="fixed inset-4 md:inset-10 bg-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-fade-in">
//             <div className="p-4 md:p-5 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
//               <Dialog.Title className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
//                   <span className="text-pink-600">📄</span> Report Card
//               </Dialog.Title>
//               <Dialog.Close asChild>
//                 <button className="bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-transparent hover:border-red-100">
//                     ✕ Close
//                 </button>
//               </Dialog.Close>
//             </div>
//             <div className="flex-1 overflow-y-auto p-2 md:p-6">
//                 <ReportCardPage studentId={student._id} />
//             </div>
//           </Dialog.Content>
//         </Dialog.Portal>
//       </Dialog.Root>

//       {/* 2. Edit Grade Modal */}
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
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 space-y-6 animate-fade-in pb-20">
        
      {/* Top Navigation */}
      <Link to="/students" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-pink-600 transition-colors">
        <span className="mr-1">←</span> Back to Directory
      </Link>

      {/* STUDENT PROFILE HEADER CARD (Responsive) */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-50 rounded-full blur-3xl opacity-50 pointer-events-none hidden md:block"></div>
        
        <div className="flex flex-row items-center gap-4 md:gap-5 z-10 w-full md:w-auto border-b border-gray-100 md:border-none pb-4 md:pb-0">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white text-xl md:text-2xl font-bold shadow-md shrink-0">
                {student.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 leading-tight">{student.fullName}</h2>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1.5 text-[11px] md:text-sm text-gray-600 font-medium">
                    <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">ID: <span className="text-gray-900 font-bold">{student.studentId}</span></span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Class: <span className="text-gray-900 font-bold">{student.gradeLevel}</span></span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Gender: <span className="text-gray-900 font-bold">{student.gender}</span></span>
                </div>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto z-10">
            <button onClick={() => setIsReportOpen(true)} className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm">
                📄 Generate Report
            </button>
            {isAdmin && (
                <div className="flex gap-2.5 w-full sm:w-auto">
                    <Link to={`/students/edit/${student._id}`} className="flex-1 sm:flex-none text-center bg-white hover:bg-gray-50 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-sm transition-all border border-gray-200 shadow-sm">
                        Edit Profile
                    </Link>
                    <button onClick={handleStudentDelete} className="flex-1 sm:flex-none bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-5 rounded-xl text-sm transition-all border border-red-100">
                        Delete
                    </button>
                </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: ACADEMIC GRADES */}
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>📊</span> Academic Records</h3>
                </div>
                
                {grades.length > 0 ? (
                <>
                  {/* --- DESKTOP TABLE VIEW --- */}
                  <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                      <thead>
                          <tr className="bg-white border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-5 font-extrabold">Subject</th>
                          <th className="py-3 px-4 font-extrabold">Term / Year</th>
                          <th className="py-3 px-4 font-extrabold text-center">Score</th>
                          <th className="py-3 px-4 font-extrabold text-right">Action</th>
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
                                      <button onClick={() => setEditingGradeId(grade._id)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent hover:border-blue-200">Edit</button>
                                      <button onClick={() => handleGradeDelete(grade._id)} className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-transparent hover:border-red-200">Delete</button>
                                  </div>
                              </td>
                          </tr>
                          ))}
                      </tbody>
                      </table>
                  </div>

                  {/* --- MOBILE CARD VIEW --- */}
                  <div className="md:hidden flex flex-col divide-y divide-gray-100">
                      {grades.map((grade) => (
                          <div key={grade._id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h4 className="font-bold text-gray-800 text-[15px]">
                                          {grade.subject?.name || <span className="text-red-400 italic">Deleted Subject</span>}
                                      </h4>
                                      <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{grade.semester}</span>
                                          <span className="text-[10px] text-gray-400 font-bold">{grade.academicYear}</span>
                                      </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Score</span>
                                      <span className="bg-green-50 text-green-700 font-black px-2.5 py-1 rounded border border-green-100 text-sm">
                                          {grade.finalScore ?? "-"}
                                      </span>
                                  </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-50">
                                  <button onClick={() => setEditingGradeId(grade._id)} className="text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex-1 text-center">Edit</button>
                                  <button onClick={() => handleGradeDelete(grade._id)} className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex-1 text-center">Delete</button>
                              </div>
                          </div>
                      ))}
                  </div>
                </>
                ) : (
                <div className="p-10 text-center text-gray-400">
                    <div className="text-4xl mb-3 opacity-50">📝</div>
                    <p className="text-sm font-medium">No academic grades entered yet.</p>
                </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: BEHAVIORAL REPORTS */}
        <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><span>🧠</span> Behaviors</h3>
                    {(isHomeroomTeacher || isAdmin) && (
                        <Link to={`/reports/add/${student._id}`} className="bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 shadow-sm px-3 py-1.5 rounded-lg transition text-xs font-bold">
                            + Add
                        </Link>
                    )}
                </div>
                
                <div className="p-3 md:p-4 flex-1 bg-gray-50/30">
                    {reports.length > 0 ? (
                    <div className="space-y-3">
                        {reports.map((report) => (
                        <div key={report._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                            <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-2">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-sm">{report.semester}</h4>
                                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{report.academicYear}</span>
                                </div>
                                {(isHomeroomTeacher || isAdmin) && (
                                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white">
                                        <Link to={`/reports/edit/${report._id}`} className="text-blue-500 bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded text-xs font-bold border border-transparent hover:border-blue-200">✎</Link>
                                        <button onClick={() => handleReportDelete(report._id)} className="text-red-500 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded text-xs font-bold border border-transparent hover:border-red-200">✕</button>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-xs text-gray-700 mt-2 bg-yellow-50 p-3 rounded-lg border border-yellow-100 leading-relaxed">
                                <span className="font-bold text-yellow-800 block mb-1 uppercase tracking-wider text-[10px]">Teacher Remarks</span> 
                                {report.teacherComment || <span className="italic text-gray-400">No remarks provided.</span>}
                            </div>
                            
                            {report.evaluations && report.evaluations.length > 0 && (
                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                    {report.evaluations.map((ev, i) => (
                                        <div key={i} className="text-[10px] bg-gray-50 border border-gray-100 p-2 rounded-lg flex justify-between items-center">
                                            <span className="text-gray-500 truncate mr-2 font-medium" title={ev.area}>{ev.area}</span>
                                            <strong className={`px-1.5 py-0.5 rounded bg-white border ${ev.result === 'A' ? 'border-green-200 text-green-700' : ev.result === 'B' ? 'border-blue-200 text-blue-700' : 'border-gray-200 text-gray-700'}`}>{ev.result}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 py-12">
                        <div className="text-4xl mb-2 opacity-50">🌱</div>
                        <p className="text-sm font-medium">No behavioral assessments yet.</p>
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
          <Dialog.Content className="fixed inset-2 md:inset-6 lg:inset-10 bg-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-fade-in">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
              <Dialog.Title className="text-lg md:text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span className="text-pink-600">📄</span> Report Card
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors border border-gray-200 hover:border-red-200">
                    ✕ Close
                </button>
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto p-2 md:p-6 bg-gray-200/50">
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
