import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminKYC = () => {
  const [pendingKycs, setPendingKycs] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    fetchPendingKycs();
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      const res = await axios.get("http://localhost:3002/allUsers", {
        withCredentials: true,
      });
      const brokerList = res.data.filter((user) => user.role === "broker");
      setBrokers(brokerList);
    } catch (error) {
      console.error("Error fetching brokers", error);
    }
  };

  const fetchPendingKycs = async () => {
    try {
      const res = await axios.get("http://localhost:3002/kyc/all", {
        withCredentials: true,
      });
      if (res.data.success) {
        setPendingKycs(res.data.kycs);
      }
    } catch (error) {
      console.error("Error fetching pending KYCs", error);
    }
  };

  const handleAction = async (kycId, status) => {
    let reason = "";
    const brokerId = assignments[kycId];

    if (status === "REJECTED") {
      reason = prompt("Enter rejection reason:");
      if (!reason) return;
    }

    if (status === "APPROVED" && brokers.length > 0 && !brokerId) {
      alert("Please assign a broker to this user before approving.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:3002/kyc/action",
        { kycId, status, reason, brokerId },
        { withCredentials: true },
      );
      alert(`KYC ${status} Successfully`);
      fetchPendingKycs();
      setAssignments((prev) => {
        const next = { ...prev };
        delete next[kycId];
        return next;
      });
    } catch (error) {
      alert("Error updating KYC status");
    }
  };

  const handleAutoAssign = (kycId) => {
    if (brokers.length === 0) {
      alert("No brokers available");
      return;
    }
    // Find broker with minimum clients (assumes clientCount property exists, else defaults to first)
    const bestBroker = brokers.reduce((prev, curr) => {
      return (prev.clientCount || 0) < (curr.clientCount || 0) ? prev : curr;
    });
    setAssignments((prev) => ({ ...prev, [kycId]: bestBroker._id }));
  };

  return (
    <div className="admin-kyc-container">
      <h2>Pending KYC Requests</h2>
      {pendingKycs.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <div className="kyc-list">
          {pendingKycs.map((kyc) => (
            <div key={kyc._id} className="kyc-card">
              <div className="user-info">
                <h4>{kyc.username}</h4>
                <p>{kyc.email}</p>
                <small>
                  Submitted: {new Date(kyc.submittedAt).toLocaleDateString()}
                </small>
              </div>
              <div className="docs">
                <div className="doc-item">
                  <span>PAN</span>
                  <img
                    src={kyc.panUrl}
                    alt="PAN"
                    onClick={() => window.open(kyc.panUrl)}
                  />
                </div>
                <div className="doc-item">
                  <span>Aadhaar</span>
                  <img
                    src={kyc.aadhaarUrl}
                    alt="Aadhaar"
                    onClick={() => window.open(kyc.aadhaarUrl)}
                  />
                </div>
                <div className="doc-item">
                  <span>Selfie</span>
                  <img
                    src={kyc.selfieUrl}
                    alt="Selfie"
                    onClick={() => window.open(kyc.selfieUrl)}
                  />
                </div>
              </div>
              <div className="actions">
                {brokers.length > 0 && (
                  <div className="assign-group">
                    <select
                      className="broker-select"
                      value={assignments[kyc._id] || ""}
                      onChange={(e) =>
                        setAssignments({
                          ...assignments,
                          [kyc._id]: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Broker</option>
                      {brokers.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.username}{" "}
                          {b.clientCount !== undefined
                            ? `(${b.clientCount})`
                            : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn-auto"
                      onClick={() => handleAutoAssign(kyc._id)}
                      title="Auto Assign (Fewest Clients)"
                    >
                      Auto
                    </button>
                  </div>
                )}
                <button
                  className="btn-approve"
                  onClick={() => handleAction(kyc._id, "APPROVED")}
                >
                  Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleAction(kyc._id, "REJECTED")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .admin-kyc-container {
          padding: 20px;
        }
        .kyc-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .kyc-card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .docs {
          display: flex;
          gap: 10px;
          margin: 15px 0;
        }
        .doc-item img {
          width: 100px;
          height: 60px;
          object-fit: cover;
          border: 1px solid #ddd;
          cursor: pointer;
        }
        .actions {
          display: flex;
          gap: 10px;
        }
        .btn-approve { background: #4caf50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1; }
        .btn-reject { background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1; }
        .assign-group { display: flex; gap: 5px; flex: 1; }
        .broker-select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1; }
        .btn-auto { background: #2196f3; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
      `}</style>
    </div>
  );
};

export default AdminKYC;
