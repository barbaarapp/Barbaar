import nodemailer from "nodemailer";

interface BookingRequest {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  therapistName: string;
  category: string;
  date: string;
  time: string;
  price: number;
  priceUnit: string;
  financialAidApplied: boolean;
  action?: string;
}

export const onRequestPost = async (context: { request: Request; env?: any }) => {
  try {
    const data: BookingRequest = await context.request.json();
    const {
      bookingId,
      clientName,
      clientEmail,
      clientPhone,
      therapistName,
      category,
      date,
      time,
      price,
      priceUnit,
      financialAidApplied,
      action,
    } = data;

    // Standardize price formatting
    const formattedPrice = `${priceUnit || "$"}${price}`;

    // Gmail SMTP credentials
    const smtpEmail = "barbaaryp@gmail.com";
    const smtpPass = "yysxhlvxjtfoijkp"; // Cleaned up app password

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpEmail,
        pass: smtpPass,
      },
    });

    if (action === "send_approval_notification") {
      const getFutureDateStr = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      };
      const expiryDateStr = getFutureDateStr(3);

      const approvalEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #f6f8f6;
              color: #1e241f;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
              border: 1px solid #e2ece3;
              overflow: hidden;
            }
            .header {
              background-color: #558B51;
              padding: 36px 24px;
              color: #ffffff;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header p {
              margin: 6px 0 0;
              font-size: 14px;
              opacity: 0.9;
              letter-spacing: 0.5px;
            }
            .content {
              padding: 36px 32px;
            }
            .greeting {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 24px;
              color: #1e241f;
            }
            .alert-box {
              background-color: #eaf5ea;
              border-left: 4px solid #558B51;
              color: #2b5c28;
              padding: 16px;
              border-radius: 8px;
              font-size: 14px;
              line-height: 1.5;
              margin-bottom: 24px;
              font-weight: 600;
            }
            .details-card {
              background-color: #faf9f6;
              border: 1px solid #efebe1;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 28px;
            }
            .label {
              font-size: 11px;
              font-weight: 700;
              color: #8c8573;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .value {
              font-size: 15px;
              font-weight: 600;
              color: #1e241f;
              margin-bottom: 14px;
            }
            .value:last-child {
              margin-bottom: 0;
            }
            .action-btn {
              display: block;
              background-color: #558B51;
              color: #ffffff !important;
              text-decoration: none;
              text-align: center;
              font-weight: 700;
              font-size: 14px;
              padding: 14px 20px;
              border-radius: 12px;
              margin: 28px 0;
              box-shadow: 0 4px 12px rgba(85, 139, 81, 0.15);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              background-color: #faf9f6;
              border-top: 1px solid #efebe1;
              padding: 24px;
              text-align: center;
              font-size: 12px;
              color: #8c8573;
              line-height: 1.5;
            }
            .footer a {
              color: #558B51;
              text-decoration: none;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BARBAAR WELLNESS</h1>
              <p>FINANCIAL AID APPROVED</p>
            </div>
            <div class="content">
              <div class="greeting">
                <strong>Hi ${clientName},</strong><br><br>
                We have some wonderful news! Our administration team has reviewed your request and successfully <strong>APPROVED</strong> your application for the Barbaar Financial Relief program.
              </div>

              <div class="alert-box">
                🎉 Your 40% pre-approved financial relief is now locked and active! It has been linked to your profile and will be applied automatically at checkout.
              </div>
              
              <div class="details-card">
                <div class="label">Approved Category</div>
                <div class="value">${category || "Somali Youth & Community"}</div>

                <div class="label">Relief Discount</div>
                <div class="value">40% Off All Session Fees</div>

                <div class="label">Approved Date</div>
                <div class="value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>

                <div class="label">Expiration Date (3 Days Only)</div>
                <div class="value" style="color: #c07d1a; font-weight: 700;">${expiryDateStr}</div>
              </div>

              <p style="font-size: 14px; color: #4e4839; line-height: 1.6; text-align: center; font-weight: 500;">
                ⚠️ <strong>Important Validity Window:</strong><br>
                This pre-approved financial aid is valid for <strong>3 days only</strong> to ensure we can distribute our limited budget fairly. Please book your first session today to keep this rate locked in!
              </p>

              <a href="https://app.barbaar.org" class="action-btn">Book Your Session Today</a>
            </div>
            <div class="footer">
              <p><strong>Barbaar Wellness</strong> • Professional mental health care made accessible and private.</p>
              <p>Need assistance or have questions? Contact us at <a href="mailto:barbaaryp@gmail.com">barbaaryp@gmail.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      const whatsappApprovalText = `*BARBAAR WELLNESS* 🎉\n---------------------------\nHalloo ${clientName},\n\nWe are pleased to inform you that your *Barbaar Financial Aid has been APPROVED*! \n\n*Relief Rate:* 40% Off All Sessions\n*Category:* ${category || "Somali Youth"}\n*Expiry:* Valid for 3 days only (until ${expiryDateStr})\n\nSecure your slot and book today: https://app.barbaar.org\n---------------------------`;

      const waToken = (context.env && context.env.WHATSAPP_API_TOKEN) || (typeof process !== "undefined" && process.env && process.env.WHATSAPP_API_TOKEN);
      const waPhoneId = (context.env && context.env.WHATSAPP_PHONE_NUMBER_ID) || (typeof process !== "undefined" && process.env && process.env.WHATSAPP_PHONE_NUMBER_ID) || "me";

      let whatsappStatus = "not_configured";

      if (waToken && clientPhone) {
        try {
          const cleanPhoneNo = clientPhone.replace(/[^0-9]/g, "");
          await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${waToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhoneNo,
              type: "text",
              text: {
                body: whatsappApprovalText,
              },
            }),
          });
          whatsappStatus = "sent";
        } catch (err) {
          whatsappStatus = "error";
        }
      } else {
        console.log("Simulated WhatsApp Approval successfully logged:", {
          to: clientPhone,
          body: whatsappApprovalText
        });
        whatsappStatus = "simulated";
      }

      await transporter.sendMail({
        from: `"Barbaar Wellness" <${smtpEmail}>`,
        to: clientEmail,
        subject: `Congratulations! Your 40% Barbaar Financial Aid is Approved 🎉`,
        html: approvalEmailHtml,
      });

      return new Response(JSON.stringify({ success: true, whatsapp: whatsappStatus, expiryDate: expiryDateStr }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "send_expiry_warning_notification") {
      const getFutureDateStr = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      };
      const warningExpiryDateStr = getFutureDateStr(1);

      const warningEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #fdfaf6;
              color: #1e241f;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
              border: 1px solid #f2dfcc;
              overflow: hidden;
            }
            .header {
              background-color: #c2813c;
              padding: 36px 24px;
              color: #ffffff;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header p {
              margin: 6px 0 0;
              font-size: 14px;
              opacity: 0.9;
              letter-spacing: 1px;
            }
            .content {
              padding: 36px 32px;
            }
            .greeting {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 24px;
              color: #1e241f;
            }
            .urgency-badge {
              display: inline-block;
              background-color: #fff3cd;
              color: #856404;
              border: 1px solid #ffeeba;
              font-weight: 700;
              font-size: 12px;
              padding: 6px 14px;
              border-radius: 999px;
              margin-bottom: 24px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .benefit-section {
              margin: 32px 0;
              padding: 24px;
              background-color: #fafaf8;
              border: 1px solid #efefe9;
              border-radius: 12px;
            }
            .benefit-item {
              margin-bottom: 20px;
            }
            .benefit-item:last-child {
              margin-bottom: 0;
            }
            .benefit-title {
              font-size: 15px;
              font-weight: 700;
              color: #558B51;
              margin-bottom: 6px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .benefit-text {
              font-size: 13.5px;
              color: #4a4f4b;
              line-height: 1.5;
            }
            .details-card {
              background-color: #faf9f6;
              border: 1px solid #efebe1;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 28px;
            }
            .label {
              font-size: 11px;
              font-weight: 700;
              color: #8c8573;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .value {
              font-size: 15px;
              font-weight: 600;
              color: #1e241f;
              margin-bottom: 14px;
            }
            .value:last-child {
              margin-bottom: 0;
            }
            .action-btn {
              display: block;
              background-color: #c2813c;
              color: #ffffff !important;
              text-decoration: none;
              text-align: center;
              font-weight: 700;
              font-size: 14px;
              padding: 14px 20px;
              border-radius: 12px;
              margin: 28px 0;
              box-shadow: 0 4px 12px rgba(194, 129, 60, 0.15);
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              background-color: #faf9f6;
              border-top: 1px solid #efebe1;
              padding: 24px;
              text-align: center;
              font-size: 12px;
              color: #8c8573;
              line-height: 1.5;
            }
            .footer a {
              color: #558B51;
              text-decoration: none;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BARBAAR WELLNESS</h1>
              <p>URGENT: ACTION REQUIRED</p>
            </div>
            <div class="content" style="text-align: left;">
              <div style="text-align: center;">
                <div class="urgency-badge">⌛ Only 24 Hours Left</div>
              </div>

              <div class="greeting">
                <strong>Hi ${clientName},</strong><br><br>
                This is a quick friendly reminder that your pre-approved <strong>40% Barbaar Financial Aid is expiring tomorrow</strong> (${warningExpiryDateStr}). To prevent this relief discount from lapsing, we encourage you to schedule your session today.
              </div>

              <div class="benefit-section">
                <div class="benefit-item">
                  <div class="benefit-title">🌱 Why Speaking with a Therapist Matters</div>
                  <div class="benefit-text">
                    Your mind is the foundation of everything you do. Speaking with a trained professional provides a private, compassionate space to unpack challenges, untangle complex emotions, and build practical tools to reduce anxiety and stress. Taking care of your mental health is a profound act of strength.
                  </div>
                </div>

                <div class="benefit-item">
                  <div class="benefit-title">🔒 Absolute Privacy &amp; Confidentiality</div>
                  <div class="benefit-text">
                    We know that seeking support takes courage. That is why your absolute privacy is our sacred guarantee. All consultations are 100% private, highly confidential, and hosted in secure virtual rooms. Your files and sessions will never be shared with anyone else. What happens in therapy stays in therapy.
                  </div>
                </div>

                <div class="benefit-item">
                  <div class="benefit-title">💼 Verified Experts You Can Trust</div>
                  <div class="benefit-text">
                    Our therapists are highly qualified specialists with years of clinical and counseling experience. They are compassionate, culturally aware, and dedicated to supporting Somali youth and the wider community on their personal journey of healing and growth.
                  </div>
                </div>
              </div>
              
              <div class="details-card">
                <div class="label">Pre-Approved Relief</div>
                <div class="value">40% OFF All Consultations</div>

                <div class="label">Validity Status</div>
                <div class="value" style="color: #c5221f; font-weight: 700;">Expiring Tomorrow!</div>
              </div>

              <p style="font-size: 14px; color: #4e4839; line-height: 1.6; text-align: center;">
                Don't let your 40% financial aid expire. Book a session with one of our expert therapists today and invest in your peace of mind.
              </p>

              <a href="https://app.barbaar.org" class="action-btn">Book &amp; Secure Your 40% Relief Now</a>
            </div>
            <div class="footer">
              <p><strong>Barbaar Wellness</strong> • Professional, confidential, and compassionate mental health care.</p>
              <p>Questions? We're here to help at <a href="mailto:barbaaryp@gmail.com">barbaaryp@gmail.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"Barbaar Wellness" <${smtpEmail}>`,
        to: clientEmail,
        subject: `Only 24 hours left: Your 40% Barbaar Financial Aid is about to expire! ⏳`,
        html: warningEmailHtml,
      });

      return new Response(JSON.stringify({ success: true, warningSent: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "activate_reminders") {
      // 1. Send Session Reminder & Link ONLY Email (Not invoice, so not repeatable)
      const reminderEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              background-color: #fcfbf7;
              color: #1e241f;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
              border: 1px solid #f2eee5;
              overflow: hidden;
            }
            .header {
              background-color: #558B51; /* Acacia color theme */
              padding: 32px 24px;
              color: #ffffff;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .header p {
              margin: 6px 0 0;
              font-size: 14px;
              opacity: 0.9;
            }
            .content {
              padding: 32px 24px;
            }
            .greeting {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 24px;
            }
            .details-card {
              background-color: #faf9f6;
              border: 1px solid #efebe1;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
            }
            .label {
              font-size: 11px;
              font-weight: 700;
              color: #8c8573;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .value {
              font-size: 14px;
              font-weight: 600;
              color: #1e241f;
              margin-bottom: 12px;
            }
            .action-btn {
              display: block;
              background-color: #558B51;
              color: #ffffff !important;
              text-decoration: none;
              text-align: center;
              font-weight: 700;
              font-size: 14px;
              padding: 14px 20px;
              border-radius: 12px;
              margin: 28px 0 16px;
              box-shadow: 0 4px 12px rgba(85, 139, 81, 0.15);
            }
            .footer {
              background-color: #faf9f6;
              border-top: 1px solid #efebe1;
              padding: 24px;
              text-align: center;
              font-size: 12px;
              color: #8c8573;
              line-height: 1.5;
            }
            .footer a {
              color: #558B51;
              text-decoration: none;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BARBAAR WELLNESS</h1>
              <p>Your session schedule and room details</p>
            </div>
            <div class="content">
              <div class="greeting">
                <strong>Hi ${clientName},</strong><br>
                Your session reminders are now active! Below are the details of your upcoming consultation and the direct link to enter the video session room.
              </div>
              
              <div class="details-card">
                <div class="label">Session ID</div>
                <div class="value">SES-${bookingId.toUpperCase()}</div>

                <div class="label">Therapist</div>
                <div class="value">${therapistName}</div>

                <div class="label">Category</div>
                <div class="value">${category.toUpperCase()}</div>

                <div class="label">Schedule</div>
                <div class="value">${date} at ${time}</div>
              </div>

              <p style="font-size: 13.5px; color: #6a6352; line-height: 1.5; text-align: center;">
                Please make sure to join 5 minutes before your scheduled session time. Click the button below to join the video session.
              </p>

              <a href="https://app.barbaar.org" class="action-btn">Join Video Session Room</a>
            </div>
            <div class="footer">
              <p><strong>Barbaar Wellness</strong> • Mental health care made simple and accessible.</p>
              <p>Need help? Contact us at <a href="mailto:barbaaryp@gmail.com">barbaaryp@gmail.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

      // 2. Programmatically dispatch automatic WhatsApp message directly from our +252 905 893 406 business account
      const whatsappReminderText = `*BARBAAR WELLNESS REMINDER* 🔔\n---------------------------\nHalloo ${clientName},\nYour session reminders are now active!\n\n*Therapist:* ${therapistName}\n*Schedule:* ${date} at ${time}\n*Session Link:* https://app.barbaar.org\n---------------------------\nPlease join 5 minutes before the scheduled time.`;

      const waToken = (context.env && context.env.WHATSAPP_API_TOKEN) || (typeof process !== "undefined" && process.env && process.env.WHATSAPP_API_TOKEN);
      const waPhoneId = (context.env && context.env.WHATSAPP_PHONE_NUMBER_ID) || (typeof process !== "undefined" && process.env && process.env.WHATSAPP_PHONE_NUMBER_ID) || "me";

      let whatsappStatus = "not_configured";

      if (waToken) {
        try {
          const cleanPhoneNo = clientPhone.replace(/[^0-9]/g, "");
          const waResponse = await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${waToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: cleanPhoneNo,
              type: "text",
              text: {
                body: whatsappReminderText,
              },
            }),
          });

          if (waResponse.ok) {
            whatsappStatus = "sent";
          } else {
            const errText = await waResponse.text();
            console.error("WhatsApp Cloud API error response:", errText);
            whatsappStatus = "failed";
          }
        } catch (waErr) {
          console.error("Error communicating with WhatsApp Cloud API:", waErr);
          whatsappStatus = "error";
        }
      } else {
        console.log("No WHATSAPP_API_TOKEN configured. Simulated WhatsApp Reminder successfully logged:", {
          to: clientPhone,
          body: whatsappReminderText
        });
      }

      // Send Reminder Email to Client
      await transporter.sendMail({
        from: `"Barbaar Wellness" <${smtpEmail}>`,
        to: clientEmail,
        subject: `Reminder: Your Upcoming Session with ${therapistName}`,
        html: reminderEmailHtml,
      });

      return new Response(JSON.stringify({ success: true, whatsapp: whatsappStatus }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Client Invoice HTML
    const clientInvoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #fcfbf7;
            color: #1e241f;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
            border: 1px solid #f2eee5;
            overflow: hidden;
          }
          .header {
            background-color: #558B51; /* Acacia color theme */
            padding: 32px 24px;
            color: #ffffff;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .header p {
            margin: 6px 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .invoice-card {
            background-color: #faf9f6;
            border: 1px solid #efebe1;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e9e4d9;
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .invoice-header-col {
            width: 48%;
            display: inline-block;
            vertical-align: top;
          }
          .label {
            font-size: 11px;
            font-weight: 700;
            color: #8c8573;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .value {
            font-size: 14px;
            font-weight: 600;
            color: #1e241f;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          .details-table th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #8c8573;
            text-transform: uppercase;
            padding-bottom: 8px;
            border-bottom: 1px solid #e9e4d9;
          }
          .details-table td {
            padding: 12px 0;
            font-size: 14px;
            border-bottom: 1px solid #f2eee5;
          }
          .total-row td {
            font-weight: 700;
            font-size: 16px;
            color: #558B51;
            border-bottom: none;
            padding-top: 16px;
          }
          .paid-badge {
            display: inline-block;
            background-color: #eaf5ea;
            color: #3b7a37;
            font-weight: 700;
            font-size: 12px;
            padding: 6px 14px;
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #c9e6c9;
            margin-top: 16px;
          }
          .action-btn {
            display: block;
            background-color: #558B51;
            color: #ffffff !important;
            text-decoration: none;
            text-align: center;
            font-weight: 700;
            font-size: 14px;
            padding: 14px 20px;
            border-radius: 12px;
            margin: 28px 0 16px;
            box-shadow: 0 4px 12px rgba(85, 139, 81, 0.15);
          }
          .footer {
            background-color: #faf9f6;
            border-top: 1px solid #efebe1;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #8c8573;
            line-height: 1.5;
          }
          .footer a {
            color: #558B51;
            text-decoration: none;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>BARBAAR WELLNESS</h1>
            <p>Your session is confirmed</p>
          </div>
          <div class="content">
            <div class="greeting">
              <strong>Hi ${clientName},</strong><br>
              Thank you for booking a session with us. We are pleased to confirm your upcoming video consultation. Your invoice is details below.
            </div>
            
            <div class="invoice-card">
              <div class="invoice-header">
                <div class="invoice-header-col">
                  <div class="label">Invoice Number</div>
                  <div class="value">INV-${bookingId.toUpperCase()}</div>
                </div>
                <div class="invoice-header-col" style="text-align: right;">
                  <div class="label">Date Paid</div>
                  <div class="value">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div class="label">Client Details</div>
                <div class="value" style="font-weight: 500;">${clientName} (${clientEmail})</div>
                <div class="value" style="font-weight: 500; font-size: 13px; color: #6a6352; margin-top: 2px;">Phone: ${clientPhone}</div>
              </div>

              <div class="label">Consultation Session Details</div>
              <table class="details-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>Video Consultation Session</strong><br>
                      <span style="font-size: 12px; color: #6a6352;">
                        Therapist: ${therapistName}<br>
                        Category: ${category.toUpperCase()}<br>
                        Schedule: ${date} at ${time}
                      </span>
                    </td>
                    <td style="text-align: right; font-weight: 600; vertical-align: top;">${formattedPrice}</td>
                  </tr>
                  ${financialAidApplied ? `
                  <tr>
                    <td><span style="color: #c07d1a; font-weight: 600; font-size: 12px;">Financial Aid Applied (40% discount)</span></td>
                    <td style="text-align: right; color: #c07d1a; font-weight: 600; vertical-align: top;">Included</td>
                  </tr>
                  ` : ""}
                  <tr class="total-row">
                    <td>Total Paid</td>
                    <td style="text-align: right;">${formattedPrice}</td>
                  </tr>
                </tbody>
              </table>

              <div style="text-align: center;">
                <div class="paid-badge">Paid &amp; Confirmed</div>
              </div>
            </div>

            <p style="font-size: 13.5px; color: #6a6352; line-height: 1.5; text-align: center;">
              You can access your video consultation room at the scheduled time by clicking the button below or logging into your Barbaar Wellness profile.
            </p>

            <a href="https://app.barbaar.org" class="action-btn">Enter Session Room</a>
          </div>
          <div class="footer">
            <p><strong>Barbaar Wellness</strong> • Mental health care made simple and accessible.</p>
            <p>Need help? Contact us at <a href="mailto:barbaaryp@gmail.com">barbaaryp@gmail.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 2. Barbaar Confirmation Email HTML
    const barbaarConfirmHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f7faf8;
            color: #1e241f;
            padding: 24px;
          }
          .card {
            max-width: 550px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e1e8e3;
            padding: 28px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          }
          h2 {
            margin-top: 0;
            color: #3b7a37;
            font-size: 18px;
            border-bottom: 2px solid #eaf5ea;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            margin: 20px 0;
          }
          th {
            text-align: left;
            font-size: 12px;
            color: #707872;
            text-transform: uppercase;
            padding: 6px 0;
            width: 35%;
          }
          td {
            font-size: 14px;
            padding: 6px 0;
            font-weight: 600;
          }
          .badge {
            display: inline-block;
            background-color: #fff3cd;
            color: #856404;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>🔔 New Booking Confirmed!</h2>
          <p>A client has successfully scheduled a video consultation session on Barbaar Wellness.</p>
          
          <table>
            <tr>
              <th>Client Name</th>
              <td>${clientName}</td>
            </tr>
            <tr>
              <th>Client Email</th>
              <td>${clientEmail}</td>
            </tr>
            <tr>
              <th>Client Phone</th>
              <td>${clientPhone}</td>
            </tr>
            <tr>
              <th>Therapist</th>
              <td>${therapistName}</td>
            </tr>
            <tr>
              <th>Category</th>
              <td>${category.toUpperCase()}</td>
            </tr>
            <tr>
              <th>Date &amp; Time</th>
              <td>${date} at ${time}</td>
            </tr>
            <tr>
              <th>Price Paid</th>
              <td>${formattedPrice}</td>
            </tr>
            <tr>
              <th>Financial Aid</th>
              <td>
                ${financialAidApplied ? '<span class="badge">Yes (40% discount)</span>' : 'No'}
              </td>
            </tr>
          </table>

          <p style="font-size: 12px; color: #707872; margin-top: 24px; text-align: center; border-top: 1px solid #eee; padding-top: 12px;">
            Barbaar Wellness Notifications • barbaaryp@gmail.com
          </p>
        </div>
      </body>
      </html>
    `;

    // Send Invoice to Client
    await transporter.sendMail({
      from: `"Barbaar Wellness" <${smtpEmail}>`,
      to: clientEmail,
      subject: `Invoice: Your Booking with ${therapistName} is Confirmed!`,
      html: clientInvoiceHtml,
    });

    // Send Confirmation to Barbaar Admin
    await transporter.sendMail({
      from: `"Barbaar Wellness" <${smtpEmail}>`,
      to: smtpEmail,
      subject: `🔔 New Session Booked: ${clientName} & ${therapistName}`,
      html: barbaarConfirmHtml,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-booking API:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
