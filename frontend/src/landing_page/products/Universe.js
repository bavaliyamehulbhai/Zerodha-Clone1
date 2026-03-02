import React from "react";
import "./Universe.css";

function Universe() {
  return (
    <div className="container mt-5">
      <div className="row text-center">
        <h1 className="mt-5 text-muted" style={{fontSize: "1.5rem"}}>The Zerodha Universe</h1>
        <p className="mt-3 text-muted" style={{fontSize: "1"}}>
          Extend your trading and investment experience even further with our
          partner platforms
        </p>
        <div className="col-12 col-md-6 col-lg-4 p-3 mt-5">
          <img
            src="media/Images/zerodhaFundhouse.png"
            style={{ width: "190px" }}
            alt="ZerodhaFundhouse"
            className="img-fluid partner-logo"
          />
          <p className="text-muted mt-3" style={{ fontSize: "12px" }}>
            Our asset management venture that is creating simple and transparent
            index funds to help you save for your goals.
          </p>
        </div>
        <div className="col-12 col-md-6 col-lg-4 p-3 mt-5">
          <img
            src="media/Images/sensibullLogo.svg"
            style={{ width: "190px" }}
            alt="Sensibull"
            className="img-fluid partner-logo mt-3"
          />
          <p className="text-muted mt-3" style={{ fontSize: "12px" }}>
            Options trading platform that lets you create strategies, analyze
            positions, and examine data points like open interest, FII/DII, and
            more.
          </p>
        </div>
        <div className="col-12 col-md-6 col-lg-4 p-3 mt-5">
          <img
            src="media/Images/streakLogo.png"
            style={{ width: "190px" }}
            alt="streak"
            className="img-fluid partner-logo"
          />
          <p className="text-muted mt-3" style={{ fontSize: "12px" }}>
            Systematic trading platform that allows you to create and backtest
            strategies without coding.
          </p>
        </div>
        <div className="col-12 col-md-6 col-lg-4 p-3 mt-5">
          <img
            src="media/Images/smallcaseLogo.png"
            style={{ width: "190px" }}
            alt="smallcase"
            className="img-fluid partner-logo"
          />
          <p className="text-muted mt-3" style={{ fontSize: "12px" }}>
            Thematic investing platform that helps you invest in diversified
            baskets of stocks on ETFs.
          </p>
        </div>
        <div className="col-12 col-md-6 col-lg-4 p-3 mt-4">
          <img
            src="media/Images/dittoLogo.png"
            style={{ width: "190px" }}
            alt="ditto"
            className="img-fluid partner-logo"
          />
          <p className="text-muted mt-3" style={{ fontSize: "12px" }}>
            Personalized advice on life and health insurance. No spam and no
            mis-selling.
          </p>
        </div>
        <div className="col-12 col-md-6 col-lg-4 p-3 mt-5">
          <img
            src="media/Images/goldenpiLogo.png"
            style={{ width: "190px" }}
            alt="goldenpi"
            className="img-fluid partner-logo"
          />
          <p className="text-muted mt-3" style={{ fontSize: "12px" }}>
            Bonds trading platform.
          </p>
        </div>
        <div className="col-12 p-3 mt-4">
          <button
            className="btn btn-primary fs-5 mb-4 text-white signup-btn"
            style={{ width: "20%", minWidth: "200px" }}
            type="button"
          >
            Signup Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Universe;
