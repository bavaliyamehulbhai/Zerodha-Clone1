import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const WithdrawalRequests = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3002/funds/broker/withdrawals",
        { withCredentials: true }
      );
      if (res.data.success) {
        setWithdrawals(res.data.withdrawals);
      }
    } catch (error) {
      console.error("Error fetching withdrawals", error);
      toast.error("Failed to fetch withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (withdrawalId, targetUserId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this withdrawal?`)) return;

    try {
      const res = await axios.post(
        "http://localhost:3002/funds/broker/withdraw-process",
        { targetUserId, withdrawalId, action },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchWithdrawals();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process request");
    }
  };

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="withdrawal-requests-container">
      <h3>Pending Withdrawal Requests</h3>
      {withdrawals.length === 0 ? (
        <div className="no-data">No pending withdrawals found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="withdrawals-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Requested At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w._id}>
                  <td>
                    <div className="user-info">
                      <span className="username">{w.username}</span>
                      <span className="email">{w.email}</span>
                    </div>
                  </td>
                  <td className="amount">₹{w.amount.toLocaleString()}</td>
                  <td>{new Date(w.requestedAt).toLocaleString()}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleAction(w._id, w.userId, "APPROVED")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleAction(w._id, w.userId, "REJECTED")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        .withdrawal-requests-container { padding: 20px; }
        .table-wrapper { background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); overflow: hidden; }
        .withdrawals-table { width: 100%; border-collapse: collapse; }
        .withdrawals-table th, .withdrawals-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
        .withdrawals-table th { background-color: #f9f9f9; font-weight: 600; color: #555; }
        .user-info { display: flex; flex-direction: column; }
        .username { font-weight: 500; color: #333; }
        .email { font-size: 0.85rem; color: #777; }
        .amount { font-weight: 600; color: #333; }
        .actions { display: flex; gap: 10px; }
        .btn-approve { background-color: #4caf50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
        .btn-reject { background-color: #f44336; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }
        .no-data { text-align: center; padding: 40px; color: #777; background: #fff; border-radius: 8px; }
      `}</style>
    </div>
  );
};

export default WithdrawalRequests;