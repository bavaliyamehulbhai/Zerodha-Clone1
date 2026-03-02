import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DoughnutChart } from "./DoughnoutChart";
import { Refresh, Download } from "@mui/icons-material";

const Summary = () => {
  const [username, setUsername] = useState("User");
  const [holdingsSummary, setHoldingsSummary] = useState({
    currentValue: 0,
    investment: 0,
    pnl: 0,
    pnlPercent: 0,
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topGainer, setTopGainer] = useState(null);
  const [topLoser, setTopLoser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, holdingsRes, ordersRes] = await Promise.all([
        axios.get("http://localhost:3002/user", { withCredentials: true }),
        axios.get("http://localhost:3002/holdings", { withCredentials: true }),
        axios.get("http://localhost:3002/allOrders", { withCredentials: true }),
      ]);

      // Process User
      if (userRes.data?.status) {
        setUsername(userRes.data.user);
      }

      // Process Holdings
      const holdings = Array.isArray(holdingsRes.data) ? holdingsRes.data : [];
      const labels = [];
      const data = [];
      let maxPnlPercent = -Infinity;
      let minPnlPercent = Infinity;
      let gainer = null;
      let loser = null;

      const investment = holdings.reduce((acc, stock) => acc + (stock.avg * stock.qty), 0);
      const currVal = holdings.reduce((acc, stock) => acc + stock.currentValue, 0);

      holdings.forEach((stock) => {
        labels.push(stock.name);
        data.push(stock.currentValue);

        const netPercent = parseFloat(stock.net) || 0;
        if (netPercent > maxPnlPercent) {
          maxPnlPercent = netPercent;
          gainer = { ...stock, percent: netPercent };
        }
        if (netPercent < minPnlPercent) {
          minPnlPercent = netPercent;
          loser = { ...stock, percent: netPercent };
        }
      });

      const pnl = currVal - investment;
      const pnlPercent = investment === 0 ? 0 : (pnl / investment) * 100;

      setHoldingsSummary({
        currentValue: currVal,
        investment: investment,
        pnl: pnl,
        pnlPercent: pnlPercent,
      });

      setTopGainer(gainer);
      setTopLoser(loser);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: "Stock Value",
            data: data,
            backgroundColor: [
              "rgba(255, 99, 132, 0.5)",
              "rgba(54, 162, 235, 0.5)",
              "rgba(255, 206, 86, 0.5)",
              "rgba(75, 192, 192, 0.5)",
              "rgba(153, 102, 255, 0.5)",
              "rgba(255, 159, 64, 0.5)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
            ],
            borderWidth: 1,
          },
        ],
      });

      // Process Orders
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const sortedOrders = orders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setRecentOrders(sortedOrders.slice(0, 5));
    } catch (error) {
      console.error("Error fetching summary data", error);
      setHoldingsSummary({ currentValue: 0, investment: 0, pnl: 0, pnlPercent: 0 });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartOptions = {
    onClick: (event, elements) => {
      if (elements.length > 0) {
        navigate("/holdings");
      }
    },
  };

  const handleDownloadReport = () => {
    const csvRows = [];

    // Summary Section
    csvRows.push(["Summary Report", `Generated on ${new Date().toLocaleDateString()}`]);
    csvRows.push([]);
    csvRows.push(["Metric", "Value"]);
    csvRows.push(["Current Value", holdingsSummary.currentValue.toFixed(2)]);
    csvRows.push(["Investment", holdingsSummary.investment.toFixed(2)]);
    csvRows.push(["P&L", holdingsSummary.pnl.toFixed(2)]);
    csvRows.push(["P&L %", holdingsSummary.pnlPercent.toFixed(2) + "%"]);
    csvRows.push([]);

    // Top Movers
    if (topGainer) {
      csvRows.push(["Top Gainer", topGainer.name, `${topGainer.percent.toFixed(2)}%`]);
    }
    if (topLoser) {
      csvRows.push(["Top Loser", topLoser.name, `${topLoser.percent.toFixed(2)}%`]);
    }
    csvRows.push([]);

    // Recent Orders
    csvRows.push(["Recent Activity"]);
    csvRows.push(["Date", "Stock", "Type", "Qty", "Price"]);
    recentOrders.forEach((order) => {
      csvRows.push([
        new Date(order.createdAt).toLocaleDateString(),
        order.name,
        order.mode,
        order.qty,
        order.price,
      ]);
    });

    const csvString = csvRows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "summary_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <style>{`
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            min-height: 400px;
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
  }

  return (
    <>
      <div className="summary-container">
        <div className="user-welcome">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="title">Hi, {username}</h3>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleDownloadReport}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#387ed1",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Download Report"
              >
                <Download />
              </button>
              <button
                onClick={fetchData}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#387ed1",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Refresh Data"
              >
                <Refresh />
              </button>
            </div>
          </div>
          <hr className="divider" />
        </div>

        <div className="section">
          <span>
            <p>Equity</p>
          </span>

          <div className="data">
            <div className="first">
              <h3 className={holdingsSummary.pnl >= 0 ? "profit" : "loss"}>
                {holdingsSummary.pnl.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
                <small> ({holdingsSummary.pnlPercent.toFixed(2)}%)</small>
              </h3>
              <p>P&L</p>
            </div>
            <hr />

            <div className="second">
              <p>
                Current Value{" "}
                <span>
                  {holdingsSummary.currentValue.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              </p>
              <p>
                Investment{" "}
                <span>
                  {holdingsSummary.investment.toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="section">
          <span>
            <p>Funds</p>
          </span>
          <div className="data">
            <div className="first">
              <h3>
                {(4043.1).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </h3>
              <p>Available Margin</p>
            </div>
            <hr />
            <div className="second">
              <p>
                Used Margin{" "}
                <span>
                  {(3757.3).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              </p>
              <p>
                Opening Balance{" "}
                <span>
                  {(4043.1).toLocaleString("en-IN", {
                    style: "currency",
                    currency: "INR",
                  })}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="section">
          <span>
            <p>Portfolio Distribution</p>
          </span>
          <div style={{ width: "400px", height: "400px", margin: "0 auto" }}>
            <DoughnutChart data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="section">
          <span>
            <p>Top Movers</p>
          </span>
          <div className="movers-container">
            {topGainer && (
              <div className="mover-card">
                <h4>Top Gainer</h4>
                <div className="mover-details">
                  <span className="name">{topGainer.name}</span>
                  <span className={`percent ${topGainer.percent >= 0 ? "profit" : "loss"}`}>
                    {topGainer.percent > 0 ? "+" : ""}
                    {topGainer.percent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
            {topLoser && (
              <div className="mover-card">
                <h4>Top Loser</h4>
                <div className="mover-details">
                  <span className="name">{topLoser.name}</span>
                  <span className={`percent ${topLoser.percent >= 0 ? "profit" : "loss"}`}>
                    {topLoser.percent > 0 ? "+" : ""}
                    {topLoser.percent.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <span>
            <p>Recent Activity</p>
          </span>
          <div className="activity-list">
            {recentOrders.length === 0 ? (
              <p className="no-activity">No recent orders.</p>
            ) : (
              recentOrders.map((order, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-info">
                    <span className="stock-name">{order.name}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="activity-details">
                    <span
                      className={`order-mode ${order.mode === "BUY" ? "buy" : "sell"
                        }`}
                    >
                      {order.mode}
                    </span>
                    <span className="order-price">
                      {order.qty} qty @ {order.price}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <style>{`
        .summary-container {
          padding: 20px;
        }
        .user-welcome {
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 40px;
        }
        .section span p {
          font-size: 1.2rem;
          color: #444;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .section span p::before {
          content: "";
          display: block;
          width: 4px;
          height: 20px;
          background-color: #387ed1;
        }
        .data {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 60%;
        }
        .data .first h3 {
          font-size: 2rem;
          font-weight: 400;
          margin-bottom: 5px;
        }
        .data .first h3.profit {
          color: #4caf50;
        }
        .data .first h3.loss {
          color: #df514c;
        }
        .data .first h3 small {
          font-size: 1rem;
          color: #666;
        }
        .data .first p {
          color: #9b9b9b;
          font-size: 0.9rem;
        }
        .data hr {
          height: 60px;
          border: 0;
          border-left: 1px solid #e0e0e0;
          margin: 0 40px;
        }
        .data .second {
          flex-grow: 1;
        }
        .data .second p {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #9b9b9b;
          font-size: 0.9rem;
        }
        .data .second p span {
          color: #444;
          font-weight: 500;
        }

        body.dark-mode .section span p {
          color: #e0e0e0;
        }
        body.dark-mode .data .second p {
          color: #aaa;
        }
        body.dark-mode .data .second p span {
          color: #e0e0e0;
        }
        body.dark-mode .data hr {
          border-left: 1px solid #444;
        }

        .movers-container {
          display: flex;
          gap: 20px;
          width: 60%;
        }
        .mover-card {
          flex: 1;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 4px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .mover-card h4 {
          margin: 0 0 10px 0;
          font-size: 0.9rem;
          color: #666;
          font-weight: 500;
        }
        .mover-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mover-details .name {
          font-weight: 500;
          color: #444;
          font-size: 1.1rem;
        }
        .mover-details .percent {
          font-weight: 500;
        }
        .mover-details .percent.profit {
          color: #4caf50;
        }
        .mover-details .percent.loss {
          color: #df514c;
        }

        body.dark-mode .mover-card {
          background-color: #1e1e1e;
          border-color: #444;
        }
        body.dark-mode .mover-card h4 {
          color: #aaa;
        }
        body.dark-mode .mover-details .name {
          color: #e0e0e0;
        }
        
        .activity-list {
          width: 60%;
        }
        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .activity-info {
          display: flex;
          flex-direction: column;
        }
        .stock-name {
          font-weight: 500;
          color: #444;
        }
        .order-date {
          font-size: 0.8rem;
          color: #9b9b9b;
        }
        .activity-details {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .order-mode {
          font-size: 0.8rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .order-mode.buy {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        .order-mode.sell {
          background-color: #ffebee;
          color: #c62828;
        }
        .order-price {
          font-size: 0.9rem;
          color: #444;
        }
        .no-activity {
          color: #9b9b9b;
          font-style: italic;
        }

        body.dark-mode .stock-name { color: #e0e0e0; }
        body.dark-mode .order-price { color: #e0e0e0; }
        body.dark-mode .activity-item { border-bottom: 1px solid #444; }

        @media (max-width: 768px) {
          .data {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
          }
          .data hr {
            display: none;
          }
          .data .second {
            width: 100%;
            margin-top: 20px;
          }
          .activity-list {
            width: 100%;
          }
          .movers-container {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
};

export default Summary;
