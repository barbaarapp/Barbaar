/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronRight, Sparkles, User as UserIcon, Heart, TrendingUp, Award, ShieldCheck, HelpCircle, Check } from "lucide-react";
import { Therapist, Booking, ClientProfile } from "../../types";
import { colors, CATEGORIES } from "../../constants";
import { fmtDate, timeOfDayGreeting } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import Wordmark from "../ui/Wordmark";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import GrowthArc from "../ui/GrowthArc";
import { TherapistCard } from "./TherapistCard";
import { motion } from "motion/react";
import FinancialAidBanner from "./FinancialAidBanner";

interface ClientHomeProps {
  clientProfile: ClientProfile;
  bookings: Booking[];
  therapists: Therapist[];
  onStartQuiz: () => void;
  onBrowse: () => void;
  onOpenSession: () => void;
  onOpenProfile: (id: string) => void;
  onOpenProfileTab: () => void;
  onOpenLegalPage: (type: "about" | "terms" | "privacy") => void;
  setClientProfile?: (profile: ClientProfile) => void;
  visitCount?: number;
  viewedTherapistCount?: number;
}

export default function ClientHome({
  clientProfile,
  bookings,
  therapists,
  onStartQuiz,
  onBrowse,
  onOpenSession,
  onOpenProfile,
  onOpenProfileTab,
  onOpenLegalPage,
  setClientProfile,
  visitCount = 1,
  viewedTherapistCount = 0,
}: ClientHomeProps) {
  const lang: Language = clientProfile.language || "en";
  // Find the first upcoming session sorted by date
  const upcoming = bookings
    .filter((b) => b.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const upcomingTherapist = upcoming
    ? therapists.find((t) => t.id === upcoming.therapistId)
    : null;

  const activeTherapists = therapists.filter((t) => t.active);

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Header Bar - visible only on mobile/tablet since desktop has a premium top nav header */}
      <div
        className="md:hidden"
        style={{
          padding: "20px 20px 6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Wordmark size={17} />
        {/* Profile Avatar Button top-right linking to Profile tab */}
        <button
          onClick={onOpenProfileTab}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: colors.indigoSoft,
            border: `1.5px solid ${colors.indigo}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            color: colors.indigo,
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          className="hover:scale-[1.05] active:scale-[0.95]"
        >
          {clientProfile.name ? clientProfile.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
        </button>
      </div>

      {/* Hero Header Area: Greeting & Main Quiz Match Banner */}
      <div className="w-full bg-transparent">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Greeting */}
          <div className="fade-up md:col-span-5" style={{ padding: "0" }}>
            <div
              className="font-display"
              style={{
                fontSize: 32,
                fontWeight: 600,
                color: colors.ink,
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
              }}
            >
              {t(timeOfDayGreeting(), lang)}
              {clientProfile.name ? `, ${clientProfile.name.split(" ")[0]}` : ""}.
            </div>
            <div style={{ fontSize: 16, color: colors.inkSoft, marginTop: 8, fontWeight: 500 }}>
              {t("How are you feeling today?", lang)}
            </div>
          </div>

          {/* Quiz Match Banner (Dominant Hero with Gradient & Glow) */}
          <div className="fade-up md:col-span-7 w-full" style={{ padding: "0" }}>
            <motion.div
              onClick={onStartQuiz}
              whileHover={{ scale: 1.012, boxShadow: "0 15px 35px -5px rgba(56, 76, 67, 0.25), inset 0 1px 1px rgba(255,255,255,0.15)" }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{
                background: `linear-gradient(135deg, ${colors.indigo} 0%, ${colors.indigoDeep} 100%)`,
                borderRadius: 24,
                padding: "28px 24px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 30px -5px rgba(56, 76, 67, 0.18), inset 0 1px 1px rgba(255,255,255,0.1)",
              }}
            >
              {/* Radial Glow Effect using Cagaar (fresh wellness green) */}
              <div
                style={{
                  position: "absolute",
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(100, 164, 97, 0.28) 0%, rgba(100, 164, 97, 0) 70%)",
                  right: -30,
                  top: -30,
                  filter: "blur(20px)",
                  pointerEvents: "none",
                }}
              />
              
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <GrowthArc
                  value={100}
                  size={58}
                  stroke={4}
                  color={colors.acacia}
                  track="rgba(255,255,255,0.12)"
                >
                  <Sparkles size={22} color={colors.acacia} />
                </GrowthArc>
                <div style={{ flex: 1 }}>
                  <div
                    className="font-display"
                    style={{
                      color: "#fff",
                      fontSize: "22px",
                      fontWeight: 600,
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {t("Find your perfect match", lang)}
                  </div>
                  <div style={{ color: "rgba(255, 255, 255, 0.82)", fontSize: "13.5px", marginTop: 5, lineHeight: 1.35 }}>
                    {t("Take our 1-minute cultural match quiz to find the right care for you.", lang)}
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: colors.acacia,
                      color: "#fff",
                      padding: "10px 18px",
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: 13,
                      boxShadow: "0 4px 12px rgba(100,164,97,0.25)",
                    }}
                  >
                    {t("Get Started", lang)} <ChevronRight size={14} />
                  </div>

                  {/* Minimalist assurance link */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLegalPage("privacy");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 8,
                      color: "rgba(255, 255, 255, 0.75)",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      transition: "color 0.15s ease",
                    }}
                    className="hover:text-white"
                  >
                    <span>{lang === "so" ? "Qaanuunka Khaasnimada" : "Privacy Policy"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {setClientProfile && (
        <FinancialAidBanner
          clientProfile={clientProfile}
          setClientProfile={setClientProfile}
          lang={lang}
          variant="home"
          visitCount={visitCount}
          viewedTherapistCount={viewedTherapistCount}
        />
      )}

      {/* Focus categories (slim de-emphasized row of chips, centered horizontally) */}
      <div className="w-full border-y border-gray-100" style={{ background: `${colors.paper}50` }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: colors.inkSoft,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {t("Or browse by focus", lang)}
            </div>
            <button
              onClick={onBrowse}
              style={{
                background: "none",
                border: "none",
                color: colors.indigo,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
              className="active:opacity-75"
            >
              {t("See all", lang)}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            className="no-scrollbar -mx-4 px-4 pb-4 md:mx-0 md:px-0"
          >
            {Object.values(CATEGORIES).map((c) => (
              <motion.button
                key={c.key}
                onClick={onBrowse}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: c.soft,
                  color: colors.ink,
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                }}
              >
                <c.icon size={14} color={c.color} />
                <span>{t(c.name, lang)}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Next session section (conditional next-session card) */}
      {upcoming && upcomingTherapist && (
        <div className="w-full bg-transparent">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: colors.inkSoft,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 10,
              }}
            >
              {t("Your next session", lang)}
            </div>
            <motion.div
              onClick={onOpenSession}
              whileHover={{ scale: 1.015, y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(0,0,0,0.03)",
                border: `1px solid ${colors.line}40`,
                maxWidth: "480px",
              }}
            >
              <Avatar therapist={upcomingTherapist} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: colors.ink }}>
                  {upcomingTherapist.name}
                </div>
                <div style={{ fontSize: 13, color: colors.inkSoft, marginTop: 2 }}>
                  {fmtDate(upcoming.date)} · {upcoming.time}
                </div>
              </div>
              <div
                style={{
                  background: colors.indigoSoft,
                  color: colors.indigo,
                  padding: "6px 12px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                {t("View", lang)}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Meet our therapists (horizontal scroll carousel on mobile, flex-wrap on desktop) */}
      <div className="w-full bg-transparent">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 16,
            }}
          >
            {t("Meet our therapists", lang)}
          </div>
          <div
            className="flex gap-6 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: 28,
              paddingTop: 8,
            }}
          >
            {activeTherapists.map((th) => (
              <TherapistCard key={th.id} t={th} onClick={() => onOpenProfile(th.id)} lang={lang} />
            ))}
          </div>
        </div>
      </div>

      {/* Impact & Experience Statistics Section (Seamless responsive rows) */}
      <div className="w-full" style={{ background: `${colors.paper}30` }}>
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div 
            className="fade-up flex flex-row items-center justify-around gap-2 text-center" 
            style={{ padding: "32px 12px" }}
          >
            {/* Stat 1: 85% Recovery */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div 
                className="font-display font-extrabold text-2xl md:text-3xl"
                style={{ color: colors.acacia, letterSpacing: "-0.5px" }}
              >
                85%
              </div>
              <div className="font-bold text-[11px] md:text-[13px] tracking-tight mt-1" style={{ color: colors.ink }}>
                {lang === "so" ? "Heerka Bogsashada" : "Recovery Rate"}
              </div>
              <div className="text-[9.5px] md:text-[11px] opacity-80 mt-0.5 leading-tight" style={{ color: colors.inkSoft }}>
                {lang === "so" ? "Kulamada hore" : "In first sessions"}
              </div>
            </div>

            {/* Minimalist vertical divider line */}
            <div style={{ width: "1px", height: "45px", background: `${colors.line}60` }} />

            {/* Stat 2: 4+ Years Experience */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <div 
                className="font-display font-extrabold text-2xl md:text-3xl"
                style={{ color: colors.amber, letterSpacing: "-0.5px" }}
              >
                4+ Years
              </div>
              <div className="font-bold text-[11px] md:text-[13px] tracking-tight mt-1" style={{ color: colors.ink }}>
                {lang === "so" ? "Khibrad la Hubiyay" : "Trusted Experience"}
              </div>
              <div className="text-[9.5px] md:text-[11px] opacity-80 mt-0.5 leading-tight" style={{ color: colors.inkSoft }}>
                {lang === "so" ? "Heer xirfadnimo" : "In clinical practice"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mental Health Education & Support Section (Desktop side-by-side split, Mobile single column) */}
      <div className="w-full bg-transparent border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          <div className="md:col-span-6">
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: colors.inkSoft,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Sparkles size={14} color={colors.acacia} className="animate-pulse" />
              <span>{t("Why we need a therapist", lang)}</span>
            </div>

            {/* Seamless frameless design with vertical brand accent line */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ borderLeft: `3px solid ${colors.acacia}`, paddingLeft: "16px", marginBottom: "16px" }}>
                <h4
                  className="font-display"
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: colors.indigo,
                    margin: "0 0 6px 0",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {t("Why Therapy Matters", lang)}
                </h4>
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: colors.inkSoft,
                  lineHeight: 1.6,
                  margin: "0 0 16px 0",
                  fontWeight: 500,
                  paddingLeft: "16px",
                }}
              >
                {t("Mental health is the foundation of our daily life, relationships, and decisions. Just as we care for our physical health, seeking guidance from a certified therapist helps us navigate stress, unpack emotional blockages, and build resilient mental habits in a confidential, supportive space.", lang)}
              </p>
            </div>
          </div>

          <div className="md:col-span-6 w-full md:pt-8">
            {/* Value Pillars Frameless List */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Pillar 1 */}
              <div
                style={{
                  paddingBottom: "16px",
                  borderBottom: `1px solid ${colors.line}40`,
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: `${colors.amber}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={15} color={colors.amber} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink }}>
                    {t("Navigate Stress", lang)}
                  </div>
                  <div style={{ fontSize: "12.5px", color: colors.inkSoft, marginTop: "4px", lineHeight: 1.5 }}>
                    {t("Decompress and unpack heavy thoughts safely.", lang)}
                  </div>
                </div>
              </div>

              {/* Pillar 2 */}
              <div
                style={{
                  paddingBottom: "16px",
                  borderBottom: `1px solid ${colors.line}40`,
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: `${colors.acacia}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <TrendingUp size={15} color={colors.acacia} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink }}>
                    {t("Build Habits", lang)}
                  </div>
                  <div style={{ fontSize: "12.5px", color: colors.inkSoft, marginTop: "4px", lineHeight: 1.5 }}>
                    {t("Develop practical, resilient daily rituals.", lang)}
                  </div>
                </div>
              </div>

              {/* Pillar 3 */}
              <div
                style={{
                  paddingBottom: "8px",
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: `${colors.indigo}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={15} color={colors.indigo} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink }}>
                    {t("Safe Space", lang)}
                  </div>
                  <div style={{ fontSize: "12.5px", color: colors.inkSoft, marginTop: "4px", lineHeight: 1.5 }}>
                    {t("100% confidential and culturally aligned support.", lang)}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* How it Works Stepper */}
      <div className="w-full bg-transparent border-t border-gray-100 py-12">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <HelpCircle size={14} color={colors.indigo} />
            <span>{t("How Barbaar Works", lang)}</span>
          </div>

          {/* Seamless frameless container for Stepper */}
          <div
            style={{
              position: "relative",
              padding: "12px 0 24px",
            }}
          >
            <p
              className="font-display"
              style={{
                fontSize: 15,
                color: colors.indigo,
                fontWeight: 600,
                lineHeight: 1.6,
                marginTop: 0,
                marginBottom: 32,
                paddingLeft: "16px",
              }}
            >
              {t("Our platform is designed to be simple, fast, and secure. Connect with dedicated clinical specialists in 3 easy steps:", lang)}
            </p>

            {/* Stepper Steps with Connecting Line */}
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "32px", paddingLeft: "16px" }}>
              {/* The Connecting Line */}
              <div
                style={{
                  position: "absolute",
                  left: "33px",
                  top: "20px",
                  bottom: "20px",
                  width: "1.5px",
                  background: `linear-gradient(to bottom, ${colors.acacia} 0%, ${colors.indigo} 50%, ${colors.amber} 100%)`,
                  opacity: 0.3,
                  zIndex: 0,
                }}
              />

              {/* Step 1 */}
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ display: "flex", gap: "20px", alignItems: "flex-start", position: "relative", zIndex: 1 }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: colors.acacia,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${colors.acacia}30`,
                  }}
                >
                  1
                </div>
                <div style={{ flex: 1, paddingTop: "2px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: colors.ink, marginBottom: 4 }}>
                    {t("1. Match Instantly", lang)}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.inkSoft, lineHeight: 1.5 }}>
                    {t("Take our 1-minute cultural match quiz to find the right specialist.", lang)}
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ display: "flex", gap: "20px", alignItems: "flex-start", position: "relative", zIndex: 1 }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: colors.indigo,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${colors.indigo}30`,
                  }}
                >
                  2
                </div>
                <div style={{ flex: 1, paddingTop: "2px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: colors.indigo, marginBottom: 4 }}>
                    {t("2. Secure Booking", lang)}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.inkSoft, lineHeight: 1.5 }}>
                    {t("Choose a convenient time slot and book a confidential session.", lang)}
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                style={{ display: "flex", gap: "20px", alignItems: "flex-start", position: "relative", zIndex: 1 }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: colors.amber,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 13,
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${colors.amber}30`,
                  }}
                >
                  3
                </div>
                <div style={{ flex: 1, paddingTop: "2px" }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: colors.indigo, marginBottom: 4 }}>
                    {t("3. Start Healing", lang)}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.inkSoft, lineHeight: 1.5 }}>
                    {t("Engage in secure video sessions and start feeling better.", lang)}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Secure Badge Divider */}
            <div
              style={{
                marginTop: 36,
                padding: "14px 20px",
                background: `linear-gradient(90deg, ${colors.acaciaSoft} 0%, ${colors.indigoSoft}10 100%)`,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                justifyContent: "center",
                color: colors.indigo,
                marginLeft: "16px",
              }}
              className="shadow-sm"
            >
              <ShieldCheck size={18} color={colors.acacia} className="flex-shrink-0" />
              <span style={{ fontSize: "12.5px", fontWeight: 700, letterSpacing: "-0.1px", lineHeight: 1.4 }}>
                {t("Safe, Fast, and Confidential Care at Your Fingertips.", lang)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Call-To-Action Button for seamless conversion */}
      <div className="w-full bg-transparent py-12 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col items-center">
          <div className="fade-up animate-pulse-subtle w-full flex justify-center mb-8">
            <motion.button
              onClick={onStartQuiz}
              whileHover={{ scale: 1.02, boxShadow: `0 12px 28px ${colors.indigo}30` }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                width: "100%",
                maxWidth: "340px",
                background: colors.indigo,
                color: "#ffffff",
                border: "none",
                borderRadius: "14px",
                padding: "15px 24px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: `0 8px 24px ${colors.indigo}20`,
              }}
            >
              <Sparkles size={16} color={colors.amber} />
              <span>{lang === "so" ? "Hel Dhakhtarkaaga" : "Find Your Match"}</span>
              <ChevronRight size={16} />
            </motion.button>
          </div>

          {/* Minimalist shared links footer */}
          <div style={{
            width: "100%",
            padding: "24px 0 0",
            borderTop: `1px solid ${colors.line}30`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            opacity: 0.6,
            fontSize: "11px",
            fontWeight: 600,
            color: colors.inkSoft,
          }}>
            <button 
              onClick={() => onOpenLegalPage("about")} 
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "4px 8px" }}
              className="hover:underline"
            >
              {lang === "so" ? "Ku Saabsan" : "About Us"}
            </button>
            <span style={{ color: `${colors.line}60` }}>•</span>
            <button 
              onClick={() => onOpenLegalPage("terms")} 
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "4px 8px" }}
              className="hover:underline"
            >
              {lang === "so" ? "Shuruudaha" : "Terms"}
            </button>
            <span style={{ color: `${colors.line}60` }}>•</span>
            <button 
              onClick={() => onOpenLegalPage("privacy")} 
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: "4px 8px" }}
              className="hover:underline"
            >
              {lang === "so" ? "Khaasnimada" : "Privacy"}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
