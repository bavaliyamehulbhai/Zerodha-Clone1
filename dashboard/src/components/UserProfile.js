import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Person,
  ExitToApp,
  Settings,
  AccountBalanceWallet,
  HelpOutline,
  TrendingUp,
  VerifiedUser,
} from "@mui/icons-material";

const Profile = ({ username, email, role, onLogout, notifications }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isBadgeVisible, setIsBadgeVisible] = useState(true);
  const profileRef = useRef(null);
  const itemsRef = useRef([]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    setIsBadgeVisible(false);
  };

  useEffect(() => {
    setIsBadgeVisible(true);
  }, [notifications]);

  // Reset refs on every render to ensure they match the current DOM
  itemsRef.current = [];

  const links = [
    { to: "/profile", icon: Person, label: "Profile" },
    { to: "/funds", icon: AccountBalanceWallet, label: "Funds" },
    { to: "/apps", icon: TrendingUp, label: "Console" },
    { to: "/kyc", icon: VerifiedUser, label: "KYC" },
    { to: "", icon: HelpOutline, label: "Support" },
  ];

  if (role === "admin") {
    links.push({ to: "/settings", icon: Settings, label: "Settings" });
    links.push({ to: "/admin/kyc", icon: VerifiedUser, label: "KYC Requests" });
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (event) => {
      const count = itemsRef.current.length;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % count);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + count) % count);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (focusedIndex !== -1 && itemsRef.current[focusedIndex]) {
          itemsRef.current[focusedIndex].click();
        }
      } else if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex]);

  return (
    <div
      className="user-profile-widget"
      onClick={toggleDropdown}
      ref={profileRef}
    >
      <div className="profile-trigger">
        <div className="avatar">
          {username && username !== "USERID" ? username[0].toUpperCase() : "U"}
          {notifications > 0 && isBadgeVisible && (
            <span className="notification-badge">{notifications}</span>
          )}
        </div>
        <span className="username-text">{username}</span>
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="user-info-mini">
            <div className="name">{username}</div>
            <div className="email">{email}</div>
          </div>
          <hr className="divider" />
          {links.map((link, index) => (
            <Link
              key={index}
              to={link.to}
              className={`menu-item ${focusedIndex === index ? "focused" : ""}`}
              onClick={() => setIsOpen(false)}
              ref={(el) => (itemsRef.current[index] = el)}
            >
              <link.icon className="icon" /> {link.label}
            </Link>
          ))}
          <hr className="divider" />
          <div
            className={`menu-item logout ${
              focusedIndex === links.length ? "focused" : ""
            }`}
            onClick={onLogout}
            ref={(el) => (itemsRef.current[links.length] = el)}
          >
            <ExitToApp className="icon" /> Logout
          </div>
        </div>
      )}

      <style>{`
        :root {
          --profile-bg: #ffffff;
          --profile-text: #444;
          --profile-hover: #f5f5f5;
          --profile-shadow: 0px 4px 12px rgba(0,0,0,0.15);
          --avatar-bg: #387ed1;
        }

        body.dark-mode {
          --profile-bg: #1e1e1e;
          --profile-text: #e0e0e0;
          --profile-hover: #333;
          --profile-shadow: 0px 4px 12px rgba(0,0,0,0.5);
          --avatar-bg: #387ed1;
        }

        .user-profile-widget {
          position: relative;
          margin-left: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          cursor: pointer;
          padding: 5px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .profile-trigger:hover {
          background-color: var(--profile-hover);
          transform: scale(1.02);
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--avatar-bg);
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 600;
          font-size: 14px;
          margin-right: 8px;
          position: relative;
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background-color: #d32f2f;
          color: white;
          border-radius: 50%;
          padding: 2px 4px;
          font-size: 9px;
          min-width: 14px;
          text-align: center;
          border: 1px solid var(--profile-bg);
          animation: pulse 1.5s infinite ease-in-out;
        }

        .username-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--profile-text);
        }

        .dropdown-menu {
          position: absolute;
          top: 120%;
          right: 0;
          width: 200px;
          background-color: var(--profile-bg);
          border-radius: 4px;
          box-shadow: var(--profile-shadow);
          padding: 10px 0;
          z-index: 1000;
          transform-origin: top right;
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .user-info-mini {
          padding: 0 15px 10px;
        }

        .user-info-mini .name { font-weight: 600; font-size: 14px; color: var(--profile-text); }
        .user-info-mini .email { font-size: 11px; color: #888; margin-top: 2px; }

        .menu-item {
          display: flex;
          align-items: center;
          padding: 10px 15px;
          text-decoration: none;
          color: var(--profile-text);
          font-size: 13px;
          transition: background 0.2s;
          cursor: pointer;
        }

        .menu-item:hover {
          background-color: var(--profile-hover);
        }
        .menu-item.focused {
          background-color: var(--profile-hover);
        }

        .menu-item .icon {
          font-size: 18px;
          margin-right: 10px;
          opacity: 0.7;
        }

        .menu-item.logout { color: #d32f2f; }
        .menu-item.logout:hover { background-color: #ffebee; }
        body.dark-mode .menu-item.logout:hover { background-color: #3e2727; }

        .divider { border: 0; border-top: 1px solid var(--profile-hover); margin: 5px 0; }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }

        @media (max-width: 768px) {
          .username-text { display: none; }
          .avatar { margin-right: 0; width: 28px; height: 28px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
