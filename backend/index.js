require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const { HoldingsModel } = require("./model/HoldingsModel");

const { PositionsModel } = require("./model/PositionsModel");
const { ChatModel } = require("./model/ChatModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");
const { SettingsModel } = require("./model/SettingsModel");
const { AlertsModel } = require("./model/AlertsModel");
const ordersRoute = require("./model/OrdersRoute");
const kycRoute = require("./model/KYCRoute");
const fundsRoute = require("./model/FundsRoute");
const marketDataRoute = require("./model/MarketDataRoute");
const MarketDataService = require("./model/MarketDataService");
const brokerConfigRoute = require("./model/BrokerConfigRoute");
const riskRoute = require("./model/RiskRoute");
const paperTradingRoute = require("./model/PaperTradingRoute");
const notificationRoute = require("./model/NotificationRoute");
const chatRoute = require("./model/ChatRoute");
const runAMOCron = require("./model/AMOCron");
const runMarketCloseCron = require("./model/MarketCloseCron");
const runAutoSquareOff = require("./model/AutoSquareOffCron");
const runUnfreezeCron = require("./model/UnfreezeCron");

const PORT = process.env.PORT || 3002;
const uri = process.env.MONGO_URL;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

const onlineUsers = new Map(); // userId -> Set<socketId>

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());
app.use("/", ordersRoute);
app.use("/", kycRoute);
app.use("/funds", fundsRoute);
app.use("/market", marketDataRoute);
app.use("/broker", brokerConfigRoute);
app.use("/risk", riskRoute);
app.use("/paper", paperTradingRoute);
app.use("/", notificationRoute);
app.use("/", chatRoute);

const createSecretToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_KEY || "secret_key_placeholder", {
    expiresIn: 3 * 24 * 60 * 60,
  });
};

// app.get("/addHoldings", async (req, res) => {
//   let tempHoldings = [
//     {
//       name: "BHARTIARTL",
//       qty: 2,
//       avg: 538.05,
//       price: 541.15,
//       net: "+0.58%",
//       day: "+2.99%",
//     },
//     {
//       name: "HDFCBANK",
//       qty: 2,
//       avg: 1383.4,
//       price: 1522.35,
//       net: "+10.04%",
//       day: "+0.11%",
//     },
//     {
//       name: "HINDUNILVR",
//       qty: 1,
//       avg: 2335.85,
//       price: 2417.4,
//       net: "+3.49%",
//       day: "+0.21%",
//     },
//     {
//       name: "INFY",
//       qty: 1,
//       avg: 1350.5,
//       price: 1555.45,
//       net: "+15.18%",
//       day: "-1.60%",
//       isLoss: true,
//     },
//     {
//       name: "ITC",
//       qty: 5,
//       avg: 202.0,
//       price: 207.9,
//       net: "+2.92%",
//       day: "+0.80%",
//     },
//     {
//       name: "KPITTECH",
//       qty: 5,
//       avg: 250.3,
//       price: 266.45,
//       net: "+6.45%",
//       day: "+3.54%",
//     },
//     {
//       name: "M&M",
//       qty: 2,
//       avg: 809.9,
//       price: 779.8,
//       net: "-3.72%",
//       day: "-0.01%",
//       isLoss: true,
//     },
//     {
//       name: "RELIANCE",
//       qty: 1,
//       avg: 2193.7,
//       price: 2112.4,
//       net: "-3.71%",
//       day: "+1.44%",
//     },
//     {
//       name: "SBIN",
//       qty: 4,
//       avg: 324.35,
//       price: 430.2,
//       net: "+32.63%",
//       day: "-0.34%",
//       isLoss: true,
//     },
//     {
//       name: "SGBMAY29",
//       qty: 2,
//       avg: 4727.0,
//       price: 4719.0,
//       net: "-0.17%",
//       day: "+0.15%",
//     },
//     {
//       name: "TATAPOWER",
//       qty: 5,
//       avg: 104.2,
//       price: 124.15,
//       net: "+19.15%",
//       day: "-0.24%",
//       isLoss: true,
//     },
//     {
//       name: "TCS",
//       qty: 1,
//       avg: 3041.7,
//       price: 3194.8,
//       net: "+5.03%",
//       day: "-0.25%",
//       isLoss: true,
//     },
//     {
//       name: "WIPRO",
//       qty: 4,
//       avg: 489.3,
//       price: 577.75,
//       net: "+18.08%",
//       day: "+0.32%",
//     },
//   ];

//   tempHoldings.forEach((item) => {
//     let newHolding = new HoldingsModel({
//       name: item.name,
//       qty: item.qty,
//       avg: item.avg,
//       price: item.price,
//       net: item.day,
//       day: item.day,
//     });

