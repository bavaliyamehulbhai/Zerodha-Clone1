const EventEmitter = require("events");
const { MarketStatusModel } = require("../model/MarketStatusSchema");
// NotificationService is required dynamically or passed to avoid circular dependency if needed, 
// but here we emit events that the main server can listen to and call NotificationService.

class MarketDataService extends EventEmitter {
  constructor() {
    super();
    this.isConnected = false;
    this.lastTickTime = Date.now();
    this.feedMode = "PRIMARY";
    this.exchangeStatus = "OPEN";
    this.spikeThreshold = 10;
    this.lastPrices = new Map();
    this.dataInterval = null;
    this.healthCheckInterval = null;

    // Initialize configuration
    this.init();
  }

  async init() {
    try {
      const status = await MarketStatusModel.findOne();
      if (status) {
        this.exchangeStatus = status.exchangeStatus;
        this.feedMode = status.feedMode;
        this.spikeThreshold = status.spikeThreshold;
      } else {
        await MarketStatusModel.create({});
      }
      this.connectUpstream();
      this.startHealthCheck();
    } catch (err) {
      console.error("MarketDataService Init Error:", err);
    }
  }

  connectUpstream() {
    if (this.dataInterval) clearInterval(this.dataInterval);

    console.log(`[MarketData] Connecting to ${this.feedMode} feed...`);

    // Simulate connection latency
    setTimeout(() => {
      this.isConnected = true;
      this.lastTickTime = Date.now();
      console.log(`[MarketData] Connected to ${this.feedMode} feed.`);
      this.emit("connectionStatus", { status: "CONNECTED", mode: this.feedMode });
      this.startDataStream();
    }, 1000);
  }

  startDataStream() {
    // Simulate incoming market data ticks
    this.dataInterval = setInterval(() => {
      if (!this.isConnected || this.exchangeStatus !== "OPEN") return;

      // Mock Ticks for demo
      const symbols = [
        "NIFTY 50", "SENSEX", "INFY", "ONGC", "TCS", "KPITTECH", "QUICKHEAL", "WIPRO", "M&M", "RELIANCE", "HUL",
        "HDFCBANK", "SBIN", "BHARTIARTL", "ITC", "TATAPOWER"
      ];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];

      const basePrices = {
        "NIFTY 50": 22000, "SENSEX": 72000, INFY: 1555.45, ONGC: 116.8,
        TCS: 3194.8, KPITTECH: 266.45, QUICKHEAL: 308.55, WIPRO: 577.75,
        "M&M": 779.8, RELIANCE: 2112.4, HUL: 2383.4, HDFCBANK: 1522.0,
        SBIN: 500, BHARTIARTL: 900, ITC: 400, TATAPOWER: 300
      };

      let basePrice = basePrices[symbol] || 500;

      const currentPrice = this.lastPrices.get(symbol) || (Math.random() * (basePrice * 0.2) + (basePrice * 0.9));
      const fluctuation = (Math.random() - 0.5) * (currentPrice * 0.01); // 1% fluctuation
      const newPrice = parseFloat((currentPrice + fluctuation).toFixed(2));

      this.processTick({ symbol, price: newPrice, timestamp: Date.now() });
    }, 500); // 2 ticks per second
  }

  processTick(tick) {
    this.lastTickTime = Date.now();

    // 1. Spike Detection
    const lastPrice = this.lastPrices.get(tick.symbol);
    if (lastPrice) {
      const change = Math.abs((tick.price - lastPrice) / lastPrice) * 100;
      if (change > this.spikeThreshold) {
        console.warn(`[MarketData] Price Spike Detected for ${tick.symbol}: ${change.toFixed(2)}%`);
        this.emit("alert", {
          type: "PRICE_SPIKE",
          symbol: tick.symbol,
          message: `Price moved ${change.toFixed(2)}% instantly. Tick suppressed.`
        });

        // Broadcast Market Crash/Spike Alert
        this.emit("notification", {
          userId: "ALL",
          data: {
            title: "Market Volatility Alert",
            message: `Unusual price movement detected in ${tick.symbol} (${change.toFixed(2)}%)`,
            type: "MARKET_CRASH"
          }
        });
        return; // Drop the tick
      }
    }

    this.lastPrices.set(tick.symbol, tick.price);

    // Broadcast to WebSocket server (listener)
    this.emit("tick", tick);
  }

  startHealthCheck() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);

    this.healthCheckInterval = setInterval(() => {
      const silenceDuration = Date.now() - this.lastTickTime;

      // If no ticks for 5 seconds and we expect to be connected
      if (silenceDuration > 5000 && this.isConnected && this.exchangeStatus === "OPEN") {
        console.error("[MarketData] Feed Unhealthy! No ticks for 5s.");
        this.handleFeedFailure();
      }
    }, 2000);
  }

  handleFeedFailure() {
    this.isConnected = false;
    this.emit("connectionStatus", { status: "DISCONNECTED", reason: "Timeout" });

    // Auto-switch logic
    if (this.feedMode === "PRIMARY") {
      console.log("[MarketData] Auto-switching to FALLBACK feed.");
      this.switchFeedMode("FALLBACK");
    } else {
      console.log("[MarketData] Fallback feed also failed. Retrying...");
      this.connectUpstream(); // Retry
    }
  }

  async switchFeedMode(mode) {
    if (this.feedMode === mode && this.isConnected) return;

    this.feedMode = mode;
    this.isConnected = false;

    await MarketStatusModel.findOneAndUpdate({}, { feedMode: mode }, { upsert: true });
    this.connectUpstream();
  }

  async setExchangeStatus(status) {
    this.exchangeStatus = status;
    await MarketStatusModel.findOneAndUpdate({}, { exchangeStatus: status }, { upsert: true });
    console.log(`[MarketData] Exchange Status set to ${status}`);

    if (status === "OPEN" && !this.isConnected) {
      this.connectUpstream();
    }
  }

  async setSpikeThreshold(threshold) {
    this.spikeThreshold = threshold;
    await MarketStatusModel.findOneAndUpdate({}, { spikeThreshold: threshold }, { upsert: true });
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      feedMode: this.feedMode,
      exchangeStatus: this.exchangeStatus,
      spikeThreshold: this.spikeThreshold,
      lastTickTime: this.lastTickTime
    };
  }

  getLastPrice(symbol) {
    return this.lastPrices.get(symbol);
  }

  getVolatility(symbol) {
    // In a real system, this would be calculated based on historical standard deviation
    // For simulation, we return a mock volatility percentage (e.g., 1.5%)
    // Higher values for specific stocks can be hardcoded for testing
    if (["ADANIENT", "IDEA"].includes(symbol)) return 3.5; // High volatility
    if (["NIFTY 50", "SENSEX"].includes(symbol)) return 0.5; // Low volatility for indices
    return 1.2; // Standard volatility
  }
}

module.exports = new MarketDataService();