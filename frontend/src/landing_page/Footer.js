import React from "react";

function Footer() {
  return (
    <footer
      className="mt-5 footer-container"
      style={{
        backgroundColor: "#f5f5f5",
        padding: "30px 0px 5px",
        borderTop: "1px solid rgb(238, 238, 238)",
      }}
    >
      <style>
        {`
            .footer-container a:hover {
              color: #387ed1 !important;
            }
            .footer-container .fa {
              transition: transform 0.3s;
              font-size: 1.25rem;
            }
            .footer-container .fa:hover {
              transform: scale(1.3);
            }
            .footer-bottom a:hover {
              color: #387ed1 !important;
            }
        `}
      </style>
      <div className="container">
        <div className="row">
          <div className="col-lg col-md-6 mb-4">
            <img
              src="media/Images/logo.svg"
              style={{ width: "60%" }}
              alt="Logo"
            />
            <p className="mt-3 text-muted mb-4" style={{ fontSize: "0.8rem" }}>
              &copy; 2010 - 2024, Not Zerodha Broking Ltd. All rights reserved.
            </p>
            <ul className="list-unstyled d-flex gap-3 mt-4">
              <li>
                <a href="" className="text-muted">
                  <i className="fa fa-xing-square" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="" className="text-muted">
                  <i className="fa fa-facebook-square" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="" className="text-muted">
                  <i className="fa fa-instagram" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="" className="text-muted">
                  <i className="fa fa-linkedin-square" aria-hidden="true"></i>
                </a>
              </li>
            </ul>
            <hr />
            <ul className="list-unstyled d-flex gap-3 mt-2">
              <li>
                <a href="" className="text-muted">
                  <i className="fa fa-youtube-play" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="" className="text-muted">
                  <i className="fa fa-whatsapp" aria-hidden="true"></i>
                </a>
              </li>
              <li>
                <a href="" className="text-muted">
                  <i className="fa fa-telegram" aria-hidden="true"></i>
                </a>
              </li>
            </ul>
          </div>
          <div className="col-lg col-md-6 mb-4">
            <p className="fw-medium">Company</p>
            <div className="d-flex flex-column">
              <a href="" className="text-muted text-decoration-none mb-2">
                About
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Products
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Pricing
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Referral programme
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Careers
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Zerodha.tech
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Press & media
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Zerodha cares (CSR)
              </a>
            </div>
          </div>
          <div className="col-lg col-md-6 mb-4">
            <p className="fw-medium">Support</p>
            <div className="d-flex flex-column">
              <a href="" className="text-muted text-decoration-none mb-2">
                Contact
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Support portal
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Z-Connects blog
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                List of charges
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Downloads & resources
              </a>
            </div>
          </div>
          <div className="col-lg col-md-6 mb-4">
            <p className="fw-medium">Account</p>
            <div className="d-flex flex-column">
              <a href="" className="text-muted text-decoration-none mb-2">
                Open an account
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Fund transfer
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                60 day challenge
              </a>
            </div>
          </div>
          <div className="col-lg col-md-6 mb-4">
            <p className="fw-medium">Quick links</p>
            <div className="d-flex flex-column">
              <a href="" className="text-muted text-decoration-none mb-2">
                Upcoming IPOs
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Brokerage charges
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Market holidays
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Economic calendar
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Calculators
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Markets
              </a>
              <a href="" className="text-muted text-decoration-none mb-2">
                Sectors
              </a>
            </div>
          </div>
        </div>
        <div className="mt-5 text-muted" style={{ fontSize: "0.7rem" }}>
          <p>
            Zerodha Broking Ltd.: Member of NSE & BSE – SEBI Registration no.:
            INZ0000031633 CDSL: Depository services through Zerodha Securities
            Pvt. Ltd. – SEBI Registration no.: IN-DP-100-2015 Commodity Trading
            through Zerodha Commodities Pvt. Ltd. MCX: 46025 – SEBI Registration
            no.: INZ000003829. Registered Address: Zerodha Broking Ltd.,
            #153/154, 4th Cross, Dollars Colony, Opp. Clarence Public School,
            J.P Nagar 4th Phase, Bengaluru - 560078, Karnataka, India. For any
            complaints pertaining to securities broking please write to &nbsp;
            <a href="#" style={{ textDecoration: "none" }}>
              complaints@zerodha.com
            </a>
            , for DP related to &nbsp;{" "}
            <a href="#" style={{ textDecoration: "none" }}>
              dp@zerodha.com
            </a>
            . Please ensure you carefully read the Risk Disclosure Document as
            prescribed by SEBI | ICF
          </p>
          <p>
            Procedure to file a complaint on{" "}
            <a href="#" style={{ textDecoration: "none" }}>
              {" "}
              SEBI SCORES
            </a>
            : Register on SCORES portal. Mandatory details for filing complaints
            on SCORES: Name, PAN, Address, Mobile Number, E-mail ID. Benefits:
            Effective Communication, Speedy redressal of the grievances
          </p>
          <p>
            Investments in securities market are subject to market risks; read
            all the related documents carefully before investing.
          </p>
          <p>
            Attention investors: (1) Stock brokers can accept securities as
            margins from clients only by way of pledge in the depository system
            w.e.f September 01, 2020. (2) Update your e-mail and phone number
            with your stock broker / depository participant and receive OTP
            directly from depository on your e-mail and/or mobile number to
            create pledge. (3) Check your securities / MF / bonds in the
            consolidated account statement issued by NSDL/CDSL every month.
          </p>
          <p>
            India's largest broker based on networth as per NSE. NSE broker
            factsheet
          </p>
          <p>
            "Prevent unauthorised transactions in your account. Update your
            mobile numbers/email IDs with your stock brokers. Receive
            information of your transactions directly from Exchange on your
            mobile/email at the end of the day. Issued in the interest of
            investors. KYC is one time exercise while dealing in securities
            markets - once KYC is done through a SEBI registered intermediary
            (broker, DP, Mutual Fund etc.), you need not undergo the same
            process again when you approach another intermediary." Dear
            Investor, if you are subscribing to an IPO, there is no need to
            issue a cheque. Please write the Bank account number and sign the
            IPO application form to authorize your bank to make payment in case
            of allotment. In case of non allotment the funds will remain in your
            bank account. As a business we don't give stock tips, and have not
            authorized anyone to trade on behalf of others. If you find anyone
            claiming to be part of Zerodha and offering such services, please
            &nbsp;
            <a href="#" style={{ textDecoration: "none" }}>
              create a ticket here
            </a>
            .
          </p>
          <p>
            *Customers availing insurance advisory services offered by Ditto
            (Tacterial Consulting Private Limited | IRDAI Registered Corporate
            Agent (Composite) License No CA0738) will not have access to the
            exchange investor grievance redressal forum, SEBI SCORES/ODR, or
            arbitration mechanism for such products.
          </p>
          <div
            className="footer-bottom text-center py-3"
            style={{ fontSize: "12px" }}
          >
            <a href="" className="text-muted text-decoration-none mx-2">
              NSE
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              BSE
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              MCX
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              Terms & conditions
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              Policies & procedures
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              Privacy policy
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              Disclosure
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              For investor's attention
            </a>
            <a href="" className="text-muted text-decoration-none mx-2">
              Investor charter
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
