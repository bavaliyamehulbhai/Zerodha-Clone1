import React from "react";
import { Link } from "react-router-dom";
import { Error } from "@mui/icons-material";

const NotFound = () => {
  return (
    <div
      className="orders"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div className="no-orders">
        <Error
          style={{ fontSize: "6rem", marginBottom: "20px", color: "#666" }}
        />
        <h2>404 Not Found</h2>
        <p>Sorry, the page you are looking for does not exist.</p>
        <Link to="/" className="btn">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
