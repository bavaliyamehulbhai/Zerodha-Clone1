const { OrdersModel } = require("../model/OrdersModel");
const { WalletModel } = require("../model/FundsSchema");
const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { UserModel } = require("../model/UserModel");
const NotificationService = require("./NotificationService");
const MarketDataService = require("./MarketDataService");
const { BrokerConfigModel } = require("../model/BrokerConfigSchema");

const emitWalletUpdate = async (userId) => {
  try {
    const wallet = await WalletModel.findOne({ userId });
    if (wallet) {
      MarketDataService.emit("wallet_update", {
        userId: userId.toString(),
        data: {
          availableBalance: wallet.availableBalance,
          usedMargin: wallet.usedMargin,
          unsettledBalance: wallet.unsettledBalance,
          currency: wallet.currency,
          isFrozen: wallet.isFrozen,
        },
      });
    }
  } catch (err) {
    console.error("Error emitting wallet update:", err);
  }
};

const executeOrder = async (orderId, userId) => {
  const order = await OrdersModel.findById(orderId);
  if (
    !order ||
    (order.status !== "PENDING" && order.status !== "PARTIALLY_FILLED")
  )
    return;

  // Simulate Partial Fill: Max 500 qty per execution
  const maxFill = 500;
  const remaining = order.qty - order.filledQty;
  const fillQty = Math.min(remaining, maxFill);

  order.filledQty += fillQty;
  order.status = order.filledQty >= order.qty ? "FILLED" : "PARTIALLY_FILLED";
  order.averagePrice = order.price;
  await order.save();

  const wallet = await WalletModel.findOne({ userId });

  if (order.product === "CNC") {
    // Holdings Logic
    let holding = await HoldingsModel.findOne({ userId, name: order.name });

    if (order.mode === "BUY") {
      // Margin was already blocked in newOrder, now it's consumed (no change to wallet totals, just state)
      // But for simplicity in this model:
      // Placed: Balance -Cost, UsedMargin +Cost
      // Executed: UsedMargin -Cost of filled qty (Asset acquired)

      // Use blockedMargin to release the correct amount (handling leverage)
      const marginPerQty = order.blockedMargin / order.qty;
      wallet.usedMargin -= marginPerQty * fillQty;

      if (holding) {
        const totalCost = holding.avg * holding.qty + order.price * fillQty;
        const totalQty = holding.qty + fillQty;
        holding.avg = totalCost / totalQty;
        holding.qty = totalQty;
      } else {
        holding = new HoldingsModel({
          userId,
          name: order.name,
          qty: fillQty,
          avg: order.price,
          price: order.price,
          net: "0.00%",
          day: "0.00%",
        });
      }
      await holding.save();
    } else {
      // SELL
      wallet.availableBalance += order.price * fillQty;
      if (holding) {
        holding.qty -= fillQty;
        if (holding.qty <= 0) {
          await HoldingsModel.deleteOne({ _id: holding._id });
        } else {
          await holding.save();
        }
      }
    }
  } else {
    // MIS/Positions Logic
    if (order.mode === "BUY") {
      // Release the blocked margin for the filled portion
      const marginPerQty = order.blockedMargin / order.qty;
      wallet.usedMargin -= marginPerQty * fillQty;
    } else {
      // Release blocked margin for MIS SELL then credit the sale value
      const marginPerQty = order.blockedMargin / order.qty;
      wallet.usedMargin -= marginPerQty * fillQty;
      wallet.availableBalance += order.price * fillQty;
    }

    let position = await PositionsModel.findOne({
      userId,
      name: order.name,
      product: order.product,
    });

    if (order.mode === "BUY") {
      if (!position) {
        position = new PositionsModel({
          userId,
          name: order.name,
          qty: fillQty,
          avg: order.price,
          product: order.product,
          ltp: order.price,
          price: order.price,
          net: "0.00%",
          day: "0.00%",
          isLoss: false,
        });
      } else {
        if (position.qty >= 0) {
          const newQty = position.qty + fillQty;
          position.avg =
            (position.qty * position.avg + fillQty * order.price) / newQty;
          position.qty = newQty;
        } else {
          position.qty += fillQty;
        }
      }
    } else {
      if (!position) {
        position = new PositionsModel({
          userId,
          name: order.name,
          qty: -fillQty,
          avg: order.price,
          product: order.product,
          ltp: order.price,
          price: order.price,
          net: "0.00%",
          day: "0.00%",
          isLoss: false,
        });
      } else {
        if (position.qty <= 0) {
          const newQty = position.qty - fillQty;
          position.avg =
            (Math.abs(position.qty) * position.avg + fillQty * order.price) /
            Math.abs(newQty);
          position.qty = newQty;
        } else {
          position.qty -= fillQty;
        }
      }
    }

    if (position.qty === 0) {
      await PositionsModel.deleteOne({ _id: position._id });
    } else {
      await position.save();
    }
  }

  await wallet.save();
  await emitWalletUpdate(userId);

  if (order.status === "PARTIALLY_FILLED") {
    await NotificationService.send({
      userId,
      title: "Order Partially Filled",
      message: `Your order for ${order.name} was partially filled (${fillQty}/${order.qty}).`,
      type: "GENERAL",
      channels: ["IN_APP", "WEBSOCKET"],
    });
  }
};

