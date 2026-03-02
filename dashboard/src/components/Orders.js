import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DataTable from "./DataTable";
import ConfirmationModal from "./ConfirmationModal";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [orderToModify, setOrderToModify] = useState(null);
  const [modifyForm, setModifyForm] = useState({ price: "", qty: "" });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    axios
      .get("http://localhost:3002/allOrders", { withCredentials: true })
      .then((res) => {
        setOrders(res.data);
      })
      .catch((err) => console.error(err));
  };

  const handleCancelOrder = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelModal(true);
  };

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      const res = await axios.delete(
        `http://localhost:3002/cancelOrder/${orderToCancel}`,
        { withCredentials: true },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

  const handleOpenModifyModal = (order) => {
    setOrderToModify(order);
    setModifyForm({ price: order.price, qty: order.qty });
    setShowModifyModal(true);
  };

  const handleModifyOrder = async () => {
    if (!orderToModify) return;
    try {
      const res = await axios.put(
        `http://localhost:3002/modifyOrder/${orderToModify._id}`,
        { price: Number(modifyForm.price), qty: Number(modifyForm.qty) },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowModifyModal(false);
        setOrderToModify(null);
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to modify order");
    }
  };

  const filteredOrders = orders.filter((order) =>
    (order.name || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const columns = [
    {
      header: "Time",
      accessor: "createdAt",
      render: (row) =>
        new Date(row.createdAt || row.orderDate).toLocaleString(),
    },
    {
      header: "Type",
      accessor: "isPaper",
      render: (row) =>
        row.isPaper ? (
          <span className="badge paper">Paper</span>
        ) : (
          <span className="badge real">Real</span>
        ),
    },
    { header: "Product", accessor: "product" },
    { header: "Instrument", accessor: "name" },
    { header: "Qty", accessor: "qty" },
    { header: "Avg. Price", accessor: "price" },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className={`status ${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: (row) =>
        ["PENDING", "TRIGGER_PENDING", "AMO_REQ"].includes(row.status) ? (
          <div style={{ display: "flex", gap: "5px" }}>
            <button
              className="btn-modify"
              onClick={() => handleOpenModifyModal(row)}
            >
              Modify
            </button>
            <button
              className="btn-cancel"
              onClick={() => handleCancelOrder(row._id)}
            >
              Cancel
            </button>
          </div>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h3 className="title">Orders</h3>
        <input
          type="text"
          placeholder="Search by instrument..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>
      <DataTable
        columns={columns}
        data={filteredOrders}
        rowsPerPage={10}
        emptyMessage="No orders found"
      />
      {showModifyModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Modify Order</h3>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                value={modifyForm.qty}
                onChange={(e) =>
                  setModifyForm({ ...modifyForm, qty: e.target.value })
                }
              />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                step="0.05"
                value={modifyForm.price}
                onChange={(e) =>
                  setModifyForm({ ...modifyForm, price: e.target.value })
                }
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowModifyModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleModifyOrder}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={showCancelModal}
        title="Confirm Cancellation"
        message="Are you sure you want to cancel this order?"
        onConfirm={confirmCancelOrder}
        onCancel={() => setShowCancelModal(false)}
        confirmText="Yes, Cancel"
        cancelText="No"
      />
      <style>{`
        .orders-container { padding: 20px; }
        .orders-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .search-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; width: 250px; font-size: 0.9rem; }
        .badge { padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; }
        .badge.paper { background-color: #e3f2fd; color: #1976d2; border: 1px solid #bbdefb; }
        .badge.real { background-color: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
        .btn-modify { background-color: #ff9800; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .btn-modify:hover { background-color: #f57c00; }
        .btn-cancel { background-color: #ff5252; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .btn-cancel:hover { background-color: #ff1744; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal { background: white; padding: 20px; border-radius: 8px; width: 300px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: 500; }
        .form-group input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
        .btn-primary { background: #387ed1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .btn-secondary { background: #f0f0f0; color: #333; border: 1px solid #ccc; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        
        body.dark-mode .modal { background: #1e1e1e; border: 1px solid #333; color: #e0e0e0; }
        body.dark-mode .form-group input { background: #2d2d2d; border-color: #444; color: white; }
        body.dark-mode .btn-secondary { background: #2d2d2d; border-color: #444; color: #e0e0e0; }
        body.dark-mode .search-input { background: #2d2d2d; border-color: #444; color: #e0e0e0; }
      `}</style>
    </div>
  );
};

export default Orders;
