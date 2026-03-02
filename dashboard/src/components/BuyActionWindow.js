import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { MarketDataContext } from "./MarketDataContext";
import "./BuyActionWindow.css";

const BuyActionWindow = ({ uid, mode, price, closeBuyWindow }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(price || 0.0);
  const [isPaperTrading, setIsPaperTrading] = useState(false);
  const [orderType, setOrderType] = useState("LIMIT");
  const [productType, setProductType] = useState("CNC");
  const { isMarketOpen, addToQueue } = useContext(MarketDataContext);

  const handleBuyClick = () => {
    if (!isPaperTrading && !isMarketOpen()) {
      addToQueue({
        name: uid,
        qty: stockQuantity,
        price: stockPrice,
        mode: mode,
        type: orderType,
        product: productType,
      });
      closeBuyWindow();
      alert("Market is closed. Order queued for execution when market opens.");
      return;
    }

    const url = isPaperTrading
      ? "http://localhost:3002/paper/order"
      : "http://localhost:3002/newOrder";

    axios
      .post(
        url,
        {
          name: uid,
          qty: stockQuantity,
          price: stockPrice,
          mode: mode,
          type: orderType,
          product: productType,
        },
        { withCredentials: true },
      )
      .then((res) => {
        if (isPaperTrading) alert(res.data.message);
        closeBuyWindow();
      })
      .catch((err) => {
        console.log(err);
        alert("Failed to place order. Please ensure you are logged in.");
      });
  };

  const handleCancelClick = () => {
    closeBuyWindow();
  };

  return (
    <div className="container" id="buy-window" draggable="true">
      <div className="regular-order">
        <div className="trade-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={isPaperTrading}
              onChange={(e) => setIsPaperTrading(e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
          <span className="toggle-label">
            {isPaperTrading ? "Paper Trading" : "Real Trading"}
          </span>
        </div>
        <div className="market-options" style={{ marginBottom: "15px" }}>
          <div
            className="row"
            style={{ display: "flex", gap: "20px", marginBottom: "10px" }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="product"
                value="MIS"
                checked={productType === "MIS"}
                onChange={(e) => setProductType(e.target.value)}
              />
              Intraday <span>MIS</span>
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="product"
                value="CNC"
                checked={productType === "CNC"}
                onChange={(e) => setProductType(e.target.value)}
              />
              Longterm <span>CNC</span>
            </label>
          </div>
          <div className="row" style={{ display: "flex", gap: "20px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="type"
                value="MARKET"
                checked={orderType === "MARKET"}
                onChange={(e) => setOrderType(e.target.value)}
              />
              Market
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="type"
                value="LIMIT"
                checked={orderType === "LIMIT"}
                onChange={(e) => setOrderType(e.target.value)}
              />
              Limit
            </label>
          </div>
        </div>
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
              disabled={orderType === "MARKET"}
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons">
        <span>Margin required ₹140.65</span>
        <div>
          <Link
            className="btn btn-blue"
            onClick={handleBuyClick}
            style={{ backgroundColor: mode === "SELL" ? "#d43725" : "#387ed1" }}
          >
            {mode}
          </Link>
          <Link to="" className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
