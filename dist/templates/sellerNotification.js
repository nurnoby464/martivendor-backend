"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerNotificationTemplate = void 0;
const escapeHtml_1 = require("../utils/escapeHtml");
const sellerNotificationTemplate = (sellerName, d) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
    .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; }
    .order-info { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
    .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .items-table th, .items-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    .action-btn { display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎉 New Order Received!</h1></div>
    <div class="alert">
      <p>Hello ${(0, escapeHtml_1.escapeHtml)(sellerName)},</p>
      <p>You have a new order. Please prepare the items below.</p>
    </div>
    <div class="order-info">
      <p><strong>Order #:</strong> ${(0, escapeHtml_1.escapeHtml)(d.subOrderNumber)}</p>
      <p><strong>Customer:</strong> ${(0, escapeHtml_1.escapeHtml)(d.customerName)}<br>
         <strong>Phone:</strong> ${(0, escapeHtml_1.escapeHtml)(d.customerPhone)}</p>
      <table class="items-table">
        <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>
          ${d.items.map((i) => `<tr><td>${(0, escapeHtml_1.escapeHtml)(i.name)}</td><td>${(0, escapeHtml_1.escapeHtml)(i.sku)}</td><td>${i.quantity}</td><td>৳${i.totalPrice}</td></tr>`).join("")}
        </tbody>
      </table>
      <p>Subtotal: ৳${d.subtotal}<br>Shipping: ৳${d.shippingCharge}<br>
         <strong>Order total: ৳${d.total}</strong></p>
      <p><strong>Payment:</strong> ${(0, escapeHtml_1.escapeHtml)(d.paymentNote)}</p>
    </div>
    <p>Log in to your seller dashboard to see the full details and start processing:</p>
    <a href="${process.env.SELLER_DASHBOARD_URL ?? ""}/orders" class="action-btn">View Order in Dashboard</a>
    <div style="margin-top:30px;padding-top:20px;border-top:1px solid #ddd;text-align:center;font-size:12px;color:#666;">
      <p>This is an automated notification from your multi-vendor platform.</p>
    </div>
  </div>
</body>
</html>
`;
exports.sellerNotificationTemplate = sellerNotificationTemplate;
//# sourceMappingURL=sellerNotification.js.map