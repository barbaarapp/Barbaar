/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Clock, AlertTriangle, Check, ChevronRight, X, Info } from "lucide-react";
import { ClientProfile } from "../../types";
import { colors } from "../../constants";
import { getFinancialAidInfo, getPendingReviewTimeLeft } from "../../utils";
import { translateText as t } from "../../utils/translations";
import Button from "../ui/Button";
import Card from "../ui/Card";

interface FinancialAidBannerProps {
  clientProfile: ClientProfile;
  setClientProfile: (profile: ClientProfile) => void;
  lang?: "en" | "so";
  onApplyClick?: () => void;
  variant?: "home" | "booking";
  visitCount?: number;
  viewedTherapistCount?: number;
}

export default function FinancialAidBanner({
  clientProfile,
  setClientProfile,
  lang = "en",
  variant = "home",
  visitCount = 1,
  viewedTherapistCount = 0,
}: FinancialAidBannerProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [category, setCategory] = useState("Somali Youth");
  const [reason, setReason] = useState("");
  const [ticker, setTicker] = useState(0);

  const [nameInput, setNameInput] = useState(clientProfile.name || "");
  const [emailInput, setEmailInput] = useState(clientProfile.email || "");
  const [phoneInput, setPhoneInput] = useState(clientProfile.phone || "");
  const [notifStatus, setNotifStatus] = useState<string | null>(null);

  useEffect(() => {
    setNameInput(clientProfile.name || "");
    setEmailInput(clientProfile.email || "");
    setPhoneInput(clientProfile.phone || "");
  }, [clientProfile.name, clientProfile.email, clientProfile.phone, showApplyModal]);

  // Live timer tick every second to update countdown precisely
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const aidInfo = getFinancialAidInfo(clientProfile);
  const status = clientProfile.financialAidStatus || "none";

  // Requirement: Hide the financial aid card on the home page for first-time users
  // (visitCount <= 1 and viewedTherapistCount < 2) if they haven't applied yet.
  const isFirstTimeUser = visitCount <= 1 && viewedTherapistCount < 2;
  const isNoneStatus = status === "none" || status === "rejected" || aidInfo.isExpired;

  if (variant === "home" && isFirstTimeUser && isNoneStatus) {
    return null;
  }

  function sendTestExpiryWarning() {
    setNotifStatus("sending_warning");
    fetch("/api/send-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: "relief-expiry",
        clientName: clientProfile.name || "Client",
        clientEmail: clientProfile.email || "barbaaryp@gmail.com",
        clientPhone: clientProfile.phone || "+252905893406",
        therapistName: "General Therapist",
        category: clientProfile.financialAidCategory || "Somali Youth & Community",
        date: new Date().toLocaleDateString(),
        time: "N/A",
        price: 0,
        priceUnit: "$",
        financialAidApplied: true,
        action: "send_expiry_warning_notification",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotifStatus("sent_warning");
          setTimeout(() => setNotifStatus(null), 8000);
        } else {
          setNotifStatus("failed_warning");
        }
      })
      .catch((err) => {
        console.warn("Failed to send warning email:", err);
        setNotifStatus("failed_warning");
      });
  }

  function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;

    setClientProfile({
      ...clientProfile,
      name: nameInput,
      email: emailInput,
      phone: phoneInput,
      financialAidStatus: "pending",
      financialAidSubmittedAt: new Date().toISOString(),
      financialAidCategory: category,
      financialAidReason: reason,
    });
    setShowApplyModal(false);
    setReason("");
  }

  // Render Apply Card if no active/pending application
  if (status === "none" || status === "rejected" || aidInfo.isExpired) {
    if (variant === "booking") {
      return (
        <div
          className="fade-up"
          style={{
            background: "#fdf8f5",
            border: `1px solid ${colors.amber}25`,
            borderRadius: 16,
            padding: "16px 20px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                background: colors.amberSoft + "40",
                color: colors.amber,
                padding: 8,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 700, fontSize: "14px", color: colors.ink }}>
                {t("Financial Aid Pre-Approval Required", lang)}
              </h4>
              <p style={{ fontSize: "12px", color: colors.inkSoft, marginTop: 4, lineHeight: 1.4 }}>
                {t("To book sessions with a 40% relief discount, you must first apply and get approved. Applications are fast and reviewed within 24 hours.", lang)}
              </p>
              <button
                onClick={() => setShowApplyModal(true)}
                style={{
                  marginTop: 10,
                  fontSize: "12.5px",
                  fontWeight: 700,
                  color: colors.indigo,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {t("Request Financial Aid", lang)} <ChevronRight size={14} />
              </button>
            </div>
          </div>
          {renderApplyModal()}
        </div>
      );
    }

    return (
      <div className="fade-up max-w-5xl mx-auto px-4 md:px-8 mt-6">
        <div
          style={{
            background: "#ffffff",
            border: `1px solid ${colors.line}`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            gap: 20,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
          className="flex flex-col md:flex-row items-center md:items-center justify-between"
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }} className="flex-col sm:flex-row text-center sm:text-left">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: colors.amberSoft + "50",
                color: colors.amber,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "15px", color: colors.ink }}>
                {t("Need financial support for your therapy?", lang)}
              </div>
              <div style={{ fontSize: "12.5px", color: colors.inkSoft, marginTop: 3, lineHeight: 1.45 }} className="max-w-xl">
                {t("Barbaar's Financial Relief program offers Somali youth, students, and low-income individuals up to 40% off sessions. Apply upfront and secure pre-approval.", lang)}
              </div>
              {status === "rejected" && (
                <div style={{ color: colors.danger, fontSize: "11.5px", fontWeight: 700, marginTop: 6 }}>
                  ✕ {t("Your previous application was declined. You can re-apply with more details.", lang)}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            style={{
              background: "transparent",
              color: colors.ink,
              border: `1.2px solid ${colors.ink}`,
              padding: "8px 20px",
              borderRadius: 999,
              fontWeight: 600,
              fontSize: "12.5px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
            }}
            className="hover:bg-gray-50 active:scale-97 w-full md:w-auto"
          >
            {t("Apply for Relief", lang)}
          </button>
        </div>
        {renderApplyModal()}
      </div>
    );
  }

  // Render Pending Card
  if (status === "pending") {
    const pendingTimeLeft = getPendingReviewTimeLeft(clientProfile.financialAidSubmittedAt);
    return (
      <div className={`fade-up ${variant === "home" ? "max-w-5xl mx-auto px-4 md:px-8 mt-6" : "mb-5"}`}>
        <div
          style={{
            background: "#faf9f6", // Soft warm white paper background
            border: `1px dashed ${colors.amber}60`,
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
          className="flex-col md:flex-row text-center md:text-left"
        >
          <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1 }} className="flex-col sm:flex-row text-center sm:text-left">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#ffffff",
                border: `1px solid ${colors.amber}30`,
                color: colors.amber,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              className="animate-pulse"
            >
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: colors.ink }}>
                {t("Financial Aid Application Pending Review", lang)}
              </div>
              <p style={{ fontSize: "12.5px", color: colors.inkSoft, marginTop: 4, lineHeight: 1.45 }}>
                {t("Our administrators are reviewing your request. We will notify you here once approved, unlocking your 40% discount.", lang)}
              </p>
            </div>
          </div>

          {/* Time Counting Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: colors.amberSoft,
              border: `1px solid ${colors.amber}30`,
              padding: "8px 14px",
              borderRadius: 12,
            }}
            className="w-full md:w-auto justify-between md:justify-start"
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: colors.amber, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {t("Review Time Left", lang)}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 800, color: colors.amber, fontFamily: "monospace", letterSpacing: "0.02em" }}>
                {pendingTimeLeft}
              </span>
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: colors.amber,
                boxShadow: `0 0 8px ${colors.amber}`,
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Render Approved Countdown Banner (FOMO Design)
  if (aidInfo.isActive) {
    return (
      <div className={`fade-up ${variant === "home" ? "max-w-5xl mx-auto px-4 md:px-8 mt-6" : "mb-5"}`}>
        <div
          style={{
            position: "relative",
            background: colors.acaciaSoft, // Soft premium botanical light green (cagaar)
            border: `1px solid ${colors.acacia}35`,
            borderRadius: 16,
            padding: "16px 20px",
            boxShadow: `0 4px 20px rgba(100, 164, 97, 0.04)`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
            className="flex-col md:flex-row"
          >
            <div style={{ display: "flex", gap: 14, alignItems: "center", flex: 1 }} className="flex-col sm:flex-row text-center sm:text-left">
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: colors.acacia,
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(100, 164, 97, 0.2)",
                }}
              >
                <Check size={16} strokeWidth={3} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }} className="justify-center sm:justify-start">
                  <span
                    style={{
                      background: colors.acacia,
                      color: "#ffffff",
                      fontSize: "9px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      padding: "2px 6px",
                      borderRadius: 4,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t("APPROVED", lang)}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "14.5px", color: colors.ink }}>
                    {t("40% Financial Aid Approved", lang)}
                  </span>
                </div>
                <p style={{ fontSize: "12.5px", color: colors.inkSoft, marginTop: 3, lineHeight: 1.45 }}>
                  {t("Your Somali Youth & Community relief discount is active and will apply automatically.", lang)}
                </p>
              </div>
            </div>

            {/* FOMO Expiration Timer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: colors.amberSoft,
                border: `1px solid ${colors.amber}25`,
                padding: "6px 12px",
                borderRadius: 12,
              }}
              className="w-full md:w-auto justify-between md:justify-start"
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "9px", fontWeight: 800, color: colors.amber, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {t("Expires in", lang)}
                </span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: colors.amber, fontFamily: "monospace", letterSpacing: "0.02em" }}>
                  {aidInfo.timeLeftStr}
                </span>
              </div>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: colors.amber,
                  boxShadow: `0 0 8px ${colors.amber}`,
                  animation: "pulse 1.5s infinite ease-in-out",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;

  // Render Application Modal Inline
  function renderApplyModal() {
    if (!showApplyModal) return null;

    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(18, 25, 22, 0.4)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          zIndex: 1000,
        }}
        onClick={() => setShowApplyModal(false)}
        className="fade-in"
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            width: "100%",
            maxWidth: 480,
            padding: "28px 24px",
            boxShadow: "0 20px 50px -10px rgba(18, 25, 22, 0.15)",
            position: "relative",
          }}
          onClick={(e) => e.stopPropagation()}
          className="scale-up"
        >
          <button
            onClick={() => setShowApplyModal(false)}
            style={{
              position: "absolute",
              right: 20,
              top: 20,
              background: "none",
              border: "none",
              color: colors.inkSoft,
              cursor: "pointer",
              padding: 4,
            }}
          >
            <X size={20} />
          </button>

          <h3
            className="font-display"
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: colors.ink,
              marginBottom: 6,
            }}
          >
            {t("Request Financial Relief", lang)}
          </h3>
          <p style={{ fontSize: "13px", color: colors.inkSoft, marginBottom: 20, lineHeight: 1.45 }}>
            {t("Barbaar is committed to mental health equity. Request upfront pre-approval to secure up to 40% relief discount on counseling sessions.", lang)}
          </p>

          <form onSubmit={handleApplySubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: colors.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                {t("Full Name", lang)}
              </label>
              <input
                required
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full p-3 rounded-xl border text-sm transition-all focus:outline-none"
                style={{
                  borderColor: colors.line,
                  background: "#fff",
                  color: colors.ink,
                }}
                placeholder={t("Enter your full name", lang)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: colors.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                {t("Gmail Address", lang)}
              </label>
              <input
                required
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-3 rounded-xl border text-sm transition-all focus:outline-none"
                style={{
                  borderColor: colors.line,
                  background: "#fff",
                  color: colors.ink,
                }}
                placeholder="you@gmail.com"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: colors.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                {t("WhatsApp Number", lang)}
              </label>
              <input
                required
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full p-3 rounded-xl border text-sm transition-all focus:outline-none"
                style={{
                  borderColor: colors.line,
                  background: "#fff",
                  color: colors.ink,
                }}
                placeholder="+252..."
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: colors.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                {t("Qualifying Category", lang)}
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {["Somali Youth", "Unemployed", "Student", "Barbaar Member"].map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: "10px 6px",
                        borderRadius: 12,
                        border: `1.5px solid ${isSelected ? colors.amber : colors.line}`,
                        background: isSelected ? colors.amberSoft + "15" : colors.paper,
                        fontSize: "12px",
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
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: colors.inkSoft, marginBottom: 6, textTransform: "uppercase" }}>
                {t("Justification Statement", lang)}
              </label>
              <textarea
                required
                rows={3}
                placeholder={t("Briefly describe your current situation. It helps our administrators review and approve your application.", lang)}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 rounded-xl border text-sm transition-all focus:outline-none"
                style={{
                  borderColor: colors.line,
                  background: "#fff",
                  color: colors.ink,
                  resize: "vertical",
                  minHeight: 100,
                  lineHeight: 1.5,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setShowApplyModal(false)}
                full
              >
                {t("Cancel", lang)}
              </Button>
              <Button
                type="submit"
                variant="amber"
                full
                disabled={!reason.trim()}
              >
                {t("Submit Request", lang)}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
