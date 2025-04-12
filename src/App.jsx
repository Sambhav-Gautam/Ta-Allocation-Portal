import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminPage from './Pages/AdminPage';
import Department from './Pages/DepartmentPage';
import Professor from './Pages/ProfessorPage';
import StudentForm from './Pages/TAForm';
import StudentState from './context/StudentState';
import CourseState from './context/CourseState';
import DepartmentState from './context/DepartmentState';
import AuthState from './context/AuthState';
import ProfState from './context/ProfState';
import ProtectedRoute from './ProtectedRoutes';
import LoginPage from './Pages/LoginPageAdv';
import ForgotPassword from './Pages/ForgotPassword';
import CourseUpload from './Pages/CourseUpload'; // Import CourseUpload component

const App = () => {
  return (
    <AuthState>
      <ProfState>
        <StudentState>
          <CourseState>
            <DepartmentState>
              <Routes>
                <Route element={<LoginPage />} path="/" />
                <Route element={<ForgotPassword />} path="/forgotPassword" />
                <Route
                  element={
                    <ProtectedRoute
                      element={<StudentForm />}
                      allowedRoles={['TA']}
                    />
                  }
                  path="/TAForm"
                />
                <Route
                  element={
                    <ProtectedRoute
                      element={<AdminPage />}
                      allowedRoles={['admin']}
                    />
                  }
                  path="/admin/*"
                />
                {/* Add the new route for CourseUpload */}
                <Route
                  element={
                    <ProtectedRoute
                      element={<CourseUpload />}
                      allowedRoles={['admin']}
                    />
                  }
                  path="/admin/course-upload"
                />
                <Route
                  element={
                    <ProtectedRoute
                      element={<Department />}
                      allowedRoles={['jm', 'admin']}
                    />
                  }
                  path="/department/*"
                />
                <Route
                  element={
                    <ProtectedRoute
                      element={<Professor />}
                      allowedRoles={['professor', 'jm', 'admin']}
                    />
                  }
                  path="/professor/*"
                />
              </Routes>
            </DepartmentState>
          </CourseState>
        </StudentState>
      </ProfState>
    </AuthState>
  );
};

export default App;
