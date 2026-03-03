import React, { useContext } from "react";
import Menu from "./Menu";
import { MarketDataContext } from "./MarketDataContext";

const TopBar = () => {
  const { marketData } = useContext(MarketDataContext);

  const getIndexData = (symbol, basePrice) => {
    const live = marketData[symbol];
    if (live) {
      const change = ((live.price - basePrice) / basePrice) * 100;
      return {
        price: live.price.toFixed(2),
        percent: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
        isDown: change < 0
      };
    }
    return { price: basePrice.toFixed(2), percent: "0.00%", isDown: false };
  };

  const nifty = getIndexData("NIFTY 50", 22000);
  const sensex = getIndexData("SENSEX", 72000);

  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className="index-points">{nifty.price}</p>
          <p className={`percent ${nifty.isDown ? "down" : ""}`}>{nifty.percent}</p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className="index-points">{sensex.price}</p>
          <p className={`percent ${sensex.isDown ? "down" : ""}`}>{sensex.percent}</p>
        </div>
      </div>

      <Menu />
    </div>
  );
};

export default TopBar;