// // src/pages/AnalyticsPage.js
// import React, { useState, useEffect } from 'react';
// import subjectService from '../services/subjectService';
// import assessmentTypeService from '../services/assessmentTypeService';
// import analyticsService from '../services/analyticsService';
// import authService from '../services/authService';
// import userService from '../services/userService';

// // --- Reusable Stat Card Component ---
// const StatCard = ({ title, value, unit = '', colorClass = 'text-gray-900' }) => (
//     <div className="bg-white p-4 rounded-lg shadow text-center border">
//         <p className="text-sm text-gray-500 uppercase font-semibold">{title}</p>
//         <p className={`text-3xl font-bold ${colorClass}`}>{value}{unit}</p>
//     </div>
// );

// const AnalyticsPage = () => {
//     // --- State Management ---
//     const [currentUser] = useState(authService.getCurrentUser());
//     const [availableSubjects, setAvailableSubjects] = useState([]);
//     const [assessmentTypes, setAssessmentTypes] = useState([]);
//     const [analysisResult, setAnalysisResult] = useState(null);

//     const [selectedGrade, setSelectedGrade] = useState('');
//     const [selectedSubject, setSelectedSubject] = useState('');
//     const [selectedAssessment, setSelectedAssessment] = useState('');

//     const [loadingSubjects, setLoadingSubjects] = useState(true);
//     const [loadingAssessments, setLoadingAssessments] = useState(false);
//     const [loadingAnalysis, setLoadingAnalysis] = useState(false);
//     const [error, setError] = useState(null);

//     // --- Data Fetching Logic ---
//     useEffect(() => {
//         const loadSubjects = async () => {
//             try {
//                 let subjects = [];
//                 if (currentUser.role === 'admin') {
//                     const res = await subjectService.getAllSubjects();
//                     subjects = res.data.data;
//                 } else {
//                     const res = await userService.getProfile();
//                     subjects = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
//                 }
//                 setAvailableSubjects(subjects);
//             } catch (err) { setError('Failed to load subject list.'); } 
//             finally { setLoadingSubjects(false); }
//         };
//         loadSubjects();
//     }, [currentUser.role]);

//     useEffect(() => {
//         if (!selectedSubject) {
//             setAssessmentTypes([]);
//             setSelectedAssessment('');
//             return;
//         }
//         setLoadingAssessments(true);
//         assessmentTypeService.getBySubject(selectedSubject)
//             .then(res => {
//                 // In a real app, you'd also  filter by semester here
//                 setAssessmentTypes(res.data.data);
//             })
//             .catch(err => setError('Could not fetch assessments.'))
//             .finally(() => setLoadingAssessments(false));
//         setSelectedAssessment('');
//     }, [selectedSubject]);

//     const handleFetchAnalysis = () => {
//         if (!selectedAssessment) return;
//         setLoadingAnalysis(true); setError(null); setAnalysisResult(null);
//         analyticsService.getAnalysis(selectedAssessment)
//             .then(res => setAnalysisResult(res.data))
//             .catch(err => setError(err.response?.data?.message || 'Failed to get analysis.'))
//             .finally(() => setLoadingAnalysis(false));
//     };
    
//     const gradeLevels = [...new Set(availableSubjects.map(s => s.gradeLevel))].sort();
//     const subjectsForGrade = selectedGrade ? availableSubjects.filter(s => s.gradeLevel === selectedGrade) : [];

//     // --- Style strings for the crosstab table ---
//     const thStyle = "p-2 border border-black text-center align-middle text-xs font-medium uppercase";
//     const subThStyle = `${thStyle} bg-gray-100`;
//     const tdStyle = "p-2 border border-black text-center text-sm";
    
//     if (loadingSubjects) return <p className="text-center text-lg mt-8">Loading configuration...</p>;

//     return (
//         <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
//             <h2 className="text-2xl font-bold text-gray-800">Assessment Analysis</h2>
            
