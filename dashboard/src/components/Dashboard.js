import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import Apps from "./Apps";
import Funds from "./Funds";
import Holdings from "./Holdings";
import Admin from "./Admin";
import Broker from "./Broker";
import Profile from "./Profile";
import Settings from "./Settings";
import ProtectedRoute from "./ProtectedRoute";

import Orders from "./Orders";
import Positions from "./Positions";
import Summary from "./Summary";
import WatchList from "./WatchList";
import NotFound from "./NotFound";
import { GeneralContextProvider } from "./GeneralContext";
import { MarketDataContextProvider } from "./MarketDataContext";
import { ToastContextProvider } from "./ToastContext";
import KYC from "./KYC";
import AdminKYC from "./AdminKYC";
import RMSAlerts from "./RMSAlerts";
import OrderBook from "./OrderBook";
import Reports from "./Reports";
import APIDashboard from "./APIDashboard";
import AuditLogs from "./AuditLogs";
import PaperTrading from "./PaperTrading";
import BrokerConfig from "./BrokerConfig";
import WithdrawalRequests from "./WithdrawalRequests";
import DepositRequests from "./DepositRequests";
import ChatWidget from "./ChatWidget";
import axios from "axios";

const Dashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (localStorage.getItem("theme") === "dark") {
      document.body.classList.add("dark-mode");
    }
    // Fetch user for chat context
    axios
      .get("http://localhost:3002/user", { withCredentials: true })
      .then((res) => {
        if (res.data.status) setUser(res.data);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="dashboard-container">
      <ToastContextProvider>
        <MarketDataContextProvider>
          <GeneralContextProvider>
            <WatchList />
          </GeneralContextProvider>
          <RMSAlerts />
          <div className="content">
            <Routes>
              <Route exact path="/" element={<Summary />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/orderbook/:symbol" element={<OrderBook />} />
              <Route path="/holdings" element={<Holdings />} />
              <Route path="/positions" element={<Positions />} />
              <Route path="/funds" element={<Funds />} />
              <Route path="/kyc" element={<KYC />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/api-dashboard" element={<APIDashboard />} />
              <Route path="/paper-trading" element={<PaperTrading />} />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/config"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <BrokerConfig />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/broker/withdrawals"
                element={
                  <ProtectedRoute allowedRoles={["broker", "admin"]}>
                    <WithdrawalRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/kyc"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminKYC />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/broker"
                element={
                  <ProtectedRoute allowedRoles={["broker"]}>
                    <Broker />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/broker/deposits"
                element={
                  <ProtectedRoute allowedRoles={["broker", "admin"]}>
                    <DepositRequests />
                  </ProtectedRoute>
                }
              />
              <Route path="/apps" element={<Apps />} />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <ChatWidget user={user} />
        </MarketDataContextProvider>
      </ToastContextProvider>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-container {
            flex-direction: column;
          }
          .content {
            width: 100%;
          }
          .watchlist-container {
            width: 100%;
            height: auto;
            max-height: 300px;
            overflow-y: auto;
          }
        }
        body.dark-mode {
          background-color: #121212;
          color: #e0e0e0;
        }
        body.dark-mode .dashboard-container,
        body.dark-mode .content,
        body.dark-mode .settings-section,
        body.dark-mode .profile-section,
        body.dark-mode .admin-section,
        body.dark-mode .broker-section {
           background-color: #121212;
           color: #e0e0e0;
        }
        body.dark-mode input, body.dark-mode select {
           background-color: #2d2d2d;
           color: #fff;
           border: 1px solid #444;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
