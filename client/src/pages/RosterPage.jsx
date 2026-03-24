// import React, { useState, useEffect } from "react";
// import rosterService from "../services/rosterService";
// import authService from "../services/authService";
// import subjectService from "../services/subjectService";
// const RosterPage = () => {
//   const [currentUser] = useState(authService.getCurrentUser());
//   const [gradeLevel, setGradeLevel] = useState(currentUser.homeroomGrade || "");
//   const [academicYear, setAcademicYear] = useState("");
//   const [rosterData, setRosterData] = useState(null);
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [homeroomTeacher, setHomeroomTeacher] = useState("");
//   const [gradeOptions, setGradeOptions] = useState([]);

//   useEffect(() => {
//     if (currentUser.role === "teacher" && currentUser.homeroomGrade) {
//       handleGenerateRoster();
//     }
//   }, [currentUser]);

//   // --- Event Handlers (Perfect, no changes) ---
//   const handleGenerateRoster = async (e) => {
//     if (e) {
//       e.preventDefault();
//     }
//     if (!gradeLevel) {
//       setError("Please specify a Grade Level.");
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     setRosterData(null);
//     try {
//       const response = await rosterService.getRoster({
//         gradeLevel,
//         academicYear,
//       });
//       setRosterData(response.data);
//       setHomeroomTeacher(response.data.homeroomTeacherName);
//     } catch (err) {
//       setError(err.response?.data?.message || "Failed to generate roster.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const fetchGradeLevels = async () => {
//       try {
//         const response = await subjectService.getAllSubjects();
//         const subjects = response.data.data || [];
//         const uniqueGrades = [
//           ...new Set(subjects.map((s) => s.gradeLevel)),
//         ].sort();
//         setGradeOptions(uniqueGrades);
//       } catch (err) {
//         // Optionally: setError("Failed to fetch grades.");
//       }
//     };
//     fetchGradeLevels();
//   }, []);
//   console.log("Roster Data:", rosterData); // Debugging line

//   const handlePrint = () => {
//     const tableToPrint = document.getElementById("rosterTable");
//     if (!tableToPrint) return;

//     const printWindow = window.open("", "", "height=800,width=1200");
//     printWindow.document.write("<html><head><title>Print Roster</title>");
//     printWindow.document.write(
//       "<style>@page { size: A4 landscape; margin: 1cm; } body { font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; font-size: 7pt; } th, td { border: 1px solid black; padding: 4px; text-align: center; } th { vertical-align: middle; } td.student-name { text-align: left; }</style>"
//     );
//     printWindow.document.write(`
//         <link rel="stylesheet" href="/src/index.css"> <!-- Or the path to your main CSS file -->
//         <style>
//             @page { 
//                 size: A4 landscape; 
//                 margin: 1cm; 
//             }
//             body { 
//                 padding:10px;
//                 font-family: Arial, sans-serif;
//                 /* These two lines are the magic for printing colors */
//                 -webkit-print-color-adjust: exact !important;
//                 color-adjust: exact !important;
//             }
//             table { 
//                 margin-top:10px;
//                 width: 100%; 
//                 border-collapse: collapse; 
//                 font-size: 7pt; 
//             }
//             th, td { 
//                 border: 1px solid black; 
//                 padding: 4px; 
//                 text-align: center; 
//             }
//             th { 
//                 vertical-align: middle; 
//             }
//             .student-name { 
//                 text-align: left; 
//             }
//             .titleOfAll {
//                 text-align:cener;
//             }
//         </style>
//     `);
//     printWindow.document.write("</head><body>");
//     printWindow.document
//       .write(`<h3 className="titleOfAll text-xl font-bold text-gray-800">
//                                         Aneja Kiddos School Roster for ${gradeLevel} - ${academicYear} | 
//                                         <span className="font-normal text-gray-600"> Homeroom Teacher: ${homeroomTeacher}</span>
//                                     </h3>`);
//     printWindow.document.write(tableToPrint.outerHTML);
//     printWindow.document.write("</body></html>");
//     printWindow.document.close();
//     setTimeout(() => {
//       printWindow.focus();
//       printWindow.print();
//       printWindow.close();
//     }, 1000);
//   };

