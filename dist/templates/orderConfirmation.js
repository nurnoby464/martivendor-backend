"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderConfirmationTemplate = void 0;
const escapeHtml_1 = require("../utils/escapeHtml");
const orderConfirmationTemplate = (customerName, o) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .box { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .items-table th, .items-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    .items-table th { background-color: #f0f0f0; }
    .right { text-align: right; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Order Confirmation</h1></div>

    <div class="box">
      <h2>Hello ${(0, escapeHtml_1.escapeHtml)(customerName)},</h2>
      <p>Thank you for your order! We have received it.</p>
      <p><strong>Order:</strong> #${(0, escapeHtml_1.escapeHtml)(o.orderNumber)}<br>
         <strong>Date:</strong> ${new Date(o.createdAt).toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" })}</p>
      ${o.packages.length > 1 ? `<p>Your items come from ${o.packages.length} sellers, so they will arrive in ${o.packages.length} separate packages.</p>` : ""}
    </div>

    ${o.packages.map((p, i) => `
    <div class="box">
      <h3>Package ${i + 1} of ${o.packages.length}: ${(0, escapeHtml_1.escapeHtml)(p.sellerName)}</h3>
      <table class="items-table">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>
          ${p.items.map((it) => `<tr><td>${(0, escapeHtml_1.escapeHtml)(it.name)}</td><td>${it.quantity}</td><td>৳${it.sellingPrice}</td><td>৳${it.totalPrice}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="right">Shipping: ৳${p.shippingCharge}<br><strong>Package total: ৳${p.total}</strong></p>
    </div>`).join("")}

    <div class="box right">
      <p>Subtotal: ৳${o.subtotal}</p>
      ${o.discountTotal > 0 ? `<p>You saved: ৳${o.discountTotal}</p>` : ""}
      <p>Shipping: ৳${o.shippingTotal}</p>
      <hr>
      <p><strong>Total: ৳${o.grandTotal}</strong></p>
    </div>

    <div class="box">
      <h3>Shipping Address</h3>
      <p>${(0, escapeHtml_1.escapeHtml)(o.shippingAddress.name)}<br>
         ${(0, escapeHtml_1.escapeHtml)(o.shippingAddress.address)}<br>
         ${(0, escapeHtml_1.escapeHtml)(o.shippingAddress.city)}${o.shippingAddress.zip ? `, ${(0, escapeHtml_1.escapeHtml)(o.shippingAddress.zip)}` : ""}<br>
         Phone: ${(0, escapeHtml_1.escapeHtml)(o.shippingAddress.phone)}</p>
      <h3>Payment</h3>
      ${o.paymentMethod === "cash_on_delivery"
    ? `<p><strong>Cash on delivery.</strong> Pay the courier when each package arrives. The amount for each package is shown above.</p>`
    : `<p><strong>${(0, escapeHtml_1.escapeHtml)(o.paymentStatus.toUpperCase())}</strong><br>Amount due: ৳${o.dueAmount}</p>`}
    </div>

    <div class="footer">
      <p>Thank you for shopping with us!</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
`;
exports.orderConfirmationTemplate = orderConfirmationTemplate;
//# sourceMappingURL=orderConfirmation.js.map