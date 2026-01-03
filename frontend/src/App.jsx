import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import TestForm from './components/TestForm';
import ReportList from './components/ReportList';
import ReportDetail from './components/ReportDetail';
import BaselineManager from './components/BaselineManager';

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Pixel Guard</h1>
        <p className="text-gray-600">Snap. Compare. Assure.</p>
      </header>

      <TestForm onTestComplete={() => setRefreshKey(k => k + 1)} />

      <div key={refreshKey}>
        <ReportList />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 pb-20">
        <nav className="bg-white shadow-sm px-6 py-4 mb-2">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link to="/" className="font-bold text-xl text-blue-600">Pixel<span className="text-gray-800">GUARD</span></Link>
            <div className="flex gap-4">
              <Link to="/baselines" className="text-gray-600 hover:text-blue-600 font-medium transition text-sm flex items-center gap-1">
                Baseline Manager
              </Link>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report/:id" element={<ReportDetail />} />
          <Route path="/baselines" element={<BaselineManager />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