//   const textInput =
//     "shadow-sm border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500";
//   const submitButton = `bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-colors duration-200 ${
//     loading ? "opacity-50 cursor-not-allowed" : ""
//   }`;
//   const thStyle = "p-2 border border-black text-center align-middle";
//   const tdStyle = "p-2 border border-black text-center";
//   const semesterCellStyle = `${tdStyle} font-bold text-left`;
//   const currentYear = new Date().getFullYear();
//   const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

//   return (
//     <div className="bg-white p-6 rounded-lg shadow-md">
//       <h2 className="text-2xl font-bold text-gray-800 mb-4">
//         Yearly Mark List
//       </h2>

//       <div className="p-4 bg-gray-50 rounded-lg border mb-6">
//         <form
//           onSubmit={handleGenerateRoster}
//           className="flex flex-wrap items-center gap-4"
//         >
//           <div>
//             <label
//               htmlFor="gradeLevel"
//               className="font-bold text-gray-700 mr-2"
//             >
//               Enter Grade Level:
//             </label>
//             {/* <input
//               id="gradeLevel"
//               type="text"
//               value={gradeLevel}
//               onChange={(e) => setGradeLevel(e.target.value)}
//               className="shadow-sm border rounded-lg py-2 px-3"
//             /> */}
//             <select
//               id="gradeLevel"
//               value={gradeLevel}
//               onChange={(e) => setGradeLevel(e.target.value)}
//               className={textInput}
//               required
//             >
//               <option value="">Select Grade Level</option>
//               {gradeOptions.map((grade) => (
//                 <option key={grade} value={grade}>
//                   {grade}
//                 </option>
//               ))}
//             </select>
//           </div>
//           {/* <div>
//                         <label htmlFor="academicYear" className="font-bold text-gray-700 mr-2">Academic Year:</label>
//                         <input id="academicYear" type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className={textInput} />
//                     </div> */}
//           <div>
//             <label
//               htmlFor="academicYear"
//               className="font-bold text-gray-700 mr-2"
//             >
//               Academic Year:
//             </label>

//             <select
//               id="academicYear"
//               value={academicYear}
//               onChange={(e) => setAcademicYear(e.target.value)}
//               className={textInput}
//             >
//               <option value="">Select Year</option>
//               {yearOptions.map((year) => (
//                 <option key={year} value={year}>
//                   {year}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <button type="submit" className={submitButton} disabled={loading}>
//             {loading ? "Generating..." : "Generate Roster"}
//           </button>
//           {rosterData && (
//             <button
//               type="button"
//               onClick={handlePrint}
//               className="ml-auto bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg"
//             >
//               Print Roster
//             </button>
//           )}
//         </form>
//       </div>

//       {error && <p className="text-red-500 text-center">{error}</p>}

