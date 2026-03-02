import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmationModal from "./ConfirmationModal";
import TransactionHistoryModal from "./TransactionHistoryModal";
import ChatWidget from "./ChatWidget";

const Admin = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [filterRole, setFilterRole] = useState("all");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    username: "",
    email: "",
    role: "",
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
  });
  const [currentUser, setCurrentUser] = useState(user || null);
  const [currentUserId, setCurrentUserId] = useState(user ? user.id : null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionUser, setTransactionUser] = useState(null);
  const [wallets, setWallets] = useState({});
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeTarget, setFreezeTarget] = useState(null);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundForm, setFundForm] = useState({
    targetUserId: "",
    amount: "",
    type: "CREDIT",
    reason: "",
  });
  const [chatTarget, setChatTarget] = useState(null);

  useEffect(() => {
    if (!user) {
      axios
        .get("http://localhost:3002/user", { withCredentials: true })
        .then((res) => {
          if (res.data.status) {
            setCurrentUserId(res.data.id);
            setCurrentUser(res.data);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      setCurrentUserId(user.id);
      setCurrentUser(user);
    }
    axios
      .get("http://localhost:3002/allUsers", { withCredentials: true })
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        toast.error("Failed to fetch users");
      });

    // Fetch Market Status
    axios
      .get("http://localhost:3002/market/status", { withCredentials: true })
      .then((res) => {
        if (res.data.success) setMarketStatus(res.data.status);
      })
      .catch((err) => {
        console.log("Failed to fetch market status", err);
      });

    // Fetch Wallets Status
    axios
      .get("http://localhost:3002/funds/admin/wallets", {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) {
          const wMap = {};
          res.data.wallets.forEach((w) => (wMap[w.userId] = w));
          setWallets(wMap);
        }
      });
  }, [user]);

  const handleLogout = () => {
    axios
      .post("http://localhost:3002/logout", {}, { withCredentials: true })
      .then(() => {
        window.location.href = "http://localhost:3001/login";
      })
      .catch((err) => console.log(err));
  };

  const handleRefresh = () => {
    setLoading(true);
    axios
      .get("http://localhost:3002/allUsers", { withCredentials: true })
      .then((res) => {
        setUsers(res.data);
        setLoading(false);
        toast.success("User list refreshed");
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
        toast.error("Failed to refresh users");
      });
  };

  const handleDelete = (id) => {
    if (id === currentUserId) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    axios
      .post("http://localhost:3002/deleteUser", { id: userToDelete })
      .then((res) => {
        if (res.data.success) {
          setUsers(users.filter((user) => user._id !== userToDelete));
          toast.success("User deleted successfully");
        }
      })
      .catch((err) => console.log(err));
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = [...selectedUserIds];
      currentUsers.forEach((user) => {
        if (!newSelected.includes(user._id)) {
          newSelected.push(user._id);
        }
      });
      setSelectedUserIds(newSelected);
    } else {
      const idsOnPage = currentUsers.map((u) => u._id);
      setSelectedUserIds(
        selectedUserIds.filter((id) => !idsOnPage.includes(id)),
      );
    }
  };

  const handleSelectUser = (e, id) => {
    if (e.target.checked) {
      setSelectedUserIds([...selectedUserIds, id]);
    } else {
      setSelectedUserIds(selectedUserIds.filter((userId) => userId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;

    if (selectedUserIds.includes(currentUserId)) {
      toast.error(
        "You cannot delete your own account. Please deselect yourself.",
      );
      return;
    }

    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = () => {
    axios
      .post(
        "http://localhost:3002/deleteUsers",
        { ids: selectedUserIds },
        { withCredentials: true },
      )
      .then((res) => {
        if (res.data.success) {
          toast.success(res.data.message);
          setUsers(users.filter((user) => !selectedUserIds.includes(user._id)));
          setSelectedUserIds([]);
        } else {
          toast.error(res.data.message);
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed to delete users");
      });
    setShowBulkDeleteModal(false);
  };

  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({ ...editFormData, [name]: value });
  };

  const handleCancelClick = () => {
    setEditingUserId(null);
  };

  const handleSaveClick = () => {
    const { username, email, role } = editFormData;
    if (!username || !email || !role) {
      toast.error("All fields are required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    axios
      .post("http://localhost:3002/updateUser", {
        id: editingUserId,
        ...editFormData,
      })
      .then((res) => {
        if (res.data.success) {
          toast.success("User updated successfully");
          setUsers(
            users.map((user) =>
              user._id === editingUserId ? { ...user, ...editFormData } : user,
            ),
          );
          setEditingUserId(null);
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed to update user");
      });
  };

  const handleNewUserFormChange = (e) => {
    const { name, value } = e.target;
    setNewUserData({ ...newUserData, [name]: value });
  };

  const handleCreateCancelClick = () => {
    setShowCreateForm(false);
    setNewUserData({ username: "", email: "", password: "", role: "user" });
  };

  const handleCreateSaveClick = async () => {
    const { username, email, password, role } = newUserData;
    if (!username || !email || !password || !role) {
      return toast.error("All fields are required");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address");
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
      );
    }

    try {
      const { data } = await axios.post(
        "http://localhost:3002/signup",
        newUserData,
        { withCredentials: true },
      );
      if (data.success) {
        toast.success("User created successfully");
        setUsers([...users, data.user]);
        handleCreateCancelClick();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleResetPassword = (id) => {
    const newPassword = window.prompt("Enter new password:");
    if (newPassword) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return toast.error(
          "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
        );
      }
      axios
        .post("http://localhost:3002/resetPassword", {
          id,
          password: newPassword,
        })
        .then((res) => {
          if (res.data.success) {
            toast.success("Password reset successfully");
          } else {
            toast.error(res.data.message);
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("Failed to reset password");
        });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = users.filter(
    (user) =>
      (filterRole === "all" || user.role === filterRole) &&
      (user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const valA = a[sortConfig.key]
      ? a[sortConfig.key].toString().toLowerCase()
      : "";
    const valB = b[sortConfig.key]
      ? b[sortConfig.key].toString().toLowerCase()
      : "";
    if (valA < valB) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (valA > valB) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const indexOfLastUser = currentPage * rowsPerPage;
  const indexOfFirstUser = indexOfLastUser - rowsPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleMarketSettingChange = async (key, value) => {
    try {
      const { data } = await axios.post(
        "http://localhost:3002/market/settings",
        { [key]: value },
        { withCredentials: true },
      );
      if (data.success) {
        setMarketStatus(data.status);
        toast.success("Market settings updated");
      }
    } catch (err) {
      toast.error("Failed to update market settings");
    }
  };

  const handleViewTransactions = (user) => {
    setTransactionUser(user);
    setShowTransactionModal(true);
  };

  const handleFreeze = (userId, currentStatus) => {
    setFreezeTarget({ userId, currentStatus });
    setShowFreezeModal(true);
  };

  const confirmFreeze = async () => {
    if (!freezeTarget) return;
    const { userId, currentStatus } = freezeTarget;
    try {
      const res = await axios.post(
        "http://localhost:3002/funds/admin/freeze",
        { userId },
        { withCredentials: true },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setWallets((prev) => ({
          ...prev,
          [userId]: { ...prev[userId], isFrozen: !currentStatus },
        }));
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
    setShowFreezeModal(false);
  };

  const handleOpenFundModal = (userId) => {
    setFundForm({
      targetUserId: userId,
      amount: "",
      type: "CREDIT",
      reason: "",
    });
    setShowFundModal(true);
  };

  const handleFundAdjustment = async () => {
    if (!fundForm.amount || !fundForm.reason)
      return toast.error("Amount and reason are required");

    try {
      const res = await axios.post(
        "http://localhost:3002/funds/admin/adjust",
        fundForm,
        { withCredentials: true },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setShowFundModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Adjustment failed");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="admin-section">
      <div className="admin-header">
        <div className="header-title">
          <h3>Admin Panel</h3>
          <p>Manage users and system settings.</p>
        </div>
        <div className="header-actions">
          <div className="nav-links">
            <Link to="/admin/config" className="nav-btn primary">
              Broker Configuration
            </Link>
            <Link to="/broker/deposits" className="nav-btn success">
              Manage Deposits
            </Link>
            <Link to="/broker/withdrawals" className="nav-btn warning">
              Manage Withdrawals
            </Link>
          </div>
          <div className="profile-menu" style={{ position: "relative" }}>
            <div
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="profile-trigger"
            >
              <div className="profile-avatar">
                {user && user.user ? user.user[0].toUpperCase() : "A"}
              </div>
              <span className="profile-name">
                {user && user.user ? user.user : "Admin"}
              </span>
            </div>
            {isProfileDropdownOpen && (
              <div className="profile-dropdown">
                <Link
                  to="/settings"
                  className="dropdown-item"
                  onClick={() => setIsProfileDropdownOpen(false)}
                >
                  Settings
                </Link>
                <div onClick={handleLogout} className="dropdown-item logout">
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            className="role-filter-select"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="broker">Broker</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="toolbar-actions">
          {selectedUserIds.length > 0 && (
            <button onClick={handleBulkDelete} className="btn btn-danger">
              Delete Selected ({selectedUserIds.length})
            </button>
          )}
          <button onClick={handleRefresh} className="btn btn-secondary">
            Refresh
          </button>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create New User
            </button>
          )}
        </div>
      </div>

      {/* Market Data Control Panel */}
      {marketStatus && (
        <div className="market-control-panel">
          <h4>Market Data Control</h4>
          <div className="market-controls-grid">
            {/* Exchange Status */}
            <div className="control-group">
              <label>Exchange Status</label>
              <select
                value={marketStatus.exchangeStatus}
                onChange={(e) =>
                  handleMarketSettingChange("exchangeStatus", e.target.value)
                }
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="HALTED">HALTED</option>
              </select>
            </div>

            {/* Feed Mode */}
            <div className="control-group">
              <label>Feed Source</label>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <select
                  value={marketStatus.feedMode}
                  onChange={(e) =>
                    handleMarketSettingChange("feedMode", e.target.value)
                  }
                >
                  <option value="PRIMARY">Primary Feed</option>
                  <option value="FALLBACK">Fallback Feed</option>
                </select>
                <span
                  className={`status-badge ${marketStatus.isConnected ? "connected" : "disconnected"}`}
                >
                  {marketStatus.isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* Spike Detection */}
            <div className="control-group">
              <label>Spike Threshold (%)</label>
              <input
                type="number"
                value={marketStatus.spikeThreshold}
                onChange={(e) =>
                  setMarketStatus({
                    ...marketStatus,
                    spikeThreshold: e.target.value,
                  })
                }
                onBlur={(e) =>
                  handleMarketSettingChange("spikeThreshold", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      )}

      {showCreateForm && (
        <div className="create-user-panel">
          <h4>Create New User</h4>
          <div className="form-grid">
            <input
              name="username"
              placeholder="Username"
              value={newUserData.username}
              onChange={handleNewUserFormChange}
            />
            <input
              name="email"
              placeholder="Email"
              value={newUserData.email}
              onChange={handleNewUserFormChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={newUserData.password}
              onChange={handleNewUserFormChange}
            />
            <select
              name="role"
              value={newUserData.role}
              onChange={handleNewUserFormChange}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="broker">broker</option>
            </select>
          </div>
          <div className="form-actions">
            <button
              onClick={handleCreateSaveClick}
              className="btn btn-success"
              style={{ marginRight: "10px" }}
            >
              Save
            </button>
            <button
              onClick={handleCreateCancelClick}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={
                    currentUsers.length > 0 &&
                    currentUsers.every((user) =>
                      selectedUserIds.includes(user._id),
                    )
                  }
                />
              </th>
              <th
                onClick={() => handleSort("username")}
                style={{ cursor: "pointer" }}
              >
                Username{" "}
                {sortConfig.key === "username" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("email")}
                style={{ cursor: "pointer" }}
              >
                Email{" "}
                {sortConfig.key === "email" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th
                onClick={() => handleSort("role")}
                style={{ cursor: "pointer" }}
              >
                Role{" "}
                {sortConfig.key === "role" &&
                  (sortConfig.direction === "ascending" ? "▲" : "▼")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <React.Fragment key={user._id || index}>
                {editingUserId === user._id ? (
                  <tr>
                    <td>
                      <input type="checkbox" disabled />
                    </td>
                    <td>
                      <input
                        type="text"
                        name="username"
                        value={editFormData.username}
                        onChange={handleEditFormChange}
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        name="email"
                        value={editFormData.email}
                        onChange={handleEditFormChange}
                      />
                    </td>
                    <td>
                      <select
                        name="role"
                        value={editFormData.role}
                        onChange={handleEditFormChange}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="broker">broker</option>
                      </select>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={handleSaveClick}
                          className="action-btn btn-success"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="action-btn btn-danger"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        onChange={(e) => handleSelectUser(e, user._id)}
                      />
                    </td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="action-btn btn-warning"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(user._id)}
                          className="action-btn btn-info"
                        >
                          Reset Pwd
                        </button>
                        <button
                          onClick={() => handleViewTransactions(user)}
                          className="action-btn btn-purple"
                        >
                          History
                        </button>
                        <button
                          onClick={() =>
                            handleFreeze(user._id, wallets[user._id]?.isFrozen)
                          }
                          className={`action-btn ${wallets[user._id]?.isFrozen ? "btn-success" : "btn-grey"}`}
                        >
                          {wallets[user._id]?.isFrozen ? "Unfreeze" : "Freeze"}
                        </button>
                        <button
                          onClick={() => handleOpenFundModal(user._id)}
                          className="action-btn btn-blue"
                        >
                          Funds
                        </button>
                        <button
                          onClick={() => setChatTarget(user)}
                          className="action-btn btn-info"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={user._id === currentUserId}
                          className="action-btn btn-danger"
                          style={{
                            opacity: user._id === currentUserId ? 0.5 : 1,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Confirm Deletion"
        message="Are you sure you want to delete this user?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        title="Confirm Bulk Deletion"
        message={`Are you sure you want to delete ${selectedUserIds.length} users?`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
        confirmText="Yes, Delete All"
        cancelText="Cancel"
      />

      <ConfirmationModal
        isOpen={showFreezeModal}
        title={`Confirm ${freezeTarget?.currentStatus ? "Unfreeze" : "Freeze"}`}
        message={`Are you sure you want to ${freezeTarget?.currentStatus ? "unfreeze" : "freeze"} this account?`}
        onConfirm={confirmFreeze}
        onCancel={() => setShowFreezeModal(false)}
        confirmText={freezeTarget?.currentStatus ? "Unfreeze" : "Freeze"}
        cancelText="Cancel"
      />

      <TransactionHistoryModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        userId={transactionUser?._id}
        username={transactionUser?.username}
      />

      {showFundModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Adjust User Funds</h3>
            <div className="form-group">
              <label>Type</label>
              <select
                value={fundForm.type}
                onChange={(e) =>
                  setFundForm({ ...fundForm, type: e.target.value })
                }
                style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
              >
                <option value="CREDIT">Credit (Add)</option>
                <option value="DEBIT">Debit (Deduct)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                placeholder="Amount"
                value={fundForm.amount}
                onChange={(e) =>
                  setFundForm({ ...fundForm, amount: e.target.value })
                }
                style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
              />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <input
                type="text"
                placeholder="Reason for adjustment"
                value={fundForm.reason}
                onChange={(e) =>
                  setFundForm({ ...fundForm, reason: e.target.value })
                }
                style={{ width: "100%", padding: "8px", marginBottom: "20px" }}
              />
            </div>
            <div
              className="modal-actions"
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setShowFundModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleFundAdjustment}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {chatTarget && (
        <ChatWidget
          user={currentUser}
          receiverId={chatTarget._id}
          receiverName={`Chat with ${chatTarget.username}`}
          isOpen={true}
          onClose={() => setChatTarget(null)}
        />
      )}

      <ToastContainer />
      <style>{`
        .admin-section { padding: 20px; max-width: 1400px; margin: 0 auto; }
        .admin-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; flex-wrap: wrap; gap: 20px; }
        .header-title h3 { margin: 0 0 5px 0; font-size: 1.5rem; color: #333; }
        .header-title p { margin: 0; color: #666; font-size: 0.9rem; }
        .header-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .nav-links { display: flex; gap: 10px; }
        .nav-btn { text-decoration: none; padding: 8px 16px; border-radius: 6px; color: white; font-size: 0.9rem; font-weight: 500; transition: opacity 0.2s; }
        .nav-btn:hover { opacity: 0.9; }
        .nav-btn.primary { background-color: #387ed1; }
        .nav-btn.success { background-color: #4caf50; }
        .nav-btn.warning { background-color: #ff9800; }
        
        .profile-trigger { display: flex; align-items: center; cursor: pointer; gap: 10px; }
        .profile-avatar { width: 40px; height: 40px; border-radius: 50%; background-color: #387ed1; color: white; display: flex; justify-content: center; align-items: center; font-weight: bold; }
        .profile-name { font-weight: 500; color: #333; }
        .profile-dropdown { position: absolute; top: 110%; right: 0; background-color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 4px; padding: 5px; z-index: 1000; min-width: 150px; }
        .dropdown-item { text-decoration: none; color: inherit; display: block; padding: 8px 12px; border-radius: 4px; transition: background 0.2s; cursor: pointer; }
        .dropdown-item:hover { background-color: #f5f5f5; }
        .dropdown-item.logout { color: #d32f2f; }
        .dropdown-item.logout:hover { background-color: #ffebee; }

        .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #eee; }
        .search-bar input { padding: 10px 15px; width: 300px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
        .search-bar input:focus { border-color: #387ed1; }
        .role-filter-select { padding: 10px 15px; border: 1px solid #ddd; border-radius: 6px; font-size: 0.95rem; outline: none; margin-left: 10px; cursor: pointer; }
        .toolbar-actions { display: flex; gap: 10px; }
        
        .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background-color: #387ed1; color: white; }
        .btn-primary:hover { background-color: #316cb9; }
        .btn-secondary { background-color: #f5f5f5; color: #333; border: 1px solid #ddd; }
        .btn-secondary:hover { background-color: #e0e0e0; }
        .btn-danger { background-color: #d32f2f; color: white; }
        .btn-danger:hover { background-color: #b71c1c; }
        .btn-success { background-color: #4caf50; color: white; }
        .btn-success:hover { background-color: #43a047; }

        .market-control-panel { margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .market-control-panel h4 { margin-top: 0; margin-bottom: 15px; color: #444; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .market-controls-grid { display: flex; gap: 30px; flex-wrap: wrap; }
        .control-group label { display: block; margin-bottom: 8px; font-weight: 500; color: #555; font-size: 0.9rem; }
        .control-group select, .control-group input { padding: 8px; border-radius: 4px; border: 1px solid #ddd; font-size: 0.9rem; }
        .status-badge { font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; margin-left: 10px; font-weight: 500; }
        .status-badge.connected { background: #e8f5e9; color: #2e7d32; }
        .status-badge.disconnected { background: #ffebee; color: #c62828; }
        
        .create-user-panel { margin-bottom: 25px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9fafb; }
        .create-user-panel h4 { margin-top: 0; margin-bottom: 15px; color: #333; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px; }
        .form-grid input, .form-grid select { padding: 10px; border: 1px solid #ddd; border-radius: 6px; outline: none; }
        
        .table-container { background: #fff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #eee; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th, .admin-table td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
        .admin-table th { background-color: #f8f9fa; font-weight: 600; color: #555; font-size: 0.9rem; user-select: none; }
        .admin-table tr:hover { background-color: #f9f9f9; }
        .admin-table td { font-size: 0.9rem; color: #333; }
        .action-buttons { display: flex; gap: 5px; flex-wrap: wrap; }
        .action-btn { padding: 4px 8px; font-size: 0.8rem; border-radius: 4px; border: none; cursor: pointer; color: white; transition: opacity 0.2s; }
        .action-btn:hover { opacity: 0.85; }
        .btn-warning { background-color: #ff9800; }
        .btn-info { background-color: #0288d1; }
        .btn-purple { background-color: #9c27b0; }
        .btn-grey { background-color: #607d8b; }
        .btn-blue { background-color: #3f51b5; }
        
        .pagination { display: flex; justify-content: center; align-items: center; padding: 15px; gap: 15px; background: #f8f9fa; border-top: 1px solid #eee; }
        .pagination button { padding: 5px 10px; cursor: pointer; background: #fff; border: 1px solid #ddd; border-radius: 4px; }
        .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
        
        /* Dark Mode Overrides */
        body.dark-mode .admin-section { color: #e0e0e0; }
        body.dark-mode .header-title h3 { color: #e0e0e0; }
        body.dark-mode .header-title p { color: #aaa; }
        body.dark-mode .profile-name { color: #e0e0e0; }
        body.dark-mode .profile-dropdown { background-color: #1e1e1e; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        body.dark-mode .dropdown-item:hover { background-color: #333; }
        body.dark-mode .toolbar, body.dark-mode .market-control-panel, body.dark-mode .table-container, body.dark-mode .create-user-panel { background: #1e1e1e; border-color: #333; }
        body.dark-mode .search-bar input, body.dark-mode .role-filter-select, body.dark-mode .control-group select, body.dark-mode .control-group input, body.dark-mode .form-grid input, body.dark-mode .form-grid select { background: #2d2d2d; border-color: #444; color: #e0e0e0; }
        body.dark-mode .market-control-panel h4, body.dark-mode .create-user-panel h4 { color: #e0e0e0; border-bottom-color: #333; }
        body.dark-mode .control-group label { color: #aaa; }
        body.dark-mode .admin-table th { background-color: #2d2d2d; color: #ccc; border-bottom-color: #333; }
        body.dark-mode .admin-table td { border-bottom-color: #333; color: #e0e0e0; }
        body.dark-mode .admin-table tr:hover { background-color: #252525; }
        body.dark-mode .btn-secondary { background-color: #2d2d2d; border-color: #444; color: #e0e0e0; }
        body.dark-mode .btn-secondary:hover { background-color: #333; }
        body.dark-mode .pagination { background: #1e1e1e; border-top-color: #333; }
        body.dark-mode .pagination button { background: #2d2d2d; border-color: #444; color: #e0e0e0; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 2000; }
        .modal { background: white; padding: 20px; border-radius: 8px; width: 350px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        body.dark-mode .modal { background: #1e1e1e; border: 1px solid #333; }
      `}</style>
    </div>
  );
};

export default Admin;