module.exports.executeOrder = executeOrder;

// Real-time Order Matching Engine
MarketDataService.on("tick", async (tick) => {
  try {
    const { symbol, price } = tick;
    // 1. Find and execute pending LIMIT orders for this symbol
    const pendingLimitOrders = await OrdersModel.find({
      name: symbol,
      status: { $in: ["PENDING", "PARTIALLY_FILLED"] },
      type: "LIMIT",
    });

    if (pendingLimitOrders.length > 0) {
      console.log(`[Matching Engine] Found ${pendingLimitOrders.length} pending LIMIT orders for ${symbol} at tick price ${price}`);
    }

    for (const order of pendingLimitOrders) {
      console.log(`  -> Checking order ${order._id}: mode=${order.mode}, orderPrice=${order.price}, currentPrice=${price}`);
      // Buy Limit: Execute if market price is lower or equal to limit price
      if (order.mode === "BUY" && price <= order.price) {
        console.log(`    -> Executing BUY order ${order._id}`);
        await executeOrder(order._id, order.userId);
      }
      // Sell Limit: Execute if market price is higher or equal to limit price
      else if (order.mode === "SELL" && price >= order.price) {
        console.log(`    -> Executing SELL order ${order._id}`);
        await executeOrder(order._id, order.userId);
      }
    }

    // 2. Find and process TRIGGER_PENDING stoploss orders
    const triggerPendingOrders = await OrdersModel.find({
      name: symbol,
      status: "TRIGGER_PENDING",
      type: { $in: ["SL", "SL-M", "TSL", "TSL-M"] },
    });

    for (const order of triggerPendingOrders) {
      let triggered = false;

      // A. Trailing Stop Loss price adjustment
      if (
        (order.type === "TSL" || order.type === "TSL-M") &&
        order.trailingStopLoss &&
        order.trailingStopLoss.value > 0
      ) {
        const tslValue = order.trailingStopLoss.isPercent
          ? price * (order.trailingStopLoss.value / 100)
          : order.trailingStopLoss.value;

        if (order.mode === "SELL") {
          // For a long position, trail stop loss up
          const potentialNewTrigger = price - tslValue;
          if (potentialNewTrigger > order.triggerPrice) {
            order.triggerPrice = potentialNewTrigger;
            await order.save();
          }
        } else {
          // 'BUY' mode, for a short position, trail stop loss down
          const potentialNewTrigger = price + tslValue;
          if (potentialNewTrigger < order.triggerPrice) {
            order.triggerPrice = potentialNewTrigger;
            await order.save();
          }
        }
      }

      // B. Check if stop loss is triggered
      if (order.mode === "SELL" && price <= order.triggerPrice) {
        triggered = true;
      } else if (order.mode === "BUY" && price >= order.triggerPrice) {
        triggered = true;
      }

      // C. Process triggered order
      if (triggered) {
        // Block margin now if it's a BUY stop-loss
        if (order.mode === "BUY") {
          const wallet = await WalletModel.findOne({ userId: order.userId });
          const orderValue = order.price * order.qty; // Using limit price for margin
          if (wallet.availableBalance < orderValue) {
            order.status = "REJECTED";
            order.rejectionReason = "Insufficient funds upon trigger";
            await order.save();
            await NotificationService.send({
              userId: order.userId,
              title: "Order Rejected",
              message: `Your stop-loss order for ${order.name} was rejected due to insufficient funds.`,
              type: "GENERAL",
              channels: ["IN_APP", "WEBSOCKET"],
            });
            continue; // go to next order
          }
          wallet.availableBalance -= orderValue;
          wallet.usedMargin += orderValue;
          await wallet.save();
          await emitWalletUpdate(order.userId);
        }

        // For SL-M/TSL-M, it becomes a market order.
        if (order.type === "SL-M" || order.type === "TSL-M") {
          order.status = "PENDING";
          order.type = "MARKET"; // Change type to market
          order.price = price; // Set price to current market price
          await order.save();
          await executeOrder(order._id, order.userId);
        } else {
          // For SL/TSL, it becomes a pending limit order
          order.status = "PENDING";
          await order.save();
          // The LIMIT order matching logic will now pick it up.
        }
      }
    }
  } catch (err) {
    console.error("Error in order matching engine:", err);
  }
});

