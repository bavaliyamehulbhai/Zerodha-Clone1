const MarketDataService = require("./MarketDataService");

module.exports.getMarketStatus = (req, res) => {
  res.json({ success: true, status: MarketDataService.getStatus() });
};

module.exports.updateSettings = async (req, res) => {
  const { exchangeStatus, feedMode, spikeThreshold } = req.body;

  try {
    if (exchangeStatus)
      await MarketDataService.setExchangeStatus(exchangeStatus);
    if (feedMode) await MarketDataService.switchFeedMode(feedMode);
    if (spikeThreshold)
      await MarketDataService.setSpikeThreshold(Number(spikeThreshold));

    res.json({
      success: true,
      message: "Market data settings updated",
      status: MarketDataService.getStatus(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
