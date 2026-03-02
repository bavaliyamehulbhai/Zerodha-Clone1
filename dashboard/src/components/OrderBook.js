import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { MarketDataContext } from "./MarketDataContext";
import GeneralContext from "./GeneralContext";

const OrderBook = () => {
  const { symbol } = useParams();
  const { marketData } = useContext(MarketDataContext);
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);
  const [bids, setBids] = useState([]);
  const [asks, setAsks] = useState([]);

  // Get current price from context or default
  const currentPrice = marketData[symbol]?.price || 1500.0;

  // Simulate Order Book Data
  useEffect(() => {
    const generateDepth = () => {
      const newBids = [];
      const newAsks = [];
      const depth = 10; // Number of rows

      for (let i = 0; i < depth; i++) {
        // Bids: Price decreasing, Asks: Price increasing
        const bidPrice = currentPrice - (i + 1) * 0.05 - Math.random() * 0.1;
        const askPrice = currentPrice + (i + 1) * 0.05 + Math.random() * 0.1;

        newBids.push({
          price: parseFloat(bidPrice.toFixed(2)),
          qty: Math.floor(Math.random() * 1000) + 10,
          orders: Math.floor(Math.random() * 20) + 1,
        });

        newAsks.push({
          price: parseFloat(askPrice.toFixed(2)),
          qty: Math.floor(Math.random() * 1000) + 10,
          orders: Math.floor(Math.random() * 20) + 1,
        });
      }
      setBids(newBids);
      setAsks(newAsks);
    };

    generateDepth();
    const interval = setInterval(generateDepth, 1000); // Update every second
    return () => clearInterval(interval);
  }, [currentPrice]);

  const totalBidQty = bids.reduce((acc, curr) => acc + curr.qty, 0);
  const totalAskQty = asks.reduce((acc, curr) => acc + curr.qty, 0);
  const maxQty = Math.max(...bids.map((b) => b.qty), ...asks.map((a) => a.qty));

  return (
    <div className="order-book-container">
      <div className="header">
        <h3>
          Market Depth: <span className="symbol">{symbol}</span>
        </h3>
        <div className="ltp">LTP: ₹{currentPrice.toFixed(2)}</div>
      </div>

      <div className="book-wrapper">
        {/* Bids Side (Buy) */}
        <div className="side bids">
          <div className="table-header">
            <span>Bid</span>
            <span>Orders</span>
            <span>Qty</span>
          </div>
          <div className="rows">
            {bids.map((bid, i) => (
              <div
                className="row"
                key={i}
                onClick={() => openBuyWindow(symbol, bid.price)}
              >
                <div
                  className="depth-bar bid-bar"
                  style={{ width: `${(bid.qty / maxQty) * 100}%` }}
                ></div>
                <span className="price">{bid.price.toFixed(2)}</span>
                <span>{bid.orders}</span>
                <span className="qty">{bid.qty}</span>
              </div>
            ))}
          </div>
          <div className="total">
            <span>Total</span>
            <span className="qty">{totalBidQty.toLocaleString()}</span>
          </div>
        </div>

        {/* Asks Side (Sell) */}
        <div className="side asks">
          <div className="table-header">
            <span>Offer</span>
            <span>Orders</span>
            <span>Qty</span>
          </div>
          <div className="rows">
            {asks.map((ask, i) => (
              <div
                className="row"
                key={i}
                onClick={() => openSellWindow(symbol, ask.price)}
              >
                <div
                  className="depth-bar ask-bar"
                  style={{ width: `${(ask.qty / maxQty) * 100}%` }}
                ></div>
                <span className="price">{ask.price.toFixed(2)}</span>
                <span>{ask.orders}</span>
                <span className="qty">{ask.qty}</span>
              </div>
            ))}
          </div>
          <div className="total">
            <span>Total</span>
            <span className="qty">{totalAskQty.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <style>{`
        .order-book-container {
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 800px;
          margin: 20px auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .symbol {
          color: #387ed1;
          font-weight: bold;
        }
        .ltp {
          font-size: 1.2rem;
          font-weight: 600;
        }
        .book-wrapper {
          display: flex;
          gap: 20px;
        }
        .side {
          flex: 1;
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          font-weight: 600;
          color: #666;
          font-size: 0.9rem;
          border-bottom: 1px solid #eee;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 6px 8px;
          font-size: 0.9rem;
          position: relative;
          cursor: default;
          cursor: pointer;
        }
        .row:hover {
          background-color: #f9f9f9;
        }
        .depth-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          opacity: 0.15;
          z-index: 0;
        }
        .bid-bar {
          right: 0;
          background-color: #4caf50;
          transform-origin: right;
        }
        .ask-bar {
          left: 0;
          background-color: #f44336;
          transform-origin: left;
        }
        .bids .price { color: #4caf50; }
        .asks .price { color: #f44336; }
        .qty { font-weight: 500; }
        .total {
          display: flex;
          justify-content: space-between;
          padding: 10px 8px;
          border-top: 1px solid #eee;
          font-weight: 600;
          margin-top: 5px;
        }
        
        /* Dark Mode Support */
        body.dark-mode .order-book-container {
          background: #1e1e1e;
          color: #e0e0e0;
        }
        body.dark-mode .row:hover { background-color: #2d2d2d; }
        body.dark-mode .table-header { color: #aaa; border-color: #333; }
        body.dark-mode .header { border-color: #333; }
        body.dark-mode .total { border-color: #333; }
      `}</style>
    </div>
  );
};

export default OrderBook;