const isMarketOpen = () => {
  const now = new Date();
  // Market Hours: 09:15 AM - 03:30 PM IST
  // IST is UTC+5:30.
  // 09:15 IST = 03:45 UTC
  // 15:30 IST = 10:00 UTC
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const time = hours * 60 + minutes;

  // 3 * 60 + 45 = 225
  // 10 * 60 = 600
  return time >= 225 && time < 600;
};

const calculateDynamicMargin = async (symbol, price, qty, product) => {
  const orderValue = price * qty;
  if (product === "CNC") return orderValue; // Delivery is usually 100% margin

  // 1. Get Base Leverage from Config
  const config = await BrokerConfigModel.findOne({ key: "margin_rules" });
  let leverage = config && config.value[product] ? config.value[product] : 5; // Default 5x for MIS

  // 2. Get Volatility from Market Data
  const volatility = MarketDataService.getVolatility(symbol);

  // 3. Dynamic Adjustment: If volatility > 2%, reduce leverage
  // Formula: AdjustedLeverage = BaseLeverage * (ReferenceVolatility / CurrentVolatility)
  const referenceVol = 1.5;
  if (volatility > referenceVol) {
    const adjustmentFactor = referenceVol / volatility;
    leverage = Math.max(1, leverage * adjustmentFactor);
  }

  return orderValue / leverage;
};

