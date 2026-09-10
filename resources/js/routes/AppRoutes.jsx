import React from 'react';
import { Navigate, Routes, Route } from "react-router-dom";
import MainLayout from '../layouts/MainLayout';

// Auth
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import CbtLogin from '../pages/auth/CbtLogin';
import Signup from '../pages/auth/Signup';
import ResetPassword from '../pages/auth/ResetPassword';
import AdminLogin from '../pages/auth/AdminLogin';

// Homepage & Public Pages
import Home from '../pages/public/home/Home';
import About from '../pages/public/about/About';
import AdmissionsPage from '../pages/public/admission/AdmissionsPage';
import NewsPage from '../pages/public/news/NewsPage';
import FeedbackPage from '../pages/public/feedback/FeedbackPage';
import Media from '../pages/public/media/Media';
import Contact from '../pages/public/contact/Contact';
import DigitalLibraryPage from '../pages/public/DigitalLibraryPage';
import ReportCardVerifyPage from '../pages/public/ReportCardVerifyPage';

// ── Student Dashboard ────────────────────────────────────────
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/student/dashboard/Dashboard';
import MyClassPage from '../pages/student/Classes/MyClassPage';
import HomeworkPage from '../pages/student/Homework/HomeworkPage';
import GradesPage from '../pages/student/Grades/GradesPage';
import StudentReportCardDetailsPage from '../pages/student/Grades/StudentReportCardDetailsPage';
import HomeworkDetail from '../pages/student/Homework/HomeworkDetail';
import Homework from '../pages/student/Homework/Homework';
import AttendancePage from '../pages/student/Attendance/AttendancePage';
import MessagesPage from '../pages/student/Messages/MessagesPage';
import ProfilePage from '../pages/student/Profile/ProfilePage';
import StudentFinancePage from '../pages/student/Finance/StudentFinancePage';
import StudentCbtPage from '../pages/student/Cbt/StudentCbtPage';
import StudentDisputePage from '../pages/student/Dispute/StudentDisputePage';
import StudentLibraryPage from '../pages/student/Library/StudentLibraryPage';
import CourseRegistrationPage from '../pages/student/Classes/CourseRegistrationPage';
import ParentInfoPage from '../pages/student/Profile/ParentInfoPage';
import WorkerPortalPage from '../pages/worker/WorkerPortalPage';

// ── Teacher Dashboard ────────────────────────────────────────
import TeacherLayout from '../layouts/TeacherLayout';
import TeacherDashboardPage from '../pages/teacher/TeacherDashboard/TeacherDashboardPage';
import TeacherMyClassesPage from '../pages/teacher/TeacherMyClasses/TeacherMyClassesPage';
import TeacherStudentsPage from '../pages/teacher/TeacherStudents/TeacherStudentsPage';
import TeacherAssignmentsPage from '../pages/teacher/TeacherAssignments/TeacherAssignmentsPage';
import TeacherGradebookPage from '../pages/teacher/TeacherGradebook/TeacherGradebookPage';
import TeacherAttendancePage from '../pages/teacher/TeacherAttendance/TeacherAttendancePage';
import TeacherMessagesPage from '../pages/teacher/TeacherMessages/TeacherMessagesPage';
import TeacherCalendarPage from '../pages/teacher/TeacherCalendar/TeacherCalendarPage';
import TeacherResourcesPage from '../pages/teacher/TeacherResources/TeacherResourcesPage';
import TeacherCreateStudentsPage from '../pages/teacher/TeacherCreateStudents/TeacherCreateStudentsPage';
import TeacherCbtPage from '../pages/teacher/TeacherCbt/TeacherCbtPage';
import TeacherDisputePage from '../pages/teacher/TeacherDispute/TeacherDisputePage';
import TeacherResultsPage from '../pages/teacher/TeacherResultsPage';