//             <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
//                 <div>
//                     <label className="font-bold block mb-1 text-sm">Grade Level</label>
//                     <select onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); }} value={selectedGrade} className="w-full p-2 border rounded-md">
//                         <option value="">Select Grade</option>
//                         {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
//                     </select>
//                 </div>
//                 <div>
//                     <label className="font-bold block mb-1 text-sm">Subject</label>
//                     <select onChange={(e) => setSelectedSubject(e.target.value)} value={selectedSubject} className="w-full p-2 border rounded-md" disabled={!selectedGrade}>
//                         <option value="">Select Subject</option>
//                         {subjectsForGrade.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
//                     </select>
//                 </div>
//                 <div>
//                     <label className="font-bold block mb-1 text-sm">Assessment</label>
//                     <select onChange={(e) => setSelectedAssessment(e.target.value)} value={selectedAssessment} className="w-full p-2 border rounded-md" disabled={!selectedSubject}>
//                         <option value="">Select Assessment</option>
//                         {loadingAssessments ? <option>Loading...</option> : assessmentTypes.map(at => <option key={at._id} value={at._id}>{at.month} - {at.name} ({at.semester})</option>)}
//                     </select>
//                 </div>
//                 <button onClick={handleFetchAnalysis} className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-md" disabled={!selectedAssessment || loadingAnalysis}>
//                     {loadingAnalysis ? 'Analyzing...' : 'Get Analysis'}
//                 </button>
//             </div>
            
//             {error && <div className="text-red-500 text-center p-4 bg-red-50 rounded border border-red-200">{error}</div>}

//             {loadingAnalysis && <p className="text-center">Calculating results...</p>}

//             {analysisResult && (
//                 <div className="animate-fade-in space-y-8 mt-6">
//                     <h3 className="text-xl font-bold text-gray-800">Results for: <span className="text-pink-600">{analysisResult.assessmentType.name}</span></h3>
//                     {analysisResult.analysis ? (
//                         <>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                                 <StatCard title="Average Score" value={analysisResult.analysis.stats.averageScore.toFixed(1)} unit="%" colorClass="text-blue-600" />
//                                 <StatCard title="Highest Score" value={analysisResult.analysis.stats.maxScore.toFixed(1)} unit="%" colorClass="text-green-600" />
//                                 <StatCard title="Lowest Score" value={analysisResult.analysis.stats.minScore.toFixed(1)} unit="%" colorClass="text-red-600" />
//                                 <StatCard title="Students Graded" value={analysisResult.analysis.stats.studentCount} />
//                             </div>
                            
//                             <div>
//                                 <h4 className="text-lg font-bold text-gray-700 mb-3">Score Distribution Analysis</h4>
//                                 <div className="overflow-x-auto">
//                                     <table className="min-w-full border-collapse border border-black">
//                                         <thead>
//                                             <tr>
//                                                 <th rowSpan="2" className={thStyle}>Student Number</th>
//                                                 <th colSpan="4" className={thStyle}> &lt; 50% </th>
//                                                 <th colSpan="4" className={thStyle}> 50% - 74.9% </th>
//                                                 <th colSpan="4" className={thStyle}> 75% - 89.9% </th>
//                                                 <th colSpan="4" className={thStyle}> &gt;= 90% </th>
//                                             </tr>
//                                             <tr>
//                                                 <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
//                                                 <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
//                                                 <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
//                                                 <th className={subThStyle}>F</th><th className={subThStyle}>M</th><th className={subThStyle}>T</th><th className={subThStyle}>%</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             <tr>
//                                                 <td className={`${tdStyle} font-bold`}>{analysisResult.analysis.totalCounts.F} F, {analysisResult.analysis.totalCounts.M} M, {analysisResult.analysis.totalCounts.T} T</td>
//                                                 <td className={tdStyle}>{analysisResult.analysis.distribution.under50.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.under50.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.under50.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.under50.P}%</td>
//                                                 <td className={tdStyle}>{analysisResult.analysis.distribution.between50and75.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.between50and75.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.between50and75.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.between50and75.P}%</td>
//                                                 <td className={tdStyle}>{analysisResult.analysis.distribution.between75and90.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.between75and90.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.between75and90.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.between75and90.P}%</td>
//                                                 <td className={tdStyle}>{analysisResult.analysis.distribution.over90.F}</td><td className={tdStyle}>{analysisResult.analysis.distribution.over90.M}</td><td className={`${tdStyle} font-bold`}>{analysisResult.analysis.distribution.over90.T}</td><td className={`${tdStyle} bg-gray-100`}>{analysisResult.analysis.distribution.over90.P}%</td>
//                                             </tr>
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         </>
//                     ) : <p className="text-center text-gray-500 p-4">{analysisResult.message}</p>}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AnalyticsPage;


