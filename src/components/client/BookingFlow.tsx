/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Clock, User, Phone, Mail, Smartphone, CreditCard, Loader2, Shield, Check, Coins, Send } from "lucide-react";
import { Therapist, Booking, ClientProfile } from "../../types";
import { colors } from "../../constants";
import { fmtDate, fmtMoney, nextAvailableDates, isoDate, getFinancialAidInfo } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import Avatar from "../ui/Avatar";
import TextField from "../ui/TextField";
import Card from "../ui/Card";
import Button from "../ui/Button";
import FinancialAidBanner from "./FinancialAidBanner";

interface BookingFlowProps {
  therapist: Therapist;
  booking: any;
  setBooking: React.Dispatch<React.SetStateAction<any>>;
  onCancel: () => void;
  onConfirm: () => void;
  lang?: Language;
  clientProfile: ClientProfile;
  setClientProfile: (profile: ClientProfile) => void;
}

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
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<"mobile" | "card">("mobile");
  const [mobileProvider, setMobileProvider] = useState<"EVC" | "ZAAD" | "SAHAL">("EVC");
  const [mobilePhone, setMobilePhone] = useState<string>(booking.phone || clientProfile.phone || "");
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expMonth: "",
    expYear: "",
    cvc: "",
    name: booking.name || clientProfile.name || "",
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentStatusMsg, setPaymentStatusMsg] = useState<string | null>(null);

  const dates = nextAvailableDates(therapist.availability.days);

  const aidInfo = getFinancialAidInfo(clientProfile);

  // Keep phone number & card name synced when entering step 3
  useEffect(() => {
    if (booking.phone && !mobilePhone) {
      setMobilePhone(booking.phone);
    }
    if (booking.name && !cardDetails.name) {
      setCardDetails((prev) => ({ ...prev, name: booking.name }));
    }
  }, [booking.phone, booking.name]);

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
      }
    }
  }, [booking.step, aidInfo.isActive, clientProfile, setBooking]);

  function pickDate(d: Date) {
    setBooking({ ...booking, date: d, time: null });
  }

  function pickTime(time: string) {
    setBooking({ ...booking, time, step: 2 });
  }

  function submitInfo() {
    setBooking({ ...booking, step: 3 });
  }

  async function pay(finalPrice: number, isApprovedAid: boolean) {
    setPaymentError(null);
    setPaymentStatusMsg(null);

    // Validate client payment details before sending to gateway
    if (method === "mobile") {
      const targetPhone = (mobilePhone || booking.phone || "").trim();
      if (!targetPhone || targetPhone.replace(/\D/g, "").length < 7) {
        setPaymentError(
          lang === "so"
            ? "Fadlan geli lambar taleefan oo sax ah kan Mobile Money (EVC / Zaad / Sahal)."
            : "Please enter a valid Mobile Money phone number."
        );
        return;
      }
      setPaying(true);
      setPaymentStatusMsg(
        lang === "so"
          ? `Codsiga USSD ${mobileProvider} waxaa loo dirayaa +${targetPhone}...`
          : `Sending ${mobileProvider} USSD payment prompt to +${targetPhone}...`
      );
    } else {
      const cleanCard = cardDetails.number.replace(/\D/g, "");
      if (!cleanCard || cleanCard.length < 13) {
        setPaymentError(
          lang === "so"
            ? "Fadlan geli lambarka kaarka oo sax ah (13-19 lambar Visa/Mastercard)."
            : "Please enter a valid card number (13-19 digits)."
        );
        return;
      }
      if (!cardDetails.expMonth || !cardDetails.expYear) {
        setPaymentError(
          lang === "so"
            ? "Fadlan geli taariikhda uu dhacayo kaarka (Bisha & Sanadka, e.g. 12/28)."
            : "Please enter card expiration date (MM/YY)."
        );
        return;
      }
      if (!cardDetails.cvc || cardDetails.cvc.replace(/\D/g, "").length < 3) {
        setPaymentError(
          lang === "so"
            ? "Fadlan geli lambarka CVV/CVC (3 ama 4 nambar)."
            : "Please enter CVV / CVC security code."
        );
        return;
      }
      setPaying(true);
      setPaymentStatusMsg(
        lang === "so"
          ? "Kaarka waxaa lagu shubayaa Sifalo Pay..."
          : "Processing card payment via Sifalo Pay..."
      );
    }

    try {
      const response = await fetch("/api/sifalo-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          amount: finalPrice,
          mobileProvider,
          phone: mobilePhone || booking.phone,
          cardDetails,
          clientName: booking.name,
          clientEmail: booking.email,
          clientPhone: booking.phone,
          bookingId: booking.id || `bk_${Date.now()}`,
          description: `Barbaar Wellness Consultation with ${therapist.name}`,
        }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        setBooking((prev: any) => ({
          ...prev,
          paymentStatus: "paid",
          paymentMethod: method,
          paymentTransactionId: resData.transactionId,
          paidAmount: finalPrice,
        }));
        setPaymentStatusMsg(resData.message || (lang === "so" ? "Lacag bixintu waa guuleysatay!" : "Payment successful!"));
        setTimeout(() => {
          setPaying(false);
          onConfirm();
        }, 800);
      } else {
        setPaying(false);
        setPaymentStatusMsg(null);
        setPaymentError(
          resData.error ||
            (lang === "so"
              ? "Lacag bixinta waa la diaday. Fadlan dib u tijaabi."
              : "Payment charge failed. Please check your details and try again.")
        );
      }
    } catch (err: any) {
      setPaying(false);
      setPaymentStatusMsg(null);
      setPaymentError(
        err?.message ||
          (lang === "so"
            ? "Cillad ayaa ka dhacday Sifalo Pay. Fadlan mar kale tijaabi."
            : "Sifalo Pay gateway error. Please try again.")
      );
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
          
          <div style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 6 }}>
            {dates.map((d) => {
              const isSelected = booking.date && isoDate(booking.date) === isoDate(d);
              return (
                <button
                  key={isoDate(d)}
                  onClick={() => pickDate(d)}
                  style={{
                    flexShrink: 0,
                    width: 62,
                    padding: "10px 0",
                    borderRadius: 14,
                    border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                    background: isSelected ? colors.indigo : colors.paper,
                    color: isSelected ? "#fff" : colors.ink,
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>
                    {getDayName(d)}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>
                    {d.getDate()}
                  </div>
                </button>
              );
            })}
          </div>

          {booking.date && (
            <div className="fade-up" style={{ marginTop: 22 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
                {therapist.availability.slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => pickTime(s)}
                    style={{
                      padding: "12px 6px",
                      borderRadius: 13,
                      border: `1.5px solid ${colors.line}`,
                      background: colors.paper,
                      fontSize: 13,
                      fontWeight: 700,
                      color: colors.ink,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Information Intake */}
      {booking.step === 2 && (
        <div className="fade-up" style={{ padding: "20px 20px" }}>
          {booking.date && (
            <Card
              style={{
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: colors.indigoSoft,
                border: "none",
              }}
            >
              <Clock size={17} color={colors.indigo} />
              <div style={{ fontSize: "13.5px", color: colors.indigo, fontWeight: 600 }}>
                {fmtDate(booking.date)} {t("at", lang)} {booking.time}
              </div>
            </Card>
          )}

          <TextField
            label={t("Full name", lang)}
            value={booking.name}
            onChange={(v) => setBooking({ ...booking, name: v })}
            placeholder={t("Your name", lang)}
            icon={User}
          />
          <TextField
            label={t("Phone number", lang)}
            value={booking.phone}
            onChange={(v) => setBooking({ ...booking, phone: v })}
            placeholder="+252 61 234 5678"
            icon={Phone}
            type="tel"
          />
          <TextField
            label={t("Email", lang)}
            value={booking.email}
            onChange={(v) => setBooking({ ...booking, email: v })}
            placeholder="you@email.com"
            icon={Mail}
            type="email"
          />

          <div style={{ marginTop: 8 }}>
            <Button
              full
              disabled={!booking.name || !booking.phone || !booking.email}
              onClick={submitInfo}
            >
              {t("Continue", lang)}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payment Summary and Options */}
      {booking.step === 3 && (() => {
        const isApprovedAid = aidInfo.isActive || clientProfile.financialAidStatus === "approved";
        const isPendingAid = clientProfile.financialAidStatus === "pending";
        const originalPrice = therapist.price;
        const isDiscounted = isApprovedAid || booking.financialAidApplied;
        const discountAmount = isDiscounted ? Math.round(originalPrice * 0.4) : 0;
        const finalPrice = originalPrice - discountAmount;

        return (
          <div className="fade-up" style={{ padding: "20px 20px" }}>
            {/* Top Financial Aid Status Banners */}
            {isApprovedAid ? (
              <div
                className="fade-up"
                style={{
                  background: colors.acaciaSoft, // Soft botanical green
                  border: `1px solid ${colors.acacia}35`,
                  borderRadius: 16,
                  padding: "16px 20px",
                  marginBottom: 16,
                  boxShadow: "0 4px 16px rgba(100, 164, 97, 0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }} className="flex-col sm:flex-row text-center sm:text-left">
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }} className="flex-col sm:flex-row">
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: colors.acacia,
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div>
                      <div style={{ fontSize: "13.5px", fontWeight: 700, color: colors.ink }}>
                        {t("40% Financial Aid Approved", lang)}
                      </div>
                      <div style={{ fontSize: "11px", color: colors.inkSoft, marginTop: 2 }}>
                        {t("Category", lang)}: {t(clientProfile.financialAidCategory || "Somali Youth", lang)} · {t("Applied directly at checkout", lang)}
                      </div>
                    </div>
                  </div>
                  
                  <div
                    style={{
                      background: colors.amberSoft,
                      border: `1px solid ${colors.amber}25`,
                      padding: "6px 12px",
                      borderRadius: 10,
                      fontSize: "11px",
                      fontWeight: 800,
                      color: colors.amber,
                      fontFamily: "monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                    className="w-full sm:w-auto justify-center"
                  >
                    <span>⏳ {aidInfo.timeLeftStr || "Active"}</span>
                  </div>
                </div>
              </div>
            ) : isPendingAid ? (
              <div
                className="fade-up"
                style={{
                  background: "#faf9f6",
                  border: `1px dashed ${colors.amber}60`,
                  borderRadius: 16,
                  padding: "16px 20px",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <Clock size={18} color={colors.amber} className="animate-pulse flex-shrink-0" />
                  <div>
                    <div style={{ fontSize: "13.5px", fontWeight: 700, color: colors.ink }}>
                      {t("Financial Aid Application Pending Review", lang)}
                    </div>
                    <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 3, lineHeight: 1.4 }}>
                      {t("Your 40% relief application is under admin review (~24h). You can proceed now at standard rate or wait for approval.", lang)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="fade-up transition-all duration-200"
                style={{
                  background: booking.financialAidApplied ? "#fdfbf7" : colors.paper,
                  border: `1.5px solid ${booking.financialAidApplied ? colors.amber : colors.line}`,
                  borderRadius: 16,
                  padding: "16px",
                  marginBottom: 16,
                  boxShadow: booking.financialAidApplied ? "0 4px 12px rgba(220, 140, 70, 0.04)" : "none",
                }}
              >
                <div 
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
                  onClick={() => {
                    const nextVal = !booking.financialAidApplied;
                    setBooking((prev: any) => ({
                      ...prev,
                      financialAidApplied: nextVal,
                      financialAidCategory: nextVal ? "Student" : undefined,
                      financialAidReason: nextVal ? "Requested at checkout" : undefined,
                    }));
                  }}
                >
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: `2px solid ${booking.financialAidApplied ? colors.amber : colors.inkSoft}`,
                    background: booking.financialAidApplied ? colors.amber : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}>
                    {booking.financialAidApplied && <Check size={12} strokeWidth={3} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink, display: "flex", alignItems: "center", gap: 6 }}>
                      {t("Apply for Financial Aid", lang)}
                      <span style={{ fontSize: "10px", fontWeight: 800, background: colors.amberSoft, color: colors.amber, padding: "2px 6px", borderRadius: 6 }}>
                        -40% OFF
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: colors.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
                      {t("Apply a 40% relief discount on this session. Perfect for youth, students, and low-income individuals. Optional, you can also book without it.", lang)}
                    </p>
                  </div>
                </div>

                {booking.financialAidApplied && (
                  <div className="fade-up" style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${colors.line}` }}>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                        {t("Qualifying Category", lang)}
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
                        {["Student", "Somali Youth", "Unemployed", "Barbaar Member"].map((cat) => {
                          const isSelected = (booking.financialAidCategory || "Student") === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setBooking((prev: any) => ({
                                  ...prev,
                                  financialAidCategory: cat,
                                }));
                              }}
                              style={{
                                padding: "8px 4px",
                                borderRadius: 10,
                                border: `1.5px solid ${isSelected ? colors.amber : colors.line}`,
                                background: isSelected ? colors.amberSoft + "15" : colors.paper,
                                fontSize: "11.5px",
                                fontWeight: 700,
                                color: colors.ink,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {t(cat, lang)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                        {t("Brief Reason (Optional)", lang)}
                      </label>
                      <textarea
                        placeholder={t("e.g. Please share a brief reason or context for seeking financial aid.", lang)}
                        value={booking.financialAidReason || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBooking((prev: any) => ({
                            ...prev,
                            financialAidReason: val,
                          }));
                        }}
                        rows={3}
                        className="w-full p-3.5 rounded-xl border text-sm focus:outline-none focus:border-amber-500 transition-all duration-150 resize-y"
                        style={{
                          borderColor: colors.line,
                          background: "#fff",
                          color: colors.ink,
                          minHeight: "84px",
                          lineHeight: "1.45",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price Breakdown Summary */}
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
              
              {isApprovedAid ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8 }}>
                    <span style={{ color: colors.inkSoft }}>{t("Session Fee", lang)}</span>
                    <span style={{ fontWeight: 600 }}>{fmtMoney(originalPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8, color: colors.acacia }}>
                    <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <Check size={14} strokeWidth={3} /> {t("Financial Relief Approved (-40%)", lang)}
                    </span>
                    <span style={{ fontWeight: 700 }}>-{fmtMoney(discountAmount)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      paddingTop: 10,
                      borderTop: `1px dashed ${colors.line}`,
                      marginTop: 4,
                    }}
                  >
                    <div>
                      <span style={{ color: colors.ink, fontWeight: 800 }}>{t("Total Amount Due", lang)}</span>
                      <div style={{ fontSize: "10.5px", color: colors.acacia, fontWeight: 600, marginTop: 1 }}>
                        {t("Discount applied directly", lang)}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18, color: colors.acacia }}>{fmtMoney(finalPrice)}</span>
                  </div>
                </>
              ) : isPendingAid ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8 }}>
                    <span style={{ color: colors.inkSoft }}>{t("Session Fee", lang)}</span>
                    <span style={{ fontWeight: 600 }}>{fmtMoney(originalPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: 8, color: colors.amber }}>
                    <span style={{ fontWeight: 600 }}>{t("Financial Aid Status", lang)}</span>
                    <span style={{ fontWeight: 700 }}>{t("Pending Review", lang)}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      paddingTop: 10,
                      borderTop: `1px dashed ${colors.line}`,
                      marginTop: 4,
                    }}
                  >
                    <span style={{ color: colors.ink, fontWeight: 800 }}>{t("Total", lang)}</span>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>{fmtMoney(originalPrice)}</span>
                  </div>
                </>
              ) : booking.financialAidApplied ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8 }}>
                    <span style={{ color: colors.inkSoft }}>{t("Session Fee", lang)}</span>
                    <span style={{ fontWeight: 600 }}>{fmtMoney(originalPrice)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: 8, color: colors.amber }}>
                    <span style={{ fontWeight: 500 }}>{t("Barbaar Financial Relief (-40%)", lang)}</span>
                    <span style={{ fontWeight: 700 }}>-{fmtMoney(discountAmount)}</span>
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
                      <span style={{ color: colors.inkSoft, fontWeight: 700 }}>{t("Total (Pending Approval)", lang)}</span>
                      <div style={{ fontSize: "10px", color: colors.amber, fontWeight: 600, marginTop: 1 }}>
                        {t("Subject to Admin confirmation", lang)}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{fmtMoney(finalPrice)}</span>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    paddingTop: 4,
                  }}
                >
                  <span style={{ color: colors.ink, fontWeight: 800 }}>{t("Total", lang)}</span>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>{fmtMoney(originalPrice)}</span>
                </div>
              )}
            </Card>

            {/* Payment Method Selector & Interactive Fields */}
            <div style={{ marginBottom: 18 }}>
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
                {t("Select Payment Gateway", lang)}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMethod("mobile");
                    setPaymentError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "14px 8px",
                    borderRadius: 14,
                    border: `1.5px solid ${method === "mobile" ? colors.indigo : colors.line}`,
                    background: method === "mobile" ? colors.indigoSoft : colors.paper,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Smartphone size={19} color={colors.indigo} />
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: colors.ink }}>
                    {t("Mobile Money", lang)}
                  </span>
                  <span style={{ fontSize: "10.5px", color: colors.inkSoft }}>
                    EVC Plus · Zaad · Sahal
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMethod("card");
                    setPaymentError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "14px 8px",
                    borderRadius: 14,
                    border: `1.5px solid ${method === "card" ? colors.indigo : colors.line}`,
                    background: method === "card" ? colors.indigoSoft : colors.paper,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <CreditCard size={19} color={colors.indigo} />
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: colors.ink }}>
                    {t("Credit / Debit Card", lang)}
                  </span>
                  <span style={{ fontSize: "10.5px", color: colors.inkSoft }}>
                    Visa · Mastercard
                  </span>
                </button>
              </div>

              {/* Mobile Money Form Details */}
              {method === "mobile" && (
                <div
                  className="fade-up"
                  style={{
                    background: colors.paper,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 16,
                    padding: "16px",
                    marginBottom: 16,
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: colors.inkSoft,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    {t("Mobile Money Service", lang)}
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
                    {[
                      { id: "EVC", label: "EVC Plus", sub: "Telesom/Hormuud" },
                      { id: "ZAAD", label: "Zaad", sub: "Telesom" },
                      { id: "SAHAL", label: "Sahal", sub: "Golis" },
                    ].map((prov) => {
                      const isSelected = mobileProvider === prov.id;
                      return (
                        <button
                          key={prov.id}
                          type="button"
                          onClick={() => setMobileProvider(prov.id as any)}
                          style={{
                            padding: "10px 4px",
                            borderRadius: 12,
                            border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                            background: isSelected ? colors.indigoSoft : "#ffffff",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <div style={{ fontSize: "12px", fontWeight: 700, color: colors.ink }}>
                            {prov.label}
                          </div>
                          <div style={{ fontSize: "9.5px", color: colors.inkSoft, marginTop: 2 }}>
                            {prov.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <TextField
                    label={t("Mobile Money Number", lang)}
                    value={mobilePhone}
                    onChange={setMobilePhone}
                    placeholder="061 234 5678 ama 063 444 5678"
                    icon={Phone}
                    type="tel"
                  />

                  <div
                    style={{
                      background: colors.indigoSoft,
                      borderRadius: 10,
                      padding: "10px 12px",
                      fontSize: "11.5px",
                      color: colors.indigo,
                      fontWeight: 600,
                      lineHeight: 1.4,
                      marginTop: 4,
                    }}
                  >
                    📱 {lang === "so"
                      ? `Astaanta USSD ee Sifalo Pay ayaa si toos ah loo soo diri doonaa. Geli PIN-kaaga EVC/Zaad si aad u xaqiijiso lacag bixinta $${finalPrice}.`
                      : `A USSD payment prompt will pop up on phone +${mobilePhone || "252..."}. Enter your ${mobileProvider} PIN to authorize $${finalPrice} payment via Sifalo Pay.`}
                  </div>
                </div>
              )}

              {/* Credit/Debit Card Form Details */}
              {method === "card" && (
                <div
                  className="fade-up"
                  style={{
                    background: colors.paper,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 16,
                    padding: "16px",
                    marginBottom: 16,
                  }}
                >
                  <TextField
                    label={t("Card Number", lang)}
                    value={cardDetails.number}
                    onChange={(v) => {
                      const cleaned = v.replace(/\D/g, "").slice(0, 16);
                      const parts = cleaned.match(/.{1,4}/g) || [];
                      setCardDetails({ ...cardDetails, number: parts.join(" ") });
                    }}
                    placeholder="4000 1234 5678 9010"
                    icon={CreditCard}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 4 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4 }}>
                        {t("Expiry (MM/YY)", lang)}
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={
                          cardDetails.expMonth && cardDetails.expYear
                            ? `${cardDetails.expMonth}/${cardDetails.expYear}`
                            : cardDetails.expMonth || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                          const m = val.slice(0, 2);
                          const y = val.slice(2, 4);
                          setCardDetails({ ...cardDetails, expMonth: m, expYear: y });
                        }}
                        className="w-full p-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-indigo-500"
                        style={{ borderColor: colors.line, background: "#ffffff", color: colors.ink }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4 }}>
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cardDetails.cvc}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        className="w-full p-3 rounded-xl border text-sm font-semibold focus:outline-none focus:border-indigo-500"
                        style={{ borderColor: colors.line, background: "#ffffff", color: colors.ink }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <TextField
                      label={t("Cardholder Name", lang)}
                      value={cardDetails.name}
                      onChange={(v) => setCardDetails({ ...cardDetails, name: v })}
                      placeholder="Magaca kaarka ku qoran"
                      icon={User}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: "11px",
                      color: colors.inkSoft,
                      marginTop: 4,
                    }}
                  >
                    <Shield size={14} color={colors.acacia} />
                    <span>{t("Encrypted 256-bit checkout secured by Sifalo Pay", lang)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error & Status Banners */}
            {paymentError && (
              <div
                className="fade-up"
                style={{
                  background: "#fdf2f2",
                  border: "1px solid #f8b4b4",
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: "12.5px",
                  color: "#9b1c1c",
                  fontWeight: 600,
                  marginBottom: 14,
                  lineHeight: 1.45,
                }}
              >
                ⚠️ {paymentError}
              </div>
            )}

            {paymentStatusMsg && (
              <div
                className="fade-up"
                style={{
                  background: colors.indigoSoft,
                  border: `1px solid ${colors.indigo}30`,
                  borderRadius: 12,
                  padding: "12px 14px",
                  fontSize: "12.5px",
                  color: colors.indigo,
                  fontWeight: 600,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Loader2 size={16} className="animate-spin flex-shrink-0" />
                <span>{paymentStatusMsg}</span>
              </div>
            )}

            <Button
              full
              variant="indigo"
              disabled={paying}
              onClick={() => pay(finalPrice, isApprovedAid)}
              icon={paying ? Loader2 : Shield}
            >
              {paying
                ? t("Processing Sifalo Pay…", lang)
                : `${t("Pay", lang)} ${fmtMoney(finalPrice)} & ${t("confirm", lang)}`}
            </Button>

            <div
              style={{
                textAlign: "center",
                fontSize: "11.5px",
                color: colors.inkSoft,
                marginTop: 10,
              }}
            >
              {t("Sifalo Pay secure checkout · Free cancellation up to 24h before", lang)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
