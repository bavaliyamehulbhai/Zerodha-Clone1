import React, { useState, useEffect } from "react";
import axios from "axios";

const Reports = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [taxReport, setTaxReport] = useState(null);

  useEffect(() => {
    fetchTaxReport();
  }, []);

  const fetchTaxReport = async () => {
    try {
      const res = await axios.get("http://localhost:3002/reports/tax-pnl", {
        withCredentials: true,
      });
      if (res.data.success) {
        setTaxReport(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch tax report");
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3002/reports/contract-note?date=${date}`,
        {
          withCredentials: true,
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `contract_note_${date}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      alert("No trades found for this date or error generating PDF");
    }
  };

  return (
    <div className="reports-container">
      <h3 className="title">Reports & Downloads</h3>

      <div className="report-card">
        <h4>Contract Note</h4>
        <p>Download the daily contract note for your trades.</p>
        <div className="controls">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="btn-primary" onClick={handleDownload}>
            Download PDF
          </button>
        </div>
      </div>

      <div className="report-card">
        <h4>Tax P&L (FY 2023-24)</h4>
        {taxReport ? (
          <div className="pnl-grid">
            <div className="pnl-item">
              <span>Realized P&L</span>
              <span className="val profit">
                ₹{taxReport.realizedPL.toLocaleString()}
              </span>
            </div>
            <div className="pnl-item">
              <span>Charges & Taxes</span>
              <span className="val loss">
                ₹{taxReport.totalCharges.toLocaleString()}
              </span>
            </div>
            <div className="pnl-item">
              <span>Net P&L</span>
              <span
                className={`val ${taxReport.netPL >= 0 ? "profit" : "loss"}`}
              >
                ₹{taxReport.netPL.toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      <style>{`
        .reports-container { padding: 20px; }
        .report-card {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          margin-bottom: 20px;
          border: 1px solid #eee;
        }
        .report-card h4 { margin-top: 0; color: #444; }
        .controls { display: flex; gap: 10px; margin-top: 15px; }
        .controls input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn-primary {
          background: #387ed1; color: white; border: none;
          padding: 8px 16px; border-radius: 4px; cursor: pointer;
        }
        .pnl-grid { display: flex; gap: 30px; margin-top: 15px; }
        .pnl-item { display: flex; flex-direction: column; }
        .pnl-item span { font-size: 0.9rem; color: #666; }
        .pnl-item .val { font-size: 1.2rem; font-weight: 500; margin-top: 5px; }
        .profit { color: #4caf50; }
        .loss { color: #d32f2f; }
        
        body.dark-mode .report-card {
          background: #1e1e1e;
          border-color: #333;
        }
        body.dark-mode .report-card h4 { color: #aaa; }
        body.dark-mode .pnl-item span { color: #aaa; }
        body.dark-mode input { background: #2d2d2d; color: #fff; border-color: #444; }
      `}</style>
    </div>
  );
};

export default Reports;
