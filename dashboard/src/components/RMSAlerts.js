import React, { useContext } from "react";
import { MarketDataContext } from "./MarketDataContext";
import { Alert, AlertTitle, IconButton, Collapse } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const RMSAlerts = () => {
  const { rmsAlerts, removeRmsAlert } = useContext(MarketDataContext);

  if (!rmsAlerts || rmsAlerts.length === 0) return null;

  return (
    <div className="rms-alerts-container">
      {rmsAlerts.map((alert) => (
        <Collapse in={true} key={alert.id}>
          <Alert
            severity={alert.level === "critical" ? "error" : "warning"}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  removeRmsAlert(alert.id);
                }}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2, boxShadow: 3, minWidth: "300px" }}
          >
            <AlertTitle>
              {alert.event === "rms:squareoff"
                ? "Auto Square-off"
                : "Risk Alert"}
            </AlertTitle>
            {alert.message}
            {alert.instrument && (
              <div style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                <strong>{alert.instrument}</strong> | Qty: {alert.qty}
              </div>
            )}
          </Alert>
        </Collapse>
      ))}
      <style>{`
        .rms-alerts-container {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 2000;
          max-height: 600px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default RMSAlerts;
