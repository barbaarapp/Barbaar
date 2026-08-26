/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Clock, 
  Check, 
  ChevronRight, 
  X, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  GraduationCap, 
  Briefcase, 
  HeartHandshake,
  ArrowUpRight,
  Zap
} from "lucide-react";
import { ClientProfile, FinancialAidRequest } from "../../types";
import { colors } from "../../constants";
import { getFinancialAidInfo, loadKey, saveKey } from "../../utils";
import { translateText as t } from "../../utils/translations";
import { db, doc, setDoc, auth } from "../../lib/firebase";

interface FinancialAidBannerProps {
  clientProfile: ClientProfile;
  setClientProfile: (profile: ClientProfile) => void;
  lang?: "en" | "so";
  onApplyClick?: () => void;
  variant?: "home" | "booking";
}

export default function FinancialAidBanner({
  clientProfile,
  setClientProfile,
  lang = "en",
  onApplyClick,
  variant = "home",
}: FinancialAidBannerProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [category, setCategory] = useState("Somali Youth");
  const [reason, setReason] = useState("");
  const [, setTicker] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [nameInput, setNameInput] = useState(clientProfile.name || "");
  const [emailInput, setEmailInput] = useState(clientProfile.email || "");
  const [phoneInput, setPhoneInput] = useState(clientProfile.phone || "");

  useEffect(() => {
    setNameInput(clientProfile.name || "");
    setEmailInput(clientProfile.email || "");
    setPhoneInput(clientProfile.phone || "");
  }, [clientProfile.name, clientProfile.email, clientProfile.phone, showApplyModal]);

  // Live timer tick every 1 second for precise countdown display
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const aidInfo = getFinancialAidInfo(clientProfile);
  let status = clientProfile.financialAidStatus || "none";
  if (status === "none") {
    try {
      const fallbackStatus = localStorage.getItem("barbaar-client-aid-status");
      if (
        fallbackStatus &&
        (fallbackStatus === "pending" || fallbackStatus === "approved" || fallbackStatus === "rejected")
      ) {
        status = fallbackStatus as any;
      }
    } catch (e) {}
  }

  async function handleApplySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || !nameInput.trim() || !emailInput.trim()) return;

    setIsSubmitting(true);

    const cleanEmail = emailInput.trim().toLowerCase();
    const nowIso = new Date().toISOString();
    // Unique ID for each application submission to preserve re-applications in history
    const uniqueReqId = `aid_${Date.now()}_${cleanEmail.replace(/[^a-z0-9]/g, "_").slice(0, 18)}`;
    const baseEmailId = `aid_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;

    // Save profile state strictly as pending for Admin review (clears previous approval)
    const updatedProfile: ClientProfile = {
      ...clientProfile,
      name: nameInput.trim(),
      email: cleanEmail,
      phone: phoneInput.trim(),
      financialAidStatus: "pending",
      financialAidApprovedAt: undefined, // Resets approval timestamp so new request is pending
      financialAidCategory: category,
      financialAidReason: reason.trim(),
    };
    
    // Save to local storage immediately so page refresh retains pending status
    saveKey("barbaar-client-profile", updatedProfile, false);
    try {
      localStorage.setItem("barbaar-client-aid-email", cleanEmail);
      localStorage.setItem("barbaar-client-aid-status", "pending");
    } catch (e) {}

    setClientProfile(updatedProfile);

    // Save to Firestore financial_aid_requests collection
    const aidRecord: FinancialAidRequest = {
      id: uniqueReqId,
      name: nameInput.trim(),
      email: cleanEmail,
      phone: phoneInput.trim(),
      financialAidStatus: "pending",
      financialAidApprovedAt: null,
      financialAidCategory: category,
      financialAidReason: reason.trim(),
      createdAt: nowIso,
      source: "upfront",
    };

    try {
      // 1. Write the unique submission
      await setDoc(doc(db, "financial_aid_requests", uniqueReqId), aidRecord);
      // 2. Overwrite the base email doc with pending state so email lookups immediately reflect latest submission
      await setDoc(doc(db, "financial_aid_requests", baseEmailId), aidRecord);

      // 3. If authenticated user exists, sync to users collection
      if (auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          name: nameInput.trim(),
          email: cleanEmail,
          phone: phoneInput.trim(),
          financialAidStatus: "pending",
          financialAidApprovedAt: null,
          financialAidCategory: category,
          financialAidReason: reason.trim(),
          updatedAt: nowIso,
        }, { merge: true });
      }
    } catch (err) {
      console.warn("Could not write aid request directly to Firestore:", err);
    }

    // Save to local aid requests cache
    try {
      const existing = await loadKey<FinancialAidRequest[]>("barbaar-aid-requests", [], true);
      const filtered = existing.filter((x) => x.id !== uniqueReqId && x.id !== baseEmailId);
      await saveKey("barbaar-aid-requests", [aidRecord, ...filtered], true);
    } catch (err) {
      console.warn("Could not save to local aid cache:", err);
    }

    // Notify backend and admins via email & WhatsApp
    try {
      await fetch("/api/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: uniqueReqId,
          clientName: nameInput.trim(),
          clientEmail: cleanEmail,
          clientPhone: phoneInput.trim(),
          therapistName: "Barbaar Care Team",
          category: category,
          reason: reason.trim(),
          financialAidApplied: true,
          action: "send_aid_request_notification",
        }),
      });
    } catch (err) {
      console.warn("Backend notification failed", err);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);

    setTimeout(() => {
      setIsSubmitted(false);
      setShowApplyModal(false);
      setReason("");
    }, 2000);
  }

  // 1. Initial State: Minimalist Light Card (matching reference design)
  if (status === "none" || status === "rejected" || aidInfo.isExpired) {
    if (variant === "booking") {
      return (
        <div
          className="fade-up"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 20,
            padding: "18px 20px",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#FAF6F0",
                color: "#B45309",
                border: "1px solid rgba(217, 119, 6, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} />
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
                  color: "#18221E",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
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

    // HOME SCREEN: Minimalist, clean light card
    return (
      <div className="fade-up max-w-5xl mx-auto px-4 md:px-8 mt-6">
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #EAECE9",
            borderRadius: 24,
            padding: "32px 24px",
            textAlign: "center",
            boxShadow: "0 2px 12px -2px rgba(0, 0, 0, 0.03)",
          }}
          className="flex flex-col items-center justify-center transition-all duration-200"
        >
          {/* Top subtle circle icon */}
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#FAF6F0",
              border: "1px solid rgba(217, 119, 6, 0.18)",
              color: "#B45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Sparkles size={20} />
          </div>

          {/* Heading */}
          <h3
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: "18px",
              color: "#18221E",
              marginBottom: 8,
              letterSpacing: "-0.01em",
            }}
          >
            {t("Need financial support for your therapy?", lang)}
          </h3>

          {/* Descriptive text */}
          <p
            style={{
              fontSize: "13.5px",
              color: "#57635C",
              lineHeight: 1.55,
              maxWidth: 520,
              marginBottom: 24,
            }}
          >
            {t(
              "Barbaar's Financial Relief program offers Somali youth, students, and low-income individuals up to 40% off sessions. Apply upfront and secure pre-approval.",
              lang
            )}
          </p>

          {status === "rejected" && (
            <div
              style={{
                color: colors.danger,
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              ✕ {t("Your previous application was declined. You can re-apply with more details.", lang)}
            </div>
          )}

          {/* Minimalist outlined pill button matching reference */}
          <button
            type="button"
            onClick={() => setShowApplyModal(true)}
            style={{
              width: "100%",
              maxWidth: 380,
              padding: "13px 28px",
              borderRadius: 999,
              border: "1.5px solid #18221E",
              background: "#FFFFFF",
              color: "#18221E",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            className="hover:bg-[#18221E] hover:text-white active:scale-[0.98] shadow-sm"
          >
            {t("Apply for Relief", lang)}
          </button>
        </div>

        {renderApplyModal()}
      </div>
    );
  }

  // 2. Pending Review State (Clean, patient, admin-only approval workflow)
  if (status === "pending") {
    return (
      <div className={`fade-up ${variant === "home" ? "max-w-5xl mx-auto px-4 md:px-8 mt-6" : "mb-5"}`}>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #EAECE9",
            borderRadius: 24,
            padding: "24px 28px",
            boxShadow: "0 2px 12px -2px rgba(0, 0, 0, 0.03)",
          }}
          className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left"
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#FAF6F0",
              border: "1px solid rgba(217, 119, 6, 0.2)",
              color: "#B45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
            className="animate-pulse"
          >
            <Clock size={20} />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10.5px] font-extrabold uppercase tracking-wide border border-amber-200/50 mb-1.5">
              <Clock size={11} className="text-amber-600" />
              <span>{lang === "so" ? "Dib u eegis ayaa socota" : "Application Under Review"}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "15px", color: colors.ink }}>
              {t("Financial Aid Pre-Approval Pending Review", lang)}
            </div>
            <p style={{ fontSize: "13px", color: colors.inkSoft, marginTop: 4, lineHeight: 1.45 }}>
              {t("Our care team is reviewing your request. You will receive a notification via Gmail and WhatsApp once approved.", lang)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Approved State: Highly Attractive, Professional Countdown UI
  if (aidInfo.isActive) {
    const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");

    return (
      <div className={`fade-up ${variant === "home" ? "max-w-5xl mx-auto px-4 md:px-8 mt-6" : "mb-5"}`}>
        <div
          style={{
            position: "relative",
            background: "#FFFFFF",
            border: "1.5px solid #DCFCE7",
            borderRadius: 24,
            padding: "24px 28px",
            boxShadow: "0 4px 24px -4px rgba(34, 197, 94, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.02)",
            overflow: "hidden",
          }}
          className="transition-all duration-200"
        >
          {/* Subtle top decorative bar indicating active approval */}
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
            }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left section: Approval badge, Title, and details */}
            <div className="flex items-start gap-4 flex-1">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.12)",
                }}
              >
                <Check size={22} strokeWidth={2.8} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wider uppercase border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    {t("APPROVED", lang)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/60">
                    <Zap size={11} className="text-amber-600" />
                    40% RELIEF
                  </span>
                </div>

                <h4 className="font-display text-base md:text-lg font-bold text-gray-900 leading-tight">
                  {t("40% Financial Relief Active", lang)}
                </h4>

                <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed max-w-xl">
                  {t(
                    "Your pre-approved 40% relief discount is automatically applied to all therapist bookings.",
                    lang
                  )}
                </p>
              </div>
            </div>

            {/* Right section: High-contrast, attractive digital countdown clock */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              {/* Countdown Units Box */}
              <div className="bg-gray-50/90 border border-gray-200/80 rounded-2xl p-3 px-4 flex flex-col items-center justify-center shadow-xs">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-amber-800 mb-1.5">
                  <Clock size={12} className="text-amber-600 animate-spin" style={{ animationDuration: "12s" }} />
                  <span>{t("Expires in", lang)}</span>
                </div>

                {/* Digital Time Segment Digits */}
                <div className="flex items-center gap-1.5 font-mono">
                  {/* Days */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white border border-gray-200 text-gray-900 text-sm md:text-base font-extrabold px-2 py-1 rounded-lg shadow-2xs min-w-[32px] text-center">
                      {pad(aidInfo.days)}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                      {t("Days", lang)}
                    </span>
                  </div>

                  <span className="text-gray-400 font-bold -mt-3.5">:</span>

                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white border border-gray-200 text-gray-900 text-sm md:text-base font-extrabold px-2 py-1 rounded-lg shadow-2xs min-w-[32px] text-center">
                      {pad(aidInfo.hours)}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                      {t("Hours", lang)}
                    </span>
                  </div>

                  <span className="text-gray-400 font-bold -mt-3.5">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white border border-gray-200 text-gray-900 text-sm md:text-base font-extrabold px-2 py-1 rounded-lg shadow-2xs min-w-[32px] text-center">
                      {pad(aidInfo.minutes)}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">
                      {t("Mins", lang)}
                    </span>
                  </div>

                  <span className="text-gray-400 font-bold -mt-3.5">:</span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <div className="bg-white border border-amber-300 text-amber-700 text-sm md:text-base font-extrabold px-2 py-1 rounded-lg shadow-2xs min-w-[32px] text-center">
                      {pad(aidInfo.seconds)}
                    </div>
                    <span className="text-[9px] font-bold text-amber-700 uppercase mt-0.5">
                      {t("Secs", lang)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Link for Home variant */}
              {variant === "home" && onApplyClick && (
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={onApplyClick}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98"
                  >
                    <span>{t("Book Session with 40% Off", lang)}</span>
                    <ArrowUpRight size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(true)}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 underline underline-offset-2 py-1 px-2 transition-colors"
                  >
                    {t("Re-apply for Aid", lang)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {renderApplyModal()}
      </div>
    );
  }

  return null;

  // Responsive, Mobile-friendly Financial Aid Application Bottom Sheet / Modal
  function renderApplyModal() {
    if (!showApplyModal) return null;

    const categoryOptions = [
      { id: "Somali Youth", label: t("Somali Youth", lang), sub: lang === "so" ? "Da'da 18–30" : "Ages 18–30", icon: Sparkles },
      { id: "Student", label: t("Student", lang), sub: lang === "so" ? "Jaamacad / Dugsiga sare" : "University / College", icon: GraduationCap },
      { id: "Unemployed", label: t("Unemployed", lang), sub: lang === "so" ? "Dakhli hoose / Shaqo doon" : "Low income / Job seeker", icon: Briefcase },
      { id: "Barbaar Member", label: t("Barbaar Member", lang), sub: lang === "so" ? "Xubin bulshada Barbaar" : "Community member", icon: HeartHandshake },
    ];

    return (
      <div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && setShowApplyModal(false)}
      >
        <div
          className="w-full max-w-lg bg-white rounded-t-[28px] md:rounded-[28px] shadow-2xl max-h-[92vh] md:max-h-[88vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-6 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile pull drag bar indicator */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 md:hidden" />

          {/* Header */}
          <div className="px-6 pt-4 pb-3 border-b border-gray-100 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold tracking-wide uppercase mb-1.5 border border-amber-200/60">
                <Sparkles size={12} className="text-amber-600" />
                <span>{lang === "so" ? "40% Dhimis Taageero ah" : "40% Relief Program"}</span>
              </div>
              <h3 className="font-display text-lg md:text-xl font-bold text-gray-900 leading-tight">
                {t("Request Financial Relief", lang)}
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">
                {lang === "so"
                  ? "Codsigu wuxuu qaadanayaa 1 daqiiqo. Waxaa laguu soo jawaabi doonaa 24 saac gudahood."
                  : "Quick 1-minute application. Reviewed and approved within 24 hours."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowApplyModal(false)}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content / Success State */}
          {isSubmitted ? (
            <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-4 animate-bounce">
                <Check size={32} strokeWidth={3} />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {t("Application Submitted!", lang)}
              </h4>
              <p className="text-sm text-gray-600 max-w-sm leading-relaxed mb-6">
                {t("We have received your financial relief request. Our care team will review and approve it within 24 hours.", lang)}
              </p>
              <div className="text-xs text-gray-400">
                {lang === "so" ? "Fariin xaqiijin ah ayaa laguugu soo diri doonaa Gmail & WhatsApp." : "Pre-approval notification will be sent to your Gmail & WhatsApp."}
              </div>
            </div>
          ) : (
            <form onSubmit={handleApplySubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                
                {/* Contact Information Fields */}
                <div className="space-y-3">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                    {lang === "so" ? "1. Xogta Xidhiidhka" : "1. Contact Information"}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t("Full Name", lang)} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <User size={15} />
                        </div>
                        <input
                          required
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder={t("Enter your full name", lang)}
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t("Gmail Address", lang)} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                          <Mail size={15} />
                        </div>
                        <input
                          required
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="you@gmail.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Phone */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t("WhatsApp Number", lang)} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Phone size={15} />
                      </div>
                      <input
                        required
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+252 61..."
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Qualifying Group Selector */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
                    {lang === "so" ? "2. Dooro Qaybta Kugu Habboon" : "2. Select Qualifying Category"}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {categoryOptions.map((opt) => {
                      const isSelected = category === opt.id;
                      const IconComp = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCategory(opt.id)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl text-left border transition-all ${
                            isSelected
                              ? "bg-amber-50/80 border-amber-600 text-gray-900 shadow-sm ring-1 ring-amber-600"
                              : "bg-gray-50/60 border-gray-200 text-gray-700 hover:bg-gray-100/60"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-amber-600 text-white" : "bg-gray-200/80 text-gray-600"
                            }`}
                          >
                            <IconComp size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate leading-tight">{opt.label}</div>
                            <div className="text-[10.5px] text-gray-500 mt-0.5 leading-tight">{opt.sub}</div>
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Justification Statement */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-700">
                    {t("Justification Statement", lang)} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("Briefly describe your current situation. It helps our administrators review and approve your application.", lang)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all resize-none"
                    style={{ minHeight: "85px" }}
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                    <span>{lang === "so" ? "100% waa qarsoodi lagana ilaalinayo cid kale." : "100% private and treated with strict clinical confidentiality."}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs md:text-sm hover:bg-gray-100 transition-colors"
                >
                  {t("Cancel", lang)}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason.trim() || !nameInput.trim() || !emailInput.trim()}
                  className="flex-1 py-3 px-6 rounded-full bg-[#18221E] text-white font-bold text-xs md:text-sm hover:bg-black active:scale-[0.99] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>{lang === "so" ? "Waa la gudbinayaa..." : "Submitting..."}</span>
                  ) : (
                    <>
                      <span>{t("Submit Application", lang)}</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}
