import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const response = await axios.get("http://localhost:3002/user", {
          withCredentials: true,
        });
        setIsLoggedIn(response.data.status);
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  const handleLogout = async () => {
    await axios.post(
      "http://localhost:3002/logout",
      {},
      { withCredentials: true }
    );
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom navbar-light sticky-top"
      style={{ backgroundColor: "#FFF" }}
    >
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img
            src="media/Images/logo.svg"
            style={{ width: "25%" }}
            alt="Logo"
          />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              {!isLoggedIn ? (
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to="/signup"
                >
                  Signup
                </Link>
              ) : (
                <div
                  className="nav-link active"
                  style={{
                    cursor: "pointer",
                    backgroundColor: "#387ed1",
                    color: "#fff",
                    padding: "5px 20px",
                    borderRadius: "3px",
                    fontWeight: "500",
                    border: "none",
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </div>
              )}
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to="/about">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to="/product">
                Product
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to="/pricing">
                Pricing
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link active" to="/support">
                Support
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
