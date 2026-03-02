import React, { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "./DataTable";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    action: "",
  });

  const fetchLogs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3002/surveillance/audit-logs",
        { withCredentials: true },
      );
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch logs");
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  const columns = [
    {
      header: "Timestamp",
      accessor: "timestamp",
      render: (row) => new Date(row.timestamp).toLocaleString(),
    },
    {
      header: "Actor",
      accessor: "actorId",
      render: (row) => row.adminId?.username || "System",
    },
    { header: "Action", accessor: "action" },
    {
      header: "Target",
      accessor: "targetId",
      render: (row) => row.targetUserId?.username || "-",
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span style={{ color: row.status === "SUCCESS" ? "green" : "red" }}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Reason/IP",
      accessor: "reason",
      render: (row) => `${row.reason} (${row.ipAddress})`,
    },
  ];

  return (
    <div className="audit-logs-container">
      <h3 className="title">Compliance & Audit Logs</h3>

      <div className="filters">
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters({ ...filters, startDate: e.target.value })
          }
        />
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />
        <input
          type="text"
          placeholder="Filter by Action (e.g. LOGIN)"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        />
        <button className="btn-primary" onClick={fetchLogs}>
          Filter
        </button>
      </div>

      <div className="logs-table">
        <DataTable
          columns={columns}
          data={logs}
          rowsPerPage={10}
          emptyMessage="No audit logs found"
        />
      </div>

      <style>{`
        .audit-logs-container { padding: 20px; }
        .filters { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .filters input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .btn-primary { background: #387ed1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .btn-secondary { background: #f0f0f0; color: #333; border: 1px solid #ccc; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .logs-table { background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); padding: 10px; }
        
        body.dark-mode .logs-table { background: #1e1e1e; border: 1px solid #333; }
        body.dark-mode input { background: #2d2d2d; color: #fff; border-color: #444; }
      `}</style>
    </div>
  );
};

export default AuditLogs;