//     newHolding.save();
//   });
//   res.send("Done!");
// });

// app.get("/addPositions", async (req, res) => {
//   let tempPositions = [
//     {
//       product: "CNC",
//       name: "EVEREADY",
//       qty: 2,
//       avg: 316.27,
//       price: 312.35,
//       net: "+0.58%",
//       day: "-1.24%",
//       isLoss: true,
//     },
//     {
//       product: "CNC",
//       name: "JUBLFOOD",
//       qty: 1,
//       avg: 3124.75,
//       price: 3082.65,
//       net: "+10.04%",
//       day: "-1.35%",
//       isLoss: true,
//     },
//   ];

//   tempPositions.forEach((item) => {
//     let newPosition = new PositionsModel({
//       product: item.product,
//       name: item.name,
//       qty: item.qty,
//       avg: item.avg,
//       price: item.price,
//       net: item.net,
//       day: item.day,
//       isLoss: item.isLoss,
//     });

//     newPosition.save();
//   });
//   res.send("Done!");
// });

app.get("/settings/registration", async (req, res) => {
  try {
    let settings = await SettingsModel.findOne({});
    if (!settings) {
      settings = await SettingsModel.create({ allowRegistration: true });
    }
    res.json({ allowRegistration: settings.allowRegistration });
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings" });
  }
});

app.post("/settings/registration", async (req, res) => {
  try {
    const { allowRegistration } = req.body;
    let settings = await SettingsModel.findOne({});
    if (!settings) {
      settings = new SettingsModel({ allowRegistration });
    } else {
      settings.allowRegistration = allowRegistration;
    }
    await settings.save();
    res.json({
      success: true,
      message: "Settings updated",
      allowRegistration: settings.allowRegistration,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating settings", success: false });
  }
});

app.get("/allUsers", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }
  jwt.verify(
    token,
    process.env.TOKEN_KEY || "secret_key_placeholder",
    async (err, data) => {
      if (err) {
        return res.status(401).json({ message: "Token expired" });
      } else {
        const user = await UserModel.findById(data.id);
        if (user && user.role === "admin") {
          const allUsers = await UserModel.find({});
          const usersWithStatus = allUsers.map((u) => ({
            ...u.toObject(),
            isOnline: onlineUsers.has(u._id.toString()),
          }));
          res.json(usersWithStatus);
        } else {
          res.status(403).json({ message: "Access denied" });
        }
      }
    },
  );
});

app.get("/user/status/:id", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }
  jwt.verify(
    token,
    process.env.TOKEN_KEY || "secret_key_placeholder",
    async (err, data) => {
      if (err) {
        return res.status(401).json({ message: "Token expired" });
      } else {
        const { id } = req.params;
        try {
          const user = await UserModel.findById(id, "username lastSeen");
          if (!user) {
            return res
              .status(404)
              .json({ success: false, message: "User not found" });
          }
          const isOnline = onlineUsers.has(id);
          res.json({ success: true, isOnline, lastSeen: user.lastSeen });
        } catch (error) {
          res.status(500).json({ success: false, message: error.message });
        }
      }
    },
  );
});

