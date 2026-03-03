const express = require("express");
const jwt = require("jsonwebtoken");
const { UserModel } = require("./UserModel");

const router = express.Router();

// Middleware to verify token and inject user ID
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Not authorized" });

    jwt.verify(token, process.env.TOKEN_KEY || "secret_key_placeholder", (err, data) => {
        if (err) return res.status(401).json({ success: false, message: "Token expired or invalid" });
        req.userId = data.id;
        next();
    });
};

router.get("/watchlist", authenticate, async (req, res) => {
    try {
        const user = await UserModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Seed default watchlist if empty
        if (!user.watchlist || user.watchlist.length === 0) {
            user.watchlist = ["INFY", "ONGC", "TCS", "KPITTECH", "QUICKHEAL", "WIPRO", "M&M", "RELIANCE", "HUL"];
            await user.save();
        }

        res.json({ success: true, watchlist: user.watchlist });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post("/watchlist/add", authenticate, async (req, res) => {
    try {
        const { symbol } = req.body;
        if (!symbol) return res.status(400).json({ success: false, message: "Symbol is required" });

        const user = await UserModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (user.watchlist.length >= 50) {
            return res.status(400).json({ success: false, message: "Watchlist limit reached (50 items)" });
        }

        if (user.watchlist.includes(symbol)) {
            return res.status(400).json({ success: false, message: "Symbol already in watchlist" });
        }

        user.watchlist.push(symbol);
        await user.save();

        res.json({ success: true, message: `${symbol} added to watchlist`, watchlist: user.watchlist });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.post("/watchlist/remove", authenticate, async (req, res) => {
    try {
        const { symbol } = req.body;
        if (!symbol) return res.status(400).json({ success: false, message: "Symbol is required" });

        const user = await UserModel.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.watchlist = user.watchlist.filter(item => item !== symbol);
        await user.save();

        res.json({ success: true, message: `${symbol} removed from watchlist`, watchlist: user.watchlist });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
