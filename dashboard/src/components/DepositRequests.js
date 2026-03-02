import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const DepositRequests = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const res = await axios.get(
        "http://localhost:3002/funds/broker/deposits",
        { withCredentials: true }
      );
      if (res.data.success) {
        setDeposits(res.data.deposits);
      }
    } catch (error) {
      console.error("Error fetching deposits", error);
      toast.error("Failed to fetch deposit requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (depositId, targetUserId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this deposit?`)) return;

    try {
      const res = await axios.post(
        "http://localhost:3002/funds/broker/deposit-process",
        { targetUserId, depositId, action },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        fetchDeposits();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process request");
    }
  };

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="deposit-requests-container">
      <h3>Pending Deposit Requests</h3>
      {deposits.length === 0 ? (
        <div className="no-data">No pending deposits found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="deposits-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Payment ID</th>
                <th>Requested At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d._id}>
                  <td>
                    <div className="user-info">
                      <span className="username">{d.username}</span>
                      <span className="email">{d.email}</span>
                    </div>
                  </td>
                  <td className="amount">₹{d.amount.toLocaleString()}</td>
                  <td>{d.paymentId}</td>
                  <td>{new Date(d.requestedAt).toLocaleString()}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleAction(d._id, d.userId, "APPROVED")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleAction(d._id, d.userId, "REJECTED")}
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
        .deposit-requests-container { padding: 20px; }
        .table-wrapper { background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); overflow: hidden; }
        .deposits-table { width: 100%; border-collapse: collapse; }
        .deposits-table th, .deposits-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
        .deposits-table th { background-color: #f9f9f9; font-weight: 600; color: #555; }
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

export default DepositRequests;