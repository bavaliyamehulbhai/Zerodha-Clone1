import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="container p-5 mb-5">
      <div className="row text-center">
        <h4 className="mt-5 pb-5">404 </h4>
         <h1 className="mt-5">Kiaan couldn’t find that page</h1>
        <h5 className="mt-5">We couldn’t find the page you were looking for. Visit <Link to="/">Zerodha’s home page </Link></h5>
      </div>
    </div>
  );
}

export default NotFound;
