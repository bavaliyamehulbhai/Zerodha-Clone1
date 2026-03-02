import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
  const [profile, setProfile] = useState({
    username: "",
    email: "",
    mobile: "",
    address: "",
    kyc: { status: "pending" },
    bankAccounts: [],
    tradingSegments: {
      equity: false,
      fno: false,
      currency: false,
      commodity: false,
    },
    dematAccount: { status: "inactive" },
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    axios
      .get("http://localhost:3002/user", { withCredentials: true })
      .then((res) => {
        if (res.data.status) {
          const isKycVerified =
            res.data.kyc &&
            (res.data.kyc.status === "APPROVED" ||
              res.data.kyc.status === "verified");

          setProfile({
            username: res.data.user,
            email: res.data.email || "",
            mobile: res.data.mobile || "",
            address: res.data.address || "",
            kyc: res.data.kyc || { status: "pending" },
            bankAccounts: res.data.bankAccounts || [],
            tradingSegments: isKycVerified
              ? {
                  equity: true,
                  fno: true,
                  currency: true,
                  commodity: true,
                }
              : res.data.tradingSegments || {
                  equity: false,
                  fno: false,
                  currency: false,
                  commodity: false,
                },
            dematAccount: isKycVerified
              ? { status: "active" }
              : res.data.dematAccount || { status: "inactive" },
          });
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:3002/updateProfile",
        profile,
        { withCredentials: true },
      );
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { oldPassword, newPassword } = passwordData;
    if (!oldPassword || !newPassword) {
      return toast.error("All fields are required");
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return toast.error(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
      );
    }
    try {
      const { data } = await axios.post(
        "http://localhost:3002/changePassword",
        passwordData,
        { withCredentials: true },
      );
      if (data.success) {
        toast.success(data.message);
        setPasswordData({ oldPassword: "", newPassword: "" });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="profile-section" style={{ padding: "20px" }}>
      <h3 className="title">Profile & Account</h3>
      <div className="profile-form" style={{ maxWidth: "400px" }}>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={profile.username}
            onChange={handleChange}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <label>Mobile Number</label>
          <input
            type="text"
            name="mobile"
            value={profile.mobile}
            onChange={handleChange}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={profile.address}
            onChange={handleChange}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <button
            type="submit"
            className="btn btn-blue"
            style={{
              padding: "10px",
              backgroundColor: "#387ed1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Update Profile
          </button>
        </form>

        <hr
          style={{ margin: "30px 0", border: "0", borderTop: "1px solid #eee" }}
        />

        <h4 style={{ marginBottom: "15px" }}>Account Status</h4>
        <div style={{ display: "grid", gap: "15px", marginBottom: "20px" }}>
          <div
            style={{
              padding: "10px",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          >
            <strong>KYC Status: </strong>
            <span
              style={{
                color:
                  profile.kyc.status === "verified" ||
                  profile.kyc.status === "APPROVED"
                    ? "green"
                    : "orange",
                fontWeight: "bold",
              }}
            >
              {profile.kyc.status === "APPROVED"
                ? "VERIFIED"
                : profile.kyc.status.toUpperCase()}
            </span>
            {profile.kyc.pan && (
              <div style={{ fontSize: "0.9em", marginTop: "5px" }}>
                PAN: {profile.kyc.pan}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "10px",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          >
            <strong>Trading Segments</strong>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginTop: "5px",
              }}
            >
              {Object.entries(profile.tradingSegments).map(([seg, active]) => (
                <span
                  key={seg}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "0.8em",
                    backgroundColor: active ? "#e8f5e9" : "#ffebee",
                    color: active ? "#2e7d32" : "#c62828",
                  }}
                >
                  {seg.toUpperCase()}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: "10px",
              border: "1px solid #eee",
              borderRadius: "4px",
            }}
          >
            <strong>Demat Account</strong>
            <div style={{ fontSize: "0.9em", marginTop: "5px" }}>
              Status: {profile.dematAccount.status.toUpperCase()}
            </div>
          </div>
        </div>

        <hr
          style={{ margin: "30px 0", border: "0", borderTop: "1px solid #eee" }}
        />

        <h4 style={{ marginBottom: "15px" }}>Change Password</h4>
        <form
          onSubmit={handlePasswordSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >
          <label>Old Password</label>
          <input
            type="password"
            name="oldPassword"
            value={passwordData.oldPassword}
            onChange={handlePasswordChange}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <label>New Password</label>
          <input
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          />
          <button
            type="submit"
            className="btn btn-blue"
            style={{
              padding: "10px",
              backgroundColor: "#387ed1",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Change Password
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Profile;
