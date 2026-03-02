import React from "react";

function Pricing() {
  return (
    <div className="container mt-5 mb-5">
      <style>
        {`
          .pricing-box {
            border-radius: 10px;
            transition: all 0.3s ease;
            cursor: pointer;
          }
          .pricing-box:hover {
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            transform: translateY(-5px);
            border-color: #387ed1;
          }
        `}
      </style>
      <div className="row">
        <div className="col-lg-4 col-sm-12">
          <h1 className="mb-3 fs-2">Unbeatable pricing</h1>
          <p className="text-muted">
            We pioneered the concept of discount broking and price transparency
            in India. Flat fees and no hidden charges.
          </p>
          <a href="" style={{ textDecoration: "none" }}>
            See pricing{" "}
            <i className="fa fa-long-arrow-right" aria-hidden="true"></i>
          </a>
        </div>
        <div className="col-lg-2 col-sm-12"></div>
        <div className="col-lg-6 col-sm-12">
          <div className="row text-center">
            <div className="col-6 p-3">
              <div className="border p-4 pricing-box">
                <h1 className="mb-3">₹0</h1>
                <p className="text-muted">
                  Free equity delivery and <br /> direct mutual funds
                </p>
              </div>
            </div>
            <div className="col-6 p-3">
              <div className="border p-4 pricing-box">
                <h1 className="mb-3">₹20</h1>
                <p className="text-muted">Intraday and F&O</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
