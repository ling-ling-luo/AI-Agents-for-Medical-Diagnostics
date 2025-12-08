import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { CaseDetail } from './components/CaseDetail';
import { EditCase } from './components/EditCase';
import { DiagnosisHistory } from './components/DiagnosisHistory';
import { VersionInfoExtractor } from './components/VersionInfoExtractor';
import './App.css';

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
          <Route path="/edit/:caseId" element={<EditCase />} />
          <Route path="/history/:caseId" element={<DiagnosisHistory />} />
          <Route path="/version-extractor" element={<VersionInfoExtractor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;