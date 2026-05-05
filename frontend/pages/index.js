import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('overview'); // overview, analysis, report
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Extracted Data
  const [billData, setBillData] = useState({
    consumer_name: '',
    consumer_number: '',
    billing_period: 'Dec 2025 - Jan 2026',
    units: 0,
    sanctioned_load: 1.0,
    tariff: '',
    amount: 0,
  });
  
  const [downloadUrl, setDownloadUrl] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Derived Solar Calculations
  const systemSize = Math.max(1, Math.ceil(billData.units / 120));
  const panels = systemSize * 2.5; // Roughly 400W panels
  const roofArea = systemSize * 100; // sq ft
  const estCost = systemSize * 55000; // ₹55k per kW
  const annualSavings = billData.amount * 11; // Approx 11 months of savings
  const payback = (estCost / annualSavings).toFixed(1);

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
          consumer_name: result.data.consumer_name || 'N/A',
          consumer_number: result.data.consumer_number || 'N/A',
          billing_period: 'Dec 2025 - Jan 2026',
          units: result.data.units || 0,
          sanctioned_load: 1.0,
          tariff: result.data.tariff || '90/LT I Res 1-Phase',
          amount: result.data.amount || 0,
        });
        setStep('analysis');
      } else {
        setError(result.detail || 'Failed to process bill');
      }
    } catch (err) {
      setError('Connection failed. Please ensure the backend is running.');
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

  const generateExcel = async () => {
    setLoading(true);
    try {
      const payload = { data: billData };
      const response = await fetch(`${API_URL}/generate-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        window.open(`${API_URL}${result.download_url}`, '_blank');
      } else {
        setError('Failed to generate report.');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Head>
        <title>SolarCloud | Energybae</title>
      </Head>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">☀️</div>
          <div className="logo-text">
            <h2>SolarCloud</h2>
            <p>by Energybae</p>
          </div>
        </div>

        <nav className="nav-section">
          <h3>Main Menu</h3>
          <div className={`nav-item ${step === 'overview' ? 'active' : ''}`} onClick={() => setStep('overview')}>
            <div className="nav-label">🏠 Overview</div>
            <div className="nav-badge">1</div>
          </div>
          <div className={`nav-item ${step === 'analysis' ? 'active' : ''}`} onClick={() => billData.units > 0 && setStep('analysis')}>
            <div className="nav-label">📊 Analysis</div>
            <div className="nav-badge">2</div>
          </div>
          <div className="nav-item">
            <div className="nav-label">📄 Report</div>
            <div className="nav-badge">3</div>
          </div>
        </nav>

        <nav className="nav-section">
          <h3>Settings</h3>
          <div className="nav-item">⚙️ Settings</div>
          <div className="nav-item">❓ Help</div>
        </nav>

        <div className="sidebar-footer">
          <div className="profile">
            <div className="profile-img">EB</div>
            <div className="profile-info">
              <h4>Energybae</h4>
              <p>Solar Consultant</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <div className="page-title">
            <h1>{step === 'overview' ? 'Upload Bill' : 'Bill Analysis'}</h1>
            <p>{step === 'overview' ? 'AI-powered extraction for MSEDCL, Adani & Tata Power' : 'Review extracted data and ROI projection'}</p>
          </div>
          <div className="top-actions">
            <div className="search-icon">🔍</div>
            <div className="notif-icon">🔔</div>
            <div className="pro-badge">✨ PRO</div>
          </div>
        </div>

        {step === 'overview' && (
          <div className="view-overview">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">2,400+</div>
                <div className="stat-label">Bills Processed</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">₹12L+</div>
                <div className="stat-label">Savings Generated</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">98%</div>
                <div className="stat-label">AI Accuracy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">&lt;3s</div>
                <div className="stat-label">Avg. Processing</div>
              </div>
            </div>

            <div className="upload-container">
              <div className="upload-icon-wrapper">📤</div>
              <h2>Upload Electricity Bill</h2>
              <p style={{color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem'}}>
                MSEDCL • Adani • Tata Power — any Indian utility bill (PDF or image)
              </p>

              <div className="upload-dropzone">
                <input type="file" onChange={handleFileUpload} accept=".pdf,image/*" />
                <div className="dz-content">
                  <div style={{fontSize: '2rem', marginBottom: '1rem'}}>📄</div>
                  <p>Drag & drop your bill here</p>
                  <small style={{color: '#94a3b8'}}>PDF, PNG, JPG • max 10 MB</small>
                </div>
              </div>

              {loading ? (
                <button className="btn-primary" disabled>
                  <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                    <span className="loader"></span> Analysing...
                  </span>
                </button>
              ) : (
                <button className="btn-primary" onClick={() => document.querySelector('input[type="file"]').click()}>
                  Browse Files
                </button>
              )}
              
              {error && <p style={{color: '#ef4444', marginTop: '1rem'}}>{error}</p>}
            </div>
          </div>
        )}

        {step === 'analysis' && (
          <div className="view-analysis">
            <div className="analysis-header-card">
              <div className="main-metrics">
                <div style={{fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem'}}>PERFORMANCE MONITORING</div>
                <h2 style={{fontSize: '1.5rem', marginBottom: '2rem'}}>Bill Analysis</h2>
                
                <div className="metrics-grid">
                  <div className="metric-item">
                    <h4>Units Consumed</h4>
                    <div className="value">{billData.units}</div>
                    <div className="sub">kWh/month</div>
                  </div>
                  <div className="metric-item">
                    <h4>Electricity Rate</h4>
                    <div className="value">{billData.tariff.match(/\d+/) ? billData.tariff.match(/\d+/)[0] : '7.5'}</div>
                    <div className="sub">₹/kWh</div>
                  </div>
                  <div className="metric-item">
                    <h4>Sanctioned Load</h4>
                    <div className="value">{billData.sanctioned_load}</div>
                    <div className="sub">kW</div>
                  </div>
                  <div className="metric-item">
                    <h4>Monthly Bill</h4>
                    <div className="value green">₹{billData.amount.toLocaleString()}</div>
                    <div className="sub">Current avg</div>
                  </div>
                  <div className="metric-item">
                    <h4>Billing Period</h4>
                    <div className="value" style={{fontSize: '1rem'}}>{billData.billing_period}</div>
                  </div>
                  <div className="metric-item">
                    <h4>Recommended Solar</h4>
                    <div className="value" style={{color: '#facc15'}}>{systemSize}</div>
                    <div className="sub">kW system</div>
                  </div>
                </div>
              </div>
              <div className="card-visual">
                <div style={{width: '60px', height: '60px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'}}>
                  📊
                </div>
              </div>
            </div>

            <div className="dashboard-layout">
              <div className="left-col">
                <div className="extracted-fields-card">
                  <div className="table-header">
                    <button onClick={() => setStep('overview')} style={{background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer'}}>← Back</button>
                    <h3 style={{fontSize: '1rem'}}>Extracted Fields</h3>
                  </div>

                  <div className="fields-list">
                    <div className="field-row">
                      <div className="field-label">Consumer Name</div>
                      <div className="field-input"><input value={billData.consumer_name} onChange={(e) => setBillData({...billData, consumer_name: e.target.value})} /></div>
                    </div>
                    <div className="field-row">
                      <div className="field-label">Consumer Number</div>
                      <div className="field-input"><input value={billData.consumer_number} onChange={(e) => setBillData({...billData, consumer_number: e.target.value})} /></div>
                    </div>
                    <div className="field-row">
                      <div className="field-label">Billing Period</div>
                      <div className="field-input"><input value={billData.billing_period} onChange={(e) => setBillData({...billData, billing_period: e.target.value})} /></div>
                    </div>
                    <div className="field-row">
                      <div className="field-label">Units Consumed (kWh)</div>
                      <div className="field-input"><input type="number" value={billData.units} onChange={(e) => setBillData({...billData, units: parseFloat(e.target.value) || 0})} /></div>
                    </div>
                    <div className="field-row">
                      <div className="field-label">Sanctioned Load (kW)</div>
                      <div className="field-input"><input type="number" value={billData.sanctioned_load} onChange={(e) => setBillData({...billData, sanctioned_load: parseFloat(e.target.value) || 0})} /></div>
                    </div>
                    <div className="field-row">
                      <div className="field-label">Tariff Category</div>
                      <div className="field-input"><input value={billData.tariff} onChange={(e) => setBillData({...billData, tariff: e.target.value})} /></div>
                    </div>
                    <div className="field-row">
                      <div className="field-label">Total Bill Amount (₹)</div>
                      <div className="field-input"><input type="number" value={billData.amount} onChange={(e) => setBillData({...billData, amount: parseFloat(e.target.value) || 0})} /></div>
                    </div>
                  </div>

                  <button className="btn-primary" style={{marginTop: '2rem', maxWidth: '100%'}} onClick={generateExcel}>
                    {loading ? 'Generating...' : 'Generate Solar Report'}
                  </button>
                </div>
              </div>

              <div className="right-col">
                <div className="roi-card">
                  <div className="roi-title">ROI Comparison</div>
                  <div className="roi-subtitle">Cumulative cost • Solar vs. No Solar • 3% annual escalation</div>
                  
                  <div className="chart-placeholder">
                    <div className="chart-bar-group">
                      <div className="bar no-solar" style={{height: '20%'}}></div>
                      <div className="bar with-solar" style={{height: '5%'}}></div>
                    </div>
                    <div className="chart-bar-group">
                      <div className="bar no-solar" style={{height: '50%'}}></div>
                      <div className="bar with-solar" style={{height: '10%'}}></div>
                    </div>
                    <div className="chart-bar-group">
                      <div className="bar no-solar" style={{height: '90%'}}></div>
                      <div className="bar with-solar" style={{height: '15%'}}></div>
                    </div>
                  </div>
                  <div className="chart-labels">
                    <span>5 Years</span>
                    <span>10 Years</span>
                    <span>20 Years</span>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item"><span className="dot" style={{background: '#facc15'}}></span> Without Solar</div>
                    <div className="legend-item"><span className="dot" style={{background: '#4ade80'}}></span> With Solar</div>
                  </div>
                </div>

                <div className="points-card">
                  <div className="roi-title" style={{marginBottom: '1rem'}}>Solar System Points</div>
                  <div className="point-item">
                    <div className="point-label">🟡 System Size</div>
                    <div className="point-value">{systemSize} kW</div>
                  </div>
                  <div className="point-item">
                    <div className="point-label">🟢 Solar Panels (400W)</div>
                    <div className="point-value">{panels}</div>
                  </div>
                  <div className="point-item">
                    <div className="point-label">🔵 Roof Area Required</div>
                    <div className="point-value">{roofArea} sq.ft</div>
                  </div>
                  <div className="point-item">
                    <div className="point-label">🟢 Est. System Cost</div>
                    <div className="point-value">₹{(estCost/100000).toFixed(1)}L</div>
                  </div>
                  <div className="point-item">
                    <div className="point-label">🟡 Annual Savings (Yr 1)</div>
                    <div className="point-value">₹{(annualSavings/1000).toFixed(0)}K</div>
                  </div>
                  <div className="point-item">
                    <div className="point-label">🔵 Payback Period</div>
                    <div className="point-value">{payback} yrs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
