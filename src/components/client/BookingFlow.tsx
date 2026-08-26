/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Clock,
  User,
  Phone,
  Mail,
  Smartphone,
  CreditCard,
  Loader2,
  Shield,
  Check,
  Coins,
  Send,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Lock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building2,
  Wallet,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Therapist, Booking, ClientProfile } from "../../types";
import { colors } from "../../constants";
import { fmtDate, fmtMoney, nextAvailableDates, isoDate, getFinancialAidInfo, parseSomaliPhone, SomaliPhoneInfo } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import Avatar from "../ui/Avatar";
import TextField from "../ui/TextField";
import Card from "../ui/Card";
import Button from "../ui/Button";
import CardPaymentForm, { CardDetails, detectCardType } from "./CardPaymentForm";
import FinancialAidBanner from "./FinancialAidBanner";

interface BookingFlowProps {
  therapist: Therapist;
  booking: any;
  setBooking: React.Dispatch<React.SetStateAction<any>>;
  onCancel: () => void;
  onConfirm: (paymentDetails?: {
    paymentGateway?: string;
    paymentMethod?: "mobile" | "card" | "premier";
    paymentStatus?: "paid" | "pending";
    paymentSid?: string;
    paymentAccount?: string;
  }) => void;
  lang?: Language;
  clientProfile: ClientProfile;
  setClientProfile: (profile: ClientProfile) => void;
}

type PaymentStatusState = "idle" | "sending_prompt" | "prompt_sent" | "success" | "failed";

