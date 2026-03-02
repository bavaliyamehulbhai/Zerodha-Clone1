import React, { useState, useContext } from "react";
import { Tooltip, Grow } from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  BarChartOutlined,
  MoreHoriz,
} from "@mui/icons-material";
import GeneralContext from "./GeneralContext";
import { MarketDataContext } from "./MarketDataContext";

const WatchList = () => {
  const { marketData } = useContext(MarketDataContext);
  const watchlist = [
    { name: "INFY", price: 1555.45, isDown: true },
    { name: "ONGC", price: 116.8, isDown: true },
    { name: "TCS", price: 3194.8, isDown: true },
    { name: "KPITTECH", price: 266.45, isDown: false },
    { name: "QUICKHEAL", price: 308.55, isDown: false },
    { name: "WIPRO", price: 577.75, isDown: false },
    { name: "M&M", price: 779.8, isDown: true },
    { name: "RELIANCE", price: 2112.4, isDown: false },
    { name: "HUL", price: 2383.4, isDown: true },
  ];

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
        />
        <span className="counts"> {watchlist.length} / 50</span>
      </div>

      <ul className="list">
        {watchlist.map((stock, index) => {
          const liveData = marketData[stock.name];
          const price = liveData ? liveData.price : stock.price;
          const isDown = liveData ? liveData.price < stock.price : stock.isDown;

          return (
            <WatchListItem stock={{ ...stock, price, isDown }} key={index} />
          );
        })}
      </ul>
    </div>
  );
};

export default WatchList;

const WatchListItem = ({ stock }) => {
  const [showActions, setShowActions] = useState(false);
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);

  const handleMouseEnter = () => setShowActions(true);
  const handleMouseLeave = () => setShowActions(false);

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="item">
        <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">{stock.isDown ? "-0.5%" : "+0.5%"}</span>
          {stock.isDown ? (
            <KeyboardArrowDown className="down" />
          ) : (
            <KeyboardArrowUp className="up" />
          )}
          <span className="price">{stock.price}</span>
        </div>
      </div>
      {showActions && (
        <div className="actions">
          <span>
            <Tooltip
              title="Buy (B)"
              placement="top"
              arrow
              TransitionComponent={Grow}
              onClick={() => openBuyWindow(stock.name, stock.price)}
            >
              <button className="buy">B</button>
            </Tooltip>
            <Tooltip
              title="Sell (S)"
              placement="top"
              arrow
              TransitionComponent={Grow}
              onClick={() => openSellWindow(stock.name, stock.price)}
            >
              <button className="sell">S</button>
            </Tooltip>
            <Tooltip
              title="Analytics (A)"
              placement="top"
              arrow
              TransitionComponent={Grow}
            >
              <button className="action">
                <BarChartOutlined className="icon" />
              </button>
            </Tooltip>
            <Tooltip
              title="More"
              placement="top"
              arrow
              TransitionComponent={Grow}
            >
              <button className="action">
                <MoreHoriz className="icon" />
              </button>
            </Tooltip>
          </span>
        </div>
      )}
    </li>
  );
};