// ── Admin Dashboard ────────────────────────────────────────
import AdminLayout from '../layouts/AdminLayout';
import AdminDashboardPage from '../pages/Admin/dashboard/AdminDashboardPage';
import UserManagementPage from '../pages/Admin/dashboard/UserManagementPage';
import AdminLogsPage from '../pages/Admin/dashboard/AdminLogsPage';
import AcademicManagementPage from '../pages/Admin/dashboard/AcademicManagementPage';
import AdminProfilePage from '../pages/Admin/dashboard/AdminProfilePage';
import AdminFinancePage from '../pages/Admin/dashboard/AdminFinancePage';
import AdminMessagesPage from '../pages/Admin/dashboard/AdminMessagesPage';
import AdminDisputePage from '../pages/Admin/dashboard/AdminDisputePage';
import AdminSettingsPage from '../pages/Admin/dashboard/AdminSettingsPage';
import AdminNotificationsPage from '../pages/Admin/dashboard/AdminNotificationsPage';
import UserDetailPage from '../pages/Admin/dashboard/UserDetailPage';
import CbtResultApprovalPage from '../pages/Admin/dashboard/CbtResultApprovalPage';
import AdminAdmissionsPage from '../pages/Admin/dashboard/AdminAdmissionsPage';
import AdminInquiriesPage from '../pages/Admin/dashboard/AdminInquiriesPage';
import AdminMediaPage from '../pages/Admin/dashboard/AdminMediaPage';
import AdminReportCardsPage from '../pages/Admin/dashboard/AdminReportCardsPage';
import AdminReportCardSettingsPage from '../pages/Admin/dashboard/AdminReportCardSettingsPage';
import AdminTimetablePage from '../pages/Admin/dashboard/AdminTimetablePage';
import AdminPromotionPage from '../pages/Admin/dashboard/AdminPromotionPage';
import AdminFeedbackPage from '../pages/Admin/dashboard/AdminFeedbackPage';

