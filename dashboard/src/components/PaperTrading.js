import React, { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "./DataTable";
import { DoughnutChart } from "./DoughnoutChart";

const PaperTrading = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState({
    wallet: { availableBalance: 0, realizedPnL: 0 },
    positions: [],
    orders: [],
    holdingsValue: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:3002/paper/profile", {
        withCredentials: true,
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch paper trading data");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get("http://localhost:3002/paper/leaderboard", {
        withCredentials: true,
      });
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard");
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure? This will reset your virtual balance to ₹10L and clear all trades.",
      )
    ) {
      await axios.post(
        "http://localhost:3002/paper/reset",
        {},
        { withCredentials: true },
      );
      fetchData();
    }
  };

  useEffect(() => {
    if (activeTab === "leaderboard") fetchLeaderboard();
  }, [activeTab]);

  // Chart Data
  const chartData = {
    labels: ["Available Cash", "Invested"],
    datasets: [
      {
        data: [data.wallet.availableBalance, data.wallet.usedMargin || 0],
        backgroundColor: ["#4caf50", "#ff9800"],
      },
    ],
  };

  return (
    <div className="paper-trading-container">
      <div className="header">
        <h3>Paper Trading Simulator</h3>
        <div className="tabs">
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={activeTab === "orders" ? "active" : ""}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </button>
          <button
            className={activeTab === "leaderboard" ? "active" : ""}
            onClick={() => setActiveTab("leaderboard")}
          >
            Leaderboard
          </button>
        </div>
        <button className="btn-reset" onClick={handleReset}>
          Reset Portfolio
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="dashboard-view">
          <div className="stats-row">
            <div className="card">
              <h4>Available Funds</h4>
              <p>₹{data.wallet.availableBalance.toLocaleString()}</p>
            </div>
            <div className="card">
              <h4>Realized P&L</h4>
              <p className={data.wallet.realizedPnL >= 0 ? "profit" : "loss"}>
                ₹{data.wallet.realizedPnL.toLocaleString()}
              </p>
            </div>
            <div className="card">
              <h4>Open Positions</h4>
              <p>{data.positions.length}</p>
            </div>
          </div>

          <div className="content-row">
            <div className="chart-section">
              <div style={{ width: "300px", margin: "0 auto" }}>
                <DoughnutChart data={chartData} />
              </div>
            </div>
            <div className="positions-section">
              <h4>Current Positions</h4>
              <DataTable
                columns={[
                  { header: "Instrument", accessor: "name" },
                  { header: "Qty", accessor: "qty" },
                  {
                    header: "Avg Price",
                    accessor: "avgPrice",
                    render: (r) => r.avgPrice.toFixed(2),
                  },
                  {
                    header: "Value",
                    render: (r) => (r.qty * r.avgPrice).toFixed(2),
                  },
                ]}
                data={data.positions}
                rowsPerPage={5}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="orders-view">
          <DataTable
            columns={[
              {
                header: "Time",
                accessor: "orderDate",
                render: (r) => new Date(r.orderDate).toLocaleString(),
              },
              { header: "Type", accessor: "mode" },
              { header: "Instrument", accessor: "name" },
              { header: "Qty", accessor: "qty" },
              { header: "Price", accessor: "price" },
              {
                header: "Status",
                accessor: "status",
                render: (r) => (
                  <span className={`status ${r.status.toLowerCase()}`}>
                    {r.status}
                  </span>
                ),
              },
            ]}
            data={data.orders}
            rowsPerPage={10}
          />
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="leaderboard-view">
          <DataTable
            columns={[
              { header: "Rank", accessor: "rank" },
              { header: "Trader", accessor: "username" },
              {
                header: "Portfolio Value",
                accessor: "totalValue",
                render: (r) => `₹${r.totalValue.toLocaleString()}`,
              },
              {
                header: "Return %",
                accessor: "pnlPercent",
                render: (r) => (
                  <span className={r.pnlPercent >= 0 ? "profit" : "loss"}>
                    {r.pnlPercent.toFixed(2)}%
                  </span>
                ),
              },
            ]}
            data={leaderboard}
            rowsPerPage={10}
          />
        </div>
      )}

      <style>{`
        .paper-trading-container { padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .tabs button { background: none; border: none; padding: 10px 20px; cursor: pointer; font-weight: 500; color: #666; border-bottom: 2px solid transparent; }
        .tabs button.active { color: #387ed1; border-bottom-color: #387ed1; }
        .btn-reset { background: #f44336; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        
        .stats-row { display: flex; gap: 20px; margin-bottom: 30px; }
        .card { flex: 1; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #eee; text-align: center; }
        .card h4 { margin: 0 0 10px 0; color: #666; font-size: 0.9rem; }
        .card p { font-size: 1.5rem; font-weight: 600; margin: 0; }
        
        .content-row { display: flex; gap: 20px; }
        .chart-section { flex: 1; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
        .positions-section { flex: 2; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
        
        .profit { color: #4caf50; }
        .loss { color: #d32f2f; }
        .status.filled { color: #4caf50; font-weight: 500; }
        .status.pending { color: #ff9800; font-weight: 500; }
        
        body.dark-mode .card, body.dark-mode .chart-section, body.dark-mode .positions-section { background: #1e1e1e; border-color: #333; }
        body.dark-mode .card h4 { color: #aaa; }
        body.dark-mode .card p { color: #e0e0e0; }
      `}</style>
    </div>
  );
};

export default PaperTrading;
