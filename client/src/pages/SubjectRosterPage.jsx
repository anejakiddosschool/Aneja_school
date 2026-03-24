// // src/pages/SubjectRosterPage.js
// import React, { useState, useEffect } from 'react';
// import { useLocation} from 'react-router-dom';
// import rosterService from '../services/rosterService';
// import subjectService from '../services/subjectService';
// import authService from '../services/authService';
// import userService from '../services/userService';

// const SubjectRosterPage = () => {
//     const location = useLocation();

//     // --- State Management ---
//     const [currentUser] = useState(authService.getCurrentUser());
//     const [subjects, setSubjects] = useState([]);
//     const [selectedSubject, setSelectedSubject] = useState(location.state?.subjectId || '');
//     const [semester, setSemester] = useState('First Semester');
//     const [academicYear, setAcademicYear] = useState('');
//     const [rosterData, setRosterData] = useState(null);
//     const [error, setError] = useState(null);
//     const [loading, setLoading] = useState(false);

//     // --- Data Fetching: Load the correct list of subjects based on the user's role ---
//     useEffect(() => {
//         const loadSubjectsForRole = async () => {
//             setError(null);
//             try {
//                 if (currentUser.role === 'admin') {
//                     const response = await subjectService.getAllSubjects();
//                     setSubjects(response.data.data);
//                 } else if (currentUser.role === 'teacher' || currentUser.role === 'hometeacher') {
//                     const response = await userService.getProfile();
//                     const taughtSubjects = response.data.subjectsTaught.map(assignment => assignment.subject).filter(Boolean);
//                     setSubjects(taughtSubjects);
//                 }
//             } catch (err) {
//                 setError('Failed to load subjects for your role.');
//             }
//         };
//         loadSubjectsForRole();
//     }, [currentUser.role]);

//      useEffect(() => {
//         // When the 'subjects' list is loaded AND we have a selectedSubject from the location state...
//         if (subjects.length > 0 && location.state?.subjectId) {
//             handleGenerate();
//         }
//     }, [subjects, location.state]);
    
//     // --- Handlers ---
//     const handleGenerate = async (e) => {
//         if (e) e.preventDefault();
//         if (!selectedSubject) return;
         
//         setLoading(true);
//         setError(null);
//         setRosterData(null);
//         try {
//              const subjectDetails = subjects.find(s => s._id === selectedSubject);
//              if (!subjectDetails) throw new Error("Selected subject not found.");

//             const response = await rosterService.getSubjectRoster(
//                 { 
//                     gradeLevel: subjectDetails.gradeLevel,
//                     subjectId: selectedSubject,
//                     semester,
//                     academicYear
//                 });
//             setRosterData(response.data);
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to generate detailed roster.');
//         } 
//         finally {
//             setLoading(false);
//         }
//     };

//     const handlePrint = () => {
//         const tableToPrint = document.getElementById('subjectRosterTable');
//         const subjectDetails = subjects.find(s => s._id === selectedSubject);
//         if (!tableToPrint || !subjectDetails) return;

//         const printWindow = window.open('', '', 'height=800,width=1200');
//         printWindow.document.write('<html><head><title>Print Subject Roster</title>');
//         printWindow.document.write('<style>@page { size: A4 landscape; margin: 1cm; } body { font-family: Arial, sans-serif; } table { width: 100%; border-collapse: collapse; font-size: 8pt; } th, td { border: 1px solid black; padding: 5px; text-align: center; } th { vertical-align: middle; } td.student-name { text-align: left; }</style>');
//         printWindow.document.write('</head><body>');
//         // printWindow.document.write(`<h3>Detailed Roster for ${subjects.find(s => s._id === selectedSubject)?.name} (${gradeLevel}) - ${semester}</h3>`);
//         printWindow.document.write(`<h3>Detailed Roster for ${subjectDetails.name} (${subjectDetails.gradeLevel}) - ${semester}</h3>`);

//         printWindow.document.write(tableToPrint.outerHTML);
//         printWindow.document.write('</body></html>');
//         printWindow.document.close();
//         setTimeout(() => {
//             printWindow.focus();
//             printWindow.print();
//             printWindow.close();
//         }, 500);
//     };

//     // --- Tailwind CSS class strings ---
//     const inputLabel = "block text-gray-700 text-sm font-bold";
//     const formInput = "shadow-sm mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500";
//     const buttonPrimary = `bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 ${!selectedSubject || loading ? 'opacity-50 cursor-not-allowed' : ''}`;
//     const buttonSecondary = "bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200";
//     const tableHeader = "px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300";
//     const tableCell = "px-4 py-2 whitespace-nowrap text-sm text-center border border-gray-300";

