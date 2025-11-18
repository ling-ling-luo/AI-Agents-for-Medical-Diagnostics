import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CaseList } from './components/CaseList';
import { CaseDetail } from './components/CaseDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Routes>
          <Route path="/" element={<CaseList />} />
          <Route path="/case/:caseId" element={<CaseDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;