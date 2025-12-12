import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { processExcelFile } from './utils/dataProcessor';
import { LogOut } from 'lucide-react';

function App() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [appState, setAppState] = useState('upload'); // upload | dashboard

  const handleFileUpload = async (file) => {
    try {
      const result = await processExcelFile(file);
      setData(result.records);
      setSummary(result.summary);
      setAppState('dashboard');
    } catch (error) {
      console.error("Processing failed", error);
      alert("Error processing file. Please check the format.");
    }
  };

  const handleReset = () => {
    setData(null);
    setSummary(null);
    setAppState('upload');
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%' }}>
      {/* GLOBAL NAVBAR */}
      {appState === 'dashboard' && (
        <nav className="navbar">
          <div className="flex-center gap-2">
            <div className="logo-box">SC</div>
            <span style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>Analytics</span>
            <span className="nav-divider">Workforce Intelligence</span>
          </div>
          <div className="flex-center gap-4">
            <button onClick={handleReset} className="nav-btn">
              <LogOut size={16} /> New Upload
            </button>
          </div>
        </nav>
      )}

      {/* CONTENT AREA */}
      <main className="app-main">
        {appState === 'upload' && (
          <FileUpload onFileUpload={handleFileUpload} />
        )}

        {appState === 'dashboard' && data && (
          <Dashboard data={data} summary={summary} />
        )}
      </main>
    </div>
  );
}

export default App;
