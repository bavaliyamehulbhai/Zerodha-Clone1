import React from "react";
import { Link } from "react-router-dom";

function Hero() {
  return (
    <div className="container border-bottom mb-5">
      <div className="row text-center mt-5 mb-5">
        <div className="col-12 p-3">
          <h1 className="text-muted">Zerodha Products</h1>
          <p className="text-muted mt-2 fs-4">
            Sleek, modern, and intuitive trading platforms
          </p>
          <p className="mt-3 mb-5">
            Check out our{" "}
            <Link to="" style={{ textDecoration: "none" }}>
              investment offerings{" "}
              <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