// Shared & Catch all
import HealthInfoPage from '../pages/shared/HealthInfoPage';
import NotFound from '../pages/public/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path='/' element={<Home />} />
        <Route path='/about' element={<About />} />
        <Route path='/admissions' element={<AdmissionsPage />} />
        <Route path='/admission' element={<AdmissionsPage />} />
        <Route path='/apply' element={<AdmissionsPage />} />
        <Route path='/news' element={<NewsPage />} />
        <Route path='/feedback' element={<FeedbackPage />} />
        <Route path='/addfeedback' element={<FeedbackPage />} />
        <Route path='/media' element={<Media />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/library' element={<DigitalLibraryPage />} />
      </Route>

      {/* Public Parent Report Card Verification */}
      <Route path='/report-card/view/:token' element={<ReportCardVerifyPage />} />

      {/* Auth */}
      <Route path='/login' element={<Login />} />
      <Route path='/signup' element={<Signup />} />
      <Route path='/register' element={<Signup />} />
      <Route path='/auth/signup' element={<Signup />} />
      <Route path='/forgot-password' element={<ForgotPassword />} />
      <Route path='/reset-password' element={<ResetPassword />} />
      <Route path='/admin/login' element={<AdminLogin />} />
      <Route path='/cbt/login' element={<CbtLogin />} />
      <Route path='/cbt-login' element={<CbtLogin />} />

      {/* Student dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path='/student' element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path='dashboard' element={<Navigate to='/student' replace />} />
          <Route path='my-classes' element={<MyClassPage />} />
          <Route path='timetable' element={<MyClassPage />} />
          <Route path='course-registration' element={<CourseRegistrationPage />} />
          <Route path='grade' element={<GradesPage />} />
          <Route path='report-card' element={<GradesPage />} />
          <Route path='report-cards/:reportCardId' element={<StudentReportCardDetailsPage />} />
          <Route path='results' element={<GradesPage />} />
          <Route path='homework' element={<HomeworkPage />}>
            <Route index element={<Homework />} />
            <Route path='detail' element={<HomeworkDetail />} />
          </Route>
          <Route path='attendance' element={<AttendancePage />} />
          <Route path='message' element={<MessagesPage />} />
          <Route path='messages' element={<MessagesPage />} />
          <Route path='profile' element={<ProfilePage />} />
          <Route path='library' element={<StudentLibraryPage />} />
          <Route path='finance' element={<StudentFinancePage />} />
          <Route path='cbt' element={<StudentCbtPage />} />
          <Route path='dispute' element={<StudentDisputePage />} />
          <Route path='health' element={<HealthInfoPage />} />
          <Route path='parent-info' element={<ParentInfoPage />} />
        </Route>
      </Route>

      {/* Worker portal */}
      <Route element={<ProtectedRoute allowedRoles={['worker']} />}>
        <Route path='/worker' element={<WorkerPortalPage />} />
      </Route>

      {/* Teacher dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route path='/teacher' element={<TeacherLayout />}>
          <Route index element={<TeacherDashboardPage />} />
          <Route path='dashboard' element={<Navigate to='/teacher' replace />} />
          <Route path='my-classes' element={<TeacherMyClassesPage />} />
          <Route path='students' element={<TeacherStudentsPage />} />
          <Route path='assignments' element={<TeacherAssignmentsPage />} />
          <Route path='gradebook' element={<TeacherGradebookPage />} />
          <Route path='results' element={<TeacherResultsPage />} />
          <Route path='attendance' element={<TeacherAttendancePage />} />
          <Route path='messages' element={<TeacherMessagesPage />} />
          <Route path='calendar' element={<TeacherCalendarPage />} />
          <Route path='timetable' element={<TeacherCalendarPage />} />
          <Route path='resources' element={<TeacherResourcesPage />} />
          <Route path='create-students' element={<TeacherCreateStudentsPage />} />
          <Route path='cbt' element={<TeacherCbtPage />} />
          <Route path='profile' element={<ProfilePage />} />
          <Route path='dispute' element={<TeacherDisputePage />} />
          <Route path='health' element={<HealthInfoPage />} />
        </Route>
      </Route>
      
      {/* Admin Dashboard */}
      <Route element={<ProtectedRoute blockedRoles={['student', 'teacher']} />}>
        <Route path='/admin' element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path='dashboard' element={<Navigate to='/admin' replace />} />
          <Route path='profile' element={<AdminProfilePage />} />
          <Route path='users' element={<UserManagementPage />} />
          <Route path='student' element={<UserManagementPage defaultRole="student" />} />
          <Route path='worker' element={<UserManagementPage defaultRole="worker" />} />
          <Route path='logs' element={<AdminLogsPage />} />
          <Route path='academics' element={<AcademicManagementPage />} />
          <Route path='timetable' element={<AdminTimetablePage />} />
          <Route path='promotions' element={<AdminPromotionPage />} />
          <Route path='report-cards' element={<AdminReportCardsPage />} />
          <Route path='results' element={<AdminReportCardsPage />} />
          <Route path='results/:studentId/report-card' element={<AdminReportCardsPage />} />
          <Route path='report-card/settings' element={<AdminReportCardSettingsPage />} />
          <Route path='finance' element={<AdminFinancePage />} />
          <Route path='messages' element={<AdminMessagesPage />} />
          <Route path='cbt-results' element={<CbtResultApprovalPage />} />
          <Route path='inquiries' element={<AdminInquiriesPage />} />
          <Route path='feedback' element={<AdminFeedbackPage />} />
          <Route path='admissions' element={<AdminAdmissionsPage />} />
          <Route path='media' element={<AdminMediaPage />} />
          <Route path='notifications' element={<AdminNotificationsPage />} />
          <Route path='settings' element={<AdminSettingsPage />} />
          <Route path='dispute' element={<AdminDisputePage />} />
          <Route path='users/view/:role/:id' element={<UserDetailPage />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