//       {rosterData && (
//         <div className="overflow-x-auto">
//           <h3 className="text-xl font-bold text-gray-800 mb-4">
//             Roster for {gradeLevel} - {academicYear} |
//             <span className="font-normal text-gray-600">
//               {" "}
//               Homeroom Teacher: {homeroomTeacher}
//             </span>
//           </h3>
//           <table id="rosterTable" className="min-w-full text-sm">
//             <thead>
//               <tr className="bg-rose-600 text-cyan-100">
//                 <th className={thStyle}>Student ID</th>
//                 <th className={thStyle}>Full Name</th>
//                 <th className={thStyle}>Sex</th>
//                 <th className={thStyle}>Age</th>
//                 <th className={thStyle}>Semester</th>
//                 {rosterData.subjects.map((subjectName) => (
//                   <th key={subjectName} className={thStyle}>
//                     {subjectName}
//                   </th>
//                 ))}
//                 <th className={`${thStyle}`}>Total</th>
//                 <th className={`${thStyle}`}>Average</th>
//                 <th className={`${thStyle}`}>Rank</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rosterData.roster.map((student) => [
//                 <tr key={`${student.studentId}-1`}>
//                   <td
//                     rowSpan="3"
//                     className={`${tdStyle} bg-rose-600 text-cyan-100`}
//                   >
//                     {student.studentId}
//                   </td>
//                   <td
//                     rowSpan="3"
//                     className={`${tdStyle} text-left student-name`}
//                   >
//                     {student.fullName}
//                   </td>
//                   <td rowSpan="3" className={tdStyle}>
//                     {student.gender?.charAt(0)}
//                   </td>
//                   <td rowSpan="3" className={tdStyle}>
//                     {student.age}
//                   </td>
//                   <td className={semesterCellStyle}>1st Sem</td>
//                   {rosterData.subjects.map((subject) => (
//                     <td key={`${subject}-1`} className={tdStyle}>
//                       {student.firstSemester.scores[subject]}
//                     </td>
//                   ))}
//                   <td className={`${tdStyle} bg-gray-200 font-bold`}>
//                     {student.firstSemester.total.toFixed(2)}
//                   </td>
//                   <td className={`${tdStyle} bg-gray-200 font-bold`}>
//                     {student.firstSemester.average.toFixed(2)}
//                   </td>
//                   <td className={`${tdStyle} bg-gray-300 font-bold`}>
//                     {student.rank1st}
//                   </td>
//                 </tr>,
//                 <tr key={`${student.studentId}-2`}>
//                   <td className={semesterCellStyle}>2nd Sem</td>
//                   {rosterData.subjects.map((subject) => (
//                     <td key={`${subject}-2`} className={tdStyle}>
//                       {student.secondSemester.scores[subject]}
//                     </td>
//                   ))}
//                   <td className={`${tdStyle} bg-gray-200 font-bold`}>
//                     {student.secondSemester.total.toFixed(2)}
//                   </td>
//                   <td className={`${tdStyle} bg-gray-200 font-bold`}>
//                     {student.secondSemester.average.toFixed(2)}
//                   </td>
//                   <td className={`${tdStyle} bg-gray-300 font-bold`}>
//                     {student.rank2nd}
//                   </td>
//                 </tr>,
//                 <tr key={`${student.studentId}-avg`} className="bg-gray-100">
//                   <td className={semesterCellStyle}>Subject Average</td>
//                   {rosterData.subjects.map((subject) => (
//                     <td
//                       key={`${subject}-avg`}
//                       className={`${tdStyle} font-bold`}
//                     >
//                       {typeof student.subjectAverages[subject] === "number"
//                         ? student.subjectAverages[subject].toFixed(2)
//                         : "-"}
//                     </td>
//                   ))}
//                   <td className={`${tdStyle} bg-gray-300 font-bold`}>
//                     {(student.overallTotal || 0).toFixed(2)}
//                   </td>
//                   <td className={`${tdStyle} bg-gray-300 font-bold`}>
//                     {(student.overallAverage || 0).toFixed(2)}
//                   </td>
//                   <td className={`${tdStyle} bg-gray-300 font-bold`}>
//                     {student.overallRank}
//                   </td>
//                 </tr>,
//               ])}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RosterPage;

// src/pages/RosterPage.js
import React, { useState, useEffect } from "react";
import rosterService from "../services/rosterService";
import authService from "../services/authService";
import subjectService from "../services/subjectService";
import toast from "react-hot-toast";

