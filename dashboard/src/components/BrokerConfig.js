import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BrokerConfig = () => {
  const [configs, setConfigs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newHoliday, setNewHoliday] = useState("");
  const [newMarginSymbol, setNewMarginSymbol] = useState("");
  const [newMarginPercent, setNewMarginPercent] = useState("");

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await axios.get("http://localhost:3002/broker/configs", {
        withCredentials: true,
      });
      if (res.data.success) {
        setConfigs(res.data.configs);
      }
    } catch (err) {
      toast.error("Failed to fetch configs");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalChange = (key, newValue) => {
    setConfigs((prev) => ({ ...prev, [key]: newValue }));
  };

  const handleSave = async (key, newValue) => {
    if (key === "trading_hours") {
      if (newValue.start && newValue.end && newValue.start >= newValue.end) {
        toast.error("Market Close time must be after Market Open time");
        return;
      }
    }

    // Optimistic update
    setConfigs((prev) => ({ ...prev, [key]: newValue }));
    try {
      await axios.post(
        "http://localhost:3002/broker/configs",
        { key, value: newValue },
        { withCredentials: true },
      );
      toast.success("Configuration saved");
    } catch (err) {
      toast.error("Failed to save configuration");
    }
  };

  const addHoliday = () => {
    if (!newHoliday) return;
    const updatedHolidays = [...(configs?.holidays || []), newHoliday];
    handleSave("holidays", updatedHolidays);
    setNewHoliday("");
  };

  const removeHoliday = (date) => {
    const updatedHolidays = (configs?.holidays || []).filter((d) => d !== date);
    handleSave("holidays", updatedHolidays);
  };

  const addDynamicMargin = () => {
    if (!newMarginSymbol || !newMarginPercent) return;
    const updatedMargins = {
      ...(configs?.dynamic_margins || {}),
      [newMarginSymbol.toUpperCase()]: Number(newMarginPercent),
    };
    handleSave("dynamic_margins", updatedMargins);
    setNewMarginSymbol("");
    setNewMarginPercent("");
  };

  const removeDynamicMargin = (symbol) => {
    const updatedMargins = { ...(configs?.dynamic_margins || {}) };
    delete updatedMargins[symbol];
    handleSave("dynamic_margins", updatedMargins);
  };

  const handleResetDefaults = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all configurations to default values?",
      )
    ) {
      try {
        const res = await axios.post(
          "http://localhost:3002/broker/configs/reset",
          {},
          { withCredentials: true },
        );
        if (res.data.success) {
          toast.success(res.data.message);
          fetchConfigs();
        }
      } catch (err) {
        toast.error("Failed to reset configurations");
      }
    }
  };

  if (loading || !configs) return <div>Loading configurations...</div>;

  return (
    <div className="broker-config-container">

      <div className="admin-nav">
        <Link to="/admin" className="btn-nav">User Management</Link>
        <Link to="/admin/kyc" className="btn-nav">KYC Requests</Link>
        <Link to="/audit-logs" className="btn-nav">Audit Logs</Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 className="title" style={{ margin: 0 }}>
          Broker Configuration
        </h3>
        <button onClick={handleResetDefaults} className="btn-reset">
          Reset to Defaults
        </button>
      </div>

      <div className="config-grid">
        {/* Trading Hours */}
        <div className="config-card">
          <h4>Trading Hours</h4>
          <div className="field-group">
            <label>Market Open</label>
            <input
              type="time"
              value={configs?.trading_hours?.start || ""}
              onChange={(e) =>
                handleLocalChange("trading_hours", {
                  ...(configs?.trading_hours || {}),
                  start: e.target.value,
                })
              }
              onBlur={() => handleSave("trading_hours", configs.trading_hours)}
            />
          </div>
          <div className="field-group">
            <label>Market Close</label>
            <input
              type="time"
              value={configs?.trading_hours?.end || ""}
              onChange={(e) =>
                handleLocalChange("trading_hours", {
                  ...(configs?.trading_hours || {}),
                  end: e.target.value,
                })
              }
              onBlur={() => handleSave("trading_hours", configs.trading_hours)}
            />
          </div>
        </div>

        {/* Segments */}
        <div className="config-card">
          <h4>Segments</h4>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={configs?.segments?.equity || false}
                onChange={(e) =>
                  handleSave("segments", {
                    ...(configs?.segments || {}),
                    equity: e.target.checked,
                  })
                }
              />{" "}
              Equity
            </label>
            <label>
              <input
                type="checkbox"
                checked={configs?.segments?.fno || false}
                onChange={(e) =>
                  handleSave("segments", {
                    ...(configs?.segments || {}),
                    fno: e.target.checked,
                  })
                }
              />{" "}
              F&O
            </label>
            <label>
              <input
                type="checkbox"
                checked={configs?.segments?.commodity || false}
                onChange={(e) =>
                  handleSave("segments", {
                    ...(configs?.segments || {}),
                    commodity: e.target.checked,
                  })
                }
              />{" "}
              Commodity
            </label>
          </div>
        </div>

        {/* Brokerage Rules */}
        <div className="config-card">
          <h4>Brokerage (Intraday)</h4>
          <div className="field-group">
            <label>Flat Fee (₹)</label>
            <input
              type="number"
              value={configs?.brokerage_slabs?.amount || ""}
              onChange={(e) =>
                handleLocalChange("brokerage_slabs", {
                  ...(configs?.brokerage_slabs || {}),
                  amount: Number(e.target.value),
                })
              }
              onBlur={() =>
                handleSave("brokerage_slabs", configs.brokerage_slabs)
              }
            />
          </div>
          <div className="field-group">
            <label>Percentage (%)</label>
            <input
              type="number"
              step="0.01"
              value={configs?.brokerage_slabs?.percent || ""}
              onChange={(e) =>
                handleLocalChange("brokerage_slabs", {
                  ...(configs?.brokerage_slabs || {}),
                  percent: Number(e.target.value),
                })
              }
              onBlur={() =>
                handleSave("brokerage_slabs", configs.brokerage_slabs)
              }
            />
          </div>
        </div>

        {/* Risk Thresholds */}
        <div className="config-card">
          <h4>Risk Limits</h4>
          <div className="field-group">
            <label>Max Order Value (₹)</label>
            <input
              type="number"
              value={configs?.risk_thresholds?.maxOrderValue || ""}
              onChange={(e) =>
                handleLocalChange("risk_thresholds", {
                  ...(configs?.risk_thresholds || {}),
                  maxOrderValue: Number(e.target.value),
                })
              }
              onBlur={() =>
                handleSave("risk_thresholds", configs.risk_thresholds)
              }
            />
          </div>
          <div className="field-group">
            <label>Max Daily Loss (₹)</label>
            <input
              type="number"
              value={configs?.risk_thresholds?.maxDailyLoss || ""}
              onChange={(e) =>
                handleLocalChange("risk_thresholds", {
                  ...(configs?.risk_thresholds || {}),
                  maxDailyLoss: Number(e.target.value),
                })
              }
              onBlur={() =>
                handleSave("risk_thresholds", configs.risk_thresholds)
              }
            />
          </div>
        </div>

        {/* Holiday Calendar */}
        <div className="config-card">
          <h4>Holiday Calendar</h4>
          <div className="field-group" style={{ display: "flex", gap: "10px" }}>
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
            />
            <button onClick={addHoliday} className="btn-add">
              +
            </button>
          </div>
          <div className="list-container">
            {(configs?.holidays || []).map((date, i) => (
              <div key={i} className="list-item">
                <span>{date}</span>
                <button
                  onClick={() => removeHoliday(date)}
                  className="btn-remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Margins */}
        <div className="config-card">
          <h4>Dynamic Margins</h4>
          <div className="field-group" style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="Symbol (e.g. INFY)"
              value={newMarginSymbol}
              onChange={(e) => setNewMarginSymbol(e.target.value)}
              style={{ flex: 2 }}
            />
            <input
              type="number"
              placeholder="%"
              value={newMarginPercent}
              onChange={(e) => setNewMarginPercent(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={addDynamicMargin} className="btn-add">
              +
            </button>
          </div>
          <div className="list-container">
            {Object.entries(configs?.dynamic_margins || {}).map(
              ([symbol, percent]) => (
                <div key={symbol} className="list-item">
                  <span>
                    <strong>{symbol}</strong>: {percent}%
                  </span>
                  <button
                    onClick={() => removeDynamicMargin(symbol)}
                    className="btn-remove"
                  >
                    ×
                  </button>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      <style>{`
        .broker-config-container { padding: 20px; }
        .config-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .config-card { background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .config-card h4 { margin-top: 0; color: #444; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
        .field-group { margin-bottom: 15px; }
        .field-group label { display: block; font-size: 0.9rem; color: #666; margin-bottom: 5px; }
        .field-group input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .checkbox-group label { display: block; margin-bottom: 10px; cursor: pointer; }
        .checkbox-group input { margin-right: 10px; }
        .btn-add { background: #387ed1; color: white; border: none; border-radius: 4px; width: 40px; cursor: pointer; font-size: 1.2rem; }
        .btn-remove { background: #ff5252; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
        .btn-reset { background: #666; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; }
        .list-container { max-height: 150px; overflow-y: auto; margin-top: 10px; }
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f0f0f0; font-size: 0.9rem; }
        .admin-nav { margin-bottom: 20px; display: flex; gap: 10px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
        .btn-nav { text-decoration: none; color: #444; padding: 8px 16px; border-radius: 4px; background: #f5f5f5; border: 1px solid #ddd; font-size: 0.9rem; transition: all 0.2s; }
        .btn-nav:hover { background: #e0e0e0; color: #000; }
        
        body.dark-mode .config-card { background: #1e1e1e; border-color: #333; }
        body.dark-mode .config-card h4 { color: #e0e0e0; border-color: #333; }
        body.dark-mode .field-group label { color: #aaa; }
        body.dark-mode input { background: #2d2d2d; color: #fff; border-color: #444; }
        body.dark-mode .btn-nav { background: #2d2d2d; color: #e0e0e0; border-color: #444; }
        body.dark-mode .btn-nav:hover { background: #387ed1; color: #fff; }
      `}</style>
    </div>
  );
};

export default BrokerConfig;
