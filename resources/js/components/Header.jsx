import { Mail, Star, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ GET USER FROM CONTEXT

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.includes("my-classes")) return "My Classes 📚";
    if (path.includes("homework")) return "Homework 📝";
    if (path.includes("grade")) return "My Report Card 📊";
    if (path.includes("attendance")) return "Attendance 📅";
    if (path.includes("message")) return "Messages ✉️";
    if (path.includes("library")) return "Library 📚";
    if (path.includes("profile")) return "My Profile 👤";
    return `Good ${getGreeting()}, ${user?.full_name?.split(" ")[0] || "Student"} ☀️`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  };

  const formatDate = () => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  };

  const goToMessages = () => {
    if (user?.role === 'teacher') navigate('/teacher/messages');
    else if (user?.role === 'student') navigate('/student/messages');
  };

  const goToProfile = () => {
    if (user?.role === 'teacher') navigate('/teacher/profile');
    else if (user?.role === 'student') navigate('/student/profile');
  };

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">

      {/* LEFT TITLE */}
      <div className="flex justify-between items-center w-full md:w-auto">
        <h2 className="text-xl md:text-2xl font-bold text-blue-600">
          {getHeaderTitle()}
        </h2>

        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-blue-600 bg-white shadow-sm rounded-lg hover:bg-gray-50"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto flex-nowrap hide-scrollbar">

        {/* DATE */}
        <span className="text-xs md:text-sm flex items-center whitespace-nowrap text-blue-600 bg-white p-2 px-3 rounded-full shadow-sm shrink-0">
          <Star className="h-4 w-4 text-blue-700 mr-2" />
          {formatDate()}
        </span>

        {/* MAIL */}
        <div className="shrink-0" onClick={goToMessages}>
          <Mail className="text-blue-700 h-9 w-9 md:h-10 md:w-10 p-1.5 bg-white rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition" />
        </div>

        {/* USER */}
        <div onClick={goToProfile} className="flex items-center gap-2 bg-white p-1 px-2 rounded-full shadow-sm shrink-0 cursor-pointer hover:shadow-md transition">

          <img
            src={user?.profile_picture || `https://ui-avatars.com/api/?name=${user?.full_name || "User"}&background=2563eb&color=fff`}
            alt="user"
            className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
          />

          <div className="hidden sm:block leading-tight pr-2">
            <p className="text-sm font-semibold">
              {user?.full_name || "Student"}
            </p>
            <p className="text-xs text-blue-500 font-bold">
              {user?.role === "teacher"
                ? (user?.institutional_role || "Teacher")
                : user?.role === "worker"
                ? (user?.institutional_role || "Worker")
                : user?.is_prefect
                ? (user?.prefect_title || "Prefect")
                : user?.student_id
                ? `ID: ${user.student_id}`
                : "Student"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}