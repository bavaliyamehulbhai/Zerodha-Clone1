import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import UserProfile from "./UserProfile";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmationModal from "./ConfirmationModal";
import {
  Menu as MenuIcon,
  NotificationsNone,
  DoneAll,
  Delete,
  Refresh,
} from "@mui/icons-material";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [username, setUsername] = useState("USERID");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const isFirstLoad = useRef(true);
  const [lastReadTime, setLastReadTime] = useState(() => {
    const saved = localStorage.getItem("lastReadTime");
    return saved ? new Date(saved) : null;
  });
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3002/user", { withCredentials: true })
      .then((res) => {
        if (res.data.status) {
          setUsername(res.data.user);
          setEmail(res.data.email);
          setRole(res.data.role);
        } else {
          if (window.location.pathname !== "/login") {
            window.location.href = "http://localhost:3001/login";
          }
        }
      })
      .catch((err) => {
        console.log(err);
        if (window.location.pathname !== "/login") {
          window.location.href = "http://localhost:3001/login";
        }
      });
  }, []);

  const fetchAlerts = () => {
    axios
      .get("http://localhost:3002/notifications", { withCredentials: true })
      .then((res) => {
        setAlerts((prev) => {
          if (!isFirstLoad.current && res.data.length > prev.length) {
            const audio = new Audio(
              "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
            );
            audio.play().catch((e) => console.log(e));
            toast.info(`New Alert: ${res.data[0].title}`);
          }
          isFirstLoad.current = false;
          return res.data;
        });
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
    setIsNavOpen(false);
  };

  const handleLogout = () => {
    axios
      .post("http://localhost:3002/logout", {}, { withCredentials: true })
      .then(() => {
        // Redirect to the frontend login page
        window.location.href = "http://localhost:3001/login";
      })
      .catch((err) => console.log(err));
  };

  const handleMarkAllRead = () => {
    if (alerts.length > 0) {
      const latestAlertTime = new Date(alerts[0].createdAt);
      setLastReadTime(latestAlertTime);
      localStorage.setItem("lastReadTime", latestAlertTime.toISOString());
    }
  };

  const handleClearAllAlerts = () => {
    axios
      .delete("http://localhost:3002/notifications", { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setAlerts([]);
          setLastReadTime(null);
          localStorage.removeItem("lastReadTime");
        }
      })
      .catch((err) => console.log(err));
  };

  const handleDeleteAlert = (id) => {
    setAlertToDelete(id);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAlert = () => {
    if (!alertToDelete) return;
    axios
      .delete(`http://localhost:3002/notifications/${alertToDelete}`, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          setAlerts((prev) => prev.filter((alert) => alert._id !== alertToDelete));
          toast.success("Alert deleted");
        }
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setShowDeleteConfirmModal(false);
        setAlertToDelete(null);
      });
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  const unreadAlerts = alerts.filter(
    (alert) => !lastReadTime || new Date(alert.createdAt) > lastReadTime,
  );
  const unreadCount = unreadAlerts.length;

  return (
    <div className="menu-container">
      <ToastContainer position="bottom-right" autoClose={3000} />
      <img src="logo.png" style={{ width: "50px" }} />
      <div className="menu-toggle" onClick={() => setIsNavOpen(!isNavOpen)}>
        <MenuIcon style={{ fontSize: "2rem", color: "#444" }} />
      </div>
      <div className={`menus ${isNavOpen ? "active" : ""}`}>
        <ul>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => handleMenuClick(0)}
            >
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                Dashboard
              </p>
            </Link>
          </li>
          {role === "admin" && (
            <li>
              <Link
                style={{ textDecoration: "none" }}
                to="/orders"
                onClick={() => handleMenuClick(1)}
              >
                <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                  Orders
                </p>
              </Link>
            </li>
          )}
          {role === "broker" && (
            <li>
              <Link
                style={{ textDecoration: "none" }}
                to="/broker"
                onClick={() => handleMenuClick(7)}
              >
                <p className={selectedMenu === 7 ? activeMenuClass : menuClass}>
                  Broker
                </p>
              </Link>
            </li>
          )}
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/holdings"
              onClick={() => handleMenuClick(2)}
            >
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                Holdings
              </p>
            </Link>
          </li>
          {role === "admin" && (
            <li>
              <Link
                style={{ textDecoration: "none" }}
                to="/positions"
                onClick={() => handleMenuClick(3)}
              >
                <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                  Positions
                </p>
              </Link>
            </li>
          )}
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="funds"
              onClick={() => handleMenuClick(4)}
            >
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                Funds
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/admin"
              onClick={() => handleMenuClick(5)}
            >
              <p className={selectedMenu === 5 ? activeMenuClass : menuClass}>
                Admin
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/apps"
              onClick={() => handleMenuClick(6)}
            >
              <p className={selectedMenu === 6 ? activeMenuClass : menuClass}>
                Apps
              </p>
            </Link>
          </li>
        </ul>
        <hr />
        <div
          className="profile"
          onClick={() => setIsAlertsOpen(!isAlertsOpen)}
          style={{
            marginRight: "20px",
            position: "relative",
            cursor: "pointer",
          }}
        >
          <NotificationsNone />
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-5px",
                right: "-5px",
                background: "#d32f2f",
                color: "white",
                borderRadius: "50%",
                padding: "2px 5px",
                fontSize: "10px",
              }}
            >
              {unreadCount}
            </span>
          )}
          {isAlertsOpen && (
            <div
              className="profile-dropdown"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                backgroundColor: "white",
                padding: "10px",
                boxShadow: "0px 0px 5px rgba(0,0,0,0.1)",
                zIndex: 1000,
                width: "250px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h5 style={{ margin: 0, fontSize: "14px" }}>Alerts</h5>
                <div>
                  <button
                    onClick={fetchAlerts}
                    title="Refresh alerts"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#387ed1",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      marginRight: "5px",
                    }}
                  >
                    <Refresh style={{ fontSize: "16px" }} />
                  </button>
                  <button
                    onClick={handleMarkAllRead}
                    title="Mark all as read"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#387ed1",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      marginRight: "5px",
                    }}
                  >
                    <DoneAll style={{ fontSize: "16px" }} />
                  </button>
                  <button
                    onClick={handleClearAllAlerts}
                    title="Delete all alerts"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#d32f2f",
                      cursor: "pointer",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <Delete style={{ fontSize: "16px" }} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "5px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                {["all", "info", "warning", "error"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    style={{
                      border: "none",
                      background:
                        filterType === type ? "#e0e0e0" : "transparent",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "10px",
                      cursor: "pointer",
                      textTransform: "capitalize",
                      fontWeight: filterType === type ? "600" : "400",
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
              {alerts.filter(
                (alert) =>
                  (filterType === "all" || alert.type === filterType) &&
                  ((alert.title || "")
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                    (alert.message || "")
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())),
              ).length === 0 ? (
                <p style={{ fontSize: "12px", color: "#666" }}>No new alerts</p>
              ) : (
                alerts
                  .filter(
                    (alert) =>
                      (filterType === "all" || alert.type === filterType) &&
                      ((alert.title || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                        (alert.message || "")
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())),
                  )
                  .map((alert) => (
                    <div
                      key={alert._id}
                      style={{
                        marginBottom: "10px",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "5px",
                        opacity:
                          lastReadTime &&
                          new Date(alert.createdAt) <= lastReadTime
                            ? 0.5
                            : 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <strong style={{ fontSize: "12px", display: "block" }}>
                          {alert.title}
                        </strong>
                        <button
                          onClick={() => handleDeleteAlert(alert._id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0",
                            color: "#d32f2f",
                          }}
                        >
                          <Delete style={{ fontSize: "14px" }} />
                        </button>
                      </div>
                      <span style={{ fontSize: "11px", color: "#444" }}>
                        {alert.message}
                      </span>
                      <br />
                      <span style={{ fontSize: "10px", color: "#999" }}>
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
        <UserProfile
          username={username}
          email={email}
          role={role}
          onLogout={handleLogout}
          notifications={unreadCount}
        />
      </div>
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        title="Confirm Deletion"
        message="Are you sure you want to delete this alert?"
        onConfirm={confirmDeleteAlert}
        onCancel={() => setShowDeleteConfirmModal(false)}
        confirmText="Delete"
        cancelText="Cancel"
      />
      <style>{`
        .menu-toggle {
          display: none;
        }
        body.dark-mode .Toastify__toast {
          background-color: #1e1e1e;
          color: #e0e0e0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        body.dark-mode .Toastify__close-button {
          color: #e0e0e0;
        }
        body.dark-mode .Toastify__progress-bar {
          background: #387ed1;
        }
        @media (max-width: 768px) {
          .menu-container {
            justify-content: space-between;
            padding: 15px;
          }
          .menu-toggle {
            display: block;
            cursor: pointer;
          }
          .menus {
            display: none;
            flex-direction: column;
            position: absolute;
            top: 60px;
            left: 0;
            width: 100%;
            background-color: #fff;
            border-bottom: 1px solid #eee;
            z-index: 1000;
            padding-bottom: 20px;
          }
          .menus.active {
            display: flex;
          }
          .menus ul {
            flex-direction: column;
            gap: 15px;
          }
          .profile {
            justify-content: center;
            margin-top: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Menu;
