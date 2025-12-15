import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CaseList } from './components/CaseList';
import { CaseDetail } from './components/CaseDetail';
import { CreateCaseForm } from './components/CreateCaseForm';
import { ImportWizard } from './components/ImportWizard';
import { EditCaseWrapper } from './components/EditCaseWrapper';
import { DiagnosisHistory } from './components/DiagnosisHistory';
import { VersionInfoExtractor } from './components/VersionInfoExtractor';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { DataAnalysis } from './pages/DataAnalysis';
import { Settings } from './pages/Settings';
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
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/cases" element={<CaseList />} />
              <Route path="/cases/new" element={<CreateCaseForm />} />
              <Route path="/import" element={<ImportWizard />} />
              <Route path="/case/:caseId" element={<CaseDetail />} />
              <Route path="/edit/:caseId" element={<EditCaseWrapper />} />
              <Route path="/history/:caseId" element={<DiagnosisHistory />} />
              <Route path="/analysis" element={<DataAnalysis />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/version-extractor" element={<VersionInfoExtractor />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;