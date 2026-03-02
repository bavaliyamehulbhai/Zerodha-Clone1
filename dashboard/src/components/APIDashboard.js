import React, { useState, useEffect } from "react";
import axios from "axios";

const APIDashboard = () => {
  const [keys, setKeys] = useState([]);
  const [usage, setUsage] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    fetchKeys();
    fetchUsage();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await axios.get("http://localhost:3002/api/keys", {
        withCredentials: true,
      });
      if (res.data.success) setKeys(res.data.keys);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsage = async () => {
    try {
      const res = await axios.get("http://localhost:3002/api/analytics", {
        withCredentials: true,
      });
      if (res.data.success) setUsage(res.data.usage);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateKey = async () => {
    try {
      await axios.post(
        "http://localhost:3002/api/keys/create",
        { name: newKeyName },
        { withCredentials: true },
      );
      setNewKeyName("");
      fetchKeys();
    } catch (err) {
      alert("Failed to create key");
    }
  };

  const toggleKeyStatus = async (keyId, currentStatus) => {
    try {
      await axios.put(
        "http://localhost:3002/api/keys/update",
        { keyId, isActive: !currentStatus },
        { withCredentials: true },
      );
      fetchKeys();
    } catch (err) {
      alert("Failed to update key");
    }
  };

  return (
    <div className="api-dashboard">
      <h3 className="title">API Management</h3>

      <div className="section">
        <h4>Your API Keys</h4>
        <div className="create-key">
          <input
            type="text"
            placeholder="Key Name (e.g. Trading Bot)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
          <button className="btn-primary" onClick={handleCreateKey}>
            Generate Key
          </button>
        </div>

        <div className="keys-list">
          {keys.map((key) => (
            <div key={key._id} className="key-card">
              <div className="key-header">
                <strong>{key.name}</strong>
                <span
                  className={`status ${key.isActive ? "active" : "inactive"}`}
                >
                  {key.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="key-value">
                <code>{key.key}</code>
              </div>
              <div className="key-actions">
                <button onClick={() => toggleKeyStatus(key._id, key.isActive)}>
                  {key.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h4>Usage Analytics</h4>
        <table className="usage-table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Method</th>
              <th>Status</th>
              <th>Count</th>
              <th>Last Used</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((u, i) => (
              <tr key={i}>
                <td>{u._id.endpoint}</td>
                <td>{u._id.method}</td>
                <td>{u._id.status}</td>
                <td>{u.count}</td>
                <td>{new Date(u.lastUsed).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .api-dashboard { padding: 20px; }
        .section { margin-bottom: 30px; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
        .create-key { display: flex; gap: 10px; margin-bottom: 20px; }
        .create-key input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1; max-width: 300px; }
        .btn-primary { background: #387ed1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        
        .key-card { border: 1px solid #eee; padding: 15px; margin-bottom: 10px; border-radius: 4px; background: #f9f9f9; }
        .key-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .status { font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; }
        .status.active { background: #e8f5e9; color: #2e7d32; }
        .status.inactive { background: #ffebee; color: #c62828; }
        .key-value code { background: #eee; padding: 4px 8px; border-radius: 4px; font-family: monospace; }
        .key-actions { margin-top: 10px; }
        .key-actions button { font-size: 0.8rem; padding: 4px 8px; cursor: pointer; }

        .usage-table { width: 100%; border-collapse: collapse; }
        .usage-table th, .usage-table td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
        .usage-table th { background: #f5f5f5; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default APIDashboard;
