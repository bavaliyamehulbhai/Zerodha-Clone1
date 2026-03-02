const PDFDocument = require("pdfkit");

const generateContractNotePDF = (orders, taxes, user, date, res) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(res);

  // --- Header ---
  doc.fontSize(20).text("Contract Note", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`Date: ${date}`, { align: "right" });
  doc.text(`Client Code: ${user._id}`);
  doc.text(`Client Name: ${user.username}`);
  doc.text(`Email: ${user.email}`);
  doc.moveDown();

  // --- Trades Table ---
  const tableTop = 150;
  let y = tableTop;

  // Table Headers
  doc.font("Helvetica-Bold");
  doc.text("Order No", 50, y);
  doc.text("Time", 120, y);
  doc.text("Txn", 180, y); // Buy/Sell
  doc.text("Instrument", 230, y);
  doc.text("Qty", 330, y);
  doc.text("Price", 380, y);
  doc.text("Net Total", 450, y);
  doc.font("Helvetica");

  y += 15;
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;

  // Table Rows
  orders.forEach((order) => {
    const total = order.price * order.qty;
    doc.text(order._id.toString().slice(-8), 50, y);
    doc.text(new Date(order.createdAt).toLocaleTimeString(), 120, y);
    doc.text(order.mode, 180, y);
    doc.text(order.name, 230, y);
    doc.text(order.qty.toString(), 330, y);
    doc.text(order.price.toFixed(2), 380, y);
    doc.text(total.toFixed(2), 450, y);
    y += 20;
  });

  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 30;

  // --- Financial Summary ---
  doc.fontSize(14).text("Financial Summary", 50, y);
  y += 25;
  doc.fontSize(10);

  const addSummaryRow = (label, value) => {
    doc.text(label, 300, y);
    doc.text(value.toFixed(2), 500, y, { align: "right" });
    y += 15;
  };

  addSummaryRow("Pay In / Pay Out Obligation", taxes.netObligation);
  addSummaryRow("Brokerage", taxes.totalBrokerage);
  addSummaryRow("STT / CTT", taxes.totalSTT);
  addSummaryRow("Exchange Transaction Charges", taxes.totalExchangeTxn);
  addSummaryRow("SEBI Turnover Fees", taxes.totalSebi);
  addSummaryRow("Stamp Duty", taxes.totalStampDuty);
  addSummaryRow("GST", taxes.totalGST);

  y += 5;
  doc.moveTo(300, y).lineTo(550, y).stroke();
  y += 10;

  doc.font("Helvetica-Bold");
  addSummaryRow("Net Amount Receivable / (Payable)", taxes.netAmount);

  doc.end();
};

module.exports = { generateContractNotePDF };
