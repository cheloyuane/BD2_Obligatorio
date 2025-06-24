import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginVotante from './components/auth/LoginVotante';
import LoginPresidente from './components/auth/LoginPresidente';
import Votar from './components/votacion/Votar';
import AdminPanel from './components/admin/AdminPanel';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginVotante />} />
          <Route path="/login-presidente" element={<LoginPresidente />} />
          <Route path="/votar" element={<Votar />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