export default function BookingFlow({
  therapist,
  booking,
  setBooking,
  onCancel,
  onConfirm,
  lang = "en",
  clientProfile,
  setClientProfile,
}: BookingFlowProps) {
  // Two clean sides: "mobile" (Somali Mobile & Wallets) vs "card" (Mastercard & Visa)
  const [paymentSide, setPaymentSide] = useState<"mobile" | "card">("mobile");
  // Mobile sub-methods: 1. evc_sahal_zaad (Auto-detected), 2. edahab, 3. premier
  const [mobileMethod, setMobileMethod] = useState<"evc_sahal_zaad" | "edahab" | "premier">("evc_sahal_zaad");
  const [customPhone, setCustomPhone] = useState<string>(booking.phone || clientProfile.phone || "");
  const [edahabPhone, setEdahabPhone] = useState<string>(booking.phone || clientProfile.phone || "");
  const [premierPhone, setPremierPhone] = useState<string>(booking.phone || clientProfile.phone || "");
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    cardNumber: "",
    cardHolder: booking.name || clientProfile.name || "",
    expiry: "",
    cvc: "",
  });

  // Live Sifalo Pay state machine
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusState>("idle");
  const [cardCheckoutUrl, setCardCheckoutUrl] = useState<string>("");
  const [cardOrderId, setCardOrderId] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<{
    success?: boolean;
    sid?: string;
    order_id?: string;
    code?: string;
    messageSo?: string;
    messageEn?: string;
    failureReason?: string;
    raw?: any;
  } | null>(null);

  const [promptCountdown, setPromptCountdown] = useState(60);

  const dates = nextAvailableDates(therapist.availability.days);
  const aidInfo = getFinancialAidInfo(clientProfile);

  // Sync phone number
  useEffect(() => {
    const initialPhone = booking.phone || clientProfile.phone || "";
    if (!customPhone && initialPhone) setCustomPhone(initialPhone);
    if (!edahabPhone && initialPhone) setEdahabPhone(initialPhone);
    if (!premierPhone && initialPhone) setPremierPhone(initialPhone);
  }, [booking.phone, clientProfile.phone]);

  // Automatically apply pre-approved financial relief state to current booking
  useEffect(() => {
    if (booking.step === 3) {
      if (aidInfo.isActive) {
        if (!booking.financialAidApplied) {
          setBooking((prev: any) => ({
            ...prev,
            financialAidApplied: true,
            financialAidCategory: clientProfile.financialAidCategory || "Somali Youth",
            financialAidReason: clientProfile.financialAidReason || "Approved",
          }));
        }
      } else {
        if (booking.financialAidApplied) {
          setBooking((prev: any) => ({
            ...prev,
            financialAidApplied: false,
          }));
        }
      }
    }
  }, [booking.step, aidInfo.isActive, clientProfile, setBooking]);

  // Countdown timer for prompt screen
  useEffect(() => {
    let timer: any = null;
    if (paymentStatus === "prompt_sent" || paymentStatus === "sending_prompt") {
      timer = setInterval(() => {
        setPromptCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      setPromptCountdown(60);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [paymentStatus]);

  // Timeout handler: if countdown reaches 0 without automatic bank confirmation, fail cleanly
  useEffect(() => {
    if (promptCountdown === 0 && paymentStatus === "prompt_sent") {
      setPaymentStatus("failed");
      setPaymentResult({
        success: false,
        messageSo: "Waqtigii xaqiijinta PIN-ka / lacag-bixinta wuu dhamaaday iyadoon la helin ogolaansho. Fadlan mar kale isku day.",
        messageEn: "Payment authorization timed out without network confirmation. Please try again.",
      });
    }
  }, [promptCountdown, paymentStatus]);

  const phoneInfo: SomaliPhoneInfo = parseSomaliPhone(customPhone || booking.phone || "");
  const edahabPhoneInfo: SomaliPhoneInfo = parseSomaliPhone(edahabPhone || booking.phone || "");
  const premierPhoneInfo: SomaliPhoneInfo = parseSomaliPhone(premierPhone || booking.phone || "");

  // Calculate session price with discount if applicable
  const discountRate = 0.4;
  const finalPrice = booking.financialAidApplied ? Math.round(therapist.price * (1 - discountRate)) : therapist.price;

  // Determine effective gateway
  const effectiveGateway =
    paymentSide === "card"
      ? "card"
      : mobileMethod === "premier"
      ? "pbwallet"
      : mobileMethod === "edahab"
      ? "edahab"
      : phoneInfo.gateway || "evc";

  // Automatic Verification Polling for Live Payment (USSD PIN & Hosted Card Gateway)
  // Only confirms booking when backend confirms real charge success
  useEffect(() => {
    let pollTimer: any = null;
    const activeOrderId = paymentResult?.order_id || cardOrderId;

    if (paymentStatus === "prompt_sent" && activeOrderId) {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch("/api/sifalo-pay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "status",
              order_id: activeOrderId,
              gateway: effectiveGateway,
              amount: finalPrice,
              phone: customPhone || booking.phone || clientProfile.phone,
              clientName: cardDetails.cardHolder || booking.name || clientProfile.name,
              clientEmail: booking.email || clientProfile.email,
              therapistName: therapist.name,
            }),
          });
          const data = await res.json();
          if (data.status === "approved" && data.success) {
            setPaymentStatus("success");
            setPaymentResult(data);
            setTimeout(() => {
              onConfirm({
                paymentGateway: data.gateway || effectiveGateway,
                paymentMethod: paymentSide === "card" ? "card" : "mobile",
                paymentStatus: "paid",
                paymentSid: data.sid || activeOrderId,
                paymentAccount:
                  paymentSide === "card"
                    ? `Card (•••• ${cardDetails.cardNumber.replace(/\D/g, "").slice(-4) || "CARD"})`
                    : mobileMethod === "premier"
                    ? premierPhoneInfo.display || premierPhone
                    : mobileMethod === "edahab"
                    ? edahabPhoneInfo.display || edahabPhone
                    : phoneInfo.display || customPhone || booking.phone,
              });
            }, 1400);
          } else if (data.status === "failed") {
            setPaymentStatus("failed");
            setPaymentResult({
              success: false,
              code: data.code,
              sid: data.sid,
              order_id: activeOrderId,
              messageSo: data.messageSo || "Lacag-bixinta lama dhameystirin.",
              messageEn: data.messageEn || "Payment could not be completed.",
            });
          }
        } catch (e) {
          console.log("[Sifalo Polling Error]:", e);
        }
      }, 3500);
    }

    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [
    paymentStatus,
    paymentResult?.order_id,
    cardOrderId,
    effectiveGateway,
    finalPrice,
    paymentSide,
    mobileMethod,
    customPhone,
    premierPhone,
    edahabPhone,
    booking,
    clientProfile,
    cardDetails,
    therapist.name,
    onConfirm,
    phoneInfo.display,
    premierPhoneInfo.display,
    edahabPhoneInfo.display,
  ]);

  function pickDate(d: Date) {
    setBooking({ ...booking, date: d, time: null });
  }

  function pickTime(time: string) {
    setBooking({ ...booking, time, step: 2 });
  }

  function submitInfo() {
    setBooking({ ...booking, step: 3 });
  }

  // Real Sifalo Pay & Direct Card Gateway API Trigger
  async function triggerSifaloPayment() {
    if (booking.financialAidApplied) {
      // Financial aid bookings are submitted for review without upfront debit
      onConfirm({
        paymentGateway: "Financial Aid",
        paymentMethod: "mobile",
        paymentStatus: "pending",
      });
      return;
    }

    // Live Card Payment Handler (Mastercard / Visa - Sifalo Pay Live Charge & Settlement)
    if (paymentSide === "card") {
      const cleanCard = cardDetails.cardNumber.replace(/\D/g, "");
      
      if (cleanCard.length < 15 || cleanCard.length > 19) {
        alert(lang === "so" ? "Fadlan geli lambarka kaadhka oo sax ah (15-16 god ah)." : "Please enter a valid 15-16 digit card number.");
        return;
      }
      if (!cardDetails.expiry.trim() || !cardDetails.expiry.includes("/")) {
        alert(lang === "so" ? "Fadlan geli taariikhda dhicitaanka kaadhka (MM/YY)." : "Please enter a valid card expiration date (MM/YY).");
        return;
      }
      if (!cardDetails.cvc.trim() || cardDetails.cvc.length < 3) {
        alert(lang === "so" ? "Fadlan geli lambarka CVC/CVV ee kaadhka (3-4 god ah)." : "Please enter a valid 3-4 digit CVC security code.");
        return;
      }
      if (!cardDetails.cardHolder.trim()) {
        alert(lang === "so" ? "Fadlan geli magaca ku qoran kaadhka." : "Please enter the cardholder name.");
        return;
      }

      const generatedOrderId = `BW_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
      setCardOrderId(generatedOrderId);

      setPaymentStatus("sending_prompt");
      setPaymentResult(null);

      try {
        const chargeRes = await fetch("/api/sifalo-pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "charge_card",
            card_number: cleanCard,
            expiry: cardDetails.expiry,
            cvc: cardDetails.cvc,
            card_holder: cardDetails.cardHolder,
            amount: finalPrice,
            currency: "USD",
            order_id: generatedOrderId,
            description: `Barbaar Wellness Consultation - ${therapist.name}`,
            clientName: cardDetails.cardHolder || booking.name || clientProfile.name,
            clientEmail: booking.email || clientProfile.email,
            clientPhone: booking.phone || clientProfile.phone,
            therapistName: therapist.name,
            bookingId: generatedOrderId,
          }),
        });

        const chargeData = await chargeRes.json();
        console.log("[Sifalo Pay Direct Card Charge Response]:", chargeData);

        if (chargeData.success && chargeData.status === "approved") {
          setPaymentStatus("success");
          setPaymentResult({
            success: true,
            sid: chargeData.sid || generatedOrderId,
            messageSo: chargeData.messageSo || "Lacagta kaadhka si toos ah ayaa loo gooyay loona xaqiijiyay!",
            messageEn: chargeData.messageEn || "Card charged and verified successfully!",
          });

          setTimeout(() => {
            onConfirm({
              paymentGateway: chargeData.gateway || "Mastercard / Visa",
              paymentMethod: "card",
              paymentStatus: "paid",
              paymentSid: chargeData.sid || generatedOrderId,
              paymentAccount: chargeData.paymentAccount || `Card (•••• ${cleanCard.slice(-4)})`,
            });
          }, 1400);
          return;
        } else {
          setPaymentStatus("failed");
          setPaymentResult({
            success: false,
            messageSo: chargeData.messageSo || chargeData.error || "Lacag-bixinta kaadhka lama aqbalin. Fadlan hubi macluumaadka kaadhka.",
            messageEn: chargeData.messageEn || chargeData.error || "Card payment was declined. Please verify your card details.",
          });
          return;
        }
      } catch (err: any) {
        console.error("[Card Processing Error]:", err);
        setPaymentStatus("failed");
        setPaymentResult({
          success: false,
          messageSo: "Khalad ayaa dhacay intii lacagta la jarayay. Fadlan mar kale isku day.",
          messageEn: "Connection error during card processing. Please try again.",
        });
        return;
      }
    }

    let payAccount = "";
    if (mobileMethod === "evc_sahal_zaad") {
      payAccount = customPhone || booking.phone || "";
      if (!payAccount.trim()) {
        alert(lang === "so" ? "Fadlan geli lambarkaaga taleefanka" : "Please enter your mobile phone number");
        return;
      }
    } else if (mobileMethod === "edahab") {
      payAccount = edahabPhone || customPhone || booking.phone || "";
      if (!payAccount.trim()) {
        alert(lang === "so" ? "Fadlan geli lambarkaaga eDahab (Somtel)" : "Please enter your eDahab phone number");
        return;
      }
    } else if (mobileMethod === "premier") {
      payAccount = premierPhone || customPhone || booking.phone || "";
      if (!payAccount.trim()) {
        alert(lang === "so" ? "Fadlan geli lambarkaaga Premier Wallet" : "Please enter your Premier Wallet number");
        return;
      }
    }

    setPaymentStatus("sending_prompt");
    setPaymentResult(null);
    setPromptCountdown(60);

    const generatedOrderId = `BW_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.toUpperCase();

    try {
      // Send payment initiation to Sifalo Pay Gateway API
      const res = await fetch("/api/sifalo-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          phone:
            mobileMethod === "premier"
              ? premierPhone
              : mobileMethod === "edahab"
              ? edahabPhone
              : payAccount,
          account:
            mobileMethod === "premier"
              ? premierPhoneInfo.normalized || premierPhone
              : mobileMethod === "edahab"
              ? edahabPhoneInfo.normalized || edahabPhone
              : phoneInfo.normalized || payAccount,
          amount: finalPrice,
          currency: "USD",
          gateway: effectiveGateway,
          order_id: generatedOrderId,
          description: `Barbaar Wellness Consultation - ${therapist.name}`,
          clientName: cardDetails.cardHolder || booking.name || clientProfile.name,
          clientEmail: booking.email || clientProfile.email,
        }),
      });

      const data = await res.json();
      console.log("[Sifalo Pay Client Handshake]:", data);

      if (data.status === "approved" && data.success) {
        // Real verified payment with confirmed charges
        setPaymentStatus("success");
        setPaymentResult(data);

        // Transition to confirmation screen after short success feedback
        setTimeout(() => {
          onConfirm({
            paymentGateway: data.gateway || effectiveGateway,
            paymentMethod: "mobile",
            paymentStatus: "paid",
            paymentSid: data.sid || generatedOrderId,
            paymentAccount:
              mobileMethod === "premier"
                ? premierPhoneInfo.display || premierPhone
                : mobileMethod === "edahab"
                ? edahabPhoneInfo.display || edahabPhone
                : phoneInfo.display || payAccount,
          });
        }, 1500);
      } else if (data.status === "pending_pin") {
        // USSD or PIN Prompt successfully delivered to phone / Premier Wallet
        // Payment has NOT been charged yet until client authorizes with PIN
        setPaymentStatus("prompt_sent");
        setPaymentResult(data);
      } else {
        // Payment failed, cancelled, insufficient balance or error
        setPaymentStatus("failed");
        setPaymentResult({
          success: false,
          code: data.code,
          sid: data.sid,
          order_id: generatedOrderId,
          messageSo: data.messageSo || "Lacag-bixinta lama dhameystirin.",
          messageEn: data.messageEn || data.error || "Payment transaction could not be completed.",
          failureReason: data.failureReason || "failed",
          raw: data.raw,
        });
      }
    } catch (err: any) {
      console.error("[Sifalo Pay Network Error]:", err);
      setPaymentStatus("failed");
      setPaymentResult({
        success: false,
        messageSo: "Cilad xagga xiriirka ah ayaa dhacday. Fadlan mar kale isku day.",
        messageEn: err.message || "Network error occurred while connecting to Sifalo Pay gateway.",
        failureReason: "network_error",
      });
    }
  }

  const steps = ["Date & time", "Your info", "Payment"];

  const getDayName = (date: Date) => {
    if (lang === "so") {
      const daysSo = ["Axad", "Isniin", "Tal", "Arb", "Kham", "Jim", "Sab"];
      return daysSo[date.getDay()];
    }
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <div>
      <TopBar title={t("Book session", lang)} onBack={onCancel} />

      {/* Progress indicators */}
      <div style={{ display: "flex", gap: 6, padding: "16px 20px 4px" }}>
        {steps.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div
              style={{
                height: 4,
                borderRadius: 999,
                background: booking.step > i ? colors.indigo : colors.line,
                transition: "background 0.3s ease",
              }}
            />
            <div
              style={{
                fontSize: "10.5px",
                marginTop: 5,
                color: booking.step - 1 === i ? colors.indigo : colors.inkSoft,
                fontWeight: 700,
              }}
            >
              {t(s, lang)}
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Date & Time Picker */}
      {booking.step === 1 && (
        <div className="fade-up" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Avatar therapist={therapist} size={44} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "14.5px" }}>{therapist.name}</div>
              <div style={{ fontSize: "12.5px", color: colors.inkSoft }}>
                {fmtMoney(therapist.price)} ·{" "}
                {therapist.priceUnit === "program"
                  ? `${therapist.sessionsIncluded}-${t("week program", lang)}`
                  : t("per session", lang)}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 10,
            }}
          >
            {t("Choose a date", lang)}
          </div>

          {/* Date Picker Horizontal Bar */}
          <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth no-scrollbar">
            {dates.map((d) => {
              const isSelected = booking.date && isoDate(booking.date) === isoDate(d);
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => pickDate(d)}
                  style={{
                    flex: "0 0 auto",
                    minWidth: 68,
                    padding: "12px 10px",
                    borderRadius: 14,
                    border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                    background: isSelected ? colors.indigo : colors.paper,
                    color: isSelected ? "#fff" : colors.ink,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:border-[#384c43] active:scale-[0.97] select-none"
                >
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: isSelected ? 0.95 : 0.6 }}>
                    {getDayName(d)}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {booking.date && (
            <div className="fade-up mt-5">
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 10,
                }}
              >
                {t("Choose a time", lang)}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {therapist.availability.slots.map((slot) => {
                  const isSelected = booking.time === slot;
                  // Ensure non-breaking space between time numbers and AM/PM
                  const formattedSlot = slot.replace(/\s+/g, "\u00A0");
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => pickTime(slot)}
                      style={{
                        padding: "12px 10px",
                        minHeight: 46,
                        borderRadius: 12,
                        border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                        background: isSelected ? colors.indigoSoft : colors.paper,
                        color: isSelected ? colors.indigo : colors.ink,
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                      }}
                      className="hover:border-[#384c43] active:scale-[0.98] whitespace-nowrap select-none w-full"
                    >
                      <Clock size={14} color={isSelected ? colors.indigo : colors.inkSoft} className="flex-shrink-0" />
                      <span className="whitespace-nowrap font-bold tracking-tight">{formattedSlot}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Client Info */}
      {booking.step === 2 && (
        <div className="fade-up" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{t("Your details", lang)}</div>
          <div style={{ fontSize: 12.5, color: colors.inkSoft, marginBottom: 18 }}>
            {lang === "so"
              ? "Geli xogtaada si laguu soo diro faahfaahinta kulanka iyo fariinta xaqiijinta."
              : "Enter your information to receive session reminders and room access."}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <TextField
              label={t("Full name", lang)}
              placeholder="e.g. Amina Warsame"
              value={booking.name || ""}
              onChange={(val) => setBooking({ ...booking, name: val })}
              icon={User}
            />

            <div>
              <TextField
                label={t("Phone number (Somalia or International)", lang)}
                placeholder="e.g. 061 234 5678 or 25261..."
                value={booking.phone || ""}
                onChange={(val) => {
                  setBooking({ ...booking, phone: val });
                  setCustomPhone(val);
                }}
                icon={Phone}
              />
              {/* Live Somali Operator Detection Badge */}
              {phoneInfo.isValid && (
                <div
                  className="fade-up"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                    padding: "4px 10px",
                    background: `${phoneInfo.brandColor}12`,
                    border: `1px solid ${phoneInfo.brandColor}30`,
                    borderRadius: 8,
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: phoneInfo.brandColor,
                    width: "fit-content",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: phoneInfo.brandColor,
                    }}
                  />
                  <span>{phoneInfo.badgeLabel}</span>
                  <span style={{ opacity: 0.6, fontWeight: 500 }}>({phoneInfo.display})</span>
                </div>
              )}
            </div>

            <TextField
              label={t("Email address", lang)}
              placeholder="e.g. amina@example.com"
              type="email"
              value={booking.email || ""}
              onChange={(val) => setBooking({ ...booking, email: val })}
              icon={Mail}
            />

            <Button
              full
              variant="primary"
              disabled={!booking.name || !booking.phone || !booking.email}
              onClick={submitInfo}
              style={{ marginTop: 10 }}
            >
              {t("Continue", lang)}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment Summary and Live Sifalo Pay Gateway */}
      {booking.step === 3 && (
        <div className="fade-up" style={{ padding: "20px 20px" }}>
          {/* Pre-Approved Financial Aid Banner or Request Status - Connected directly to Home Page Aid State */}
          <div style={{ marginBottom: 16 }}>
            <FinancialAidBanner
              clientProfile={clientProfile}
              setClientProfile={setClientProfile}
              lang={lang}
              variant="booking"
            />
          </div>

          {/* Session Overview Card */}
          <Card style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8 }}>
              <span style={{ color: colors.inkSoft }}>{t("Therapist", lang)}</span>
              <span style={{ fontWeight: 700 }}>{therapist.name}</span>
            </div>
            {booking.date && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8 }}>
                <span style={{ color: colors.inkSoft }}>{t("When", lang)}</span>
                <span style={{ fontWeight: 700 }}>
                  {fmtDate(booking.date)}, {booking.time}
                </span>
              </div>
            )}

            {aidInfo.isActive ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8 }}>
                  <span style={{ color: colors.inkSoft }}>{t("Session Fee", lang)}</span>
                  <span style={{ fontWeight: 600, textDecoration: "line-through", color: colors.inkSoft }}>{fmtMoney(therapist.price)}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13.5px",
                    marginBottom: 8,
                    color: colors.acacia,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{t("Barbaar Financial Relief (-40%)", lang)}</span>
                  <span style={{ fontWeight: 800 }}>-{fmtMoney(Math.round(therapist.price * 0.4))}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13.5px",
                    paddingTop: 8,
                    borderTop: `1px dashed ${colors.line}`,
                    marginTop: 4,
                  }}
                >
                  <div>
                    <span style={{ color: colors.ink, fontWeight: 800 }}>
                      {t("Total (Aid Applied)", lang)}
                    </span>
                    <div style={{ fontSize: "10px", color: colors.acacia, fontWeight: 700, marginTop: 1 }}>
                      {t("40% Barbaar Community Subsidy", lang)}
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 17, color: colors.acacia }}>{fmtMoney(finalPrice)}</span>
                </div>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13.5px",
                  paddingTop: 8,
                  borderTop: `1px dashed ${colors.line}`,
                  marginTop: 4,
                }}
              >
                <span style={{ color: colors.inkSoft }}>{t("Total", lang)}</span>
                <span style={{ fontWeight: 800, fontSize: 16, color: colors.indigo }}>{fmtMoney(finalPrice)}</span>
              </div>
            )}
          </Card>

          {/* Payment Method / Sifalo Pay Gateway Options */}
          <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: colors.inkSoft,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{lang === "so" ? "Habka Lacag-bixinta" : "Payment Method"}</span>
                <span
                  style={{
                    fontSize: "11px",
                    color: colors.acacia,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    background: colors.acaciaSoft,
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  <Lock size={11} />
                  Sifalo Pay Gateway
                </span>
              </div>

              {/* 2 Clean Sides: Mobile Money vs Debit/Credit Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 16,
                  background: "#F1F5F9",
                  padding: "4px",
                  borderRadius: 14,
                }}
              >
                {/* Side 1: Somali Mobile Money & Wallets */}
                <button
                  type="button"
                  onClick={() => setPaymentSide("mobile")}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: "none",
                    background: paymentSide === "mobile" ? "#ffffff" : "transparent",
                    boxShadow: paymentSide === "mobile" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Smartphone size={16} color={paymentSide === "mobile" ? colors.indigo : colors.inkSoft} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: paymentSide === "mobile" ? colors.indigo : colors.ink }}>
                      {lang === "so" ? "Mobile Money" : "Mobile & Wallets"}
                    </div>
                  </div>
                </button>

                {/* Side 2: Debit / Credit Card */}
                <button
                  type="button"
                  onClick={() => setPaymentSide("card")}
                  style={{
                    padding: "10px 8px",
                    borderRadius: 10,
                    border: "none",
                    background: paymentSide === "card" ? "#ffffff" : "transparent",
                    boxShadow: paymentSide === "card" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <CreditCard size={16} color={paymentSide === "card" ? colors.indigo : colors.inkSoft} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: paymentSide === "card" ? colors.indigo : colors.ink }}>
                      {lang === "so" ? "Kaadhka (Card)" : "Mastercard / Visa"}
                    </div>
                  </div>
                </button>
              </div>

              {/* Side 1 View: Mobile Money & Wallets */}
              {paymentSide === "mobile" && (
                <div className="space-y-2.5 mb-4">
                  {/* Option 1: Pay with EVC, Sahal, ZAAD (Auto-detected) */}
                  <div
                    onClick={() => setMobileMethod("evc_sahal_zaad")}
                    style={{
                      border: `1.5px solid ${mobileMethod === "evc_sahal_zaad" ? colors.indigo : colors.line}`,
                      background: mobileMethod === "evc_sahal_zaad" ? "#FFFFFF" : colors.paper,
                      borderRadius: 14,
                      padding: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: mobileMethod === "evc_sahal_zaad" ? "0 4px 12px rgba(45, 90, 39, 0.08)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mobileMethod === "evc_sahal_zaad" ? 10 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `2px solid ${mobileMethod === "evc_sahal_zaad" ? colors.indigo : colors.line}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: mobileMethod === "evc_sahal_zaad" ? colors.indigo : "#ffffff",
                          }}
                        >
                          {mobileMethod === "evc_sahal_zaad" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: colors.ink }}>
                            {lang === "so" ? "Ku bixi EVC Plus, Sahal ama ZAAD" : "Pay with EVC Plus, Sahal, ZAAD"}
                          </div>
                          <div style={{ fontSize: "11px", color: colors.inkSoft, marginTop: 1 }}>
                            {lang === "so" ? "Si toos ah baa loo gartaa (Hormuud • Telesom • Golis)" : "Auto-detected by number (Hormuud • Telesom • Golis)"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#E0F2FE", color: "#0369A1" }}>
                          Auto
                        </span>
                      </div>
                    </div>

                    {/* Input Field when selected */}
                    {mobileMethod === "evc_sahal_zaad" && (
                      <div className="fade-up" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.line}` }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>
                          {lang === "so" ? "Lambarka Taleefanka (Somali Mobile #)" : "Phone Number (EVC / Sahal / ZAAD)"}
                        </label>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            placeholder="e.g. 061 234 5678 or 063..."
                            value={customPhone}
                            onChange={(e) => setCustomPhone(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full p-2.5 pl-3 pr-36 rounded-xl border text-sm font-semibold focus:outline-none focus:border-indigo-500"
                            style={{
                              borderColor: colors.line,
                              background: "#ffffff",
                              color: colors.ink,
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              right: 6,
                              top: "50%",
                              transform: "translateY(-50%)",
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: `${phoneInfo.brandColor}15`,
                              color: phoneInfo.brandColor,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: phoneInfo.brandColor }} />
                            {phoneInfo.operator}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Pay with eDahab */}
                  <div
                    onClick={() => setMobileMethod("edahab")}
                    style={{
                      border: `1.5px solid ${mobileMethod === "edahab" ? colors.indigo : colors.line}`,
                      background: mobileMethod === "edahab" ? "#FFFFFF" : colors.paper,
                      borderRadius: 14,
                      padding: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: mobileMethod === "edahab" ? "0 4px 12px rgba(45, 90, 39, 0.08)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mobileMethod === "edahab" ? 10 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `2px solid ${mobileMethod === "edahab" ? colors.indigo : colors.line}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: mobileMethod === "edahab" ? colors.indigo : "#ffffff",
                          }}
                        >
                          {mobileMethod === "edahab" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: colors.ink }}>
                            {lang === "so" ? "Ku bixi eDahab" : "Pay with eDahab"}
                          </div>
                          <div style={{ fontSize: "11px", color: colors.inkSoft, marginTop: 1 }}>
                            Somtel Somalia & Somaliland
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#FEF3C7", color: "#D97706" }}>
                        Somtel
                      </span>
                    </div>

                    {/* Input Field when selected */}
                    {mobileMethod === "edahab" && (
                      <div className="fade-up" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.line}` }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>
                          {lang === "so" ? "Lambarka eDahab (Somtel #)" : "eDahab Phone Number"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 065 123 4567 or 25265..."
                          value={edahabPhone}
                          onChange={(e) => setEdahabPhone(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full p-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-indigo-500"
                          style={{
                            borderColor: colors.line,
                            background: "#ffffff",
                            color: colors.ink,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Option 3: Pay with Premier Wallet */}
                  <div
                    onClick={() => setMobileMethod("premier")}
                    style={{
                      border: `1.5px solid ${mobileMethod === "premier" ? "#1B365D" : colors.line}`,
                      background: mobileMethod === "premier" ? "#FFFFFF" : colors.paper,
                      borderRadius: 14,
                      padding: "14px",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: mobileMethod === "premier" ? "0 4px 12px rgba(27, 54, 93, 0.1)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mobileMethod === "premier" ? 10 : 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `2px solid ${mobileMethod === "premier" ? "#1B365D" : colors.line}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: mobileMethod === "premier" ? "#1B365D" : "#ffffff",
                          }}
                        >
                          {mobileMethod === "premier" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff" }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#1B365D" }}>
                            {lang === "so" ? "Ku bixi Premier Wallet" : "Pay with Premier Wallet"}
                          </div>
                          <div style={{ fontSize: "11px", color: colors.inkSoft, marginTop: 1 }}>
                            Premier Bank PBWallet • Automated Direct Payout
                          </div>
                        </div>
                      </div>

                      <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#DBEAFE", color: "#1E40AF" }}>
                        PBWallet
                      </span>
                    </div>

                    {/* Input Field when selected */}
                    {mobileMethod === "premier" && (
                      <div className="fade-up" style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${colors.line}` }}>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>
                          {lang === "so" ? "Lambarka Premier Wallet (Taleefanka / Account)" : "Premier Wallet Mobile / Account #"}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 061 234 5678 or 85xxxxxxx"
                          value={premierPhone}
                          onChange={(e) => setPremierPhone(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full p-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-blue-900"
                          style={{
                            borderColor: "#CBD5E1",
                            background: "#ffffff",
                            color: colors.ink,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Side 2 View: Debit / Credit Card (In-Page Mastercard & Visa) */}
              {paymentSide === "card" && (
                <div className="fade-up" style={{ marginBottom: 16 }}>
                  <CardPaymentForm
                    cardDetails={cardDetails}
                    setCardDetails={setCardDetails}
                    lang={lang}
                    amount={finalPrice}
                  />
                </div>
              )}
            </div>

          {/* Interactive Live Payment Processing / USSD / Card Charge Modal */}
          {(paymentStatus === "sending_prompt" || paymentStatus === "prompt_sent") && (
            <div
              className="fade-up"
              style={{
                background: "#ffffff",
                border: `2px solid ${paymentSide === "card" ? colors.acacia : mobileMethod === "premier" ? "#1B365D" : colors.indigo}`,
                borderRadius: 20,
                padding: "24px 20px",
                marginBottom: 20,
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(45, 90, 39, 0.12)",
              }}
            >
              {/* Animated Icon Graphic */}
              <div style={{ position: "relative", width: 70, height: 70, margin: "0 auto 16px" }}>
                <div
                  className="animate-ping"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: paymentSide === "card" ? "#DCFCE7" : mobileMethod === "premier" ? "#DBEAFE" : colors.indigoSoft,
                    opacity: 0.75,
                  }}
                />
                <div
                  style={{
                    position: "relative",
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: paymentSide === "card" ? colors.acacia : mobileMethod === "premier" ? "#1B365D" : colors.indigo,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 14px rgba(45, 90, 39, 0.25)",
                  }}
                >
                  {paymentSide === "card" ? (
                    <CreditCard size={32} className="animate-bounce" />
                  ) : mobileMethod === "premier" ? (
                    <Wallet size={32} className="animate-bounce" />
                  ) : (
                    <Smartphone size={32} className="animate-bounce" />
                  )}
                </div>
              </div>

              <h3 style={{ fontSize: "16px", fontWeight: 800, color: colors.ink, marginBottom: 4 }}>
                {paymentSide === "card"
                  ? lang === "so"
                    ? "Xaqiijinta Bangiga & Goynta Lacagta..."
                    : "Authorizing with Bank & Charging Card..."
                  : mobileMethod === "premier"
                  ? lang === "so"
                    ? "Fadlan Hubi Premier Wallet-kaaga!"
                    : "Check Your Premier Wallet Screen"
                  : lang === "so"
                  ? "Fadlan Fur Taleefankaaga!"
                  : "Check Your Mobile Screen"}
              </h3>

              <div style={{ fontSize: "13px", color: paymentSide === "card" ? colors.acacia : mobileMethod === "premier" ? "#1B365D" : colors.indigo, fontWeight: 700, marginBottom: 12 }}>
                {paymentSide === "card"
                  ? `${detectCardType(cardDetails.cardNumber).toUpperCase()} (•••• ${cardDetails.cardNumber.replace(/\D/g, "").slice(-4) || "••••"})`
                  : mobileMethod === "premier"
                  ? `${premierPhoneInfo.display || premierPhone} (Premier Wallet)`
                  : mobileMethod === "edahab"
                  ? `${edahabPhoneInfo.display || edahabPhone} (eDahab Somtel)`
                  : `${phoneInfo.display || customPhone} (${phoneInfo.operator})`}
              </div>

              {/* Terminal Screen Mockup */}
              <div
                style={{
                  background: "#1E293B",
                  borderRadius: 14,
                  padding: "14px 16px",
                  color: "#F8FAFC",
                  textAlign: "left",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  marginBottom: 16,
                  border: "2px solid #334155",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", color: "#94A3B8", fontSize: "10px", marginBottom: 6 }}>
                  <span>{paymentSide === "card" ? "SIFALO PAY • 3D SECURE CARD CHECKOUT" : mobileMethod === "premier" ? "PREMIER WALLET • PBWALLET" : "SIFALO PAY • USSD"}</span>
                  <span>{promptCountdown}s</span>
                </div>
                <div style={{ color: "#38BDF8", fontWeight: 700, marginBottom: 4 }}>
                  Barbaar Wellness: ${finalPrice}.00 USD
                </div>
                <div style={{ color: "#E2E8F0" }}>
                  {paymentSide === "card"
                    ? lang === "so"
                      ? "Bogga sugan ee Sifalo Pay ayaa la diyaariyay. Guji badhanka hoose si aad ugu bixiso kaadhkaaga Visa ama Mastercard."
                      : "Sifalo Pay secure checkout session active. Click the button below to complete your Mastercard or Visa payment."
                    : mobileMethod === "premier"
                    ? lang === "so"
                      ? "Geli PIN-ka Premier Wallet si aad u xaqiijiso bixinta lacagta."
                      : "Enter your Premier Wallet PIN to approve the charge."
                    : lang === "so"
                    ? "Geli PIN-kaaga si aad u xaqiijiso bixinta lacagta."
                    : "Enter your PIN on your mobile screen to approve the charge."}
                </div>
              </div>

              {/* Card Checkout Action Link if URL is ready */}
              {paymentSide === "card" && cardCheckoutUrl && (
                <div style={{ marginBottom: 16 }}>
                  <a
                    href={cardCheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #166534 0%, #15803d 100%)",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 800,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(22, 101, 52, 0.35)",
                      marginBottom: 8,
                    }}
                  >
                    <ExternalLink size={16} />
                    {lang === "so" ? "Fur Bogga Sugan ee Sifalo Pay (Ku bixi Kaadhka)" : "Open Sifalo Secure Card Portal"}
                  </a>
                  <div style={{ fontSize: "11px", color: colors.inkSoft }}>
                    {lang === "so"
                      ? "Nidaamka wuxuu si toos ah u xaqiijinayaa lacag-bixintaada isla marka aad kaadhka ku bixiso."
                      : "The system will automatically detect and verify your charge once completed."}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "12px", color: colors.inkSoft, marginBottom: 16 }}>
                <Loader2 size={14} className="animate-spin" color={paymentSide === "card" ? colors.acacia : mobileMethod === "premier" ? "#1B365D" : colors.indigo} />
                <span>
                  {paymentSide === "card"
                    ? lang === "so"
                      ? "Waxaa si toos ah loo sugayaa ogolaanshaha bangiga..."
                      : "Awaiting bank clearance & auto-verifying charge..."
                    : lang === "so"
                    ? "Waxaa si toos ah loo sugayaa ogolaanshaha PIN-ka..."
                    : "Awaiting PIN entry & auto-verifying charge..."}
                </span>
              </div>

              {/* Only Cancel button provided - No manual fake confirmation buttons */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentStatus("idle");
                    setPaymentResult(null);
                    setCardCheckoutUrl("");
                  }}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 10,
                    background: "#F1F5F9",
                    color: colors.inkSoft,
                    fontSize: "12px",
                    fontWeight: 600,
                    border: `1px solid ${colors.line}`,
                    cursor: "pointer",
                  }}
                >
                  {lang === "so" ? "Jooji & Dib u Noqo" : "Cancel & Return"}
                </button>
              </div>
            </div>
          )}

          {/* Payment Success State */}
          {paymentStatus === "success" && (
            <div
              className="fade-up"
              style={{
                background: colors.acaciaSoft,
                border: `2px solid ${colors.acacia}`,
                borderRadius: 20,
                padding: "20px",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: colors.acacia,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: colors.ink, marginBottom: 4 }}>
                {lang === "so" ? "Lacag-bixinta Waa Lagu Guuleystay!" : "Payment Verified & Approved!"}
              </h3>
              <p style={{ fontSize: "12px", color: colors.inkSoft, marginBottom: 8 }}>
                {lang === "so"
                  ? "Lacagta waa la xaqiijiyay, ballantaadiina waa la diiwaangeliyay."
                  : "Transaction completed successfully. Finalizing your session booking..."}
              </p>
              {paymentResult?.sid && (
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: colors.acacia,
                    fontFamily: "monospace",
                    background: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: 8,
                    display: "inline-block",
                  }}
                >
                  SID: {paymentResult.sid}
                </div>
              )}
            </div>
          )}

          {/* Payment Failure State with Actionable Guidance */}
          {paymentStatus === "failed" && (
            <div
              className="fade-up"
              style={{
                background: "#FEF2F2",
                border: "1.5px solid #F87171",
                borderRadius: 18,
                padding: "16px 18px",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <XCircle size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#991B1B" }}>
                    {lang === "so" ? "Lacag-bixintu Ma Dhameystirmin" : "Payment Incomplete"}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#B91C1C", marginTop: 4, lineHeight: 1.4 }}>
                    {lang === "so" ? paymentResult?.messageSo : paymentResult?.messageEn}
                  </p>

                  {/* Error recovery buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }} className="flex-wrap">
                    <button
                      type="button"
                      onClick={triggerSifaloPayment}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        background: "#DC2626",
                        color: "#ffffff",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <RefreshCw size={12} />
                      {lang === "so" ? "Mar kale isku day" : "Try Again"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentStatus("idle")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#ffffff",
                        color: "#374151",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        border: "1px solid #D1D5DB",
                        cursor: "pointer",
                      }}
                    >
                      {lang === "so" ? "Beddel Nambarka" : "Change Payment Details"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <Button
            full
            variant="amber"
            disabled={paymentStatus === "sending_prompt" || paymentStatus === "prompt_sent" || paymentStatus === "success"}
            onClick={triggerSifaloPayment}
            icon={
              paymentStatus === "sending_prompt" || paymentStatus === "prompt_sent"
                ? Loader2
                : booking.financialAidApplied
                ? Send
                : Shield
            }
          >
            {paymentStatus === "sending_prompt" || paymentStatus === "prompt_sent"
              ? lang === "so"
                ? "Lacag-bixinta baa socota…"
                : "Initiating Live Handshake…"
              : booking.financialAidApplied
              ? lang === "so"
                ? "Gudbi Codsiga & Sug Ogolaansho"
                : "Submit Request & Wait Approval"
              : paymentSide === "card"
              ? lang === "so"
                ? `Bixi ${fmtMoney(finalPrice)} (Mastercard / Visa)`
                : `Pay ${fmtMoney(finalPrice)} (Mastercard / Visa)`
              : mobileMethod === "premier"
              ? lang === "so"
                ? `Bixi ${fmtMoney(finalPrice)} (Premier Wallet)`
                : `Pay ${fmtMoney(finalPrice)} (Premier Wallet)`
              : mobileMethod === "edahab"
              ? lang === "so"
                ? `Bixi ${fmtMoney(finalPrice)} (eDahab Somtel)`
                : `Pay ${fmtMoney(finalPrice)} (eDahab Somtel)`
              : `${t("Pay", lang)} ${fmtMoney(finalPrice)} (${phoneInfo.operator})`}
          </Button>

          <div
            style={{
              textAlign: "center",
              fontSize: "11.5px",
              color: colors.inkSoft,
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Lock size={12} color={colors.inkSoft} />
            <span>
              {booking.financialAidApplied
                ? lang === "so"
                  ? "Bilaash ku gudbi · Dib-u-eegis degdeg ah"
                  : "Free submission · Fast admin verification"
                : lang === "so"
                ? "256-Bit SSL Sugan · Sifalo Pay Gateway · Mobile Money, Premier Wallet & Kaadhadh"
                : "256-Bit SSL Encrypted · Sifalo Pay Gateway · Mobile, Premier Wallet & Cards"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
