import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CaseList } from './components/CaseList';
import { CaseDetail } from './components/CaseDetail';
import { CreateCaseForm } from './components/CreateCaseForm';
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
          <Route path="/version-extractor" element={<VersionInfoExtractor />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;