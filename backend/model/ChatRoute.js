const router = require("express").Router();
const { ChatModel } = require("./ChatModel");
const { UserModel } = require("./UserModel");
const { HoldingsModel } = require("./HoldingsModel");
const { PositionsModel } = require("./PositionsModel");
const { userVerification } = require("../middlewares/AuthMiddleware");
const MarketDataService = require("./MarketDataService");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

let GoogleGenerativeAI;
try {
  GoogleGenerativeAI = require("@google/generative-ai").GoogleGenerativeAI;
} catch (e) {
  console.warn("Google Generative AI package not found. AI features will be disabled.");
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  },
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Get chat history
router.get("/chat/history/:contactId", userVerification, async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;
    const user = await UserModel.findById(userId);

    let query = {};

    if (contactId === "SUPPORT") {
      // User fetching their chat with support
      // Messages they sent to SUPPORT OR Messages sent to them (by any admin)
      query = {
        $or: [
          { senderId: userId, receiverId: "SUPPORT" },
          { receiverId: userId }, // Assuming only admins/support message users directly in this context
        ],
      };
    } else {
      // Admin/Broker fetching chat with a specific user
      if (user.role !== "admin" && user.role !== "broker") {
        return res.status(403).json({ message: "Access denied" });
      }
      query = {
        $or: [
          { senderId: contactId, receiverId: "SUPPORT" }, // User sent to support
          { senderId: userId, receiverId: contactId }, // Admin sent to user
          { receiverId: contactId }, // Any message received by that user
        ],
      };
    }

    const messages = await ChatModel.find(query).sort({ timestamp: 1 });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/chat/upload", userVerification, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Max size is 5MB.",
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      if (err.message === "Only image files are allowed!") {
        return res.status(400).json({ success: false, message: err.message });
      }
      return res.status(500).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }
    res.json({
      success: true,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  });
});

