import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('portal'); // portal, engine, report
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [billData, setBillData] = useState({
    consumer_name: '',
    consumer_number: '',
    billing_period: 'Q1 2026',
    units: 0,
    sanctioned_load: 1.0,
    tariff: '',
    amount: 0,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Advanced Solar Engine Calculations
  const systemSize = Math.max(1, Math.ceil(billData.units / 125));
  const dailyGen = (systemSize * 4.2).toFixed(1); // Avg units per day
  const carbonOffset = (systemSize * 1.5).toFixed(1); // Tons per year
  const panels = Math.ceil(systemSize * 2.5);
  const estCost = systemSize * 58000;
  const yearlySavings = billData.amount * 10.5;

  const processBill = async (selectedFile) => {
    const fileToProcess = selectedFile || file;
    if (!fileToProcess) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', fileToProcess);

    try {
      const response = await fetch(`${API_URL}/process-bill`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (response.ok) {
        setBillData({
          consumer_name: result.data.consumer_name || 'Anonymous User',
          consumer_number: result.data.consumer_number || 'EXT-000000',
          billing_period: 'Jan 2026',
          units: result.data.units || 0,
          sanctioned_load: 1.0,
          tariff: result.data.tariff || 'Residential',
          amount: result.data.amount || 0,
        });
        setStep('engine');
      } else {
        setError(result.detail || 'Neural link failed.');
      }
    } catch (err) {
      setError('Connection to EnergyBae Neural Network lost.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      processBill(f);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: billData }),
      });
      const result = await response.json();
      if (response.ok) {
        window.open(`${API_URL}${result.download_url}`, '_blank');
      }
    } catch (err) {
      setError('Report generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <Head>
        <title>EnergyBae | Next-Gen Solar Intelligence</title>
      </Head>

      {/* Futuristic Sidebar */}
      <aside className="energy-sidebar">
        <div className="brand">
          <div className="brand-orb">⚡</div>
          <div className="brand-name">EnergyBae</div>
        </div>

        <div className="menu-group">
          <div className="menu-label">Intelligence</div>
          <div className={`menu-item ${step === 'portal' ? 'active' : ''}`} onClick={() => setStep('portal')}>
            <span>💠</span> Data Portal
          </div>
          <div className={`menu-item ${step === 'engine' ? 'active' : ''}`} onClick={() => billData.units > 0 && setStep('engine')}>
            <span>⚛️</span> Solar Engine
          </div>
          <div className="menu-item">
            <span>📊</span> Analytics
          </div>
        </div>

        <div className="menu-group">
          <div className="menu-label">System</div>
          <div className="menu-item"><span>⚙️</span> Core Config</div>
          <div className="menu-item"><span>🛡️</span> Security</div>
        </div>

        <div style={{marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '20px'}}>
          <div style={{fontSize: '0.8rem', color: '#10b981', fontWeight: 700}}>SYSTEM ONLINE</div>
          <div style={{fontSize: '0.7rem', color: '#94a3b8'}}>Neural Link: Active</div>
        </div>
      </aside>

      {/* Main Canvas */}
      <main className="main-canvas">
        <header className="canvas-header">
          <div className="greeting">
            <h1>{step === 'portal' ? 'Quantum Data Entry' : 'Engine Calibration'}</h1>
            <p>{step === 'portal' ? 'Feed the AI with your energy footprint' : 'Optimize your solar trajectory'}</p>
          </div>
          <div style={{display: 'flex', gap: '1rem'}}>
             <div className="brand-orb" style={{width: '32px', height: '32px', fontSize: '0.9rem'}}>🔔</div>
             <div className="brand-orb" style={{width: '32px', height: '32px', fontSize: '0.9rem'}}>👤</div>
          </div>
        </header>

        {step === 'portal' && (
          <div className="upload-portal">
            <div className="portal-card">
              <div style={{position: 'relative', zIndex: 1}}>
                <div className="brand-orb" style={{width: '80px', height: '80px', fontSize: '2rem', margin: '0 auto 2rem'}}>📥</div>
                <h2>Initialize Data Upload</h2>
                <p style={{color: '#94a3b8', marginTop: '1rem'}}>Securely process your electricity bills via our Neural Engine</p>

                <div className="drop-zone" onClick={() => document.querySelector('input[type="file"]').click()}>
                  <input type="file" onChange={handleFileUpload} accept=".pdf,image/*" />
                  <div style={{fontSize: '3rem', marginBottom: '1.5rem'}}>⚡</div>
                  <p style={{fontWeight: 600}}>DRAG & DROP BILL</p>
                  <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem'}}>PDF • PNG • JPG (MAX 25MB)</p>
                </div>

                {loading ? (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
                    <div className="loader-ring"></div>
                    <p className="analyzing">CALIBRATING NEURAL LINK...</p>
                  </div>
                ) : (
                  <button className="btn-neon" onClick={() => document.querySelector('input[type="file"]').click()}>
                    BROWSE LOCAL STORAGE
                  </button>
                )}

                {error && <p style={{color: '#ef4444', marginTop: '2rem', fontSize: '0.9rem'}}>⚠️ {error}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 'engine' && (
          <div className="view-engine animate-fade">
            <div className="metrics-row">
              <div className="metric-gauge">
                <span className="gauge-label">ENERGY LOAD</span>
                <div className="gauge-value">{billData.units} <span style={{fontSize: '0.9rem', color: '#94a3b8'}}>kWh</span></div>
              </div>
              <div className="metric-gauge">
                <span className="gauge-label">SOLAR POTENTIAL</span>
                <div className="gauge-value" style={{color: '#06b6d4'}}>{systemSize} <span style={{fontSize: '0.9rem', color: '#94a3b8'}}>kWp</span></div>
              </div>
              <div className="metric-gauge">
                <span className="gauge-label">EST. SAVINGS</span>
                <div className="gauge-value" style={{color: '#f59e0b'}}>₹{(yearlySavings/1000).toFixed(1)}k <span style={{fontSize: '0.9rem', color: '#94a3b8'}}>Yearly</span></div>
              </div>
            </div>

            <div className="grid-layout">
              <div className="glass-panel">
                <h3 style={{marginBottom: '2rem', fontSize: '1.1rem', color: '#10b981'}}>⚛️ Extracted Data Calibration</h3>
                <table className="data-table">
                  <tbody>
                    <tr>
                      <td><label>Consumer Name</label></td>
                      <td><input value={billData.consumer_name} onChange={(e) => setBillData({...billData, consumer_name: e.target.value})} /></td>
                    </tr>
                    <tr>
                      <td><label>Identifier</label></td>
                      <td><input value={billData.consumer_number} onChange={(e) => setBillData({...billData, consumer_number: e.target.value})} /></td>
                    </tr>
                    <tr>
                      <td><label>Energy Units (kWh)</label></td>
                      <td><input type="number" value={billData.units} onChange={(e) => setBillData({...billData, units: parseFloat(e.target.value) || 0})} /></td>
                    </tr>
                    <tr>
                      <td><label>Sanctioned Load</label></td>
                      <td><input type="number" value={billData.sanctioned_load} onChange={(e) => setBillData({...billData, sanctioned_load: parseFloat(e.target.value) || 0})} /></td>
                    </tr>
                    <tr>
                      <td><label>Tariff Class</label></td>
                      <td><input value={billData.tariff} onChange={(e) => setBillData({...billData, tariff: e.target.value})} /></td>
                    </tr>
                    <tr>
                      <td><label>Bill Amount (₹)</label></td>
                      <td><input type="number" value={billData.amount} onChange={(e) => setBillData({...billData, amount: parseFloat(e.target.value) || 0})} /></td>
                    </tr>
                  </tbody>
                </table>
                <button className="btn-neon" style={{marginTop: '2.5rem', width: '100%'}} onClick={generateReport}>
                  {loading ? 'GENERATING BYTES...' : 'GENERATE SOLAR BLUEPRINT'}
                </button>
              </div>

              <div className="right-stack">
                <div className="glass-panel" style={{marginBottom: '2rem', padding: '1.5rem'}}>
                  <h4 style={{fontSize: '0.9rem', marginBottom: '1.5rem'}}>SAVINGS TRAJECTORY</h4>
                  <div className="chart-container">
                    <div className="chart-bar" style={{height: '30%'}} data-label="Current"></div>
                    <div className="chart-bar" style={{height: '65%'}} data-label="Year 5"></div>
                    <div className="chart-bar" style={{height: '95%'}} data-label="Year 10"></div>
                  </div>
                </div>

                <div className="glass-panel" style={{padding: '1.5rem'}}>
                  <h4 style={{fontSize: '0.9rem', marginBottom: '1.5rem'}}>SYSTEM BLUEPRINT</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                      <span style={{color: '#94a3b8'}}>Panel Count (400W)</span>
                      <span style={{fontWeight: 700}}>{panels} Units</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                      <span style={{color: '#94a3b8'}}>Daily Generation</span>
                      <span style={{fontWeight: 700, color: '#10b981'}}>{dailyGen} kWh</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                      <span style={{color: '#94a3b8'}}>Carbon Offset</span>
                      <span style={{fontWeight: 700, color: '#06b6d4'}}>{carbonOffset} Tons</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                      <span style={{color: '#94a3b8'}}>Est. Investment</span>
                      <span style={{fontWeight: 700}}>₹{(estCost/100000).toFixed(1)}L</span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
                      <span style={{color: '#94a3b8'}}>Payback Matrix</span>
                      <span style={{fontWeight: 700, color: '#f59e0b'}}>{payback} Years</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        .animate-fade { animation: slideUp 0.5s ease-out; }
      `}</style>
    </div>
  );
}