//     return (
//         <div className="p-6 bg-gray-50 min-h-screen">
//             <div className="bg-white p-6 rounded-lg shadow-md">
//                 <h2 className="text-2xl font-bold text-gray-800 mb-4">Detailed Subject Mark List</h2>
                
//                 {/* --- Controls Section --- */}
//                 <div className="p-4 bg-gray-100 rounded-lg mb-6">
//                     <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
//                         <div>
//                             <label htmlFor="subject" className={inputLabel}>Subject</label>
//                             <select id="subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className={formInput} required>
//                                 <option value="">-- Select --</option>
//                                 {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.gradeLevel})</option>)}
//                             </select>
//                         </div>
//                         <div>
//                             <label htmlFor="semester" className={inputLabel}>Semester</label>
//                             <select id="semester" value={semester} onChange={e => setSemester(e.target.value)} className={formInput} required>
//                                 <option value="First Semester">First Semester</option>
//                                 <option value="Second Semester">Second Semester</option>
//                             </select>
//                         </div>
//                         <div>
//                             <label htmlFor="academicYear" className={inputLabel}>Academic Year</label>
//                             <input id="academicYear" type="text" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className={formInput} required />
//                         </div>
//                         <div className="flex gap-2">
//                             <button type="submit" className={buttonPrimary} disabled={!selectedSubject || loading}>
//                                 {loading ? 'Generating...' : 'Generate'}
//                             </button>
//                             {rosterData && <button type="button" onClick={handlePrint} className={buttonSecondary}>Print</button>}
//                         </div>
//                     </form>
//                 </div>

//                 {error && <p className="text-red-500 text-center mt-4">{error}</p>}

//                 {/* --- Roster Table Section --- */}
//                 {rosterData && (
//                     <div id="subjectRosterTableWrapper" className="overflow-x-auto">
//                         <h3 className="text-xl font-bold text-gray-800 my-4 text-center">
//                             Detailed Roster for {subjects.find(s => s._id === selectedSubject)?.name} 
//                             ({subjects.find(s => s._id === selectedSubject)?.gradeLevel}) 
//                             - {semester}
//                         </h3>
//                         <table id="subjectRosterTable" className="min-w-full divide-y divide-gray-200 border">
//                             <thead>
//                                 <tr>
//                                     <th rowSpan="2" className={tableHeader}>Student Id</th>
//                                     <th rowSpan="2" className={tableHeader}>Student Name</th>
//                                     <th rowSpan="2" className={tableHeader}>Sex</th>
//                                     <th rowSpan="2" className={tableHeader}>Age</th>
//                                     {rosterData && rosterData.sortedMonths.map(month => (
//                                         <th key={month} colSpan={rosterData.assessmentsByMonth[month].length} className={`${tableHeader} bg-gray-100`}>
//                                             {month}
//                                         </th>
//                                     ))}
//                                     <th rowSpan="2" className={`${tableHeader} bg-pink-100`}>Final Score</th>
//                                 </tr>
//                                 <tr>
//                                     {rosterData.sortedMonths.map(month => (
//                                         rosterData.assessmentsByMonth[month].map(at => (
//                                             <th key={at._id} className={`${tableHeader} font-normal`}>{at.name}<br/>({at.totalMarks})</th>
//                                         ))
//                                     ))}
//                                 </tr>
//                             </thead>
//                             <tbody className="bg-white divide-y divide-gray-200">
//                                 {rosterData.roster.map(student => (
//                                     <tr key={student.studentId} className="hover:bg-gray-50">
//                                         <td className={tableCell}>{student.studentId}</td>
//                                         <td className={`${tableCell} text-left font-medium text-gray-800 student-name`}>{student.fullName}</td>
//                                         <td className={tableCell}>{student.gender.charAt(0)}</td>
//                                         <td className={tableCell}>{student.age}</td>
//                                         {rosterData.sortedMonths.map(month => (
//                                             rosterData.assessmentsByMonth[month].map(at => (
//                                                 <td key={at._id} className={tableCell}>{student.detailedScores[at._id]}</td>
//                                             ))
//                                         ))}
//                                         <td className={`${tableCell} font-bold bg-pink-50`}>{student.finalScore}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default SubjectRosterPage;


