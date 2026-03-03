import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { ToastContext } from "./ToastContext";

export const MarketDataContext = createContext();

export const MarketDataContextProvider = ({ children }) => {
  const [marketData, setMarketData] = useState({});
  const socketRef = useRef(null);
  const alertsRef = useRef([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [rmsAlerts, setRmsAlerts] = useState([]);
  const [orderQueue, setOrderQueue] = useState(() => {
    const savedQueue = localStorage.getItem("orderQueue");
    const parsed = savedQueue ? JSON.parse(savedQueue) : [];
    return parsed.map((o) =>
      o.id ? o : { ...o, id: Date.now() + Math.random() },
    );
  });
  const [lastOrderProcessedTime, setLastOrderProcessedTime] = useState(null);
  const { showToast } = useContext(ToastContext);

  useEffect(() => {
    const socket = io("http://localhost:3002", { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to Market Data via Socket.IO");
    });

    socket.on("market_snapshot", (snapshotArray) => {
      const initialData = {};
      snapshotArray.forEach((tick) => {
        initialData[tick.symbol] = tick;
      });
      setMarketData((prev) => ({ ...prev, ...initialData }));
    });

    socket.on("tick", (data) => {
      // Check for alerts
      const prevAlertsLength = alertsRef.current.length;
      alertsRef.current = alertsRef.current.filter((alert) => {
        if (alert.symbol === data.symbol && data.price >= alert.targetPrice) {
          const audio = new Audio(
            "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
          );
          audio.play().catch((e) => console.error("Audio play failed", e));
          return false;
        }
        return true;
      });

      if (alertsRef.current.length !== prevAlertsLength) {
        setActiveAlerts([...alertsRef.current]);
      }

      setMarketData((prevData) => ({
        ...prevData,
        [data.symbol]: data,
      }));
    });

    socket.on("notification", (data) => {
      const newAlert = {
        id: Date.now(),
        event: "notification",
        ...data,
        timestamp: new Date(),
      };
      setRmsAlerts((prev) => [newAlert, ...prev]);
      showToast(
        `${data.title}: ${data.message}`,
        data.type === "RMS_ALERT" ? "warning" : "info",
      );
    });

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      socket.close();
    };
  }, [showToast]);

  const subscribe = (symbols) => {
    if (socketRef.current && socketRef.current.connected) {
      // The current backend doesn't use a subscription model, it broadcasts all ticks.
      // This function is kept for future compatibility.
      // socketRef.current.emit("subscribe", { symbols });
    } else if (socketRef.current) {
      socketRef.current.on(
        "connect",
        () => {
          // socketRef.current.emit("subscribe", { symbols });
        },
        { once: true },
      );
    }
  };

  const setAlert = (symbol, targetPrice) => {
    alertsRef.current.push({ symbol, targetPrice });
    setActiveAlerts([...alertsRef.current]);
  };

  const deleteAlert = (index) => {
    alertsRef.current.splice(index, 1);
    setActiveAlerts([...alertsRef.current]);
  };

  const isMarketOpen = () => {
    const now = new Date();
    // Convert current time to IST (UTC + 5:30)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 3600000 * 5.5);

    const day = ist.getDay();
    const hours = ist.getHours();
    const minutes = ist.getMinutes();

    // Market is closed on Sunday (0) and Saturday (6)
    if (day === 0 || day === 6) return false;

    const currentMinutes = hours * 60 + minutes;
    // Market Open: 9:15 AM (555 mins) | Market Close: 3:30 PM (930 mins)
    return currentMinutes >= 555 && currentMinutes < 930;
  };

  const addToQueue = (order) => {
    setOrderQueue((prev) => [...prev, { ...order, id: Date.now() }]);
  };

  const removeFromQueue = (id) => {
    setOrderQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const removeRmsAlert = (id) => {
    setRmsAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  const updateOrderInQueue = (id, updatedOrder) => {
    setOrderQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updatedOrder } : item,
      ),
    );
  };

  useEffect(() => {
    localStorage.setItem("orderQueue", JSON.stringify(orderQueue));
  }, [orderQueue]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isMarketOpen() && orderQueue.length > 0) {
        processQueue();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [orderQueue]);

  const processQueue = async () => {
    const ordersToProcess = [...orderQueue];
    setOrderQueue([]); // Clear queue

    for (const order of ordersToProcess) {
      try {
        await axios.post("http://localhost:3002/newOrder", order, {
          withCredentials: true,
        });
        console.log("Processed queued order for", order.name);
      } catch (err) {
        console.error("Failed to process queued order", err);
      }
    }
    if (ordersToProcess.length > 0) {
      setLastOrderProcessedTime(Date.now());
      showToast(
        `Market is open! Executed ${ordersToProcess.length} pre-market orders.`,
        "success",
      );
    }
  };

  return (
    <MarketDataContext.Provider
      value={{
        marketData,
        subscribe,
        setAlert,
        activeAlerts,
        deleteAlert,
        isMarketOpen,
        addToQueue,
        removeFromQueue,
        updateOrderInQueue,
        orderQueue,
        lastOrderProcessedTime,
        rmsAlerts,
        removeRmsAlert,
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
};