module.exports.newOrder = async (req, res) => {
  const {
    name,
    qty,
    price,
    mode,
    type,
    product,
    triggerPrice,
    trailingStopLoss,
  } = req.body;
  const userId = req.user._id;

  try {
    // Determine final target price
    let finalPrice = Number(price);
    if (type === "MARKET") {
      const livePrice = MarketDataService.getLastPrice(name);
      const basePrices = {
        INFY: 1555.45, ONGC: 116.8, TCS: 3194.8, KPITTECH: 266.45,
        QUICKHEAL: 308.55, WIPRO: 577.75, "M&M": 779.8, RELIANCE: 2112.4,
        HUL: 2383.4, HDFCBANK: 1522.0, SBIN: 500, BHARTIARTL: 900, ITC: 400, TATAPOWER: 300, "NIFTY 50": 22000, "SENSEX": 72000
      };
      finalPrice = livePrice || basePrices[name] || 500;
    }

    // 1. Wallet Check
    const wallet = await WalletModel.findOne({ userId });
    if (!wallet)
      return res
        .status(400)
        .json({ success: false, message: "Wallet not found" });

    const requiredMargin = await calculateDynamicMargin(
      name,
      finalPrice,
      Number(qty),
      product,
    );
    const isStopLossOrder = ["SL", "SL-M", "TSL", "TSL-M"].includes(type);

    if (isStopLossOrder) {
      if (!triggerPrice) {
        return res.status(400).json({
          success: false,
          message: "Trigger price is required for stop-loss orders.",
        });
      }
      // For SL orders, we don't block margin until triggered.
    } else if (mode === "BUY" || (mode === "SELL" && product === "MIS")) {
      if (wallet.availableBalance < requiredMargin) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient funds" });
      }
      // Block Funds
      wallet.availableBalance -= requiredMargin;
      wallet.usedMargin += requiredMargin;
      await wallet.save();
      await emitWalletUpdate(userId);
    } else if (mode === "SELL" && product === "CNC") {
      // Check Holdings
      const holding = await HoldingsModel.findOne({ userId, name });
      if (!holding || holding.qty < qty) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient holdings to sell" });
      }
    }

    // Check for AMO (After Market Order)
    const marketOpen = isMarketOpen();
    let status = "PENDING";

    if (!marketOpen) {
      status = "AMO_REQ";
    } else if (isStopLossOrder) {
      status = "TRIGGER_PENDING";
    }

    // 2. Create Order
    let newOrder = new OrdersModel({
      name,
      qty,
      price: finalPrice,
      mode,
      type,
      product,
      userId,
      status,
      triggerPrice: isStopLossOrder ? triggerPrice : undefined,
      trailingStopLoss:
        type === "TSL" || type === "TSL-M" ? trailingStopLoss : undefined,
      blockedMargin: (mode === "BUY" || (mode === "SELL" && product === "MIS")) && !isStopLossOrder ? requiredMargin : 0,
    });

    await newOrder.save();

    // 3. Notify Broker
    const brokers = await UserModel.find({ role: "broker" });
    for (const broker of brokers) {
      await NotificationService.send({
        userId: broker._id,
        title: "New Order Placed",
        message: `User ${req.user.username} placed ${mode} order for ${name}`,
        type: "GENERAL",
        channels: ["IN_APP", "WEBSOCKET"],
      });
    }

    // 4. Execute Order
    if (type === "MARKET" && status !== "AMO_REQ") {
      await executeOrder(newOrder._id, userId);
    }
    // LIMIT, SL, TSL orders are handled by the tick listener. AMO orders wait for cron.

    res.json({
      success: true,
      message: "Order placed successfully",
      order: newOrder,
    });
  } catch (error) {
    res.status(500).json({ message: "Error saving order", success: false });
  }
};

module.exports.getOrders = async (req, res) => {
  try {
    const orders = await OrdersModel.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", success: false });
  }
};

module.exports.getHoldings = async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ userId: req.user._id });

    const enrichedHoldings = holdings.map((holding) => {
      const ltp = MarketDataService.getLastPrice(holding.name) || holding.avg;
      const currentValue = holding.qty * ltp;
      const investmentValue = holding.qty * holding.avg;
      const pnl = currentValue - investmentValue;
      const net = investmentValue > 0 ? (pnl / investmentValue) * 100 : 0;

      return {
        ...holding.toObject(),
        ltp,
        currentValue,
        pnl,
        net: net.toFixed(2),
      };
    });

    res.json(enrichedHoldings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching holdings", success: false });
  }
};

module.exports.getPositions = async (req, res) => {
  try {
    const positions = await PositionsModel.find({ userId: req.user._id });

    const enrichedPositions = positions.map((position) => {
      const ltp = MarketDataService.getLastPrice(position.name) || position.avg;
      const pnl = (ltp - position.avg) * position.qty;

      return {
        ...position.toObject(),
        ltp,
        pnl,
      };
    });
    res.json(enrichedPositions);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching positions", success: false });
  }
};

