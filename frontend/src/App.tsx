import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './components/HomePage';
import { CaseDetail } from './components/CaseDetail';
import { EditCaseWrapper } from './components/EditCaseWrapper';
import { DiagnosisHistory } from './components/DiagnosisHistory';
import { VersionInfoExtractor } from './components/VersionInfoExtractor';
import { Login } from './components/Login';
import { Register } from './components/Register';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="w-full min-h-screen">
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 受保护的路由 - 需要登录 */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/case/:caseId"
              element={
                <ProtectedRoute requiredPermission="case:read">
                  <CaseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit/:caseId"
              element={
                <ProtectedRoute requiredPermission="case:update">
                  <EditCaseWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history/:caseId"
              element={
                <ProtectedRoute requiredPermission="diagnosis:read">
                  <DiagnosisHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/version-extractor"
              element={
                <ProtectedRoute>
                  <VersionInfoExtractor />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;