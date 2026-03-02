import React, { useState } from "react";

function Table() {
  const [activeTable, setActiveTable] = useState("equity");

  return (
    <div className="container">
      <div className="row p-5 text-center">
        <div className="col-12">
          <div className="btn-group mb-5" role="group">
            <button
              type="button"
              className={`btn ${
                activeTable === "equity" ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => setActiveTable("equity")}
            >
              Equity
            </button>
            <button
              type="button"
              className={`btn ${
                activeTable === "currency"
                  ? "btn-primary"
                  : "btn-outline-primary"
              }`}
              onClick={() => setActiveTable("currency")}
            >
              Currency & Commodity
            </button>
          </div>

          {activeTable === "equity" && (
            <div>
              <h3 className="fs-5 text-center mb-5">Equity</h3>
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Equity Delivery</th>
                    <th>Equity Intraday</th>
                    <th>F&O - Futures</th>
                    <th>F&O - Options</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Brokerage</td>
                    <td>Zero Brokerage</td>
                    <td>0.03% or Rs. 20/exec order</td>
                    <td>0.03% or Rs. 20/exec order</td>
                    <td>Flat Rs. 20 per order</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        title="Securities Transaction Tax / Commodities Transaction Tax"
                        style={{
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          cursor: "help",
                        }}
                      >
                        STT/CTT
                      </span>
                    </td>
                    <td>0.1% on buy & sell</td>
                    <td>0.025% on sell</td>
                    <td>0.01% on sell</td>
                    <td>0.05% on sell</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        title="Exchange transaction charges"
                        style={{
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          cursor: "help",
                        }}
                      >
                        Transaction Charges
                      </span>
                    </td>
                    <td>NSE: 0.00345%, BSE: 0.00345%</td>
                    <td>NSE: 0.00345%, BSE: 0.00345%</td>
                    <td>NSE: 0.002%, BSE: 0</td>
                    <td>NSE: 0.053%, BSE: 0</td>
                  </tr>
                  <tr>
                    <td>GST</td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                  </tr>
                  <tr>
                    <td>SEBI Charges</td>
                    <td>₹10 / crore</td>
                    <td>₹10 / crore</td>
                    <td>₹10 / crore</td>
                    <td>₹10 / crore</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTable === "currency" && (
            <div>
              <h3 className="fs-5 text-center mb-5">Currency & Commodity</h3>
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Currency Futures</th>
                    <th>Currency Options</th>
                    <th>Commodity Futures</th>
                    <th>Commodity Options</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Brokerage</td>
                    <td>0.03% or Rs. 20/exec order</td>
                    <td>Flat Rs. 20 per order</td>
                    <td>0.03% or Rs. 20/exec order</td>
                    <td>Flat Rs. 20 per order</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        title="Securities Transaction Tax / Commodities Transaction Tax"
                        style={{
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          cursor: "help",
                        }}
                      >
                        STT/CTT
                      </span>
                    </td>
                    <td>No STT</td>
                    <td>No STT</td>
                    <td>0.01% on sell side (Non-Agri)</td>
                    <td>0.05% on sell</td>
                  </tr>
                  <tr>
                    <td>
                      <span
                        title="Exchange transaction charges"
                        style={{
                          textDecoration: "underline",
                          textDecorationStyle: "dotted",
                          cursor: "help",
                        }}
                      >
                        Transaction Charges
                      </span>
                    </td>
                    <td>NSE: 0.0009% | BSE: 0.00022%</td>
                    <td>NSE: 0.035% | BSE: 0.001%</td>
                    <td>MCX: 0.0021%</td>
                    <td>MCX: 0.0418%</td>
                  </tr>
                  <tr>
                    <td>GST</td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                    <td>
                      18% on (brokerage + SEBI charges + transaction charges)
                    </td>
                  </tr>
                  <tr>
                    <td>SEBI Charges</td>
                    <td>₹10 / crore</td>
                    <td>₹10 / crore</td>
                    <td>₹10 / crore</td>
                    <td>₹10 / crore</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="text-center mt-5">
            <a href="" className="text-decoration-none fs-5">Calculate your costs &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Table;
