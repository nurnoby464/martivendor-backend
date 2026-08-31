"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellerNotificationTemplate = void 0;
const sellerNotificationTemplate = (sellerName, orderData) => `
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
        .action-btn { display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 New Order Received!</h1>
        </div>

        <div class="alert">
            <p>Hello ${sellerName},</p>
            <p>You have a new order! Take action now to process it.</p>
        </div>

        <div class="order-info">
            <h3>Order Details:</h3>
            <p><strong>Order #:</strong> ${orderData.orderNumber}</p>
            <p><strong>Customer Name:</strong> ${orderData.customerName}</p>
            <p><strong>Customer Phone:</strong> ${orderData.customerPhone}</p>
            <p><strong>Items:</strong> ${orderData.itemCount} product(s)</p>
            <p><strong>Total Amount:</strong> ৳${orderData.totalAmount}</p>
            <p><strong>Payment Status:</strong> <strong style="color: ${orderData.paymentStatus === "paid" ? "green" : "orange"}">${orderData.paymentStatus.toUpperCase()}</strong></p>
        </div>

        <p>Log in to your seller dashboard to view full order details and start processing:</p>
        <a href="${process.env.SELLER_DASHBOARD_URL}/orders" class="action-btn">View Order in Dashboard</a>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated notification from your multi-vendor platform.</p>
        </div>
    </div>
</body>
</html>
`;
exports.sellerNotificationTemplate = sellerNotificationTemplate;
//# sourceMappingURL=sellerNotification.js.map