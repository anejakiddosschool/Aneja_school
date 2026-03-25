

// src/pages/HomePage.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import userService from "../services/userService";
import authService from "../services/authService";
import studentAuthService from "../services/studentAuthService";
import dashboardService from "../services/dashboardService";
import studentService from "../services/studentService";

// --- Reusable UI Components ---

// 🎓 Stat Card (Modernized)
const StatCard = ({ title, value, icon, colorClass = "from-pink-500 to-rose-400" }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow duration-300">
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-tr ${colorClass} flex items-center justify-center text-white text-2xl shadow-sm`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-gray-800 mt-1">{value}</p>
    </div>
  </div>
);

// 🚀 Action Card (Modernized)
const ActionCard = ({ to, title, description, state = {}, icon = "→" }) => (
  <Link
    to={to}
    state={state}
    className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-pink-200 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
  >
    <div className="absolute -right-6 -top-6 w-24 h-24 bg-pink-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
    <div className="relative z-10 flex-grow">
      <h3 className="font-extrabold text-lg text-gray-800 group-hover:text-pink-600 transition-colors">{title}</h3>
      <p className="text-gray-500 text-sm mt-2 leading-relaxed">{description}</p>
    </div>
    <div className="mt-6 flex items-center text-sm font-bold text-pink-600 group-hover:text-pink-700 relative z-10">
      Access Portal <span className="ml-2 group-hover:translate-x-1 transition-transform">{icon}</span>
    </div>
  </Link>
);

const HomePage = () => {
  // --- State Management ---
  const [currentUser] = useState(authService.getCurrentUser());
  const [currentStudent] = useState(studentAuthService.getCurrentStudent());
  const [profileData, setProfileData] = useState(null); 
  const [studentData, setStudentData] = useState(null); 
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Data Fetching ---
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        if (currentUser) {
          const profileRes = await userService.getProfile();
          setProfileData(profileRes.data);
          if (profileRes.data.role === "admin") {
            const statsRes = await dashboardService.getStats();
            setStats(statsRes.data);
          }
        } else if (currentStudent) {
          const studentRes = await studentService.getStudentById(currentStudent._id);
          setStudentData(studentRes.data.data);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [currentUser, currentStudent]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading Dashboard Space...</p>
      </div>
    );
  }

  // --- 1. Admin Dashboard View ---
  if (profileData?.role === "admin") {
    return (
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 animate-fade-in">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-100 to-transparent rounded-bl-full opacity-50"></div>
          <div className="relative z-10">
            <span className="text-pink-600 font-bold tracking-wider uppercase text-sm mb-2 block">Administrator Panel</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
               Welcome back, {currentUser.fullName}
            </h2>
          </div>
          <div className="relative z-10">
            <Link to="/profile" className="inline-flex items-center gap-2 bg-gray-50 hover:bg-pink-50 text-gray-700 hover:text-pink-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-gray-200">
              <span>⚙️</span> Account Settings
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Active Students" value={stats?.students ?? "..."} icon="👨‍🎓" colorClass="from-blue-500 to-cyan-400" />
          <StatCard title="Teachers/Staff" value={stats?.teachers ?? "..."} icon="👩‍🏫" colorClass="from-purple-500 to-fuchsia-400" />
          <StatCard title="Total Subjects" value={stats?.subjects ?? "..."} icon="📚" colorClass="from-pink-500 to-rose-400" />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
            <span>⚡</span> Quick Launch
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <ActionCard to="/admin/users" title="User Management" description="Add, view, and assign roles or subjects to all staff members." />
            <ActionCard to="/subjects" title="Subject Setup" description="Define and manage the subjects offered for each grade level." />
            <ActionCard to="/manage-assessments" title="Assessments" description="Configure the grading structure and academic terms." />
            <ActionCard to="/students/import" title="Bulk Import" description="Quickly enroll a full class of students using an Excel sheet." icon="📥" />
          </div>
        </div>
      </div>
    );
  }

  // --- 2. Teacher Dashboard View ---
  if (profileData?.role === "teacher") {
    return (
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-10 animate-fade-in">
        
        {/* Welcome Header */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-50"></div>
          <div className="relative z-10">
             <span className="text-purple-600 font-bold tracking-wider uppercase text-sm mb-2 block">Teacher Workspace</span>
             <h2 className="text-3xl md:text-4xl font-black text-gray-900">
               Hello, {profileData.fullName}
             </h2>
             <p className="text-gray-500 mt-2 font-medium">Manage your classes, grades, and student rosters.</p>
          </div>
          <div className="relative z-10">
            <Link to="/profile" className="inline-flex items-center gap-2 bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-gray-200">
              <span>⚙️</span> Edit Profile
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-gray-800 mb-6 flex items-center gap-2">
            <span>📚</span> My Classes & Duties
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profileData.homeroomGrade && (
              <ActionCard
                to="/students"
                title={`Homeroom: Grade ${profileData.homeroomGrade}`}
                description="Manage and generate the comprehensive yearly roster for your primary class."
              />
            )}
            {profileData.subjectsTaught?.map((assignment) =>
                assignment.subject && (
                  <ActionCard
                    key={assignment.subject._id}
                    to="/subject-roster"
                    title={assignment.subject.name}
                    description={`Manage grades and mark lists for ${assignment.subject.gradeLevel}.`}
                    state={{ subjectId: assignment.subject._id }}
                  />
                )
            )}
          </div>

          {profileData.subjectsTaught?.length === 0 && !profileData.homeroomGrade && (
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl text-center">
               <span className="text-3xl block mb-2">🚧</span>
               <h4 className="text-lg font-bold text-orange-800">No Classes Assigned</h4>
               <p className="text-orange-600 mt-1">You have not been assigned any homeroom or subjects yet. Please contact the administrator.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 3. Parent Dashboard View ---
  if (studentData) {
    return (
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white text-3xl font-bold shadow-md z-10">
             {studentData.fullName.charAt(0)}
          </div>
          <div className="text-center md:text-left z-10">
             <span className="text-pink-600 font-bold tracking-wider uppercase text-xs mb-1 block">Parent Portal</span>
             <h2 className="text-3xl font-black text-gray-900">{studentData.fullName}</h2>
             <p className="text-gray-500 mt-1 font-medium">View academic progress and official school records.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-gradient-to-b from-gray-50 to-gray-100 p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Student Profile</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-gray-500">Student ID</p>
                <p className="text-lg font-bold text-gray-900">{studentData.studentId}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500">Current Grade</p>
                <p className="text-lg font-bold text-gray-900">{studentData.gradeLevel}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500">Enrollment Status</p>
                <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {studentData.status || "Active"}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <ActionCard
              to={`/students/${studentData._id}/report`}
              title="Official Report Card"
              description="View, download, and print the complete academic report card for the current year. Includes all subject grades and behavioral assessments."
              icon="📄"
            />
          </div>
        </div>
      </div>
    );
  }

  // --- 4. Visitor View (Demo Portal / Landing Page) ---
  return (
    <div className="min-h-screen bg-gray-50 selection:bg-pink-200 selection:text-pink-900">
      
      {/* 🌟 Modern Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-gray-200">
        {/* Decorative Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>

        <div className="max-w-[1200px] mx-auto px-4 py-24 sm:py-32 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-100 text-pink-600 text-sm font-bold mb-8 shadow-sm">
            <span>✨</span> Next-Gen School Management
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
            Welcome to <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">Aneja Kiddos School</span>
          </h1>
          <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-gray-500 font-medium leading-relaxed">
            A secure, seamless, and colorful platform designed to bring administration, teachers, and parents together in one place.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={() => navigate("/login", { state: { username: "", password: "" } })}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Staff Portal Login
            </button>
            <button
              onClick={() => navigate("/parent-login")}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold py-4 px-8 rounded-xl shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
            >
              Parent Portal Login
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 Features Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Why choose our platform?</h2>
            <p className="text-gray-500 mt-4 font-medium">Everything you need to run your institution efficiently.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">📊</div>
              <h4 className="font-extrabold text-xl mb-3 text-gray-900">Smart Reporting</h4>
              <p className="text-gray-500 leading-relaxed font-medium">
                Generate beautiful, printable report cards, automated timetables, and detailed class rosters instantly.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">💬</div>
              <h4 className="font-extrabold text-xl mb-3 text-gray-900">WhatsApp Integration</h4>
              <p className="text-gray-500 leading-relaxed font-medium">
                Send report cards, test results, and important reminders directly to parents' WhatsApp automatically.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">🔐</div>
              <h4 className="font-extrabold text-xl mb-3 text-gray-900">Role-Based Security</h4>
              <p className="text-gray-500 leading-relaxed font-medium">
                A highly secure system ensuring distinct, restricted access for Admins, Teachers, and Parents.
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;
