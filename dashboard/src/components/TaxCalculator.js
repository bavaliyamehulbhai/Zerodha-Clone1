const calculateTaxes = (order) => {
  const value = order.price * order.qty;
  const isIntraday = order.product === "MIS";
  const isSell = order.mode === "SELL";
  const isBuy = order.mode === "BUY";

  // 1. Brokerage (Zerodha model: Free Delivery, Flat 20 Intraday)
  let brokerage = 0;
  if (isIntraday) {
    brokerage = Math.min(20, value * 0.0003);
  }

  // 2. STT/CTT
  // Delivery: 0.1% on Buy & Sell
  // Intraday: 0.025% on Sell only
  let stt = 0;
  if (isIntraday) {
    if (isSell) stt = value * 0.00025;
  } else {
    stt = value * 0.001;
  }

  // 3. Transaction Charges (Exchange) ~ 0.00345% (NSE/BSE avg)
  const txnCharges = value * 0.0000345;

  // 4. SEBI Charges: ₹10 per crore = 0.0001%
  const sebiCharges = value * 0.000001;

  // 5. GST (18% on Brokerage + TxnCharges + SEBI)
  const gst = (brokerage + txnCharges + sebiCharges) * 0.18;

  // 6. Stamp Duty (Buy only)
  // Delivery: 0.015%, Intraday: 0.003%
  let stampDuty = 0;
  if (isBuy) {
    stampDuty = value * (isIntraday ? 0.00003 : 0.00015);
  }

  const totalTax = brokerage + stt + txnCharges + gst + sebiCharges + stampDuty;

  return {
    value,
    brokerage,
    stt,
    txnCharges,
    gst,
    sebiCharges,
    stampDuty,
    totalTax,
  };
};

module.exports = { calculateTaxes };
