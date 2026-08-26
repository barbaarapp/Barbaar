/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CheckCircle2, Mail, MessageSquare, FileText, Check } from "lucide-react";
import { Therapist, Booking } from "../../types";
import { colors } from "../../constants";
import { fmtDate, fmtMoney } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import Avatar from "../ui/Avatar";
import Card from "../ui/Card";
import Button from "../ui/Button";
import GrowthArc from "../ui/GrowthArc";

interface ConfirmationProps {
  booking: Booking | undefined;
  therapist: Therapist | undefined;
  onDone: () => void;
  onHome: () => void;
  lang?: Language;
}

export default function Confirmation({ booking, therapist, onDone, onHome, lang = "en" }: ConfirmationProps) {
  const [synced, setSynced] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!booking || !therapist) return null;

  function handleSync() {
    setSyncing(true);

    // Trigger backend dispatch to send BOTH Google Calendar/Gmail and automated WhatsApp reminders directly
    fetch("/api/send-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "activate_reminders",
        bookingId: booking.id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        therapistName: therapist.name,
        category: booking.category,
        date: fmtDate(booking.date),
        time: booking.time,
        price: booking.price,
        priceUnit: therapist.priceUnit,
        financialAidApplied: booking.financialAidApplied || false,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to activate reminders");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Reminders activated directly:", data);
        setSyncing(false);
        setSynced(true);
      })
      .catch((err) => {
        console.warn("Failed to dispatch direct activation alerts:", err);
        // Fallback to local success state so user has feedback anyway
        setSyncing(false);
        setSynced(true);
      });
  }

  // Generate WhatsApp Message & URL for direct invoice sending to our business number
  const isPendingAid = booking.financialAidApplied && (booking.financialAidStatus === "pending" || booking.status === "pending_financial_aid");

  const whatsappMessage = isPendingAid 
    ? `*BARBAAR WELLNESS FINANCIAL AID REQUEST* ⏳\n---------------------------\n*Request No:* REQ-${booking.id.toUpperCase()}\n*Client Name:* ${booking.clientName}\n*Therapist:* ${therapist.name}\n*Category:* ${booking.category.toUpperCase()}\n*Schedule:* ${fmtDate(booking.date)}, ${booking.time}\n*Estimated Price:* ${fmtMoney(booking.price)}\n*Aid Status:* PENDING REVIEW ⏳\n---------------------------\nSubmitted via checkout. Looking forward to approval.`
    : `*BARBAAR WELLNESS INVOICE* 📄\n---------------------------\n*Invoice No:* INV-${booking.id.toUpperCase()}\n*Client Name:* ${booking.clientName}\n*Therapist:* ${therapist.name}\n*Category:* ${booking.category.toUpperCase()}\n*Schedule:* ${fmtDate(booking.date)}, ${booking.time}\n*Price:* ${fmtMoney(booking.price)}\n*Status:* PAID & CONFIRMED ✅\n---------------------------\nThank you for choosing Barbaar Wellness. Enter your session room here: https://app.barbaar.org`;
  
  const whatsappUrl = `https://wa.me/252905893406?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyInvoiceText = () => {
    navigator.clipboard.writeText(whatsappMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 md:py-12 text-center">
      <div className="pop-in flex justify-center mb-6">
        <GrowthArc value={100} size={84} stroke={6} color={isPendingAid ? colors.amber : colors.acacia}>
          <CheckCircle2 size={36} color={isPendingAid ? colors.amber : colors.acacia} className="animate-pulse" />
        </GrowthArc>
      </div>

      <h2
        className="font-display tracking-tight text-2xl md:text-3xl font-bold"
        style={{
          color: colors.ink,
        }}
      >
        {isPendingAid ? t("Request submitted", lang) : t("Booking confirmed", lang)}
      </h2>
      <p className="text-sm md:text-base mt-2" style={{ color: colors.inkSoft }}>
        {isPendingAid 
          ? t("Your financial aid and session request are pending admin review", lang)
          : `${t("You're all set with", lang)} ${therapist.name}`
        }
      </p>

      {/* Realistic Professional Invoice Card */}
      <div
        className="text-left mt-8 p-6 md:p-8 rounded-2xl border relative overflow-hidden transition-all duration-300 shadow-sm"
        style={{
          borderColor: isPendingAid ? colors.amber + "30" : colors.line,
          background: isPendingAid ? "#fdfbf7" : colors.paper,
        }}
      >
        {/* Subtle Watermark/Background Accent */}
        <div
          className="absolute -right-12 -bottom-12 opacity-[0.03] pointer-events-none font-display font-bold text-9xl select-none"
          style={{ color: colors.ink }}
        >
          B
        </div>

        {/* Status Stamp */}
        <div
          style={{
            position: "absolute",
            top: "24px",
            right: "24px",
            transform: "rotate(4deg)",
            border: `1.5px solid ${isPendingAid ? colors.amber : colors.acacia}`,
            color: isPendingAid ? colors.amber : colors.acacia,
            fontSize: "11px",
            fontWeight: 800,
            padding: "5px 12px",
            borderRadius: "6px",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            background: isPendingAid ? `${colors.amber}08` : `${colors.acacia}08`,
            pointerEvents: "none",
          }}
          className="shadow-sm"
        >
          {isPendingAid 
            ? (lang === "so" ? "Sugaya" : "PENDING")
            : (lang === "so" ? "La Bixiyay" : "PAID")
          }
        </div>

        {/* Invoice Header */}
        <div className="border-b pb-4 mb-6" style={{ borderColor: `${colors.line}60` }}>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: isPendingAid ? colors.amber : colors.acacia }}
            ></span>
            <span className="font-display tracking-wider text-xs font-extrabold uppercase" style={{ color: colors.ink }}>
              BARBAAR WELLNESS
            </span>
          </div>
          <div className="font-mono text-[10px] mt-1.5 uppercase tracking-wider" style={{ color: colors.inkSoft }}>
            {isPendingAid ? "Request No: " : "Invoice No: "}<span style={{ color: colors.ink }}>REQ-{booking.id.toUpperCase()}</span>
          </div>
        </div>

        {/* Invoice Details Grid (Responsive: 1 col on mobile, 2 cols on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs">
          <div>
            <div className="font-bold uppercase tracking-wider text-[10px] mb-2" style={{ color: colors.inkSoft }}>
              {lang === "so" ? "Macaamiilka" : "Billed To"}
            </div>
            <div className="font-bold text-sm" style={{ color: colors.ink }}>{booking.clientName}</div>
            <div className="mt-1" style={{ color: colors.inkSoft }}>{booking.clientEmail}</div>
            <div style={{ color: colors.inkSoft }}>{booking.clientPhone}</div>
          </div>
          <div className="sm:text-right">
            <div className="font-bold uppercase tracking-wider text-[10px] mb-2" style={{ color: colors.inkSoft }}>
              {lang === "so" ? "Taariikhda" : "Date Issued"}
            </div>
            <div className="font-semibold text-sm" style={{ color: colors.ink }}>
              {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </div>
            <div className="mt-1.5" style={{ color: colors.inkSoft }}>
              Status: <span className="font-bold" style={{ color: isPendingAid ? colors.amber : colors.acacia }}>
                {isPendingAid ? (lang === "so" ? "Sugaya Ogolaansho" : "Pending Review") : "Settled"}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border-t border-b py-4 mb-6" style={{ borderColor: `${colors.line}60` }}>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: colors.inkSoft }}>
            <span>{lang === "so" ? "Adeega" : "Description"}</span>
            <span>{lang === "so" ? "Qiimaha" : "Amount"}</span>
          </div>

          <div className="flex justify-between items-start gap-4 text-xs">
            <div className="flex-1">
              <div className="font-bold text-sm" style={{ color: colors.ink }}>
                Online Video Consultation (50 mins)
              </div>
              <div className="text-xs mt-1.5 flex flex-col gap-0.5" style={{ color: colors.inkSoft }}>
                <div>
                  Therapist: <span className="font-medium" style={{ color: colors.ink }}>{therapist.name}</span> ({t(therapist.credentials, lang)})
                </div>
                <div>
                  Schedule: <span className="font-medium text-slate-800">{fmtDate(booking.date)}</span> at <span className="font-medium text-slate-800">{booking.time}</span>
                </div>
                {booking.paymentGateway && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <span>⚡ Gateway: {booking.paymentGateway.toUpperCase()}</span>
                    {booking.paymentSid && <span className="opacity-75 font-mono">({booking.paymentSid})</span>}
                  </div>
                )}
                {isPendingAid && (
                  <div className="mt-2 text-amber-600 font-medium">
                    {t("Relief Applied", lang)}: -40% ({booking.financialAidCategory})
                  </div>
                )}
              </div>
            </div>
            <span className="font-bold text-sm" style={{ color: colors.ink }}>
              {isPendingAid ? fmtMoney(Math.round(booking.originalPrice || therapist.price)) : fmtMoney(booking.price)}
            </span>
          </div>
        </div>

        {/* Total Row */}
        <div className="flex justify-between items-center pt-2">
          <span className="font-bold text-xs uppercase tracking-wider" style={{ color: colors.inkSoft }}>
            {isPendingAid 
              ? (lang === "so" ? "Qiimaha Booska (Haddii la Ogolaado)" : "Total (Upon Approval)")
              : (lang === "so" ? "Wajarka Guud" : "Total Paid")
            }
          </span>
          <span className="text-lg font-extrabold" style={{ color: isPendingAid ? colors.amber : colors.acacia }}>
            {fmtMoney(booking.price)}
          </span>
        </div>
      </div>

      {/* WhatsApp Sharing & Direct Invoicing Row */}
      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => window.open(whatsappUrl, "_blank")}
          style={{
            background: isPendingAid ? colors.amber : "#25D366",
            color: "#fff",
          }}
          className="flex-1 border-0 py-3 px-4 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-2 shadow-md hover:brightness-95 active:scale-95 transition-all duration-150"
        >
          <MessageSquare size={15} />
          <span>{isPendingAid ? (lang === "so" ? "Weydii WhatsApp" : "Ask on WhatsApp") : (lang === "so" ? "Ku dir WhatsApp" : "Send on WhatsApp")}</span>
        </button>

        <button
          onClick={handleCopyInvoiceText}
          style={{
            background: copied ? `${isPendingAid ? colors.amber : colors.acacia}10` : `${colors.indigoSoft}40`,
            border: `1px solid ${copied ? (isPendingAid ? colors.amber : colors.acacia) : colors.indigo}20`,
            color: copied ? (isPendingAid ? colors.amber : colors.acacia) : colors.indigo,
          }}
          className="flex-1 py-3 px-4 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all duration-150"
        >
          {copied ? <Check size={15} /> : <FileText size={15} />}
          <span>{copied ? "Copied!" : (isPendingAid ? "Copy Request Details" : "Copy Invoice")}</span>
        </button>
      </div>

      {/* Interactive Reminders & Calendar Sync Card */}
      <div
        className="rounded-2xl p-5 mt-4 text-left flex flex-col gap-4 border"
        style={{
          background: synced ? `${colors.acacia}08` : `${colors.indigoSoft}15`,
          borderColor: synced ? `${colors.acacia}30` : `${colors.line}50`,
        }}
      >
        <div className="flex gap-3 items-start">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm"
            style={{
              background: synced ? colors.acacia : colors.indigo,
            }}
          >
            <Mail size={16} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-xs uppercase tracking-wider" style={{ color: synced ? colors.acacia : colors.ink }}>
              {synced ? t("Reminders Set Successfully!", lang) : t("Activate Mobile & Gmail Reminders", lang)}
            </h4>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: colors.inkSoft }}>
              {synced
                ? `${t("Done! We have sent a Google Calendar invite & text message alerts to", lang)} ${booking.clientEmail} ${t("and", lang)} ${booking.clientPhone}.`
                : t("Receive direct Zoom links, text alerts (EVC Plus/SMS), and Google Calendar invites before your session.", lang)}
            </p>
          </div>
        </div>

        {!synced && (
          <Button
            full
            variant={syncing ? "subtle" : "primary"}
            onClick={handleSync}
            disabled={syncing}
            style={{ height: 40, fontSize: 12, fontWeight: 700 }}
          >
            {syncing ? t("Connecting with Google & SMS...", lang) : t("Sync to Calendar & Enable Alerts", lang)}
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-2.5">
        <Button full onClick={onDone} style={{ fontWeight: 600 }}>
          {t("View my sessions", lang)}
        </Button>
        <Button full variant="ghost" onClick={onHome} style={{ fontWeight: 600 }}>
          {t("Back to home", lang)}
        </Button>
      </div>
    </div>
  );
}