app.post("/deleteUser", async (req, res) => {
  try {
    const { id } = req.body;
    await UserModel.findByIdAndDelete(id);
    res.json({ message: "User deleted successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

app.post("/deleteUsers", async (req, res) => {
  try {
    const { ids } = req.body;
    await UserModel.deleteMany({ _id: { $in: ids } });
    res.json({ message: "Users deleted successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

app.post("/updateUser", async (req, res) => {
  try {
    const { id, username, email, role } = req.body;
    await UserModel.findByIdAndUpdate(id, { username, email, role });
    res.json({ message: "User updated successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

app.post("/updateProfile", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ status: false, message: "Not authorized" });
  }
  jwt.verify(
    token,
    process.env.TOKEN_KEY || "secret_key_placeholder",
    async (err, data) => {
      if (err) {
        return res.json({ status: false, message: "Token expired" });
      } else {
        const { username, email, mobile, address } = req.body;
        await UserModel.findByIdAndUpdate(data.id, {
          username,
          email,
          mobile,
          address,
        });
        res.json({ success: true, message: "Profile updated successfully" });
      }
    },
  );
});

app.post("/changePassword", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ status: false, message: "Not authorized" });
  }
  jwt.verify(
    token,
    process.env.TOKEN_KEY || "secret_key_placeholder",
    async (err, data) => {
      if (err) {
        return res.json({ status: false, message: "Token expired" });
      } else {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
          return res.json({
            success: false,
            message: "All fields are required",
          });
        }
        const user = await UserModel.findById(data.id);
        if (!user) {
          return res.json({ success: false, message: "User not found" });
        }
        const auth = await bcrypt.compare(oldPassword, user.password);
        if (!auth) {
          return res.json({
            success: false,
            message: "Incorrect old password",
          });
        }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: "Password changed successfully" });
      }
    },
  );
});

app.post("/resetPassword", async (req, res) => {
  try {
    const { id, password } = req.body;
    const user = await UserModel.findById(id);
    if (!user) {
      return res.json({ message: "User not found", success: false });
    }
    user.password = password;
    await user.save();
    res.json({ message: "Password reset successfully", success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

app.post("/forgotPassword", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found", success: false });
    }
    const token = jwt.sign(
      { id: user._id },
      process.env.TOKEN_KEY || "secret_key_placeholder",
      {
        expiresIn: "15m",
      },
    );
    const link = `http://localhost:3000/reset_password/${user._id}/${token}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      text: `Click this link to reset your password: ${link}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset link sent to email", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

app.post("/resetPasswordWithToken", async (req, res) => {
  const { id, token, password } = req.body;
  try {
    const verify = jwt.verify(
      token,
      process.env.TOKEN_KEY || "secret_key_placeholder",
    );
    const user = await UserModel.findById(id);
    if (!user) {
      return res.json({ message: "User not found", success: false });
    }
    user.password = password;
    await user.save();
    res.json({ message: "Password reset successfully", success: true });
  } catch (error) {
    res.json({ message: "Invalid or expired token", success: false });
  }
});

app.post("/signup", async (req, res, next) => {
  try {
    const settings = await SettingsModel.findOne({});
    const registrationAllowed = settings ? settings.allowRegistration : true;
    let isAdmin = false;
    const token = req.cookies.token;

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.TOKEN_KEY || "secret_key_placeholder",
        );
        const requester = await UserModel.findById(decoded.id);
        if (requester && requester.role === "admin") {
          isAdmin = true;
        }
      } catch (e) {
        // ignore error if token is invalid
      }
    }

    if (!registrationAllowed && !isAdmin) {
      return res.json({
        message: "New user registrations are currently disabled.",
      });
    }

    const { email, password, username, role } = req.body;
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }
    const user = await UserModel.create({ email, password, username, role });

    if (isAdmin) {
      // Admin is creating a user. Return the user object for the UI.
      res.status(201).json({ message: "User created successfully", success: true, user });
    } else {
      // Public registration. Don't log in, tell user to go to login page.
      res.status(201).json({ message: "User registered successfully. Please login.", success: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ message: "All fields are required" });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ message: "Incorrect password or email" });
    }
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.json({ message: "Incorrect password or email" });
    }
    const token = createSecretToken(user._id);
    res.cookie("token", token, {
      path: "/",
      httpOnly: false,
    });
    res.status(201).json({
      message: "User logged in successfully",
      success: true,
      user: { username: user.username, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error", success: false });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.json({ message: "Logged out successfully" });
});

app.post("/newAlert", async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const newAlert = new AlertsModel({ title, message, type });
    await newAlert.save();
    res.json({ success: true, message: "Alert created" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating alert" });
  }
});

app.get("/allAlerts", async (req, res) => {
  try {
    const alerts = await AlertsModel.find({}).sort({ createdAt: -1 }).limit(10);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching alerts" });
  }
});

app.delete("/deleteAllAlerts", async (req, res) => {
  try {
    await AlertsModel.deleteMany({});
    res.json({ success: true, message: "All alerts deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting alerts" });
  }
});

app.delete("/deleteAlert/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await AlertsModel.findByIdAndDelete(id);
    res.json({ success: true, message: "Alert deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting alert" });
  }
});

app.get("/user", async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ status: false });
  }
  jwt.verify(
    token,
    process.env.TOKEN_KEY || "secret_key_placeholder",
    async (err, data) => {
      if (err) {
        return res.json({ status: false });
      } else {
        const user = await UserModel.findById(data.id);
        if (user)
          return res.json({
            status: true,
            user: user.username,
            email: user.email,
            mobile: user.mobile,
            address: user.address,
            role: user.role,
            id: user._id,
          });
        else return res.json({ status: false });
      }
    },
  );
});

// Start Smart Features (Cron Jobs)
runAMOCron();
runMarketCloseCron();
runAutoSquareOff();
runUnfreezeCron();

