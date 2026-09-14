import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { io } from "socket.io-client";
import { useNotifications } from './context/NotificationContext';
import authService from './services/authService';
import studentAuthService from './services/studentAuthService';

// --- Layout / Route guards (tiny, eager) ---
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import ParentRoute from './components/ParentRoute';
import UniversalRoute from './components/UniversalRoute';

// --- Lazy-loaded pages (code-split per route for fast first load) ---

// 1. Public Pages (kept eager: HomePage is the landing route)
import HomePage from './pages/HomePage';
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ParentLoginPage = lazy(() => import('./pages/ParentLoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const TimetablePage = lazy(() => import('./pages/TimetablePage'));

// 2. Parent-Only Pages
const ParentDashboardPage = lazy(() => import('./pages/ParentDashboardPage'));
const ForceChangePasswordPage = lazy(() => import('./pages/ForceChangePasswordPage'));

// 3. Shared Logged-in Pages
const ReportCardPage = lazy(() => import('./pages/ReportCardPage'));

// 4. Staff-Only Pages
const StudentListPage = lazy(() => import('./pages/StudentListPage'));
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'));
const RosterPage = lazy(() => import('./pages/RosterPage'));
const SubjectRosterPage = lazy(() => import('./pages/SubjectRosterPage'));
const AssessmentTypesPage = lazy(() => import('./pages/AssessmentTypesPage'));
const AddReportPage = lazy(() => import('./pages/AddReportPage'));
const EditGradePage = lazy(() => import('./pages/EditGradePage'));
const EditReportPage = lazy(() => import('./pages/EditReportPage'));
const GradeSheetPage = lazy(() => import('./pages/GradeSheetPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// 5. Admin-Only Pages
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const UserEditPage = lazy(() => import('./pages/UserEditPage'));
const SubjectListPage = lazy(() => import('./pages/SubjectListPage'));
const AddSubjectPage = lazy(() => import('./pages/AddSubjectPage'));
const EditSubjectPage = lazy(() => import('./pages/EditSubjectPage'));
const AddStudentPage = lazy(() => import('./pages/AddStudentPage'));
const EditStudentPage = lazy(() => import('./pages/EditStudentPage'));
const ImportStudentsPage = lazy(() => import('./pages/ImportStudentsPage'));
const ImportUsersPage = lazy(() => import('./pages/ImportUsersPage'));
const ImportSubjectsPage = lazy(() => import('./pages/ImportSubjectsPage'));
const ClassManagementPage = lazy(() => import('./pages/ClassManagementPage'));
const CustomTestPage = lazy(() => import('./pages/CustomTestPage'));
const FoundationTestPage = lazy(() => import('./pages/FoundationTestPage'));

// Full-page loader for suspended route chunks
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
    <div className="w-12 h-12 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin"></div>
    <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
  </div>
);

const frontUrl = import.meta.env.VITE_BACKEND_URL;

function App() {
  const { addNotification } = useNotifications();
  const currentUser = authService.getCurrentUser();
  const currentStudent = studentAuthService.getCurrentStudent();

  useEffect(() => {
    let socket;
    if (currentUser?._id) {
      socket = io(frontUrl);
      socket.emit("addNewUser", currentUser._id);
    } else if (currentStudent?._id) {
      socket = io(frontUrl);
      socket.emit("addParentUser", currentStudent._id);
    }

    if (socket) {
      socket.on("getNotification", (data) => {
        if (data && data.message) {
          addNotification({ message: data.message, link: data.link, createdAt: new Date() });
        }
      });
    }
    return () => { if (socket) socket.disconnect(); };
  }, [currentUser, currentStudent, addNotification]);

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />
      <main className="container mx-auto p-4">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ======= 1. PUBLIC ROUTES ======== */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/parent-login" element={<ParentLoginPage />} />
            <Route path="/" element={<HomePage />} />
            <Route path="/timetable" element={<TimetablePage />} />

            {/* ===== 2. STAFF-ONLY ROUTES ====== */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/students" element={<StudentListPage />} />
              <Route path="/students/:id" element={<StudentDetailPage />} />
              <Route path="/grades/edit/:gradeId" element={<EditGradePage />} />
              <Route path="/reports/add/:studentId" element={<AddReportPage />} />
              <Route path="/reports/edit/:reportId" element={<EditReportPage />} />
              <Route path="/roster" element={<RosterPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/subject-roster" element={<SubjectRosterPage />} />
              <Route path="/manage-assessments" element={<AssessmentTypesPage />} />
              <Route path="/grade-sheet" element={<GradeSheetPage />} />
              <Route path="/custom-tests" element={<CustomTestPage />} />
              <Route path="/foundation-tests" element={<FoundationTestPage />} />

              {/* --- ADMIN-ONLY SUB-ROUTES --- */}
              <Route element={<AdminRoute />}>
                <Route path="/subjects" element={<SubjectListPage />} />
                <Route path="/subjects/add" element={<AddSubjectPage />} />
                <Route path="/subjects/edit/:id" element={<EditSubjectPage />} />
                <Route path="/subjects/import" element={<ImportSubjectsPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/students/add" element={<AddStudentPage />} />
                <Route path="/students/edit/:id" element={<EditStudentPage />} />
                <Route path="/students/import" element={<ImportStudentsPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
                <Route path="/admin/users/:id" element={<UserEditPage />} />
                <Route path="/admin/users/import" element={<ImportUsersPage />} />
                <Route path="/admin/classes" element={<ClassManagementPage />} />
              </Route>
            </Route>

            {/* ====== 3. PARENT ROUTES ========= */}
            <Route element={<ParentRoute />}>
              <Route path="/parent/dashboard" element={<ParentDashboardPage />} />
              <Route path="/parent/change-password" element={<ForceChangePasswordPage />} />
            </Route>

            {/* === 4. UNIVERSAL LOGGED-IN ROUTES === */}
            <Route element={<UniversalRoute />}>
              <Route path="/students/:id/report" element={<ReportCardPage />} />
            </Route>
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default App;
