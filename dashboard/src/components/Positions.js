import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import DataTable from "./DataTable";
import { MarketDataContext } from "./MarketDataContext";
import ConfirmationModal from "./ConfirmationModal";

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const { marketData, subscribe } = useContext(MarketDataContext);
  const [showExitModal, setShowExitModal] = useState(false);
  const [positionToExit, setPositionToExit] = useState(null);
  const [filterType, setFilterType] = useState("all");

  const fetchPositions = async () => {
    try {
      const res = await axios.get("http://localhost:3002/positions", {
        withCredentials: true,
      });
      setPositions(res.data);
      const symbols = res.data.map((pos) => pos.name);
      subscribe(symbols);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    setPositions((prevPositions) =>
      prevPositions.map((position) => {
        const updatedData = marketData[position.name];
        if (updatedData) {
          const newPnl = (updatedData.price - position.avgPrice) * position.qty;
          return { ...position, ltp: updatedData.price, pnl: newPnl };
        }
        return position;
      }),
    );
  }, [marketData]);

  const filteredPositions = positions.filter((pos) => {
    if (filterType === "all") return true;
    if (filterType === "paper") return pos.isPaper;
    if (filterType === "real") return !pos.isPaper;
    return true;
  });

  const totalPnL = filteredPositions.reduce((acc, row) => {
    return acc + (row.pnl || 0);
  }, 0);

  const handleExitClick = (row) => {
    setPositionToExit(row);
    setShowExitModal(true);
  };

  const confirmExit = async () => {
    const row = positionToExit;
    const isSell = row.qty > 0;
    const mode = isSell ? "SELL" : "BUY";
    const qty = Math.abs(row.qty);

    try {
      const url = row.isPaper
        ? "http://localhost:3002/paper/order"
        : "http://localhost:3002/newOrder";

      await axios.post(
        url,
        {
          name: row.name,
          qty: qty,
          price: row.ltp || row.avgPrice,
          mode: mode,
          type: "MARKET",
          product: row.product,
        },
        { withCredentials: true },
      );

      alert("Exit order placed successfully");
      fetchPositions();
    } catch (err) {
      console.error(err);
      alert("Failed to exit position");
    } finally {
      setShowExitModal(false);
      setPositionToExit(null);
    }
  };

  const columns = [
    {
      header: "Product",
      accessor: "product",
      render: (row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span>{row.product}</span>
          {row.isPaper ? (
            <span className="badge paper">Paper</span>
          ) : (
            <span className="badge real">Real</span>
          )}
        </div>
      ),
    },
    { header: "Instrument", accessor: "name" },
    { header: "Qty", accessor: "qty" },
    {
      header: "Avg. Price",
      accessor: "avgPrice",
      render: (row) => (row.avgPrice || 0).toFixed(2),
    },
    {
      header: "LTP",
      accessor: "ltp",
      render: (row) => (row.ltp ? row.ltp.toFixed(2) : "-"),
    },
    {
      header: "P&L",
      render: (row) => {
        const pnl = row.pnl || 0;
        return (
          <span className={pnl >= 0 ? "profit" : "loss"}>
            {pnl >= 0 ? "+" : ""}
            {pnl.toFixed(2)}
          </span>
        );
      },
    },
    {
      header: "Action",
      render: (row) => (
        <button className="btn-exit" onClick={() => handleExitClick(row)}>
          Exit
        </button>
      ),
    },
  ];

  return (
    <div className="positions-container">
      <div className="header-row">
        <h3 className="title">Positions ({filteredPositions.length})</h3>
        <div className="filter-controls">
          <button
            className={filterType === "all" ? "active" : ""}
            onClick={() => setFilterType("all")}
          >
            All
          </button>
          <button
            className={filterType === "real" ? "active" : ""}
            onClick={() => setFilterType("real")}
          >
            Real
          </button>
          <button
            className={filterType === "paper" ? "active" : ""}
            onClick={() => setFilterType("paper")}
          >
            Paper
          </button>
        </div>
      </div>

      <div className="portfolio-summary">
        <div className="summary-card">
          <h4>Total P&L</h4>
          <h2 className={totalPnL >= 0 ? "profit" : "loss"}>
            {totalPnL >= 0 ? "+" : ""}
            {totalPnL.toFixed(2)}
          </h2>
        </div>
      </div>

      <div className="table-wrapper">
        <DataTable
          columns={columns}
          data={filteredPositions}
          rowsPerPage={10}
          emptyMessage="No open positions"
        />
      </div>
      <ConfirmationModal
        isOpen={showExitModal}
        title="Confirm Exit"
        message={`Are you sure you want to exit ${positionToExit?.name}?`}
        onConfirm={confirmExit}
        onCancel={() => setShowExitModal(false)}
        confirmText="Exit"
        cancelText="Cancel"
      />
      <style>{`
        .positions-container { padding: 20px; }
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .filter-controls { display: flex; gap: 5px; }
        .filter-controls button {
            padding: 5px 10px;
            border: 1px solid #ddd;
            background: #fff;
            cursor: pointer;
            border-radius: 4px;
            font-size: 0.8rem;
        }
        .filter-controls button.active {
            background: #387ed1;
            color: white;
            border-color: #387ed1;
        }
        .portfolio-summary { margin-bottom: 20px; display: flex; gap: 20px; }
        .summary-card {
            background: #fff;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border: 1px solid #eee;
            min-width: 150px;
        }
        .summary-card h4 { margin: 0 0 5px 0; color: #666; font-size: 0.9rem; font-weight: 500; }
        .summary-card h2 { margin: 0; font-size: 1.8rem; font-weight: 600; }
        
        .table-wrapper {
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border: 1px solid #eee;
            overflow: hidden;
        }

        .badge { padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
        .badge.paper { background-color: #e3f2fd; color: #1976d2; border: 1px solid #bbdefb; }
        .badge.real { background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .profit { color: #4caf50; }
        .loss { color: #d32f2f; }
        .btn-exit {
          background-color: #ff5722;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.8rem;
          transition: background-color 0.2s;
        }
        .btn-exit:hover {
          background-color: #f4511e;
        }

        /* Dark mode support */
        body.dark-mode .summary-card, body.dark-mode .table-wrapper {
            background: #1e1e1e;
            border-color: #333;
        }
        body.dark-mode .filter-controls button {
            background: #2d2d2d;
            border-color: #444;
            color: #e0e0e0;
        }
        body.dark-mode .filter-controls button.active {
            background: #387ed1;
            color: white;
        }
        body.dark-mode .summary-card h4 { color: #aaa; }
      `}</style>
    </div>
  );
};

export default Positions;