// src/pages/SubjectRosterPage.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import rosterService from '../services/rosterService';
import subjectService from '../services/subjectService';
import authService from '../services/authService';
import userService from '../services/userService';
import toast from 'react-hot-toast';

const SubjectRosterPage = () => {
    const location = useLocation();

    // Create dynamic Academic Years (Format: 2025-2026)
    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 5 }, (_, i) => `${currentYear - i}-${currentYear - i + 1}`);

    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(location.state?.subjectId || '');
    const [semester, setSemester] = useState('First Semester');
    const [academicYear, setAcademicYear] = useState(yearOptions[0]); // Changed from empty string to default session
    
    const [rosterData, setRosterData] = useState(null);
    const [loading, setLoading] = useState(false);

    // --- Data Fetching: Load the correct list of subjects based on the user's role ---
    useEffect(() => {
        const loadSubjectsForRole = async () => {
            try {
                if (currentUser.role === 'admin') {
                    const response = await subjectService.getAllSubjects();
                    setSubjects(response.data.data);
                } else if (currentUser.role === 'teacher' || currentUser.role === 'hometeacher') {
                    const response = await userService.getProfile();
                    const taughtSubjects = response.data.subjectsTaught.map(assignment => assignment.subject).filter(Boolean);
                    setSubjects(taughtSubjects);
                }
            } catch (err) {
                toast.error('Failed to load subjects for your role.');
            }
        };
        loadSubjectsForRole();
    }, [currentUser.role]);

    // Auto generate if we navigated here from another page with a specific subject
     useEffect(() => {
        if (subjects.length > 0 && location.state?.subjectId) {
            handleGenerate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjects, location.state]);
    
    // --- Handlers ---
    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        
        if (!selectedSubject) {
            toast.error("Please select a subject first.");
            return;
        }
         
        setLoading(true);
        setRosterData(null);
        try {
             const subjectDetails = subjects.find(s => s._id === selectedSubject);
             if (!subjectDetails) throw new Error("Selected subject not found.");

            // Request backend data using the selected year and semester
            const response = await rosterService.getSubjectRoster({ 
                gradeLevel: subjectDetails.gradeLevel,
                subjectId: selectedSubject,
                semester,
                academicYear
            });
            
            if(response.data.roster.length === 0) {
                toast.error("No student marks found for this session.");
            }
            
            setRosterData(response.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to generate detailed roster.');
        } 
        finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const tableToPrint = document.getElementById('subjectRosterTable');
        const subjectDetails = subjects.find(s => s._id === selectedSubject);
        if (!tableToPrint || !subjectDetails) return;

        const printWindow = window.open('', '', 'height=800,width=1200');
        printWindow.document.write('<html><head><title>Print Subject Roster</title>');
        printWindow.document.write(`
            <style>
                @page { size: A4 landscape; margin: 1cm; } 
                body { font-family: Arial, sans-serif; padding: 10px; -webkit-print-color-adjust: exact !important; color-adjust: exact !important;} 
                table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 15px;} 
                th, td { border: 1px solid black; padding: 5px; text-align: center; } 
                th { vertical-align: middle; background-color: #f3f4f6 !important; font-weight: bold; } 
                .student-name { text-align: left; font-weight: bold; }
                h3 { text-align: center; margin-bottom: 5px;}
            </style>`);
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h3>Detailed Subject Mark List - ${semester}</h3>`);
        printWindow.document.write(`<div style="text-align: center; font-size: 12pt; color: #555;">Subject: <b>${subjectDetails.name}</b> &nbsp;|&nbsp; Class: <b>${subjectDetails.gradeLevel}</b> &nbsp;|&nbsp; Session: <b>${academicYear}</b></div>`);

        printWindow.document.write(tableToPrint.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    // --- Tailwind Classes for Web UI Table ---
    const thStyle = "px-4 py-3 border border-gray-200 text-center text-xs font-bold text-gray-700 uppercase tracking-wider";
    const tdStyle = "px-4 py-2 border border-gray-100 text-center text-sm font-medium text-gray-800";

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
            
            {/* HEADER SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">Subject Mark List (Detailed Roster)</h2>
                <p className="text-sm text-gray-500 mt-1">View month-wise assessment details for a specific subject and term.</p>
            </div>
            
            {/* CONTROLS SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-end">
                    
                    <div>
                        <label htmlFor="subject" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Subject</label>
                        <select id="subject" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer transition-all" required>
                            <option value="">-- Choose Subject --</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.gradeLevel})</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="semester" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Term / Semester</label>
                        <select id="semester" value={semester} onChange={e => setSemester(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer transition-all" required>
                            <option value="First Semester">First Semester (Term I)</option>
                            <option value="Second Semester">Second Semester (Term II)</option>
                        </select>
                    </div>

                    {/* FIXED ACADEMIC YEAR DROPDOWN */}
                    <div>
                        <label htmlFor="academicYear" className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Academic Session</label>
                        <select id="academicYear" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 cursor-pointer transition-all" required>
                            {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-3 h-[42px] mt-auto">
                        <button type="submit" className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all" disabled={!selectedSubject || loading}>
                            {loading ? 'Generating...' : 'Load Data'}
                        </button>
                        
                        {rosterData && rosterData.roster.length > 0 && (
                            <button type="button" onClick={handlePrint} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm transition-all flex items-center gap-2">
                                <span>🖨️</span> Print
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* TABLE SECTION */}
            {rosterData && rosterData.roster.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                    
                    <div className="bg-gray-50 p-5 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">
                                Register for: <span className="text-pink-600">{subjects.find(s => s._id === selectedSubject)?.name}</span>
                            </h3>
                            <p className="text-sm font-medium text-gray-500 mt-1">
                                Class: {subjects.find(s => s._id === selectedSubject)?.gradeLevel} | {semester}
                            </p>
                        </div>
                        <div className="text-sm font-semibold bg-white border text-gray-700 px-4 py-1.5 rounded-full shadow-sm">
                            Total Students: {rosterData.roster.length}
                        </div>
                    </div>

                    <div id="subjectRosterTableWrapper" className="overflow-x-auto p-4">
                        <table id="subjectRosterTable" className="w-full divide-y divide-gray-200 border-collapse">
                            <thead>
                                <tr>
                                    <th rowSpan="2" className={`${thStyle} bg-rose-600 text-white`}>ID</th>
                                    <th rowSpan="2" className={`${thStyle} bg-rose-600 text-white`}>Student Name</th>
                                    <th rowSpan="2" className={`${thStyle} bg-rose-600 text-white`}>Sex</th>
                                    <th rowSpan="2" className={`${thStyle} bg-rose-600 text-white`}>Age</th>
                                    {rosterData.sortedMonths.map(month => (
                                        <th key={month} colSpan={rosterData.assessmentsByMonth[month].length} className={`${thStyle} bg-gray-100 text-gray-900 border-b-2 border-gray-300`}>
                                            {month}
                                        </th>
                                    ))}
                                    <th rowSpan="2" className={`${thStyle} bg-rose-700 text-white`}>Final Score</th>
                                </tr>
                                <tr>
                                    {rosterData.sortedMonths.map(month => (
                                        rosterData.assessmentsByMonth[month].map(at => (
                                            <th key={at._id} className={`${thStyle} bg-gray-50 text-[10px] !py-1 leading-tight`}>
                                                <span className="block mb-1">{at.name}</span>
                                                <span className="bg-gray-200 text-gray-600 px-1 rounded">({at.totalMarks})</span>
                                            </th>
                                        ))
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {rosterData.roster.map(student => (
                                    <tr key={student.studentId} className="hover:bg-blue-50/50 transition-colors">
                                        <td className={`${tdStyle} bg-gray-50`}>{student.studentId}</td>
                                        <td className={`${tdStyle} text-left student-name`}>{student.fullName}</td>
                                        <td className={`${tdStyle} text-gray-500`}>{student.gender.charAt(0)}</td>
                                        <td className={`${tdStyle} text-gray-500`}>{student.age}</td>
                                        {rosterData.sortedMonths.map(month => (
                                            rosterData.assessmentsByMonth[month].map(at => (
                                                <td key={at._id} className={tdStyle}>
                                                    {student.detailedScores[at._id]}
                                                </td>
                                            ))
                                        ))}
                                        <td className={`${tdStyle} bg-pink-50 text-pink-700 font-extrabold text-lg`}>
                                            {student.finalScore}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : rosterData && rosterData.roster.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center animate-fade-in">
                    <span className="text-5xl">📊</span>
                    <p className="text-xl font-bold text-gray-800 mt-4">No Mark Entries Found</p>
                    <p className="text-gray-500 mt-2">There is no student data recorded for this subject in the <b>{academicYear}</b> session.</p>
                </div>
            ) : null}
        </div>
    );
};

export default SubjectRosterPage;
