import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  AccountBalanceWallet,
  AddCard,
  History,
  AccountBalance,
  Delete,
  VerifiedUser,
} from "@mui/icons-material";

const Funds = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [amount, setAmount] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Bank Form
  const [bankForm, setBankForm] = useState({
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branch: "",
  });

  // UPI Form
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await axios.get("http://localhost:3002/funds/wallet", {
        withCredentials: true,
      });
      if (res.data.success) {
        setWallet(res.data.wallet);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch wallet");
      setWallet(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return toast.error("Invalid amount");
    try {
      const res = await axios.post(
        "http://localhost:3002/funds/add",
        { amount: numAmount, paymentId: "PAY_" + Date.now() },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAddModal(false);
        setAmount("");
        fetchWallet();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding funds");
    }
  };

  const handleWithdraw = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return toast.error("Invalid amount");
    try {
      const res = await axios.post(
        "http://localhost:3002/funds/withdraw",
        { amount: numAmount },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowWithdrawModal(false);
        setAmount("");
        fetchWallet();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error withdrawing funds");
    }
  };

  const handleAddBank = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:3002/funds/wallet/bank",
        bankForm,
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setWallet({ ...wallet, bankAccounts: res.data.bankAccounts });
        setBankForm({
          accountNumber: "",
          ifsc: "",
          bankName: "",
          branch: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding bank");
    }
  };

  const handleDeleteBank = async (id) => {
    try {
      const res = await axios.delete(
        `http://localhost:3002/funds/wallet/bank/${id}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setWallet({ ...wallet, bankAccounts: res.data.bankAccounts });
      }
    } catch (error) {
      toast.error("Error deleting bank");
    }
  };

  const handleVerifyBank = async (id) => {
    try {
      const res = await axios.post(
        "http://localhost:3002/funds/wallet/bank/verify",
        { bankId: id },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        // Update local state
        const updatedBanks = wallet.bankAccounts.map((b) =>
          b._id === id ? res.data.bankAccount : b
        );
        setWallet({ ...wallet, bankAccounts: updatedBanks });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    }
  };

  const handleAddUPI = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:3002/funds/wallet/upi",
        { vpa: upiId },
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setWallet({ ...wallet, upiIds: res.data.upiIds });
        setUpiId("");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding UPI");
    }
  };

  const handleDeleteUPI = async (id) => {
    try {
      const res = await axios.delete(
        `http://localhost:3002/funds/wallet/upi/${id}`,
        { withCredentials: true }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setWallet({ ...wallet, upiIds: res.data.upiIds });
      }
    } catch (error) {
      toast.error("Error deleting UPI");
    }
  };

  const handleDownloadHistory = async () => {
    try {
      const response = await axios.get("http://localhost:3002/funds/transactions/pdf", {
        withCredentials: true,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transaction_history.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      toast.error("Error downloading statement");
    }
  };

  if (loading) return <div className="loading">Loading Funds...</div>;

  return (
    <div className="funds-component">
      <div className="funds-header">
        <h3>Funds</h3>
        <div className="tabs">
          <button
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            <AccountBalanceWallet /> Overview
          </button>
          <button
            className={activeTab === "methods" ? "active" : ""}
            onClick={() => setActiveTab("methods")}
          >
            <AccountBalance /> Payment Methods
          </button>
          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            <History /> History
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="overview-tab">
          <div className="balance-card">
            <div className="balance-item">
              <h4>Available Margin</h4>
              <h1>
                ₹
                {wallet?.availableBalance?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </h1>
            </div>
            <div className="balance-item">
              <h4>Used Margin</h4>
              <h1>
                ₹
                {wallet?.usedMargin?.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </h1>
            </div>
          </div>

          <div className="action-buttons">
            <button
              className="btn-add"
              onClick={() => setShowAddModal(true)}
            >
              <AddCard /> Add Funds
            </button>
            <button
              className="btn-withdraw"
              onClick={() => setShowWithdrawModal(true)}
            >
              <AccountBalanceWallet /> Withdraw
            </button>
          </div>
        </div>
      )}

      {activeTab === "methods" && (
        <div className="methods-tab">
          <div className="section">
            <h4>Bank Accounts</h4>
            <div className="list">
              {wallet?.bankAccounts?.map((bank) => (
                <div key={bank._id} className="list-item">
                  <div>
                    <p className="bank-name">{bank.bankName}</p>
                    <p className="account-num">
                      {bank.accountNumber} • {bank.ifsc}
                    </p>
                    {bank.isVerified ? (
                      <span className="badge verified">
                        <VerifiedUser fontSize="small" /> Verified
                      </span>
                    ) : (
                      <button
                        className="btn-verify"
                        onClick={() => handleVerifyBank(bank._id)}
                      >
                        Verify
                      </button>
                    )}
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteBank(bank._id)}
                  >
                    <Delete />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddBank} className="add-form">
              <input
                placeholder="Bank Name"
                value={bankForm.bankName}
                onChange={(e) =>
                  setBankForm({ ...bankForm, bankName: e.target.value })
                }
                required
              />
              <input
                placeholder="Account Number"
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountNumber: e.target.value })
                }
                required
              />
              <input
                placeholder="IFSC Code"
                value={bankForm.ifsc}
                onChange={(e) =>
                  setBankForm({ ...bankForm, ifsc: e.target.value })
                }
                required
              />
              <input
                placeholder="Branch"
                value={bankForm.branch}
                onChange={(e) =>
                  setBankForm({ ...bankForm, branch: e.target.value })
                }
              />
              <button type="submit">Add Bank</button>
            </form>
          </div>

          <div className="section">
            <h4>UPI IDs</h4>
            <div className="list">
              {wallet?.upiIds?.map((upi) => (
                <div key={upi._id} className="list-item">
                  <p>{upi.vpa}</p>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteUPI(upi._id)}
                  >
                    <Delete />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddUPI} className="add-form">
              <input
                placeholder="UPI ID (e.g. user@upi)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
              />
              <button type="submit">Add UPI</button>
            </form>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="history-tab">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4>Recent Transactions</h4>
            <button className="btn-secondary" onClick={handleDownloadHistory}>Download PDF</button>
          </div>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ...(wallet?.deposits?.map((d) => ({ ...d, type: "Deposit" })) ||
                  []),
                ...(wallet?.withdrawals?.map((w) => ({
                  ...w,
                  type: "Withdrawal",
                })) || []),
              ]
                .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
                .map((txn, i) => (
                  <tr key={i}>
                    <td>{new Date(txn.requestedAt).toLocaleDateString()}</td>
                    <td>{txn.type}</td>
                    <td
                      className={
                        txn.type === "Deposit" ? "text-green" : "text-red"
                      }
                    >
                      {txn.type === "Deposit" ? "+" : "-"}₹{txn.amount}
                    </td>
                    <td>
                      <span className={`status ${txn.status.toLowerCase()}`}>
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {(showAddModal || showWithdrawModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{showAddModal ? "Add Funds" : "Withdraw Funds"}</h3>
            <input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={showAddModal ? handleAddFunds : handleWithdraw}
              >
                Confirm
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setShowWithdrawModal(false);
                  setAmount("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .funds-component { padding: 20px; max-width: 1000px; margin: 0 auto; }
        .funds-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .tabs { display: flex; gap: 10px; }
        .tabs button { display: flex; align-items: center; gap: 5px; padding: 8px 16px; border: none; background: #f0f0f0; cursor: pointer; border-radius: 4px; font-weight: 500; }
        .tabs button.active { background: #387ed1; color: white; }
        
        .overview-tab { display: flex; flex-direction: column; gap: 20px; }
        .balance-card { display: flex; gap: 20px; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .balance-item { flex: 1; }
        .balance-item h4 { margin: 0 0 10px 0; color: #666; }
        .balance-item h1 { margin: 0; font-size: 2rem; color: #333; }
        
        .action-buttons { display: flex; gap: 15px; }
        .action-buttons button { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 600; color: white; }
        .btn-add { background: #4caf50; }
        .btn-withdraw { background: #387ed1; }
        
        .methods-tab { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .section { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .list { margin-bottom: 15px; display: flex; flex-direction: column; gap: 10px; }
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #eee; border-radius: 4px; }
        .bank-name { font-weight: 600; margin: 0; }
        .account-num { font-size: 0.9rem; color: #666; margin: 2px 0; }
        .badge.verified { color: #4caf50; display: flex; align-items: center; gap: 4px; font-size: 0.8rem; margin-top: 5px; }
        .btn-verify { background: #ff9800; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-top: 5px; }
        .btn-delete { background: none; border: none; color: #f44336; cursor: pointer; }
        
        .add-form { display: flex; flex-direction: column; gap: 10px; }
        .add-form input { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .add-form button { padding: 8px; background: #387ed1; color: white; border: none; border-radius: 4px; cursor: pointer; }
        
        .history-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .history-table th, .history-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #eee; }
        .history-table th { background: #f9f9f9; font-weight: 600; }
        .text-green { color: #4caf50; font-weight: 600; }
        .text-red { color: #f44336; font-weight: 600; }
        .status { padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
        .status.approved { background: #e8f5e9; color: #2e7d32; }
        .status.pending { background: #fff3e0; color: #ef6c00; }
        .status.rejected { background: #ffebee; color: #c62828; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal { background: white; padding: 20px; border-radius: 8px; width: 300px; }
        .modal h3 { margin-top: 0; }
        .modal input { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-primary { background: #387ed1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        .btn-secondary { background: #f0f0f0; color: #333; border: 1px solid #ccc; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
        
        body.dark-mode .funds-component { color: #e0e0e0; }
        body.dark-mode .tabs button { background: #2d2d2d; color: #e0e0e0; }
        body.dark-mode .tabs button.active { background: #387ed1; color: white; }
        body.dark-mode .balance-card, body.dark-mode .section, body.dark-mode .history-table { background: #1e1e1e; border: 1px solid #333; }
        body.dark-mode .balance-item h1 { color: #e0e0e0; }
        body.dark-mode .list-item { border-color: #333; }
        body.dark-mode input { background: #2d2d2d; border-color: #444; color: white; }
        body.dark-mode .history-table th { background: #2d2d2d; color: #e0e0e0; }
        body.dark-mode .history-table td { border-bottom-color: #333; }
        body.dark-mode .modal { background: #1e1e1e; border: 1px solid #333; }
        body.dark-mode .btn-secondary { background: #2d2d2d; border-color: #444; color: #e0e0e0; }
      `}</style>
    </div>
  );
};

export default Funds;