import React from "react";
import "./Hero.css";

function Hero() {
  return (
    <section className="container-fluid" id="supportHero">
      <div className="p-5 " id="supportWrapper">
        <h4>Support Portal</h4>
        <a href="">Track Tickets</a>
      </div>
      <div className="row p-5 m-3">
        <div className="col-6 p-3">
          <h1 className="fs-3">
            Search for an answer or browse help topics to create a ticket
          </h1>
          <div className="input-container">
            <input placeholder="Eg. how do i activate F&O, why is my order rejected ..." />
            <i className="fa fa-search"></i>
          </div>
          <div className="mt-3">
            <a href="" className="support-link">
              Track account opening
            </a>
            <a href="" className="support-link">
              Track segment activation
            </a>
            <a href="" className="support-link">
              Intraday margins
            </a>
            <a href="" className="support-link">
              Kite user manual
            </a>
          </div>
        </div>
        <div className="col-6 p-3">
          <h1 className="fs-3">Featured</h1>
          <ol>
            <li>
              <a href="">Current Takeovers and Delisting - January 2024</a>
            </li>
            <li>
              <a href="">Latest Intraday leverages - MIS & CO</a>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}

export default Hero;
