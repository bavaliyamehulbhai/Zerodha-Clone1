import React, { useState, useEffect } from "react";
import axios from "axios";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("http://localhost:3002/user", {
          withCredentials: true,
        });
        if (res.data.status) {
          if (allowedRoles.includes(res.data.role)) {
            setUserData(res.data);
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          window.location.href = "http://localhost:3000/login";
        }
      } catch (err) {
        window.location.href = "http://localhost:3000/login";
      }
    };
    checkAuth();
  }, [allowedRoles]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <h3>You are not authorized to view this page.</h3>;
  }

  return React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { user: userData });
    }
    return child;
  });
};

export default ProtectedRoute;
