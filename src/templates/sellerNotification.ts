import { escapeHtml as h } from "../utils/escapeHtml";

export type TSellerNotificationData = {
  subOrderNumber: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; sku: string; quantity: number; totalPrice: number }[];
  subtotal: number;
  shippingCharge: number;
  total: number;
  paymentNote: string;
};

export const sellerNotificationTemplate = (sellerName: string, d: TSellerNotificationData) => `
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
      <p>Hello ${h(sellerName)},</p>
      <p>You have a new order. Please prepare the items below.</p>
    </div>
    <div class="order-info">
      <p><strong>Order #:</strong> ${h(d.subOrderNumber)}</p>
      <p><strong>Customer:</strong> ${h(d.customerName)}<br>
         <strong>Phone:</strong> ${h(d.customerPhone)}</p>
      <table class="items-table">
        <thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Total</th></tr></thead>
        <tbody>
          ${d.items.map((i) => `<tr><td>${h(i.name)}</td><td>${h(i.sku)}</td><td>${i.quantity}</td><td>৳${i.totalPrice}</td></tr>`).join("")}
        </tbody>
      </table>
      <p>Subtotal: ৳${d.subtotal}<br>Shipping: ৳${d.shippingCharge}<br>
         <strong>Order total: ৳${d.total}</strong></p>
      <p><strong>Payment:</strong> ${h(d.paymentNote)}</p>
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