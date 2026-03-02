import React, { useState, useEffect } from "react";
import axios from "axios";
import DataTable from "./DataTable";

const TransactionHistoryModal = ({ isOpen, onClose, userId, username }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchTransactions();
    }
  }, [isOpen, userId]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3002/funds/admin/transactions/${userId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setTransactions(res.data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const columns = [
    { header: "Date", accessor: "date", render: (row) => new Date(row.date).toLocaleString() },
    { header: "Type", accessor: "transactionType" },
    { header: "Amount", accessor: "amount", render: (row) => row.amount.toFixed(2) },
    { header: "Balance", accessor: "balanceAfter", render: (row) => row.balanceAfter.toFixed(2) },
    { header: "Description", accessor: "description" },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Transaction History: {username}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <DataTable columns={columns} data={transactions} rowsPerPage={5} emptyMessage="No transactions found" />
          )}
        </div>
      </div>
      <style>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: white; padding: 20px; border-radius: 8px; width: 800px; max-height: 80vh; overflow-y: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .modal-header h3 { margin: 0; }
        .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
        .close-btn:hover { color: #000; }
        
        body.dark-mode .modal-content { background: #1e1e1e; color: #e0e0e0; }
        body.dark-mode .modal-header { border-bottom-color: #333; }
        body.dark-mode .close-btn { color: #aaa; }
        body.dark-mode .close-btn:hover { color: #fff; }
      `}</style>
    </div>
  );
};

export default TransactionHistoryModal;