const RosterPage = () => {
  const [currentUser] = useState(authService.getCurrentUser());
  
  // Create dynamic Academic Years (Format: 2025-2026)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`);

  // --- States ---
  const [gradeLevel, setGradeLevel] = useState(currentUser.homeroomGrade || "");
  const [academicYear, setAcademicYear] = useState(yearOptions[0]); // Default to current session
  
  const [rosterData, setRosterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [homeroomTeacher, setHomeroomTeacher] = useState("");
  const [gradeOptions, setGradeOptions] = useState([]);

  // Auto-generate if teacher has a homeroom grade assigned
  useEffect(() => {
    if (currentUser.role === "teacher" && currentUser.homeroomGrade) {
      handleGenerateRoster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Fetch unique grade levels for the dropdown
  useEffect(() => {
    const fetchGradeLevels = async () => {
      try {
        const response = await subjectService.getAllSubjects();
        const subjects = response.data.data || [];
        const uniqueGrades = [...new Set(subjects.map((s) => s.gradeLevel).filter(Boolean))].sort();
        setGradeOptions(uniqueGrades);
      } catch (err) {
        toast.error("Failed to load grade levels.");
      }
    };
    fetchGradeLevels();
  }, []);

  // --- Event Handlers ---
  const handleGenerateRoster = async (e) => {
    if (e) e.preventDefault();
    
    if (!gradeLevel) {
      toast.error("Please select a Class/Grade.");
      return;
    }

    setLoading(true);
    setRosterData(null);
    
    try {
      const response = await rosterService.getRoster({ gradeLevel, academicYear });
      setRosterData(response.data);
      setHomeroomTeacher(response.data.homeroomTeacherName);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate roster data.");
    } finally {
      setLoading(false);
    }
  };

  // --- Print Handler (Styles kept as requested for perfect hardcopy) ---
  const handlePrint = () => {
    const tableToPrint = document.getElementById("rosterTable");
    if (!tableToPrint) return;

    const printWindow = window.open("", "", "height=800,width=1200");
    printWindow.document.write("<html><head><title>Print Roster</title>");
    printWindow.document.write(`
        <style>
            @page { 
                size: A4 landscape; 
                margin: 1cm; 
            }
            body { 
                padding: 10px;
                font-family: Arial, sans-serif;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            table { 
                margin-top: 15px;
                width: 100%; 
                border-collapse: collapse; 
                font-size: 8pt; 
            }
            th, td { 
                border: 1px solid #000; 
                padding: 6px; 
                text-align: center; 
            }
            th { 
                background-color: #f3f4f6 !important;
                vertical-align: middle; 
                font-weight: bold;
            }
            .student-name { 
                text-align: left; 
                font-weight: bold;
            }
            .header-bg {
               background-color: #e11d48 !important; 
               color: white !important;
            }
            .titleOfAll {
                text-align: center;
                font-size: 16pt;
                margin-bottom: 5px;
            }
            .subTitle {
                text-align: center;
                font-size: 12pt;
                color: #555;
            }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
            .bg-gray-200 { background-color: #e5e7eb !important; }
            .bg-gray-300 { background-color: #d1d5db !important; }
        </style>
    `);
    printWindow.document.write("</head><body>");
    printWindow.document.write(`
        <h3 class="titleOfAll">Aneja Kiddos School Roster</h3>
        <div class="subTitle">Class: <b>${gradeLevel}</b> &nbsp;|&nbsp; Session: <b>${academicYear}</b> &nbsp;|&nbsp; Homeroom Teacher: <b>${homeroomTeacher}</b></div>
    `);
    printWindow.document.write(tableToPrint.outerHTML);
    printWindow.document.write("</body></html>");
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 1000);
  };

  // --- Web UI Table Classes ---
  const thStyle = "px-3 py-4 border-r border-rose-700 text-center align-middle font-semibold tracking-wide text-xs uppercase";
  const tdStyle = "px-3 py-2 border border-gray-200 text-center text-sm text-gray-700";
  const semesterCellStyle = `${tdStyle} font-bold text-left bg-gray-50 text-gray-800 uppercase text-xs tracking-wider`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
      
      {/* HEADER SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800">Yearly Mark List (Roster)</h2>
        <p className="text-sm text-gray-500 mt-1">Generate comprehensive semester-wise mark sheets and class rankings.</p>
      </div>

      {/* FILTER FORM */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleGenerateRoster} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 items-end">
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Class</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer transition-all"
              required
            >
              <option value="">-- Choose Class --</option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Academic Session</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer transition-all"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 flex gap-3 h-[42px] mt-auto">
            <button 
              type="submit" 
              disabled={loading || !gradeLevel}
              className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all"
            >
              {loading ? "Generating Sheet..." : "Load Data"}
            </button>
            
            {rosterData && (
              <button
                type="button"
                onClick={handlePrint}
                className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2"
              >
                <span>🖨️</span> Print Document
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ROSTER TABLE RESULTS */}
      {rosterData && rosterData.roster.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          
          <div className="bg-gray-50 p-5 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                Performance Register: <span className="text-pink-600">{gradeLevel}</span>
              </h3>
              <p className="text-sm text-gray-600 font-medium mt-1">
                Homeroom Teacher: <span className="text-gray-800 bg-white px-2 py-0.5 border rounded shadow-sm">{homeroomTeacher || "Not Assigned"}</span>
              </p>
            </div>
            <div className="text-sm font-semibold bg-white border text-gray-700 px-4 py-1.5 rounded-full shadow-sm">
              Total Students: {rosterData.roster.length}
            </div>
          </div>

          <div className="overflow-x-auto p-4">
            <table id="rosterTable" className="w-full border-collapse">
              <thead>
                <tr className="bg-rose-600 text-white header-bg">
                  <th className={thStyle}>ID</th>
                  <th className={thStyle}>Full Name</th>
                  <th className={thStyle}>Sex</th>
                  <th className={thStyle}>Age</th>
                  <th className={thStyle}>Term</th>
                  {rosterData.subjects.map((subjectName) => (
                    <th key={`head-${subjectName}`} className={thStyle}>{subjectName}</th>
                  ))}
                  <th className={`${thStyle} bg-rose-700`}>Total</th>
                  <th className={`${thStyle} bg-rose-700`}>Average</th>
                  <th className={`${thStyle} bg-rose-800 border-none`}>Rank</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {rosterData.roster.map((student, idx) => (
                  <React.Fragment key={student.studentId}>
                    {/* First Semester Row */}
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td rowSpan="3" className="px-3 py-2 border border-gray-200 text-center font-bold text-gray-700 bg-gray-50">{student.studentId}</td>
                      <td rowSpan="3" className="px-3 py-2 border border-gray-200 text-left font-bold text-gray-900 student-name">{student.fullName}</td>
                      <td rowSpan="3" className="px-3 py-2 border border-gray-200 text-center text-gray-600">{student.gender?.charAt(0)}</td>
                      <td rowSpan="3" className="px-3 py-2 border border-gray-200 text-center text-gray-600">{student.age}</td>
                      
                      <td className={semesterCellStyle}>1st Sem</td>
                      {rosterData.subjects.map((subject) => (
                        <td key={`${student.studentId}-${subject}-1`} className={tdStyle}>{student.firstSemester.scores[subject] ?? "-"}</td>
                      ))}
                      <td className="px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-gray-800">{student.firstSemester.total.toFixed(2)}</td>
                      <td className="px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-blue-700">{student.firstSemester.average.toFixed(2)}%</td>
                      <td className="px-3 py-2 border border-gray-200 text-center font-bold bg-gray-200 text-gray-900">{student.rank1st}</td>
                    </tr>
                    
                    {/* Second Semester Row */}
                    <tr className="hover:bg-blue-50/30 transition-colors">
                      <td className={semesterCellStyle}>2nd Sem</td>
                      {rosterData.subjects.map((subject) => (
                        <td key={`${student.studentId}-${subject}-2`} className={tdStyle}>{student.secondSemester.scores[subject] ?? "-"}</td>
                      ))}
                      <td className="px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-gray-800">{student.secondSemester.total.toFixed(2)}</td>
                      <td className="px-3 py-2 border border-gray-200 text-center font-bold bg-gray-100 text-blue-700">{student.secondSemester.average.toFixed(2)}%</td>
                      <td className="px-3 py-2 border border-gray-200 text-center font-bold bg-gray-200 text-gray-900">{student.rank2nd}</td>
                    </tr>

                    {/* Overall Average Row */}
                    <tr className="bg-blue-50/50 border-b-2 border-b-gray-400">
                      <td className={`${semesterCellStyle} text-blue-800`}>Subject Avg</td>
                      {rosterData.subjects.map((subject) => (
                        <td key={`${student.studentId}-${subject}-avg`} className="px-3 py-2 border border-gray-200 text-center font-bold text-gray-700">
                          {typeof student.subjectAverages[subject] === "number" ? student.subjectAverages[subject].toFixed(1) : "-"}
                        </td>
                      ))}
                      <td className="px-3 py-2 border border-gray-200 text-center font-extrabold bg-blue-100 text-gray-900">{(student.overallTotal || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 border border-gray-200 text-center font-extrabold bg-blue-100 text-blue-800">{(student.overallAverage || 0).toFixed(2)}%</td>
                      <td className="px-3 py-2 border border-gray-200 text-center font-extrabold bg-pink-100 text-pink-700 text-lg">{student.overallRank}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : rosterData && rosterData.roster.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
            <span className="text-5xl">📭</span>
            <p className="text-xl font-bold text-gray-800 mt-4">No Records Found</p>
            <p className="text-gray-500 mt-2">No student marks have been entered for this class and academic session.</p>
        </div>
      ) : null}
      
    </div>
  );
};

export default RosterPage;
