import { IOrderDocument } from "../CRM/order/order.interface";

export const orderConfirmationTemplate = (
  customerName: string,
  order: IOrderDocument,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .order-details { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background-color: #f0f0f0; }
        .total-section { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Order Confirmation</h1>
        </div>

        <div class="order-details">
            <h2>Hello ${customerName},</h2>
            <p>Thank you for your order! We've received your order and it will be processed shortly.</p>

            <h3>Order Number: <strong>#${order.orderNumber}</strong></h3>
            <p><strong>Order Date:</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString()}</p>

            <h3>Order Items:</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items
                      .map(
                        (item) => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>৳${item.sellingPrice}</td>
                            <td>৳${item.totalPrice}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <div class="total-section">
                <p>Subtotal: ৳${order.subtotal}</p>
                <p>Discount: -৳${order.discountAmount}</p>
                <p>Tax: ৳${order.taxAmount}</p>
                <p>Shipping: ৳${order.shippingCharge}</p>
                <hr>
                <p>Total: ৳${order.grandTotal}</p>
            </div>

            <h3>Shipping Address:</h3>
            <p>
                ${order.shippingAddress.name}<br>
                ${order.shippingAddress.address}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.zip}<br>
                Phone: ${order.shippingAddress.phone}
            </p>

            <h3>Payment Status:</h3>
            <p><strong>${order.paymentStatus.toUpperCase()}</strong></p>
            ${
              order.paymentStatus !== "paid"
                ? `
                <p>Paid Amount: ৳${order.paidAmount}</p>
                <p>Due Amount: ৳${order.dueAmount}</p>
            `
                : ""
            }
        </div>

        <div class="footer">
            <p>Thank you for shopping with us!</p>
            <p>If you have any questions, please contact our support team.</p>
        </div>
    </div>
</body>
</html>
`;
