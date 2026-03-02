import React from "react";

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "No",
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "5px",
          width: "300px",
          textAlign: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          color: "black",
        }}
      >
        <h4>{title}</h4>
        <p>{message}</p>
        <div style={{ marginTop: "20px" }}>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              marginRight: "10px",
              cursor: "pointer",
            }}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: "#ccc",
              color: "black",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
