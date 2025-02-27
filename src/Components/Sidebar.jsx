import React from "react";
import { Link, useNavigate } from "react-router-dom";

const SideBar = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate(API);
  };

  const sidebarItems = [
    { to: "/admin/", label: "Dashboard" },
    { to: "/admin/student", label: "Students" },
    { to: "/admin/course", label: "Courses" },
    { to: "/admin/course-upload", label: "Upload Courses" },
    { to: "/admin/department", label: "Allocate" },
    { to: "/admin/professors", label: "Faculty" },
    { to: "/admin/logs", label: "Logs" },
    { to: "/admin/feedback", label: "Feedback" },
    { to: "/admin/archived-feedback", label: "Archived Feedback" },
  ];

  const commonClasses =
    "bg-[#3dafaa] p-2 h-16 hover:bg-[rgb(50,140,135)] focus:bg-[rgb(50,140,135)] text-white font-bold";

  return (
    <div className="bg-[#3dafaa] h-screen text-center max-w-[95%] mt-4">
      <nav className="flex flex-col" aria-label="Sidebar Navigation">
        {sidebarItems.map((item, index) => (
          <React.Fragment key={index}>
            <Link to={item.to} className={commonClasses}>
              {item.label}
            </Link>
            <hr className="border-t-2" />
          </React.Fragment>
        ))}
        <button className={commonClasses} onClick={handleLogout}>
          Logout
        </button>
        <hr className="border-t-2" />
      </nav>
    </div>
  );
};

export default SideBar;
