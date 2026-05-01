import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const processBill = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_URL}/process-bill`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.detail || 'Failed to process bill');
      }
    } catch (err) {
      setError('Connection to server failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result && result.download_url) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      window.open(`${API_URL}${result.download_url}`, '_blank');
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Solar Load Automation | EnergyBae</title>
        <meta name="description" content="Extract bill data and calculate solar load automatically" />
      </Head>

      <div className="header">
        <h1>EnergyBae</h1>
        <p>Electricity Bill to Solar Load Excel Automation</p>
      </div>

      <div 
        className={`upload-area ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" onChange={handleFileChange} accept=".pdf,image/*" />
        <span className="upload-icon">{file ? '📄' : '📁'}</span>
        <p>
          {file ? file.name : "Drag & drop your bill or click to browse"}
        </p>
        <small style={{ color: 'var(--text-dim)', marginTop: '0.5rem', display: 'block' }}>
          Supports PDF, JPG, PNG
        </small>
      </div>

      <button 
        className="btn btn-primary" 
        onClick={processBill} 
        disabled={!file || loading}
      >
        {loading ? (
          <>
            <span className="loader"></span>
            Processing Bill...
          </>
        ) : (
          'Process Bill & Generate Excel'
        )}
      </button>

      {error && (
        <div style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center', fontWeight: '500' }}>
          {error}
        </div>
      )}

      {result && (
        <div className="results-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--secondary)' }}>
            ✓ Extraction Successful
          </h2>
          <div className="data-grid">
            <div className="data-item">
              <div className="data-label">Consumer</div>
              <div className="data-value">{result.data.consumer_name || 'N/A'}</div>
            </div>
            <div className="data-item">
              <div className="data-label">Bill Amount</div>
              <div className="data-value">₹ {result.data.amount || '0'}</div>
            </div>
            <div className="data-item">
              <div className="data-label">Units Consumed</div>
              <div className="data-value">{result.data.units || '0'} kWh</div>
            </div>
            <div className="data-item">
              <div className="data-label">Tariff Rate</div>
              <div className="data-value">₹ {result.data.tariff || 'N/A'}/kWh</div>
            </div>
          </div>

          <div className="download-section">
            <button className="btn btn-primary" onClick={handleDownload} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              Download Solar Load Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
