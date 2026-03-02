const { OrdersModel } = require("../model/OrdersModel");
const { UserModel } = require("../model/UserModel");
const { calculateTaxes } = require("../utils/TaxCalculator");
const { generateContractNotePDF } = require("../utils/PDFGenerator");

module.exports.downloadContractNote = async (req, res) => {
  try {
    const { date } = req.query; // Format: YYYY-MM-DD
    const userId = req.user._id;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const orders = await OrdersModel.find({
      userId,
      createdAt: { $gte: startDate, $lte: endDate },
      status: "FILLED", // Only filled orders appear in contract note
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: "No trades found for this date" });
    }

    const user = await UserModel.findById(userId);

    // Aggregate Taxes
    let taxes = {
      netObligation: 0,
      totalBrokerage: 0,
      totalSTT: 0,
      totalExchangeTxn: 0,
      totalSebi: 0,
      totalStampDuty: 0,
      totalGST: 0,
      netAmount: 0,
    };

    orders.forEach((order) => {
      const tax = calculateTaxes(order);
      taxes.totalBrokerage += tax.brokerage;
      taxes.totalSTT += tax.stt;
      taxes.totalExchangeTxn += tax.txnCharges;
      taxes.totalSebi += tax.sebiCharges;
      taxes.totalStampDuty += tax.stampDuty;
      taxes.totalGST += tax.gst;

      // Net Obligation: Sell (+) - Buy (-)
      if (order.mode === "SELL") {
        taxes.netObligation += tax.value;
      } else {
        taxes.netObligation -= tax.value;
      }
    });

    const totalCharges =
      taxes.totalBrokerage +
      taxes.totalSTT +
      taxes.totalExchangeTxn +
      taxes.totalSebi +
      taxes.totalStampDuty +
      taxes.totalGST;

    taxes.netAmount = taxes.netObligation - totalCharges;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=contract_note_${date}.pdf`,
    );

    generateContractNotePDF(orders, taxes, user, date, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating contract note" });
  }
};

module.exports.getTaxReport = async (req, res) => {
  try {
    const userId = req.user._id;
    // Fetch all filled orders sorted by date
    const orders = await OrdersModel.find({ userId, status: "FILLED" }).sort({
      createdAt: 1,
    });

    // Simplified P&L Logic (Real-world requires FIFO matching)
    let realizedPL = 0;
    let totalCharges = 0;
    let turnover = 0;

    orders.forEach((order) => {
      const tax = calculateTaxes(order);
      totalCharges += tax.totalTax;
      turnover += tax.value;

      // Very basic P&L approximation for demo
      // (Assuming Sell Price - Buy Price logic is handled in a real Tradebook)
      if (order.mode === "SELL") {
        // Mock logic: Assume 5% profit on every sell for demo
        realizedPL += order.price * order.qty * 0.05;
      }
    });

    res.json({
      success: true,
      data: {
        realizedPL: parseFloat(realizedPL.toFixed(2)),
        unrealizedPL: 0, // Requires current market price
        totalCharges: parseFloat(totalCharges.toFixed(2)),
        netPL: parseFloat((realizedPL - totalCharges).toFixed(2)),
        turnover: parseFloat(turnover.toFixed(2)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tax report" });
  }
};
