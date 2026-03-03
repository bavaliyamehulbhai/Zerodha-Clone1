import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState({
    email: "",
    password: "",
  });
  const { email, password } = inputValue;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({
      ...inputValue,
      [name]: value,
    });
  };

  const handleError = (err) =>
    toast.error(err, {
      position: "bottom-left",
    });
  const handleSuccess = (msg) =>
    toast.success(msg, {
      position: "bottom-right",
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return handleError("All fields are required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return handleError("Please enter a valid email address");
    }
    try {
      const { data } = await axios.post(
        "http://localhost:3002/login",
        {
          ...inputValue,
        },
        { withCredentials: true }
      );
      const { success, message, user } = data;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          if (user.role === "admin") {
            window.location.href = "http://localhost:3000/admin";
          } else if (user.role === "broker") {
            window.location.href = "http://localhost:3000/broker";
          } else {
            window.location.href = "http://localhost:3000/";
          }
        }, 1000);
      } else {
        handleError(message);
      }
    } catch (error) {
      handleError(error.response?.data?.message || error.message);
    }
    setInputValue({
      ...inputValue,
      email: "",
      password: "",
    });
  };

  return (
    <div className="form_container">
      <h2>Login Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            value={email}
            placeholder="Enter your email"
            onChange={handleOnChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            value={password}
            placeholder="Enter your password"
            onChange={handleOnChange}
          />
        </div>
        <button type="submit">Login</button>
        <span>
          Already have an account? <Link to={"/signup"}>Signup</Link>
        </span>
        <span style={{ marginTop: "10px" }}>
          <Link to={"/forgot-password"} style={{ textDecoration: "none", fontSize: "12px" }}>Forgot Password?</Link>
        </span>
      </form>

    </div>
  );
};

export default Login;