router.put("/chat/read", userVerification, async (req, res) => {
  try {
    const { contactId } = req.body;
    const userId = req.user._id;
    const user = await UserModel.findById(userId);

    let query = {};
    let targetId = "";

    if (contactId === "SUPPORT") {
      query = { receiverId: userId, isRead: false };
      targetId = "SUPPORT";
    } else {
      if (user.role !== "admin" && user.role !== "broker") {
        return res.status(403).json({ message: "Access denied" });
      }
      query = { senderId: contactId, receiverId: "SUPPORT", isRead: false };
      targetId = contactId;
    }

    const result = await ChatModel.updateMany(query, { isRead: true });

    if (result.modifiedCount > 0) {
      MarketDataService.emit("chat_read", { readerId: userId, targetId });
    }

    res.json({ success: true, count: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/chat/message/:id", userVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const user = await UserModel.findById(userId);

    const message = await ChatModel.findById(id);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    if (message.senderId !== userId && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (message.attachment && message.attachment.filename) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        message.attachment.filename,
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await ChatModel.findByIdAndDelete(id);

    MarketDataService.emit("chat_delete", {
      messageId: id,
      receiverId: message.receiverId,
      senderId: message.senderId,
    });

    res.json({ success: true, message: "Message deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/chat/ai", userVerification, async (req, res) => {
  try {
    const { message, receiverId, attachment, clientMsgId } = req.body;
    const userId = req.user._id;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 1. Save User Message
    const userMsg = new ChatModel({
      senderId: userId,
      receiverId: receiverId,
      message: message,
      attachment: attachment,
      timestamp: new Date(),
      isRead: true,
      senderName: user.username,
    });
    await userMsg.save();

    // Prepare object for emit/response
    const userMsgObj = userMsg.toObject();
    if (clientMsgId) userMsgObj.clientMsgId = clientMsgId;

    // Emit to update sender's UI
    MarketDataService.emit("message_sent", userMsgObj);

    // 2. Call Gemini API
    let aiResponseText =
      "I received your attachment. How can I help you with it?";

    if (message || (attachment && attachment.mimetype.startsWith("image/"))) {
      let holdingsStr = "None";
      let positionsStr = "None";
      let marketContext = "";

      try {
        const holdings = await HoldingsModel.find({ userId });
        const positions = await PositionsModel.find({ userId });

        // Optimize prompt: Select essential fields, use concise format, and limit items
        holdingsStr = holdings
          .slice(0, 30)
          .map((h) => `${h.name}:${h.qty}@${h.avg}`)
          .join(", ");
        positionsStr = positions
          .slice(0, 30)
          .map((p) => `${p.name}(${p.product}):${p.qty}@${p.avg}`)
          .join(", ");

        // Detect potential stock symbols in the message and fetch real-time price
        const potentialSymbols = (message || "").match(/\b[A-Z]{3,10}\b/g) || [];

        if (potentialSymbols.length > 0) {
          const prices = potentialSymbols
            .map((sym) => {
              const price = MarketDataService.getLastPrice(sym);
              return price ? `${sym}: ${price}` : null;
            })
            .filter(Boolean);

          if (prices.length > 0) {
            marketContext = `Real-time Market Data: ${prices.join(", ")}`;
          }
        }
      } catch (contextError) {
        console.warn("Failed to fetch context for AI:", contextError.message);
      }

      const prompt = `You are a support assistant for a trading platform.
User's Portfolio Context:
Holdings: ${holdingsStr || "None"}
Positions: ${positionsStr || "None"}
${marketContext}

If the user explicitly asks to place a trade/order (buy or sell), check if Symbol, Quantity, and Side (Buy/Sell) are clear.
If yes, append a JSON block at the very end of your response strictly in this format:
|||JSON
{
  "action": "PLACE_ORDER",
  "order": {
    "name": "SYMBOL",
    "qty": 1,
    "mode": "BUY",
    "type": "MARKET",
    "product": "CNC"
  }
}
|||
Default to MARKET type and CNC product if not specified.
If details are missing, ask for them.

User Question: ${message || "Analyze the attached image."}`;

      let parts = [prompt];
      let hasImage = false;

      if (attachment && attachment.mimetype.startsWith("image/")) {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          attachment.filename,
        );
        if (fs.existsSync(filePath)) {
          const imageBuffer = fs.readFileSync(filePath);
          parts.push({
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: attachment.mimetype,
            },
          });
          hasImage = true;
        }
      }

      if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Fallback mechanism: Try multiple models if one fails
        // Prioritize 1.5 models. Only use vision models if image is present.
        const modelsToTry = hasImage
          ? [
              "gemini-1.5-flash",
              "gemini-1.5-pro",
              "gemini-pro-vision",
            ]
          : [
              "gemini-1.5-flash",
              "gemini-1.5-pro",
              "gemini-1.0-pro",
              "gemini-pro",
            ];

        let success = false;

        for (const modelName of modelsToTry) {
          try {
            const currentModel = genAI.getGenerativeModel({ model: modelName });
            const result = await currentModel.generateContent(parts);
            const response = await result.response;
            aiResponseText = response.text();
            success = true;
            break; // Success, exit loop
          } catch (apiError) {
            console.warn(
              `Gemini Model ${modelName} failed: ${apiError.message}`,
            );
            // Continue to next model in the list
          }
        }

        if (!success) {
          aiResponseText =
            "I apologize, but I am currently experiencing technical difficulties with all available AI models. Please try again later.";
        }
      } else {
        aiResponseText =
          "AI support is currently unavailable (API Key missing or SDK not loaded).";
      }
    }

    // 3. Save AI Message
    const aiMsg = new ChatModel({
      senderId: receiverId, // "SUPPORT"
      receiverId: userId,
      message: aiResponseText,
      timestamp: new Date(),
      isRead: false,
      senderName: "AI Support",
    });
    await aiMsg.save();
    const aiMsgObj = aiMsg.toObject();

    // 4. Emit to update user's UI with AI response
    MarketDataService.emit("receive_message", aiMsgObj);

    res.json({ success: true, userMsg: userMsgObj, aiMsg: aiMsgObj });
  } catch (err) {
    console.error("AI Chat Error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to get AI response" });
  }
});

router.delete(
  "/chat/history/:contactId",
  userVerification,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const { contactId } = req.params;
      const user = await UserModel.findById(userId);

      let query = {};

      if (contactId === "SUPPORT") {
        query = {
          $or: [
            { senderId: userId, receiverId: "SUPPORT" },
            { receiverId: userId },
          ],
        };
      } else {
        if (user.role !== "admin" && user.role !== "broker") {
          return res.status(403).json({ message: "Access denied" });
        }
        query = {
          $or: [
            { senderId: contactId, receiverId: "SUPPORT" },
            { receiverId: contactId },
          ],
        };
      }

      await ChatModel.deleteMany(query);
      res.json({ success: true, message: "Chat history cleared" });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = router;
