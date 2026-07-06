// src/pages/ParentDashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import studentAuthService from '../services/studentAuthService';
import studentService from '../services/studentService';
import gradeService from '../services/gradeService';
import behavioralReportService from '../services/behavioralReportService';

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-xl shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-gray-800 mt-0.5">{value || "—"}</p>
      </div>
    </div>
  </div>
);

const ParentDashboardPage = () => {
    const [student, setStudent] = useState(null);
    const [grades, setGrades] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const currentStudent = studentAuthService.getCurrentStudent();
        if (currentStudent) {
            const studentId = currentStudent._id;
            const fetchData = async () => {
                try {
                    const results = await Promise.allSettled([
                        studentService.getStudentById(studentId),
                        gradeService.getGradesByStudent(studentId),
                        behavioralReportService.getReportsByStudent(studentId)
                    ]);
                    if (results[0].status === 'fulfilled') setStudent(results[0].value.data.data);
                    if (results[1].status === 'fulfilled') setGrades(results[1].value.data.data);
                    if (results[2].status === 'fulfilled') setReports(results[2].value.data.data);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        } else {
            setLoading(false);
            setError("Could not find logged in student information.");
        }
    }, []);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium animate-pulse">Loading your child's information...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="bg-red-50 border border-red-200 p-6 rounded-2xl text-center max-w-md">
                <span className="text-3xl block mb-2">⚠️</span>
                <p className="text-red-600 font-bold">{error}</p>
            </div>
        </div>
    );

    const avgScore = grades.length > 0 
        ? (grades.reduce((sum, g) => sum + (g.finalScore || 0), 0) / grades.length).toFixed(1)
        : null;

    return (
        <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-400 flex items-center justify-center text-white text-3xl font-bold shadow-md shrink-0">
                        {student?.fullName?.charAt(0) || "S"}
                    </div>
                    <div className="flex-1">
                        <span className="text-purple-600 font-bold tracking-wider uppercase text-xs mb-1 block">Parent Portal</span>
                        <h2 className="text-2xl md:text-3xl font-black text-gray-900">{student?.fullName}</h2>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 border border-gray-200">
                                ID: {student?.studentId}
                            </span>
                            <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 border border-gray-200">
                                Class: {student?.gradeLevel}
                            </span>
                            {student?.section && (
                                <span className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-600 border border-gray-200">
                                    Section: {student.section}
                                </span>
                            )}
                        </div>
                    </div>
                    <Link 
                        to={`/students/${student?._id}/report`} 
                        className="w-full md:w-auto bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-purple-200/50 transition-all text-center"
                    >
                        📄 View Full Report Card
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Subjects" value={grades.length} icon="📚" color="bg-blue-50 text-blue-600" />
                <StatCard label="Avg Score" value={avgScore ? `${avgScore}%` : "—"} icon="📊" color="bg-green-50 text-green-600" />
                <StatCard label="Reports" value={reports.length} icon="📋" color="bg-amber-50 text-amber-600" />
                <StatCard label="Status" value={student?.status || "Active"} icon="✅" color="bg-emerald-50 text-emerald-600" />
            </div>

            {/* Academic Grades */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span>📊</span> Academic Performance
                    </h3>
                </div>
                <div className="p-5">
                    {grades.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                                        <th className="pb-3 pr-4">Subject</th>
                                        <th className="pb-3 pr-4">Semester</th>
                                        <th className="pb-3 pr-4">Session</th>
                                        <th className="pb-3 text-right">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {grades.map((grade) => (
                                        <tr key={grade._id} className="hover:bg-purple-50/30 transition-colors">
                                            <td className="py-3 pr-4 font-bold text-gray-800">{grade.subject?.name || "—"}</td>
                                            <td className="py-3 pr-4 text-gray-600 text-sm">{grade.semester}</td>
                                            <td className="py-3 pr-4 text-gray-500 text-sm">{grade.academicYear}</td>
                                            <td className="py-3 text-right">
                                                <span className="inline-block bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg border border-green-100 text-sm">
                                                    {grade.finalScore ?? "—"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <span className="text-4xl block mb-3 opacity-50">📝</span>
                            <p className="font-medium">No academic grades recorded yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Behavioral Reports */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span>🧠</span> Behavioral Reports
                    </h3>
                </div>
                <div className="p-5">
                    {reports.length > 0 ? (
                        <div className="grid gap-4">
                            {reports.map(report => (
                                <div key={report._id} className="p-5 bg-amber-50/50 border border-amber-100 rounded-xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{report.semester}</h4>
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{report.academicYear}</span>
                                        </div>
                                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                                            Conduct: {report.conduct || "Good"}
                                        </span>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-amber-200">
                                        <p className="text-sm font-bold text-amber-800 mb-1 uppercase tracking-wider text-xs">Teacher's Comment</p>
                                        <p className="text-gray-700 text-sm">{report.teacherComment || "No remarks provided."}</p>
                                    </div>
                                    {report.evaluations?.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {report.evaluations.map((ev, i) => (
                                                <div key={i} className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs flex items-center gap-2">
                                                    <span className="text-gray-600 font-medium">{ev.area}</span>
                                                    <strong className={`px-1.5 py-0.5 rounded text-[10px] ${
                                                        ev.result === 'E' ? 'bg-green-100 text-green-700' :
                                                        ev.result === 'VG' ? 'bg-blue-100 text-blue-700' :
                                                        ev.result === 'G' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>{ev.result}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <span className="text-4xl block mb-3 opacity-50">🌱</span>
                            <p className="font-medium">No behavioral reports yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentDashboardPage;