module.exports.modifyOrder = async (req, res) => {
  const { id } = req.params;
  const { price, qty } = req.body; // new price and/or qty

  try {
    const userId = req.user._id;
    const order = await OrdersModel.findOne({ _id: id, userId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status !== "PENDING" && order.status !== "PARTIALLY_FILLED") {
      return res.status(400).json({
        success: false,
        message: `Cannot modify an order with status ${order.status}`,
      });
    }

    const wallet = await WalletModel.findOne({ userId });
    if (!wallet) {
      return res
        .status(400)
        .json({ success: false, message: "Wallet not found" });
    }

    const newPrice = price !== undefined ? Number(price) : order.price;
    const newQty = qty !== undefined ? Number(qty) : order.qty;

    if (newQty <= order.filledQty) {
      return res.status(400).json({
        success: false,
        message: "New quantity must be greater than filled quantity",
      });
    }

    if (order.mode === "BUY") {
      const remainingQty = order.qty - order.filledQty;
      const originalBlockedMargin = order.price * remainingQty;

      const newRemainingQty = newQty - order.filledQty;
      const newRequiredMargin = newPrice * newRemainingQty;

      const marginDifference = newRequiredMargin - originalBlockedMargin;

      if (marginDifference > 0) {
        if (wallet.availableBalance < marginDifference) {
          return res.status(400).json({
            success: false,
            message: "Insufficient funds for modification",
          });
        }
        wallet.availableBalance -= marginDifference;
        wallet.usedMargin += marginDifference;
      } else {
        wallet.availableBalance += Math.abs(marginDifference);
        wallet.usedMargin -= Math.abs(marginDifference);
      }
    } else if (order.mode === "SELL" && order.product === "CNC") {
      const holding = await HoldingsModel.findOne({ userId, name: order.name });
      const totalOwned = (holding ? holding.qty : 0) + order.filledQty;
      if (newQty > totalOwned) {
        return res.status(400).json({
          success: false,
          message: "Insufficient holdings for modification",
        });
      }
    }

    order.price = newPrice;
    order.qty = newQty;
    await order.save();
    await wallet.save();
    await emitWalletUpdate(userId);

    res.json({ success: true, message: "Order modified successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Error modifying order", success: false });
  }
};

const cancelOrderInternal = async (orderId, userId, reason = "Cancelled") => {
  const order = await OrdersModel.findOne({ _id: orderId, userId });
  if (!order) return { success: false, message: "Order not found" };

  if (
    !["PENDING", "PARTIALLY_FILLED", "TRIGGER_PENDING", "AMO_REQ"].includes(
      order.status,
    )
  ) {
    return {
      success: false,
      message: `Cannot cancel an order with status ${order.status}`,
    };
  }

  // Refund Logic for BUY orders where margin is blocked
  const isStopLoss = ["SL", "SL-M", "TSL", "TSL-M"].includes(order.type);
  if (order.mode === "BUY" && !isStopLoss) {
    const wallet = await WalletModel.findOne({ userId });
    if (wallet) {
      const remainingQty = order.qty - order.filledQty;
      // Refund based on the actual blocked margin per unit
      const marginToRefund = (order.blockedMargin / order.qty) * remainingQty;

      wallet.availableBalance += marginToRefund;
      wallet.usedMargin -= marginToRefund;

      await wallet.save();
      await emitWalletUpdate(userId);
    }
  }

  order.status = "CANCELLED";
  order.rejectionReason = reason;
  await order.save();

  return { success: true, order };
};

module.exports.cancelOrderInternal = cancelOrderInternal;

module.exports.cancelOrder = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const result = await cancelOrderInternal(id, userId, "Cancelled by user");
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: result.order,
    });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling order", success: false });
  }
};
