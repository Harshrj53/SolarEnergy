import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('upload'); // upload, processing, review, success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  
  // Editable Data State
  const [billData, setBillData] = useState({
    consumer_name: '',
    consumer_number: '',
    units: 0,
    amount: 0,
    tariff: 0,
  });
  
  const [confidence, setConfidence] = useState({});
  const [downloadUrl, setDownloadUrl] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processBill = async () => {
    if (!file) return;

    setStep('processing');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/process-bill`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setBillData({
          consumer_name: result.data.consumer_name || '',
          consumer_number: result.data.consumer_number || '',
          units: result.data.units || 0,
          amount: result.data.amount || 0,
          tariff: result.data.tariff || 0,
        });
        setConfidence(result.data.confidence || {});
        setStep('review');
      } else {
        setError(result.detail || 'Failed to process bill');
        setStep('upload');
      }
    } catch (err) {
      setError('Connection failed. Please ensure the backend is running.');
      setStep('upload');
    }
  };

  const generateExcel = async () => {
    setLoading(true);
    try {
      const payload = {
        data: billData,
        confidence: confidence
      };

      const response = await fetch(`${API_URL}/generate-excel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (response.ok) {
        setDownloadUrl(result.download_url);
        setStep('success');
      } else {
        setError('Failed to generate Excel file.');
      }
    } catch (err) {
      setError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (!score || score === 0) return '#94a3b8'; // Neutral
    if (score > 0.85) return '#10b981'; // Green
    if (score > 0.60) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const reset = () => {
    setFile(null);
    setStep('upload');
    setDownloadUrl(null);
    setBillData({ consumer_name: '', consumer_number: '', units: 0, amount: 0, tariff: 0 });
  };

  return (
    <div className="container">
      <Head>
        <title>EnergyBae | AI Solar Automation</title>
      </Head>

      <div className="header">
        <h1>EnergyBae</h1>
        <p>Production-Grade Solar Load Automation</p>
      </div>

      {step === 'upload' && (
        <div className="card-animation">
          <div 
            className={`upload-area ${dragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
          >
            <input type="file" onChange={handleFileChange} accept=".pdf,image/*" />
            <span className="upload-icon">{file ? '📄' : '☁️'}</span>
            <p>{file ? file.name : "Upload your electricity bill"}</p>
            <small>Supports PDF, JPG, PNG</small>
          </div>

          <button className="btn btn-primary" onClick={processBill} disabled={!file}>
            Process Bill with AI
          </button>
          
          {error && <p className="error-text">{error}</p>}
        </div>
      )}

      {step === 'processing' && (
        <div className="processing-state">
          <div className="loader-large"></div>
          <h2>Processing bill...</h2>
          <p>Our AI is extracting data and verifying patterns.</p>
        </div>
      )}

      {step === 'review' && (
        <div className="review-container">
          <div className="alert-info">
            🛡️ AI-extracted data. Please review and edit before generating Excel.
          </div>
          
          <div className="form-grid">
            <div className="input-group">
              <label>Consumer Name <span className="conf" style={{color: getConfidenceColor(confidence.consumer_name)}}>{(confidence.consumer_name * 100).toFixed(0)}%</span></label>
              <input 
                type="text" 
                value={billData.consumer_name} 
                onChange={(e) => setBillData({...billData, consumer_name: e.target.value})}
                placeholder="Enter consumer name"
              />
            </div>
            
            <div className="input-group">
              <label>Units Consumed (kWh) <span className="conf" style={{color: getConfidenceColor(confidence.units)}}>{(confidence.units * 100).toFixed(0)}%</span></label>
              <input 
                type="number" 
                value={billData.units} 
                onChange={(e) => setBillData({...billData, units: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div className="input-group">
              <label>Total Amount (₹) <span className="conf" style={{color: getConfidenceColor(confidence.amount)}}>{(confidence.amount * 100).toFixed(0)}%</span></label>
              <input 
                type="number" 
                value={billData.amount} 
                onChange={(e) => setBillData({...billData, amount: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div className="input-group">
              <label>Tariff Rate (₹/kWh) <span className="conf" style={{color: getConfidenceColor(confidence.tariff)}}>{(confidence.tariff * 100).toFixed(0)}%</span></label>
              <input 
                type="number" 
                value={billData.tariff} 
                onChange={(e) => setBillData({...billData, tariff: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="action-row">
            <button className="btn btn-secondary" onClick={reset}>Cancel</button>
            <button className="btn btn-primary" onClick={generateExcel} disabled={loading}>
              {loading ? <span className="loader"></span> : 'Generate Excel Report'}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="success-state">
          <span className="success-icon">✅</span>
          <h2>Report Ready!</h2>
          <p>Your solar load calculation has been generated based on your review.</p>
          <button className="btn btn-primary" onClick={() => window.open(`${API_URL}${downloadUrl}`, '_blank')}>
            Download Excel File
          </button>
          <button className="btn-text" onClick={reset}>Process another bill</button>
        </div>
      )}

      <style jsx>{`
        .card-animation { animation: fadeIn 0.4s ease-out; }
        .processing-state, .success-state { text-align: center; padding: 2rem; }
        .loader-large { width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
        .review-container { animation: slideUp 0.5s ease-out; }
        .alert-info { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 1rem; border-radius: 12px; margin-bottom: 2rem; font-size: 0.9rem; color: #93c5fd; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-size: 0.85rem; color: var(--text-dim); font-weight: 500; display: flex; justify-content: space-between; }
        .input-group input { background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); padding: 0.8rem; border-radius: 10px; color: white; font-size: 1rem; transition: border 0.2s; }
        .input-group input:focus { outline: none; border-color: var(--primary); }
        .conf { font-size: 0.75rem; font-weight: 700; }
        .action-row { display: flex; gap: 1rem; }
        .btn-secondary { background: rgba(255,255,255,0.05); color: white; border: 1px solid var(--glass-border); }
        .success-icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
        .btn-text { background: none; border: none; color: var(--text-dim); margin-top: 1rem; cursor: pointer; text-decoration: underline; }
        .error-text { color: #ef4444; margin-top: 1rem; font-size: 0.9rem; }
        
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