// src/pages/AnalyticsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import subjectService from '../services/subjectService';
import assessmentTypeService from '../services/assessmentTypeService';
import analyticsService from '../services/analyticsService';
import authService from '../services/authService';
import userService from '../services/userService';
import toast from 'react-hot-toast';

// --- Premium Stat Card Component ---
const StatCard = ({ title, value, unit = '', subtext = '', bgColor = 'bg-white', textColor = 'text-gray-800' }) => (
    <div className={`p-6 rounded-2xl shadow-sm border border-gray-100 ${bgColor} transition-transform hover:scale-[1.02] flex flex-col justify-center items-center text-center`}>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
        <p className={`text-4xl font-extrabold ${textColor}`}>{value}<span className="text-xl ml-1 opacity-80">{unit}</span></p>
        {subtext && <p className="text-xs font-medium mt-2 opacity-70 text-gray-600">{subtext}</p>}
    </div>
);

const AnalyticsPage = () => {
    // --- State Management ---
    const [currentUser] = useState(authService.getCurrentUser());
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [assessmentTypes, setAssessmentTypes] = useState([]);
    const [analysisResult, setAnalysisResult] = useState(null);

    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedAssessment, setSelectedAssessment] = useState('');

    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingAssessments, setLoadingAssessments] = useState(false);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    // --- Data Fetching Logic ---
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                let subjects = [];
                if (currentUser.role === 'admin') {
                    const res = await subjectService.getAllSubjects();
                    subjects = res.data.data;
                } else {
                    const res = await userService.getProfile();
                    subjects = res.data.subjectsTaught.map(a => a.subject).filter(Boolean);
                }
                setAvailableSubjects(subjects);
            } catch (err) { 
                toast.error('Failed to load subject list.'); 
            } finally { 
                setLoadingSubjects(false); 
            }
        };
        loadSubjects();
    }, [currentUser.role]);

    useEffect(() => {
        if (!selectedSubject) {
            setAssessmentTypes([]);
            setSelectedAssessment('');
            return;
        }
        setLoadingAssessments(true);
        assessmentTypeService.getBySubject(selectedSubject)
            .then(res => {
                setAssessmentTypes(res.data.data);
            })
            .catch(() => toast.error('Could not fetch assessments.'))
            .finally(() => setLoadingAssessments(false));
        setSelectedAssessment('');
    }, [selectedSubject]);

    const handleFetchAnalysis = async () => {
        if (!selectedAssessment) return;
        setLoadingAnalysis(true);
        setAnalysisResult(null);
        
        try {
            const res = await analyticsService.getAnalysis(selectedAssessment);
            setAnalysisResult(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to get analysis.';
            toast.error(msg);
            setAnalysisResult({ error: true, message: msg });
        } finally {
            setLoadingAnalysis(false);
        }
    };
    
    const gradeLevels = useMemo(() => {
        return [...new Set(availableSubjects.map(s => s.gradeLevel).filter(Boolean))].sort();
    }, [availableSubjects]);

    const subjectsForGrade = useMemo(() => {
        return selectedGrade ? availableSubjects.filter(s => s.gradeLevel === selectedGrade) : [];
    }, [availableSubjects, selectedGrade]);

    // --- Table Classes ---
    const thBase = "px-4 py-3 border border-gray-200 text-center align-middle text-xs font-bold text-gray-600 uppercase tracking-wider";
    const subThBase = `${thBase} bg-gray-50/80 text-[10px]`;
    const tdBase = "px-4 py-3 border border-gray-100 text-center text-sm font-medium text-gray-700";

    if (loadingSubjects) {
        return <div className="flex justify-center items-center mt-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div></div>;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-10">
            
            {/* HEADER SECTION */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800">Assessment Analytics</h2>
                <p className="text-sm text-gray-500 mt-1">Review student performance, averages, and score distributions.</p>
            </div>
            
            {/* FILTER CONTROLS */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                    
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">1. Select Class</label>
                        <select 
                            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubject(''); }} 
                            value={selectedGrade} 
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
                        >
                            <option value="">-- Choose Grade --</option>
                            {gradeLevels.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">2. Select Subject</label>
                        <select 
                            onChange={(e) => setSelectedSubject(e.target.value)} 
                            value={selectedSubject} 
                            disabled={!selectedGrade}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-pink-500 transition-all"
                        >
                            <option value="">-- Choose Subject --</option>
                            {subjectsForGrade.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">3. Assessment</label>
                        <select 
                            onChange={(e) => setSelectedAssessment(e.target.value)} 
                            value={selectedAssessment} 
                            disabled={!selectedSubject || assessmentTypes.length === 0}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg disabled:opacity-50 cursor-pointer focus:ring-2 focus:ring-pink-500 transition-all"
                        >
                            <option value="">-- Choose Test --</option>
                            {loadingAssessments ? <option>Loading...</option> : assessmentTypes.map(at => <option key={at._id} value={at._id}>{at.name} ({at.semester})</option>)}
                        </select>
                    </div>

                    <button 
                        onClick={handleFetchAnalysis} 
                        disabled={!selectedAssessment || loadingAnalysis}
                        className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-all h-[42px]"
                    >
                        {loadingAnalysis ? 'Analyzing...' : 'Generate Report'}
                    </button>
                </div>
            </div>
            
            {/* ANALYTICS RESULTS */}
            {analysisResult && !analysisResult.error && analysisResult.analysis ? (
                <div className="animate-fade-in space-y-6">
                    
                    {/* SUMMARY CARDS */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="mb-6 flex justify-between items-center border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Results for: <span className="text-pink-600">{analysisResult.assessmentType.name}</span></h3>
                                <p className="text-sm text-gray-500 mt-1">Based on {analysisResult.analysis.stats.studentCount} graded students</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Average Score" value={analysisResult.analysis.stats.averageScore.toFixed(1)} unit="%" bgColor="bg-blue-50/50" textColor="text-blue-700" />
                            <StatCard title="Highest Score" value={analysisResult.analysis.stats.maxScore.toFixed(1)} unit="%" bgColor="bg-green-50/50" textColor="text-green-700" />
                            <StatCard title="Lowest Score" value={analysisResult.analysis.stats.minScore.toFixed(1)} unit="%" bgColor="bg-red-50/50" textColor="text-red-700" />
                            <StatCard title="Total Graded" value={analysisResult.analysis.stats.studentCount} bgColor="bg-purple-50/50" textColor="text-purple-700" subtext="Students evaluated" />
                        </div>
                    </div>

                    {/* DISTRIBUTION TABLE */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📊</span> Score Distribution Details
                        </h4>
                        
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="w-full border-collapse bg-white">
                                <thead>
                                    <tr>
                                        <th rowSpan="2" className={`${thBase} bg-gray-50 border-r-2 border-r-gray-200 min-w-[150px]`}>Demographics</th>
                                        <th colSpan="4" className={`${thBase} bg-red-50 text-red-700`}> Needs Attention (&lt; 50%) </th>
                                        <th colSpan="4" className={`${thBase} bg-orange-50 text-orange-700`}> Average (50% - 74.9%) </th>
                                        <th colSpan="4" className={`${thBase} bg-blue-50 text-blue-700`}> Good (75% - 89.9%) </th>
                                        <th colSpan="4" className={`${thBase} bg-green-50 text-green-700`}> Excellent (&gt;= 90%) </th>
                                    </tr>
                                    <tr>
                                        <th className={subThBase}>F</th><th className={subThBase}>M</th><th className={`${subThBase} font-bold text-gray-800`}>Total</th><th className={subThBase}>%</th>
                                        <th className={subThBase}>F</th><th className={subThBase}>M</th><th className={`${subThBase} font-bold text-gray-800`}>Total</th><th className={subThBase}>%</th>
                                        <th className={subThBase}>F</th><th className={subThBase}>M</th><th className={`${subThBase} font-bold text-gray-800`}>Total</th><th className={subThBase}>%</th>
                                        <th className={subThBase}>F</th><th className={subThBase}>M</th><th className={`${subThBase} font-bold text-gray-800`}>Total</th><th className={subThBase}>%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="hover:bg-gray-50 transition-colors">
                                        <td className={`${tdBase} bg-gray-50 border-r-2 border-r-gray-200`}>
                                            <div className="font-bold text-gray-800">Total: {analysisResult.analysis.totalCounts.T}</div>
                                            <div className="text-xs text-gray-500 mt-1">({analysisResult.analysis.totalCounts.M} Boys, {analysisResult.analysis.totalCounts.F} Girls)</div>
                                        </td>
                                        
                                        <td className={tdBase}>{analysisResult.analysis.distribution.under50.F}</td>
                                        <td className={tdBase}>{analysisResult.analysis.distribution.under50.M}</td>
                                        <td className={`${tdBase} font-bold text-red-600 bg-red-50/30`}>{analysisResult.analysis.distribution.under50.T}</td>
                                        <td className={`${tdBase} text-gray-500`}>{analysisResult.analysis.distribution.under50.P}%</td>
                                        
                                        <td className={tdBase}>{analysisResult.analysis.distribution.between50and75.F}</td>
                                        <td className={tdBase}>{analysisResult.analysis.distribution.between50and75.M}</td>
                                        <td className={`${tdBase} font-bold text-orange-600 bg-orange-50/30`}>{analysisResult.analysis.distribution.between50and75.T}</td>
                                        <td className={`${tdBase} text-gray-500`}>{analysisResult.analysis.distribution.between50and75.P}%</td>
                                        
                                        <td className={tdBase}>{analysisResult.analysis.distribution.between75and90.F}</td>
                                        <td className={tdBase}>{analysisResult.analysis.distribution.between75and90.M}</td>
                                        <td className={`${tdBase} font-bold text-blue-600 bg-blue-50/30`}>{analysisResult.analysis.distribution.between75and90.T}</td>
                                        <td className={`${tdBase} text-gray-500`}>{analysisResult.analysis.distribution.between75and90.P}%</td>
                                        
                                        <td className={tdBase}>{analysisResult.analysis.distribution.over90.F}</td>
                                        <td className={tdBase}>{analysisResult.analysis.distribution.over90.M}</td>
                                        <td className={`${tdBase} font-bold text-green-600 bg-green-50/30`}>{analysisResult.analysis.distribution.over90.T}</td>
                                        <td className={`${tdBase} text-gray-500`}>{analysisResult.analysis.distribution.over90.P}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : analysisResult && analysisResult.error ? (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center">
                    <span className="text-4xl">⚠️</span>
                    <p className="text-lg font-bold text-gray-800 mt-3">No Data Found</p>
                    <p className="text-gray-500 mt-1">{analysisResult.message}</p>
                </div>
            ) : null}

        </div>
    );
};

export default AnalyticsPage;
