import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import DataTable from "./DataTable";
import { MarketDataContext } from "./MarketDataContext";

const Broker = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalMarginUsed: 0,
    riskAlerts: 0,
  });

  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const { rmsAlerts } = useContext(MarketDataContext);
  const prevAlertIdRef = useRef(rmsAlerts?.[0]?.id);

  const fetchBrokerData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("http://localhost:3002/broker/dashboard", {
        withCredentials: true,
      });
      if (res.data) {
        setStats(res.data.stats);
        setClients(res.data.clients);
      }
    } catch (error) {
      console.error("Error fetching broker data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokerData();
  }, []);

  useEffect(() => {
    if (rmsAlerts && rmsAlerts.length > 0) {
      const latestAlert = rmsAlerts[0];
      if (latestAlert.id !== prevAlertIdRef.current) {
        prevAlertIdRef.current = latestAlert.id;
        if (
          latestAlert.event === "notification" &&
          (latestAlert.title?.includes("Client") ||
            latestAlert.message?.includes("assigned"))
        ) {
          fetchBrokerData();
        }
      }
    }
  }, [rmsAlerts]);

  const handleLiquidate = async (userId, username) => {
    if (
      window.confirm(
        `Are you sure you want to liquidate all positions for ${username}? This action cannot be undone.`,
      )
    ) {
      try {
        const res = await axios.post(
          "http://localhost:3002/liquidate",
          { userId },
          { withCredentials: true },
        );
        if (res.data.success) {
          alert("Positions liquidated successfully");
          fetchBrokerData();
        } else {
          alert("Failed to liquidate: " + res.data.message);
        }
      } catch (error) {
        console.error("Error liquidating positions", error);
        alert("Failed to liquidate positions");
      }
    }
  };

  const columns = [
    {
      header: "Client ID",
      accessor: "id",
      sortable: true,
      render: (row) => row.id || row._id,
    },
    { header: "Username", accessor: "username", sortable: true },
    {
      header: "Margin Used",
      accessor: "marginUsed",
      sortable: true,
      render: (row) => `₹${row.marginUsed.toLocaleString()}`,
    },
    {
      header: "Available Cash",
      accessor: "available",
      sortable: true,
      render: (row) => `₹${row.available.toLocaleString()}`,
    },
    {
      header: "Utilization %",
      accessor: "utilization",
      sortable: true,
      render: (row) => (
        <span
          style={{
            color:
              (row.utilization || 0) > 90
                ? "red"
                : (row.utilization || 0) > 75
                  ? "orange"
                  : "green",
            fontWeight: "bold",
          }}
        >
          {(row.utilization || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      sortable: true,
      render: (row) => (
        <span className={`status-badge ${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: (row) => (
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            className="btn-action"
            onClick={() => alert(`View details for ${row.username}`)}
          >
            View
          </button>
          <button
            className="btn-action btn-danger"
            onClick={() => handleLiquidate(row.id || row._id, row.username)}
          >
            Liquidate
          </button>
        </div>
      ),
    },
  ];

  const filteredClients = clients.filter(
    (client) =>
      (client.username || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (client.id || client._id || "").toString().includes(searchTerm),
  );

  return (
    <div className="broker-section">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3 className="title" style={{ margin: 0 }}>
          Broker Dashboard
        </h3>
        <div>
          <Link
            to="/broker/deposits"
            style={{
              textDecoration: "none",
              padding: "10px 20px",
              background: "#4caf50",
              color: "white",
              borderRadius: "4px",
              fontWeight: "500",
              marginRight: "10px",
            }}
          >
            Manage Deposits
          </Link>
          <Link
            to="/broker/withdrawals"
            style={{
              textDecoration: "none",
              padding: "10px 20px",
              background: "#9c27b0",
              color: "white",
              borderRadius: "4px",
              fontWeight: "500",
            }}
          >
            Manage Withdrawals
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : (
        <>
          <div className="stats-container">
            <div className="stat-card">
              <h4>Total Clients</h4>
              <p>{stats.totalClients}</p>
            </div>
            <div className="stat-card">
              <h4>Active Clients</h4>
              <p>{stats.activeClients}</p>
            </div>
            <div className="stat-card">
              <h4>Total Exposure</h4>
              <p>₹{(stats.totalMarginUsed / 100000).toFixed(2)} L</p>
            </div>
            <div className="stat-card alert">
              <h4>Risk Alerts</h4>
              <p>{stats.riskAlerts}</p>
            </div>
          </div>

          <div className="clients-table-section">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ margin: 0 }}>Client Risk Monitor</h4>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="Search by username or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    width: "250px",
                  }}
                />
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  style={{
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    cursor: "pointer",
                  }}
                >
                  <option value={5}>5 rows</option>
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>
            </div>
            <DataTable
              key={rowsPerPage + searchTerm}
              columns={columns}
              data={filteredClients}
              rowsPerPage={rowsPerPage}
              emptyMessage="No clients found"
            />
          </div>
        </>
      )}

      <style>{`
        .broker-section {
          padding: 20px;
        }
        .stats-container {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }
        .stat-card {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          flex: 1;
          min-width: 200px;
          border: 1px solid #eee;
        }
        .stat-card h4 {
          margin: 0 0 10px 0;
          color: #666;
          font-size: 0.9rem;
        }
        .stat-card p {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 600;
          color: #333;
        }
        .stat-card.alert p {
          color: #d32f2f;
        }
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
        }
        .status-badge.safe {
          background: #e8f5e9;
          color: #2e7d32;
        }
        .status-badge.critical {
          background: #ffebee;
          color: #c62828;
        }
        .status-badge.liquidated {
          background: #212121;
          color: #fff;
        }

        .btn-action {
          padding: 5px 10px;
          background: #387ed1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-danger {
          background: #d32f2f;
        }

        body.dark-mode .stat-card {
          background: #1e1e1e;
          border-color: #333;
        }
        body.dark-mode .stat-card h4 {
          color: #aaa;
        }
        body.dark-mode .stat-card p {
          color: #e0e0e0;
        }
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
        }
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border-left-color: #387ed1;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Broker;
