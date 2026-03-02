import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Settings = () => {
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [alertData, setAlertData] = useState({
    title: "",
    message: "",
    type: "info",
  });
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    axios
      .get("http://localhost:3002/settings/registration", {
        withCredentials: true,
      })
      .then((res) => {
        setAllowRegistration(res.data.allowRegistration);
      })
      .catch((err) => console.log(err));
  }, []);

  const handleToggle = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:3002/settings/registration",
        { allowRegistration: !allowRegistration },
        { withCredentials: true }
      );
      if (data.success) {
        setAllowRegistration(data.allowRegistration);
        toast.success(data.message);
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("Error updating settings");
    }
  };

  const handleDarkModeToggle = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  };

  const handleAlertChange = (e) => {
    setAlertData({ ...alertData, [e.target.name]: e.target.value });
  };

  const handleBroadcastAlert = async (e) => {
    e.preventDefault();
    if (!alertData.title || !alertData.message) {
      return toast.error("Title and message are required");
    }
    try {
      const { data } = await axios.post("http://localhost:3002/newAlert", alertData);
      if (data.success) {
        toast.success("Alert broadcasted successfully");
        setAlertData({ title: "", message: "", type: "info" });
      } else {
        toast.error("Failed to broadcast alert");
      }
    } catch (error) {
      toast.error("Error broadcasting alert");
    }
  };

  return (
    <div className="settings-section" style={{ padding: "20px" }}>
      <h3 className="title">Settings</h3>
      <div className="settings-content" style={{ marginTop: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "500" }}>
            Allow New User Registrations:
          </label>
          <input
            type="checkbox"
            checked={allowRegistration}
            onChange={handleToggle}
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
          <span>{allowRegistration ? "Enabled" : "Disabled"}</span>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "5px" }}>
          When disabled, only admins can create new users. Public signup will be
          blocked.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <label style={{ fontWeight: "500" }}>Dark Mode:</label>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={handleDarkModeToggle}
            style={{ width: "20px", height: "20px", cursor: "pointer" }}
          />
          <span>{darkMode ? "On" : "Off"}</span>
        </div>

        <hr style={{ margin: "30px 0", border: "0", borderTop: "1px solid #eee" }} />
        
        <h4 style={{ marginBottom: "15px" }}>Broadcast Admin Alert</h4>
        <form onSubmit={handleBroadcastAlert} style={{ display: "flex", flexDirection: "column", gap: "15px", maxWidth: "400px" }}>
          <input type="text" name="title" placeholder="Alert Title" value={alertData.title} onChange={handleAlertChange} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }} />
          <textarea name="message" placeholder="Alert Message" value={alertData.message} onChange={handleAlertChange} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px", minHeight: "80px" }} />
          <select name="type" value={alertData.type} onChange={handleAlertChange} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "4px" }}>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button type="submit" style={{ padding: "10px", backgroundColor: "#ff9800", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>
            Broadcast Alert
          </button>
        </form>

      </div>
      <ToastContainer />
    </div>
  );
};

export default Settings;
