// Simulates an external exchange (NSE/BSE)
const simulateExchangeExecution = (order) => {
  return new Promise((resolve) => {
    // Simulate network latency (100ms - 1s)
    const latency = Math.floor(Math.random() * 900) + 100;

    setTimeout(() => {
      const rand = Math.random();

      // 1. Simulate Rejection (5% chance)
      if (rand < 0.05) {
        return resolve({
          status: "REJECTED",
          reason: "Exchange connectivity issue",
          filledQty: 0,
          avgPrice: 0,
        });
      }

      // 2. Simulate Partial Fill (15% chance for Limit orders)
      if (order.type === "LIMIT" && rand < 0.2) {
        const partialQty = Math.floor(order.qty * 0.5); // Fill 50%
        return resolve({
          status: "PARTIALLY_FILLED",
          filledQty: partialQty,
          avgPrice: order.price,
          exchangeOrderId: `EX-${Date.now()}`,
        });
      }

      // 3. Simulate Full Fill (Default)
      // For Market orders, price might slip slightly
      let executionPrice = order.price;
      if (order.type === "MARKET" || order.type === "SL-M") {
        // Simulate slippage +/- 1%
        const slippage = 1 + (Math.random() * 0.02 - 0.01);
        executionPrice = (order.price || 100) * slippage;
      }

      resolve({
        status: "FILLED",
        filledQty: order.qty,
        avgPrice: parseFloat(executionPrice.toFixed(2)),
        exchangeOrderId: `EX-${Date.now()}`,
      });
    }, latency);
  });
};

module.exports = { simulateExchangeExecution };