// Socket.io Authentication Middleware
io.use((socket, next) => {
  const cookieHeader = socket.handshake.headers.cookie;
  if (!cookieHeader) {
    return next(new Error("Authentication error: No cookies found"));
  }

  const getCookie = (name) => {
    const value = `; ${cookieHeader}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const token = getCookie("token");

  if (!token) {
    return next(new Error("Authentication error: Token not found"));
  }

  jwt.verify(
    token,
    process.env.TOKEN_KEY || "secret_key_placeholder",
    (err, decoded) => {
      if (err) return next(new Error("Authentication error: Invalid token"));
      socket.userId = decoded.id;
      next();
    },
  );
});

// Socket.io Connection
io.on("connection", async (socket) => {
  if (socket.userId) {
    socket.join(socket.userId);

    // Track Online Status
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, new Set());
    }
    onlineUsers.get(socket.userId).add(socket.id);

    // Broadcast online status if it's the first connection
    if (onlineUsers.get(socket.userId).size === 1) {
      io.emit("user_status", { userId: socket.userId, status: "online" });
    }

    // If user is Admin or Broker, join the SUPPORT room to receive user messages
    try {
      const user = await UserModel.findById(socket.userId);
      if (user && (user.role === "admin" || user.role === "broker")) {
        socket.join("SUPPORT");
      }
    } catch (e) {
      console.error("Socket role check error:", e);
    }
  }

  socket.on("send_message", async (data) => {
    // data: { receiverId, message }
    // receiverId can be a specific userId or "SUPPORT"
    try {
      const { receiverId, message, attachment, clientMsgId } = data;
      const senderId = socket.userId;

      const user = await UserModel.findById(senderId);
      const senderName = user ? user.username : "Unknown";

      const newChat = new ChatModel({
        senderId,
        receiverId,
        message,
        attachment,
        senderName,
      });
      await newChat.save();

      // Emit to specific receiver (User ID or "SUPPORT" room)
      io.to(receiverId).emit("receive_message", newChat);

      // Confirm to sender
      const responseMsg = newChat.toObject();
      if (clientMsgId) responseMsg.clientMsgId = clientMsgId;
      socket.emit("message_sent", responseMsg);
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  socket.on("typing", (data) => {
    const { receiverId } = data;
    if (receiverId) {
      io.to(receiverId).emit("typing", { senderId: socket.userId });
    }
  });

  socket.on("stop_typing", (data) => {
    const { receiverId } = data;
    if (receiverId) {
      io.to(receiverId).emit("stop_typing", { senderId: socket.userId });
    }
  });

  socket.on("disconnect", async () => {
    if (socket.userId && onlineUsers.has(socket.userId)) {
      const userSockets = onlineUsers.get(socket.userId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(socket.userId);
        io.emit("user_status", { userId: socket.userId, status: "offline" });
        try {
          await UserModel.findByIdAndUpdate(socket.userId, {
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error("Error updating last seen:", err);
        }
      }
    }
  });

  socket.on("get_online_users", () => {
    socket.emit("online_users_list", Array.from(onlineUsers.keys()));
  });
});

// Bridge MarketDataService Events to Socket.io
MarketDataService.on("tick", (tick) => {
  io.emit("tick", tick);
});

MarketDataService.on("wallet_update", (data) => {
  if (data.userId) {
    io.to(data.userId).emit("wallet_update", data.data);
  }
});

MarketDataService.on("notification", (notification) => {
  if (notification.userId === "ALL") {
    io.emit("notification", notification.data);
  } else if (notification.userId) {
    io.to(notification.userId).emit("notification", notification.data);
  }
});

MarketDataService.on("chat_read", (data) => {
  const { readerId, targetId } = data;
  if (targetId === "SUPPORT") {
    io.to("SUPPORT").emit("messages_read", { readerId });
  } else {
    io.to(targetId).emit("messages_read", { readerId: "SUPPORT" });
  }
});

MarketDataService.on("chat_delete", (data) => {
  const { messageId, receiverId, senderId } = data;
  if (receiverId === "SUPPORT") {
    io.to("SUPPORT").emit("message_deleted", { messageId });
  } else {
    io.to(receiverId).emit("message_deleted", { messageId });
  }
  if (senderId) {
    io.to(senderId).emit("message_deleted", { messageId });
  }
});

MarketDataService.on("message_sent", (message) => {
  if (message.senderId) {
    io.to(message.senderId).emit("message_sent", message);
  }
});

MarketDataService.on("receive_message", (message) => {
  if (message.receiverId) {
    io.to(message.receiverId).emit("receive_message", message);
  }
});

server.listen(PORT, () => {
  console.log(`App started on port ${PORT}!`);
  mongoose
    .connect(uri)
    .then(() => console.log("DB started!"))
    .catch((err) => console.log("DB connection error:", err));
});
