import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { Tooltip, Grow } from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  BarChartOutlined,
  MoreHoriz,
  DeleteOutline
} from "@mui/icons-material";
import GeneralContext from "./GeneralContext";
import { MarketDataContext } from "./MarketDataContext";
import { toast } from "react-toastify";

const WatchList = () => {
  const { marketData } = useContext(MarketDataContext);
  const [watchlist, setWatchlist] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Stock base prices to simulate % change if marketData only sends price without base
  const basePrices = {
    INFY: 1555.45, ONGC: 116.8, TCS: 3194.8, KPITTECH: 266.45,
    QUICKHEAL: 308.55, WIPRO: 577.75, "M&M": 779.8, RELIANCE: 2112.4,
    HUL: 2383.4, HDFCBANK: 1522.0, SBIN: 500, BHARTIARTL: 900, ITC: 400, TATAPOWER: 300
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      const res = await axios.get("http://localhost:3002/watchlist", { withCredentials: true });
      if (res.data.success) {
        setWatchlist(res.data.watchlist);
      }
    } catch (error) {
      console.error("Error fetching watchlist", error);
    }
  };

  const handleAddStock = async (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const symbol = searchTerm.trim().toUpperCase();
      try {
        const res = await axios.post("http://localhost:3002/watchlist/add", { symbol }, { withCredentials: true });
        if (res.data.success) {
          setWatchlist(res.data.watchlist);
          setSearchTerm("");
          toast.success(`${symbol} added to watchlist`);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Error adding stock");
      }
    }
  };

  const handleRemoveStock = async (symbol) => {
    try {
      const res = await axios.post("http://localhost:3002/watchlist/remove", { symbol }, { withCredentials: true });
      if (res.data.success) {
        setWatchlist(res.data.watchlist);
        toast.success(`${symbol} removed from watchlist`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error removing stock");
    }
  };

  return (
    <div className="watchlist-container">
      <div className="search-container">
        <input
          type="text"
          name="search"
          id="search"
          placeholder="Search & Press Enter to Add (eg: INFY, TCS)"
          className="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleAddStock}
        />
        <span className="counts"> {watchlist.length} / 50</span>
      </div>

      <ul className="list">
        {watchlist.map((symbol, index) => {
          const liveData = marketData[symbol];
          const basePrice = basePrices[symbol] || 500;
          const currentPrice = liveData ? liveData.price : basePrice;

          let change = 0;
          let percent = "0.00%";
          let isDown = false;

          if (liveData) {
            change = currentPrice - basePrice;
            percent = `${change >= 0 ? "+" : ""}${((change / basePrice) * 100).toFixed(2)}%`;
            isDown = change < 0;
          }

          const stock = { name: symbol, price: currentPrice.toFixed(2), isDown, percent };

          return (
            <WatchListItem
              stock={stock}
              key={symbol + index}
              onRemove={() => handleRemoveStock(symbol)}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default WatchList;

const WatchListItem = ({ stock, onRemove }) => {
  const [showActions, setShowActions] = useState(false);
  const { openBuyWindow, openSellWindow } = useContext(GeneralContext);

  const handleMouseEnter = () => setShowActions(true);
  const handleMouseLeave = () => setShowActions(false);

  return (
    <li onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="item">
        <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>
        <div className="itemInfo">
          <span className="percent">{stock.percent}</span>
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
              title="Remove"
              placement="top"
              arrow
              TransitionComponent={Grow}
              onClick={onRemove}
            >
              <button className="action" style={{ color: "red" }}>
                <DeleteOutline className="icon" />
              </button>
            </Tooltip>
          </span>
        </div>
      )}
    </li>
  );
};
