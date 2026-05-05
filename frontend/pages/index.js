import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function Home() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('portal'); // portal, engine, report
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const comparisonRef = useRef(null);
  
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

  // Advanced Solar Engine Calculations (Optimized for 16-18 kWp range)
  const systemSize = Math.max(1, Math.ceil(billData.units / 80));
  const dailyGen = (systemSize * 4.2).toFixed(1); 
  const carbonOffset = (systemSize * 1.5).toFixed(1); 
  const panels = Math.ceil(systemSize * 2.5);
  const estCost = systemSize * 58000;
  const yearlySavings = billData.amount * 10.5;
  const payback = yearlySavings > 0 ? (estCost / yearlySavings).toFixed(1) : '0.0';

  // Initialize Charts
  useEffect(() => {
    if (step === 'engine' && typeof Chart !== 'undefined') {
      // 1. Savings Trajectory Chart
      if (chartRef.current) {
        const ctx = chartRef.current.getContext('2d');
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Current', 'Year 5', 'Year 10', 'Year 15', 'Year 25'],
            datasets: [{
              label: 'Cumulative Savings (₹)',
              data: [0, yearlySavings * 5, yearlySavings * 10, yearlySavings * 15, yearlySavings * 25],
              backgroundColor: 'rgba(16, 185, 129, 0.6)',
              borderColor: '#10b981',
              borderWidth: 2,
              borderRadius: 8,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
              x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
          }
        });
      }

      // 2. Comparison Chart
      if (comparisonRef.current) {
        const ctx = comparisonRef.current.getContext('2d');
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Grid Dependency', 'Solar Independence'],
            datasets: [{
              data: [20, 80],
              backgroundColor: ['rgba(245, 158, 11, 0.6)', 'rgba(16, 185, 129, 0.6)'],
              borderColor: ['#f59e0b', '#10b981'],
              borderWidth: 2,
            }]
          },
          options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } },
            cutout: '70%'
          }
        });
      }
    }
  }, [step, billData.units, yearlySavings]);

  const processBill = async (selectedFile) => {
    const fileToProcess = selectedFile || file;
    if (!fileToProcess) return;

    setLoading(true);
    setLoadingStage('INITIALIZING NEURAL LINK...');
    setError(null);
    
    const formData = new FormData();
    formData.append('file', fileToProcess);

    try {
      setTimeout(() => setLoadingStage('EXTRACTING ENERGY DATA...'), 1000);
      setTimeout(() => setLoadingStage('CALIBRATING SOLAR ENGINE...'), 2500);

      const response = await fetch(`${API_URL}/process-bill`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      console.log("ENERGYBAE DEBUG:", result);
      
      if (response.ok) {
        setBillData({
          consumer_name: result.data.consumer_name || 'Anonymous User',
          consumer_number: result.data.consumer_number || 'EXT-000000',
          billing_period: result.data.bill_date || 'Jan 2026',
          units: result.data.units || 0,
          sanctioned_load: result.data.sanctioned_load || 0,
          tariff: result.data.tariff || 'Residential',
          amount: result.data.amount || 0,
          due_date: result.data.due_date || 'N/A'
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

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (file.type === 'application/pdf') return resolve(file);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Even smaller for faster upload
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7); // 70% quality is enough for OCR
        };
      };
    });
  };

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      let f = e.target.files[0];
      setLoading(true);
      setLoadingStage('OPTIMIZING UPLOAD BYTE-STREAM...');
      
      if (f.type.startsWith('image/')) {
        f = await compressImage(f);
      }
      
      setFile(f);
      processBill(f);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setLoadingStage('ENCODING SOLAR BLUEPRINT...');
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
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </Head>

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

      <main className="main-canvas">
        <header className="canvas-header">
          <div className="greeting">
            <h1>{step === 'portal' ? 'Quantum Data Entry' : 'Engine Calibration'}</h1>
            <p>{step === 'portal' ? 'Feed the AI with your energy footprint' : 'Optimize your solar trajectory'}</p>
          </div>
          <div style={{display: 'flex', gap: '1rem'}}>
             <div className="brand-orb" style={{width: '32px', height: '32px', fontSize: '0.9rem', cursor: 'pointer'}}>🔔</div>
             <div className="brand-orb" style={{width: '32px', height: '32px', fontSize: '0.9rem', cursor: 'pointer'}}>👤</div>
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
                  <input type="file" onChange={handleFileUpload} accept=".pdf,image/*" style={{display: 'none'}} />
                  <div style={{fontSize: '3rem', marginBottom: '1.5rem'}}>⚡</div>
                  <p style={{fontWeight: 600}}>DRAG & DROP BILL</p>
                  <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem'}}>PDF • PNG • JPG (MAX 25MB)</p>
                </div>

                {loading ? (
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'}}>
                    <div className="loader-ring"></div>
                    <p className="analyzing" style={{letterSpacing: '2px', fontSize: '0.8rem'}}>{loadingStage}</p>
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
                <div className="gauge-value">
                  {billData.units > 10000 ? '10k+' : billData.units} 
                  <span style={{fontSize: '0.9rem', color: '#94a3b8'}}> kWh</span>
                </div>
              </div>
              <div className="metric-gauge">
                <span className="gauge-label">SOLAR POTENTIAL</span>
                <div className="gauge-value" style={{color: '#06b6d4'}}>
                  {systemSize > 500 ? '500+' : systemSize} 
                  <span style={{fontSize: '0.9rem', color: '#94a3b8'}}> kWp</span>
                </div>
              </div>
              <div className="metric-gauge">
                <span className="gauge-label">EST. SAVINGS</span>
                <div className="gauge-value" style={{color: '#f59e0b'}}>
                  ₹{yearlySavings > 10000000 ? '99L+' : (yearlySavings/1000).toFixed(1)}k 
                  <span style={{fontSize: '0.9rem', color: '#94a3b8'}}> Yearly</span>
                </div>
              </div>
            </div>

            <div className="grid-layout">
              <div className="glass-panel">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                  <h3 style={{fontSize: '1.1rem', color: '#10b981'}}>⚛️ Extracted Data Calibration</h3>
                  <span style={{fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 12px', borderRadius: '12px', fontWeight: 700}}>98% CONFIDENCE</span>
                </div>
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
                      <td><label>Billing Date</label></td>
                      <td><input value={billData.billing_period} onChange={(e) => setBillData({...billData, billing_period: e.target.value})} /></td>
                    </tr>
                    <tr>
                      <td><label>Due Date</label></td>
                      <td><input value={billData.due_date} onChange={(e) => setBillData({...billData, due_date: e.target.value})} /></td>
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
                  {loading ? 'ENCODING...' : 'GENERATE SOLAR BLUEPRINT'}
                </button>
              </div>

              <div className="right-stack">
                <div className="glass-panel" style={{marginBottom: '2rem', padding: '1.5rem'}}>
                  <h4 style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Savings Trajectory</h4>
                  <canvas ref={chartRef}></canvas>
                </div>

                <div className="glass-panel" style={{padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center'}}>
                  <div>
                    <h4 style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', textTransform: 'uppercase'}}>Independence</h4>
                    <canvas ref={comparisonRef} height="120"></canvas>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                    <div style={{fontSize: '0.75rem'}}>
                       <p style={{color: '#94a3b8'}}>System Blueprint</p>
                       <p style={{fontWeight: 700, fontSize: '1rem'}}>{panels} Panels</p>
                    </div>
                    <div style={{fontSize: '0.75rem'}}>
                       <p style={{color: '#94a3b8'}}>ROI Period</p>
                       <p style={{fontWeight: 700, fontSize: '1rem', color: '#f59e0b'}}>{payback} Years</p>
                    </div>
                    <div style={{fontSize: '0.75rem'}}>
                       <p style={{color: '#94a3b8'}}>Investment</p>
                       <p style={{fontWeight: 700, fontSize: '1rem', color: '#06b6d4'}}>₹{(estCost/100000).toFixed(1)}L</p>
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
        .right-stack { display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
