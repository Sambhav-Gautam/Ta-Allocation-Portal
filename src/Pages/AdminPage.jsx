/* src/pages/AdminPage.jsx */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminNav from '../Components/AdminNavbar';
import SideBar from '../Components/Sidebar';
import AdminStudent from '../Components/AdminStudent';
import AdminCourse from '../Components/AdminCourse';
import Department from '../Components/AdminAllocate';
import CoursePage from '../Components/CoursePage';
import AdminDashboard from '../Components/AdminDashboard';
import AdminLog from '../Components/AdminLog';
import AdminProfessor from '../Components/AdminProfessor';
import AdminJms from '../Components/AdminJms';
import FeedbackList from '../Components/FeedbackList';
import ArchivedFeedback from '../Components/ArchivedFeedback';
import NominationsList from '../Components/NominationsList';

const AdminPage = () => {
  return (
    <div className="fixed w-full">
      <AdminNav />
      <div className="flex">
        <div className="w-44 transition-all duration-300">
          <SideBar />
        </div>
        <div className="flex-1">
          <Routes>
            <Route element={<AdminDashboard />} path="/" />
            <Route element={<AdminStudent />} path="/student" />
            <Route element={<AdminCourse />} path="/course" />
            <Route element={<Department />} path="/department" />
            <Route element={<CoursePage />} path="/department/:courseName" />
            <Route element={<AdminLog />} path="/logs" />
            <Route element={<AdminProfessor />} path="/professors" />
            <Route element={<AdminJms />} path="/jms" />
            <Route element={<FeedbackList />} path="/feedback" />
            <Route element={<ArchivedFeedback />} path="/archived-feedback" />
            {/* New: Admin-only TA nominations */}
            <Route element={<NominationsList />} path="/nominations" />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
