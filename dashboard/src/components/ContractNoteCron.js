const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { PassThrough } = require("stream");
const { OrdersModel } = require("../model/OrdersModel");
const { UserModel } = require("../model/UserModel");
const { calculateTaxes } = require("../utils/TaxCalculator");
const { generateContractNotePDF } = require("../utils/PDFGenerator");

// Email Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to generate PDF Buffer from the existing generator function
const generatePDFBuffer = (orders, taxes, user, date) => {
  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    const buffers = [];
    stream.on("data", (chunk) => buffers.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(buffers)));
    stream.on("error", reject);

    // Pass the stream as the 'res' object to the generator
    generateContractNotePDF(orders, taxes, user, date, stream);
  });
};

const sendContractNote = async (user, orders, date) => {
  try {
    // 1. Aggregate Taxes for the day
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

    // 2. Generate PDF
    const pdfBuffer = await generatePDFBuffer(orders, taxes, user, date);

    // 3. Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Contract Note for ${date} - Zerodha Clone`,
      text: `Dear ${user.username},\n\nPlease find attached the contract note for your trades executed on ${date}.\n\nRegards,\nZerodha Clone Team`,
      attachments: [
        {
          filename: `contract_note_${date}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Cron] Contract note sent to ${user.email}`);
  } catch (error) {
    console.error(
      `[Cron] Failed to send contract note to ${user.email}:`,
      error,
    );
  }
};

const runContractNoteCron = () => {
  // Schedule: 6:30 PM every weekday (Mon-Fri)
  cron.schedule("30 18 * * 1-5", async () => {
    console.log("[Cron] Running Daily Contract Note Job...");
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    try {
      // Find all filled orders for today
      const orders = await OrdersModel.find({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: "FILLED",
      }).populate("userId"); // Assuming userId in OrdersModel can populate or we fetch manually

      // Group orders by User ID
      const ordersByUser = {};
      orders.forEach((order) => {
        // Handle case where userId is a string or populated object
        const uid =
          typeof order.userId === "object"
            ? order.userId._id.toString()
            : order.userId;
        if (!ordersByUser[uid]) {
          ordersByUser[uid] = [];
        }
        ordersByUser[uid].push(order);
      });

      // Process each user
      for (const userId of Object.keys(ordersByUser)) {
        const user = await UserModel.findById(userId);
        if (user && user.email) {
          await sendContractNote(user, ordersByUser[userId], dateStr);
        }
      }
    } catch (error) {
      console.error("[Cron] Error executing contract note job:", error);
    }
  });
};

module.exports = runContractNoteCron;
