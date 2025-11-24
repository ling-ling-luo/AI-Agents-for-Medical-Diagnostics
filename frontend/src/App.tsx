import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CaseList } from './components/CaseList';
import { CaseDetail } from './components/CaseDetail';
import { CreateCaseForm } from './components/CreateCaseForm';
import { EditCase } from './components/EditCase';
import { DiagnosisHistory } from './components/DiagnosisHistory';
import { ImportWizard } from './components/ImportWizard';
import { VersionInfoExtractor } from './components/VersionInfoExtractor';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<CaseList />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          <Route path="/create" element={<CreateCaseForm />} />
          <Route path="/edit/:caseId" element={<EditCase />} />
          <Route path="/history/:caseId" element={<DiagnosisHistory />} />
          <Route path="/import" element={<ImportWizard />} />
          <Route path="/version-extractor" element={<VersionInfoExtractor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;