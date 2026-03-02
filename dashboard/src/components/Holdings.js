import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { MarketDataContext } from "./MarketDataContext";

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const { marketData } = useContext(MarketDataContext);

  useEffect(() => {
    axios.get("http://localhost:3002/holdings", { withCredentials: true }).then((res) => {
      setAllHoldings(res.data);
    });
  }, []);

  useEffect(() => {
    setAllHoldings((prevHoldings) =>
      prevHoldings.map((stock) => {
        const updatedData = marketData[stock.name];
        if (updatedData) {
          // Recalculate PnL based on new LTP
          const newCurrentValue = stock.qty * updatedData.price;
          const newPnl = newCurrentValue - (stock.avg * stock.qty);
          const newNet = stock.avg > 0 ? (newPnl / (stock.avg * stock.qty)) * 100 : 0;

          // Update the stock object with new values
          return { ...stock, ltp: updatedData.price, currentValue: newCurrentValue, pnl: newPnl, net: newNet.toFixed(2) + "%" };
        }
        return stock;
      }),
    );
  }, [marketData]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedHoldings = [...allHoldings].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let valA, valB;    
    if (sortConfig.key === "day" || sortConfig.key === "net") {
      valA = parseFloat(a[sortConfig.key].replace(/[+%]/g, ""));
      valB = parseFloat(b[sortConfig.key].replace(/[+%]/g, ""));
    } else {
      valA = a[sortConfig.key];
      valB = b[sortConfig.key];
    }

    if (valA < valB) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (valA > valB) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th
                onClick={() => handleSort("name")}
                style={{ cursor: "pointer" }}
              >
                Instrument{" "}
                {sortConfig.key === "name" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("qty")}
                style={{ cursor: "pointer" }}
              >
                Qty.{" "}
                {sortConfig.key === "qty" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("avg")}
                style={{ cursor: "pointer" }}
              >
                Avg. cost{" "}
                {sortConfig.key === "avg" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("price")}
                style={{ cursor: "pointer" }}
              >
                LTP{" "}
                {sortConfig.key === "ltp" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("currentValue")}
                style={{ cursor: "pointer" }}
              >
                Cur. val{" "}
                {sortConfig.key === "currentValue" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("pnl")}
                style={{ cursor: "pointer" }}
              >
                P&L{" "}
                {sortConfig.key === "pnl" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("net")}
                style={{ cursor: "pointer" }}
              >
                Net chg.{" "}
                {sortConfig.key === "net" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("day")}
                style={{ cursor: "pointer" }}
              >
                Day chg.{" "}
                {sortConfig.key === "day" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((stock, index) => (
              <HoldingsRow key={stock.name || index} stock={stock} />
            ))}
          </tbody>
        </table>
        <style>{`
          @keyframes flashUp {
            0% { background-color: rgba(76, 175, 80, 0.3); }
            100% { background-color: transparent; }
          }
          @keyframes flashDown {
            0% { background-color: rgba(244, 67, 54, 0.3); }
            100% { background-color: transparent; }
          }
          .flash-up {
            animation: flashUp 0.5s ease-out;
          }
          .flash-down {
            animation: flashDown 0.5s ease-out;
          }
        `}</style>
      </div>
    </>
  );
};

export default Holdings;

const HoldingsRow = React.memo(({ stock }) => {
  const [flashClass, setFlashClass] = useState("");
  const prevPrice = useRef(stock.price);

  useEffect(() => {
    if (stock.price > prevPrice.current) {
      setFlashClass("flash-up");
    } else if (stock.price < prevPrice.current) {
      setFlashClass("flash-down");
    }
    prevPrice.current = stock.price;
    const timer = setTimeout(() => setFlashClass(""), 500);
    return () => clearTimeout(timer);
  }, [stock.price]);

  const profClass = stock.pnl >= 0 ? "profit" : "loss";
  const dayClass = stock.isLoss ? "loss" : "profit";

  return (
    <tr className={flashClass}>
      <td>{stock.name}</td>
      <td>{stock.qty}</td>
      <td>{stock.avg.toFixed(2)}</td>
      <td>{(stock.ltp || stock.price).toFixed(2)}</td>
      <td>{stock.currentValue.toFixed(2)}</td>
      <td className={profClass}>{stock.pnl.toFixed(2)}</td>
      <td className={profClass}>{stock.net}</td>
      <td className={dayClass}>{stock.day}</td>
    </tr>
  );
});
