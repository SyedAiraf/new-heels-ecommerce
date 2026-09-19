const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ============ ORDER CONFIRMATION EMAIL TO CUSTOMER ============
async function sendOrderConfirmationEmail(order) {
  try {
    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #F8F3EF;">
            <strong style="color: #3F3040;">${item.productName}</strong>
            ${item.size ? `<br><small style="color: #8B6688;">Size: ${item.size}</small>` : ''}
            ${item.color ? `<br><small style="color: #8B6688;">Color: ${item.color}</small>` : ''}
          </td>
          <td style="padding: 12px; text-align: center; border-bottom: 1px solid #F8F3EF;">${item.quantity}</td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #F8F3EF;">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
        </tr>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #F8F3EF; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          
          <div style="background: #3F3040; padding: 30px; text-align: center;">
            <h1 style="color: #C9A45C; margin: 0; letter-spacing: 4px; font-size: 22px;">NEW HEELS</h1>
            <p style="color: #B9A0C0; margin: 5px 0 0; font-size: 11px; letter-spacing: 2px;">ORDER CONFIRMATION</p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #3F3040; margin-top: 0;">Thank you, ${order.customer.name}!</h2>
            <p style="color: #5a4a5c; line-height: 1.7;">
              Your order has been received and is being processed. We'll contact you soon to confirm delivery.
            </p>
            
            <div style="background: #F8F3EF; padding: 20px; margin: 25px 0; border-left: 3px solid #C9A45C;">
              <p style="margin: 0 0 8px; color: #8B6688; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Order Number</p>
              <p style="margin: 0; color: #3F3040; font-size: 20px; font-weight: bold; letter-spacing: 1px;">${order.orderNumber}</p>
            </div>
            
            <h3 style="color: #3F3040; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border-bottom: 2px solid #F8F3EF; padding-bottom: 10px;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background: #F8F3EF;">
                  <th style="padding: 10px; text-align: left; font-size: 11px; letter-spacing: 1px; color: #3F3040; text-transform: uppercase;">Item</th>
                  <th style="padding: 10px; text-align: center; font-size: 11px; letter-spacing: 1px; color: #3F3040; text-transform: uppercase;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-size: 11px; letter-spacing: 1px; color: #3F3040; text-transform: uppercase;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <table style="width: 100%; margin-top: 20px;">
              <tr>
                <td style="padding: 8px 0; color: #8B6688; font-size: 13px;">Subtotal</td>
                <td style="padding: 8px 0; text-align: right; color: #3F3040; font-weight: 600;">Rs. ${order.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #8B6688; font-size: 13px;">Delivery</td>
                <td style="padding: 8px 0; text-align: right; color: #3F3040; font-weight: 600;">${order.deliveryCharge === 0 ? 'FREE' : 'Rs. ' + order.deliveryCharge.toLocaleString()}</td>
              </tr>
              <tr style="border-top: 2px solid #F8F3EF;">
                <td style="padding: 15px 0 0; color: #3F3040; font-weight: bold; font-size: 15px;">TOTAL</td>
                <td style="padding: 15px 0 0; text-align: right; color: #8B6688; font-weight: bold; font-size: 18px;">Rs. ${order.total.toLocaleString()}</td>
              </tr>
            </table>
            
            <div style="background: #F8F3EF; padding: 20px; margin: 30px 0;">
              <h4 style="color: #3F3040; margin: 0 0 12px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Delivery Address</h4>
              <p style="margin: 0; color: #5a4a5c; line-height: 1.7; font-size: 13px;">
                ${order.customer.name}<br>
                ${order.customer.address}<br>
                ${order.customer.city}, ${order.customer.postalCode}<br>
                Phone: ${order.customer.phone}
              </p>
            </div>
            
            <p style="color: #8B6688; font-size: 13px; line-height: 1.7; text-align: center; margin-top: 30px;">
              Questions? WhatsApp us at <strong>0327 7985292</strong>
            </p>
          </div>
          
          <div style="background: #3F3040; padding: 25px; text-align: center;">
            <p style="color: #B9A0C0; margin: 0; font-size: 11px;">© 2026 New Heels Pakistan. All rights reserved.</p>
          </div>
          
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: 'New Heels <onboarding@resend.dev>',
      to: [order.customer.email],
      subject: `Order Confirmed - ${order.orderNumber}`,
      html: html
    });

    console.log('✅ Customer email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Customer email error:', error.message);
    throw error;
  }
}

// ============ NEW ORDER NOTIFICATION TO ADMIN ============
async function sendAdminOrderNotification(order) {
  try {
    let itemsHtml = '';
    order.items.forEach(item => {
      itemsHtml += `<li>${item.productName} (Qty: ${item.quantity}) - Rs. ${(item.price * item.quantity).toLocaleString()}</li>`;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; background: #F8F3EF; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          <div style="background: #3F3040; padding: 30px; text-align: center;">
            <h1 style="color: #C9A45C; margin: 0; letter-spacing: 4px; font-size: 22px;">NEW ORDER RECEIVED</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #3F3040; margin-top: 0;">Order #${order.orderNumber}</h2>
            <p style="color: #8B6688;">A new order has been placed.</p>
            
            <h3 style="color: #3F3040; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-top: 30px;">Customer</h3>
            <p style="color: #5a4a5c; line-height: 1.7;">
              <strong>${order.customer.name}</strong><br>
              📞 ${order.customer.phone}<br>
              📧 ${order.customer.email}<br>
              📍 ${order.customer.address}, ${order.customer.city}
            </p>
            
            <h3 style="color: #3F3040; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-top: 30px;">Items</h3>
            <ul style="color: #5a4a5c; line-height: 1.8;">
              ${itemsHtml}
            </ul>
            
            <div style="background: #F8F3EF; padding: 20px; margin-top: 30px; border-left: 3px solid #C9A45C;">
              <p style="margin: 0; color: #3F3040; font-size: 18px; font-weight: bold;">
                Total: Rs. ${order.total.toLocaleString()}
              </p>
              <p style="margin: 8px 0 0; color: #8B6688; font-size: 13px;">
                Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Bank Transfer'}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: 'New Heels <onboarding@resend.dev>',
     to: [process.env.ADMIN_NOTIFICATION_EMAIL || 'newheelsmardan@gmail.com'],
      subject: `New Order - ${order.orderNumber} - Rs. ${order.total.toLocaleString()}`,
      html: html
    });

    console.log('✅ Admin email sent:', result.id);
    return result;
  } catch (error) {
    console.error('❌ Admin email error:', error.message);
    throw error;
  }
}

module.exports = {
  sendOrderConfirmationEmail,
  sendAdminOrderNotification
};