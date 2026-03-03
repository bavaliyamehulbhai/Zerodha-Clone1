import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [timer, setTimer] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );
        const { exp } = JSON.parse(jsonPayload);

        const interval = setInterval(() => {
          const now = Date.now();
          const timeLeft = exp * 1000 - now;

          if (timeLeft <= 0) {
            clearInterval(interval);
            setTimer("Expired");
          } else {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            setTimer(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
          }
        }, 1000);

        return () => clearInterval(interval);
      } catch (error) {
        console.log(error);
      }
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (timer === "Expired") {
      return toast.error("Link expired. Please request a new one.");
    }
    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }
    try {
      const { data } = await axios.post(
        "http://localhost:3002/resetPasswordWithToken",
        { id, token, password }
      );
      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="form_container">
      <h2>Reset Password</h2>
      {timer && (
        <p
          style={{
            color: timer === "Expired" ? "red" : "green",
            textAlign: "center",
            fontSize: "1.2rem",
            fontWeight: "bold",
            margin: "10px 0",
          }}
        >
          Expires in: {timer}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">New Password</label>
          <input
            type="password"
            name="password"
            value={password}
            placeholder="Enter new password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            placeholder="Confirm new password"
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>

    </div>
  );
};

export default ResetPassword;
