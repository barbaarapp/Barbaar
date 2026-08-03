import nodemailer from "nodemailer";

const DEFAULT_WA_TOKEN = "EAAPGVJuSZCIkBSH5QraZA5B8cnaPGJyhhoKT2OZAPZBSoZClMJZC2ch4fljMl3TvPfdNZAP65HG72XC8ZBmHZASVxL6HEqTMFDn2N4ZAiN1kGGhCf3uf3yzRKZA6Ci051Hp1oAkIkT7HHH9tq9q0FcHZCtvarZAuimgRRKJtlXWo77oW5k8CZCzKJG2Hctv4N2mL29r4WPZAwZDZD";
const DEFAULT_WA_PHONE_NUMBER_ID = "1189309474270832";

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

const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return "";
  let digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00252")) {
    digits = digits.substring(2);
  } else if (digits.startsWith("0")) {
    digits = "252" + digits.substring(1);
  } else if (!digits.startsWith("252") && digits.length >= 7 && digits.length <= 10) {
    digits = "252" + digits;
  }
  return digits;
};

const dispatchWhatsAppMessage = async (
  context: { env?: any },
  toPhone: string,
  bodyText: string,
  bookingDetails?: { clientName?: string; therapistName?: string; date?: string; time?: string; formattedPrice?: string; bookingId?: string }
): Promise<{ status: string; cleanPhone?: string; details?: string; templateFallback?: boolean }> => {
  if (!toPhone) return { status: "no_phone" };

  const cleanPhoneNo = formatPhoneForWhatsApp(toPhone);
  if (!cleanPhoneNo) return { status: "no_phone" };

  const waToken =
    (context.env && context.env.WHATSAPP_API_TOKEN) ||
    (typeof process !== "undefined" && process.env && process.env.WHATSAPP_API_TOKEN) ||
    DEFAULT_WA_TOKEN;

  const rawPhoneId =
    (context.env && context.env.WHATSAPP_PHONE_NUMBER_ID) ||
    (typeof process !== "undefined" && process.env && process.env.WHATSAPP_PHONE_NUMBER_ID) ||
    DEFAULT_WA_PHONE_NUMBER_ID;

  let primaryPhoneId = rawPhoneId;
  if (!rawPhoneId || rawPhoneId.startsWith("+") || (rawPhoneId.startsWith("252") && rawPhoneId.length < 14)) {
    primaryPhoneId = DEFAULT_WA_PHONE_NUMBER_ID;
  }

  const phoneIdsToTry = [primaryPhoneId];
  if (primaryPhoneId !== "me") {
    phoneIdsToTry.push("me");
  }

  // Helper for Meta Graph API call
  const callMetaApi = async (phoneId: string, payload: any) => {
    return fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${waToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  };

  const clientNameVal = bookingDetails?.clientName || "Client";
  const therapistNameVal = bookingDetails?.therapistName || "Therapist";
  const dateVal = bookingDetails?.date || "";
  const timeVal = bookingDetails?.time || "";
  const priceVal = bookingDetails?.formattedPrice || "$30";

  for (const currentPhoneId of phoneIdsToTry) {
    try {
      // 1. Try booking_invoice_template WITH parameters
      const langCodes = ["en_US", "en", "so", "en_GB"];
      for (const lang of langCodes) {
        const payloadWithParams = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhoneNo,
          type: "template",
          template: {
            name: "booking_invoice_template",
            language: { code: lang },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: clientNameVal },
                  { type: "text", text: therapistNameVal },
                  { type: "text", text: dateVal },
                  { type: "text", text: timeVal },
                  { type: "text", text: priceVal },
                ],
              },
            ],
          },
        };

        const res = await callMetaApi(currentPhoneId, payloadWithParams);
        const resText = await res.text();
        if (res.ok) {
          console.log(`WhatsApp 'booking_invoice_template' (with params, ${lang}) succeeded for +${cleanPhoneNo}:`, resText);
          // Follow up with text invoice as well
          try {
            await callMetaApi(currentPhoneId, {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: cleanPhoneNo,
              type: "text",
              text: { preview_url: true, body: bodyText },
            });
          } catch (e) {
            console.warn("Follow-up text error:", e);
          }
          return { status: "sent", cleanPhone: cleanPhoneNo };
        }

        // Try WITHOUT components
        const payloadNoParams = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhoneNo,
          type: "template",
          template: {
            name: "booking_invoice_template",
            language: { code: lang },
          },
        };
        const resNoParam = await callMetaApi(currentPhoneId, payloadNoParams);
        const resTextNoParam = await resNoParam.text();
        if (resNoParam.ok) {
          console.log(`WhatsApp 'booking_invoice_template' (no params, ${lang}) succeeded for +${cleanPhoneNo}:`, resTextNoParam);
          try {
            await callMetaApi(currentPhoneId, {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: cleanPhoneNo,
              type: "text",
              text: { preview_url: true, body: bodyText },
            });
          } catch (e) {
            console.warn("Follow-up text error:", e);
          }
          return { status: "sent", cleanPhone: cleanPhoneNo };
        }
      }

      // 2. Try 'hello_world' standard template
      for (const lang of ["en_US", "en"]) {
        const helloPayload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhoneNo,
          type: "template",
          template: {
            name: "hello_world",
            language: { code: lang },
          },
        };
        const helloRes = await callMetaApi(currentPhoneId, helloPayload);
        const helloText = await helloRes.text();
        if (helloRes.ok) {
          console.log(`WhatsApp 'hello_world' template (${lang}) succeeded for +${cleanPhoneNo}:`, helloText);
          // Send direct text invoice since 24h window is open
          try {
            await callMetaApi(currentPhoneId, {
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: cleanPhoneNo,
              type: "text",
              text: { preview_url: true, body: bodyText },
            });
          } catch (e) {
            console.warn("Follow-up text error:", e);
          }
          return { status: "sent", cleanPhone: cleanPhoneNo, templateFallback: true };
        }
      }

      // 3. Try direct text message
      const textPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhoneNo,
        type: "text",
        text: { preview_url: true, body: bodyText },
      };
      const textRes = await callMetaApi(currentPhoneId, textPayload);
      const textResStr = await textRes.text();
      if (textRes.ok) {
        console.log(`WhatsApp direct text message succeeded for +${cleanPhoneNo}:`, textResStr);
        return { status: "sent", cleanPhone: cleanPhoneNo };
      }
    } catch (err: any) {
      console.warn(`Error during Meta API calls on Phone ID ${currentPhoneId}:`, err);
    }
  }

  return { status: "failed", cleanPhone: cleanPhoneNo };
};

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

      const whatsappStatus = await dispatchWhatsAppMessage(context, clientPhone, whatsappApprovalText, { clientName, therapistName, date, time, formattedPrice, bookingId });

      try {
        await transporter.sendMail({
          from: `"Barbaar Wellness" <${smtpEmail}>`,
          to: clientEmail,
          subject: `Congratulations! Your 40% Barbaar Financial Aid is Approved 🎉`,
          html: approvalEmailHtml,
        });
      } catch (e) {
        console.warn("Approval email failed:", e);
      }

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

      const whatsappWarningText = `*BARBAAR WELLNESS* ⌛\n---------------------------\nHalloo ${clientName},\nReminder: Your pre-approved *40% Barbaar Financial Aid is expiring tomorrow* (${warningExpiryDateStr})!\n\nDon't let your relief discount lapse. Book your session now: https://app.barbaar.org\n---------------------------`;

      const whatsappStatus = await dispatchWhatsAppMessage(context, clientPhone, whatsappWarningText, { clientName, therapistName, date, time, formattedPrice, bookingId });

      try {
        await transporter.sendMail({
          from: `"Barbaar Wellness" <${smtpEmail}>`,
          to: clientEmail,
          subject: `Only 24 hours left: Your 40% Barbaar Financial Aid is about to expire! ⏳`,
          html: warningEmailHtml,
        });
      } catch (e) {
        console.warn("Warning email failed:", e);
      }

      return new Response(JSON.stringify({ success: true, warningSent: true, whatsapp: whatsappStatus }), {
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

      const whatsappReminderText = `*BARBAAR WELLNESS REMINDER* 🔔\n---------------------------\nHalloo ${clientName},\nYour session reminders are now active!\n\n*Therapist:* ${therapistName}\n*Schedule:* ${date} at ${time}\n*Session Link:* https://app.barbaar.org\n---------------------------\nPlease join 5 minutes before the scheduled time.`;

      const whatsappStatus = await dispatchWhatsAppMessage(context, clientPhone, whatsappReminderText, { clientName, therapistName, date, time, formattedPrice, bookingId });

      // Send Reminder Email to Client
      try {
        await transporter.sendMail({
          from: `"Barbaar Wellness" <${smtpEmail}>`,
          to: clientEmail,
          subject: `Reminder: Your Upcoming Session with ${therapistName}`,
          html: reminderEmailHtml,
        });
      } catch (e) {
        console.warn("Reminder email failed:", e);
      }

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

    const whatsappInvoiceText = `*BARBAAR WELLNESS INVOICE* 🧾\n---------------------------\nHalloo ${clientName},\nThank you for booking with Barbaar Wellness! Your session is confirmed.\n\n*Invoice No:* INV-${bookingId.toUpperCase()}\n*Therapist:* ${therapistName}\n*Category:* ${category.toUpperCase()}\n*Schedule:* ${date} at ${time}\n*Total Paid:* ${formattedPrice}\n\nEnter session room: https://app.barbaar.org\n---------------------------`;

    // 1. Send WhatsApp Invoice directly to Client's Mobile Phone
    const bookingDetailsForWA = { clientName, therapistName, date, time, formattedPrice, bookingId };
    const whatsappStatus = await dispatchWhatsAppMessage(context, clientPhone, whatsappInvoiceText, bookingDetailsForWA);

    // 2. Also send WhatsApp copy to Barbaar Admin (252905893406)
    let adminWhatsappStatus = null;
    if (clientPhone !== "252905893406" && clientPhone !== "0905893406") {
      adminWhatsappStatus = await dispatchWhatsAppMessage(context, "252905893406", `*NEW BOOKING NOTIFICATION* 🔔\n\nClient: ${clientName} (${clientPhone})\nTherapist: ${therapistName}\nDate: ${date} at ${time}\nAmount: ${formattedPrice}\nInvoice: INV-${bookingId.toUpperCase()}`, bookingDetailsForWA);
    }

    // Send Invoice via Email safely
    try {
      await transporter.sendMail({
        from: `"Barbaar Wellness" <${smtpEmail}>`,
        to: clientEmail,
        subject: `Invoice: Your Booking with ${therapistName} is Confirmed!`,
        html: clientInvoiceHtml,
      });

      await transporter.sendMail({
        from: `"Barbaar Wellness" <${smtpEmail}>`,
        to: smtpEmail,
        subject: `🔔 New Session Booked: ${clientName} & ${therapistName}`,
        html: barbaarConfirmHtml,
      });
    } catch (emailErr) {
      console.warn("Failed to dispatch email notification, proceeding with WhatsApp result:", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        whatsapp: whatsappStatus,
        adminWhatsapp: adminWhatsappStatus,
        clientPhoneClean: formatPhoneForWhatsApp(clientPhone),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking API:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
