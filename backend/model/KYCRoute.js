const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { KYCModel } = require("./KYCModel");
const { UserModel } = require("./UserModel");

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ status: false, message: "Not authorized" });
  jwt.verify(
    token,
    process.env.TOKEN_KEY || "secret_key_placeholder",
    (err, data) => {
      if (err)
        return res
          .status(401)
          .json({ status: false, message: "Token expired" });
      req.user = data;
      next();
    },
  );
};

router.post("/kyc/submit", verifyToken, async (req, res) => {
  try {
    const { panUrl, aadhaarUrl, selfieUrl } = req.body;
    const user = await UserModel.findById(req.user.id);

    let kyc = await KYCModel.findOne({ userId: req.user.id });
    if (kyc) {
      kyc.panUrl = panUrl;
      kyc.aadhaarUrl = aadhaarUrl;
      kyc.selfieUrl = selfieUrl;
      kyc.status = "PENDING";
      kyc.rejectionReason = "";
      kyc.submittedAt = Date.now();
    } else {
      kyc = new KYCModel({
        userId: req.user.id,
        username: user.username,
        email: user.email,
        panUrl,
        aadhaarUrl,
        selfieUrl,
        status: "PENDING",
      });
    }
    await kyc.save();
    res.json({ success: true, message: "KYC submitted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error submitting KYC" });
  }
});

router.post("/kyc/draft", verifyToken, async (req, res) => {
  try {
    const { panUrl, aadhaarUrl, selfieUrl } = req.body;
    const user = await UserModel.findById(req.user.id);

    let kyc = await KYCModel.findOne({ userId: req.user.id });
    if (kyc) {
      if (panUrl) kyc.panUrl = panUrl;
      if (aadhaarUrl) kyc.aadhaarUrl = aadhaarUrl;
      if (selfieUrl) kyc.selfieUrl = selfieUrl;
      kyc.status = "DRAFT";
    } else {
      kyc = new KYCModel({
        userId: req.user.id,
        username: user.username,
        email: user.email,
        panUrl: panUrl || "",
        aadhaarUrl: aadhaarUrl || "",
        selfieUrl: selfieUrl || "",
        status: "DRAFT",
      });
    }
    await kyc.save();
    res.json({ success: true, message: "KYC draft saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving KYC draft" });
  }
});

router.get("/kyc/status", verifyToken, async (req, res) => {
  try {
    const kyc = await KYCModel.findOne({ userId: req.user.id });
    res.json({ success: true, kyc });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching status" });
  }
});

router.get("/kyc/all", verifyToken, async (req, res) => {
  try {
    const requester = await UserModel.findById(req.user.id);
    if (requester.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const kycs = await KYCModel.find({ status: "PENDING" });
    res.json({ success: true, kycs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching KYCs" });
  }
});

router.post("/kyc/action", verifyToken, async (req, res) => {
  try {
    const requester = await UserModel.findById(req.user.id);
    if (requester.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const { kycId, status, reason } = req.body;
    const kyc = await KYCModel.findById(kycId);
    if (!kyc)
      return res.status(404).json({ success: false, message: "KYC not found" });

    kyc.status = status;
    if (status === "REJECTED") kyc.rejectionReason = reason;
    await kyc.save();

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: kyc.email,
        subject: `KYC Status Update: ${status}`,
        text: `Your KYC verification status has been updated to ${status}.${
          status === "REJECTED" ? ` Reason: ${reason}` : ""
        }`,
      };
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.log("Error sending KYC email:", emailError);
    }

    res.json({ success: true, message: `KYC ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating KYC" });
  }
});

module.exports = router;
