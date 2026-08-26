/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CalendarDays,
  Video,
  MessageCircle,
  Star,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Bell,
  BellRing,
  Share2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { Therapist, Booking } from "../../types";
import { colors } from "../../constants";
import { fmtDate } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import EmptyState from "../ui/EmptyState";
import Avatar from "../ui/Avatar";
import CategoryBadge from "../ui/CategoryBadge";
import { motion, AnimatePresence } from "motion/react";

interface SessionsScreenProps {
  bookings: Booking[];
  therapists: Therapist[];
  onMessage: (therapistId: string) => void;
  onRateSession?: (bookingId: string, rating: number, review: string) => void;
  onBack: () => void;
  lang?: Language;
  onJoinSession?: (booking: Booking) => void;
  onBrowse?: () => void;
}

export default function SessionsScreen({
  bookings,
  therapists,
  onMessage,
  onRateSession,
  onBack,
  lang = "en",
  onJoinSession,
  onBrowse,
}: SessionsScreenProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [stars, setStars] = useState<number>(5);
  const [hoverStars, setHoverStars] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>("");
  const [syncedIds, setSyncedIds] = useState<string[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const upcoming = bookings
    .filter((b) => b.status === "upcoming" || b.status === "pending_financial_aid")
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = bookings.filter(
    (b) => b.status !== "upcoming" && b.status !== "pending_financial_aid"
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleToggleReminder = (bookingId: string) => {
    if (syncedIds.includes(bookingId)) {
      setSyncedIds(syncedIds.filter((id) => id !== bookingId));
      showToast(t("Reminders deactivated for this session", lang));
    } else {
      setSyncingId(bookingId);
      setTimeout(() => {
        setSyncedIds([...syncedIds, bookingId]);
        setSyncingId(null);
        showToast(t("Google Calendar & SMS reminder activated (1 hr before)", lang));
      }, 600);
    }
  };

  function submitReview(bookingId: string) {
    if (onRateSession) {
      onRateSession(bookingId, stars, reviewText);
      showToast(t("Thank you! Your review has been submitted.", lang));
    }
    setRatingBookingId(null);
    setReviewText("");
    setStars(5);
  }

  // Calculate relative date badge (e.g. "Today", "Tomorrow", "In 3 days")
  const getRelativeDay = (dateStr: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return { label: t("Today", lang), isToday: true };
      if (diffDays === 1) return { label: t("Tomorrow", lang), isToday: false };
      if (diffDays > 1 && diffDays <= 7) return { label: `${t("In", lang)} ${diffDays} ${t("days", lang)}`, isToday: false };
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA]" style={{ paddingBottom: 80 }}>
      <TopBar title={t("Your sessions", lang)} onBack={onBack} />

      {/* Floating Toast Feedback */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#18221E] text-white text-xs font-semibold shadow-xl flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {/* Navigation / Filter Tabs */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-200/70">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("upcoming")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "upcoming"
                  ? "bg-[#18221E] text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
              }`}
            >
              <CalendarDays size={15} />
              <span>{t("Upcoming", lang)}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
                }`}
              >
                {upcoming.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === "past"
                  ? "bg-[#18221E] text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80"
              }`}
            >
              <Clock size={15} />
              <span>{t("Past Sessions", lang)}</span>
              {past.length > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === "past" ? "bg-white/20 text-white" : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {past.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>{t("HIPAA & Cultural Privacy Protected", lang)}</span>
          </div>
        </div>

        {/* Tab 1: Upcoming Sessions */}
        {activeTab === "upcoming" && (
          <div>
            {upcoming.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 text-center shadow-xs flex flex-col items-center my-2">
                <div className="w-16 h-16 rounded-2xl bg-[#284136]/10 text-[#284136] flex items-center justify-center mb-4">
                  <CalendarDays size={32} />
                </div>
                
                <h3 className="font-display font-bold text-lg sm:text-xl text-stone-900 tracking-tight mb-2">
                  {lang === "so"
                    ? "Ma Jiraan Kulammo Soo Socda"
                    : "No Scheduled Sessions Yet"}
                </h3>
                
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed mb-6 font-medium">
                  {lang === "so"
                    ? "Ku xirnow dhakhtar cilmi-nafsi ama la-taliye khibrad leh oo ku hadla afkaaga. Qabso kulankaaga koowaad si fudud."
                    : "Connect with a licensed Somali-speaking counselor or clinical psychologist in minutes. Available online worldwide with secure HD video."}
                </p>

                {/* 3 Value Pillars */}
                <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left mb-7">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {lang === "so" ? "Qarsoodi 100%" : "Private & Secure"}
                      </div>
                      <div className="text-[10.5px] text-stone-500">
                        {lang === "so" ? "Xogtaadu waa aamin" : "Encrypted video & chat"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {lang === "so" ? "Afkaaga Hooyo" : "Cultural Match"}
                      </div>
                      <div className="text-[10.5px] text-stone-500">
                        {lang === "so" ? "Somali & English" : "Somali & English fluent"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {lang === "so" ? "Gargaar 40%" : "Relief Available"}
                      </div>
                      <div className="text-[10.5px] text-stone-500">
                        {lang === "so" ? "Qiimo dhimis daryeel" : "40% discount program"}
                      </div>
                    </div>
                  </div>
                </div>

                {onBrowse && (
                  <button
                    type="button"
                    onClick={onBrowse}
                    className="px-6 py-3 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                  >
                    <Calendar size={16} className="text-emerald-400" />
                    <span>{lang === "so" ? "Raadso Dhakhtar & Qabso Ballan" : "Find & Book a Therapist"}</span>
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:gap-5">
                {upcoming.map((b) => {
                  const therapistObj = therapists.find((x) => x.id === b.therapistId);
                  if (!therapistObj) return null;

                  const isSynced = syncedIds.includes(b.id);
                  const isSyncing = syncingId === b.id;
                  const relDay = getRelativeDay(b.date);
                  const isAidPending = b.status === "pending_financial_aid";

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col"
                    >
                      {/* Top Accent Strip based on status */}
                      <div
                        className={`h-1.5 w-full ${
                          isAidPending
                            ? "bg-amber-400"
                            : b.rescheduledByTherapist
                            ? "bg-sky-500"
                            : "bg-[#284136]"
                        }`}
                      />

                      <div className="p-5 sm:p-6 flex flex-col gap-4">
                        {/* 1. Header: Specialist Profile & Session Type */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative">
                              <Avatar therapist={therapistObj} size={48} />
                              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-display font-bold text-base sm:text-lg text-stone-900 tracking-tight truncate">
                                  {therapistObj.name}
                                </h3>
                              </div>
                              <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                                {therapistObj.credentials || t("Licensed Specialist", lang)} · {therapistObj.languages?.join(", ") || "Somali, English"}
                              </p>
                            </div>
                          </div>

                          {/* Badges Right */}
                          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                            {relDay && (
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                                  relDay.isToday
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                                    : "bg-stone-100 text-stone-700 border border-stone-200/60"
                                }`}
                              >
                                {relDay.label}
                              </span>
                            )}
                            <CategoryBadge cat={b.category} size="sm" />
                          </div>
                        </div>

                        {/* 2. Structured Logistics Bar (Minimalist & High Contrast) */}
                        <div className="bg-stone-50/90 rounded-xl p-3.5 sm:p-4 border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-[13px] text-stone-800">
                            {/* Date & Time */}
                            <div className="flex items-center gap-2 font-semibold">
                              <Calendar size={15} className="text-[#284136] flex-shrink-0" />
                              <span>{fmtDate(b.date)}</span>
                            </div>

                            <span className="text-stone-300 hidden sm:inline">|</span>

                            <div className="flex items-center gap-1.5 font-bold text-[#284136]">
                              <Clock size={15} className="text-[#284136] flex-shrink-0" />
                              <span>{b.time}</span>
                              <span className="text-[11px] font-normal text-stone-500">(50 min)</span>
                            </div>

                            <span className="text-stone-300 hidden sm:inline">|</span>

                            <div className="flex items-center gap-1.5 text-stone-600 font-medium">
                              <Video size={14} className="text-stone-500" />
                              <span>{t("HD Video Room", lang)}</span>
                            </div>
                          </div>

                          {/* Quick Reminder / Calendar Sync Chip */}
                          <button
                            type="button"
                            onClick={() => handleToggleReminder(b.id)}
                            disabled={isSyncing}
                            className={`self-start sm:self-auto px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                              isSynced
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-white text-stone-700 border border-stone-200/80 hover:bg-stone-50 hover:text-stone-900"
                            }`}
                          >
                            {isSyncing ? (
                              <Clock size={13} className="animate-spin text-stone-400" />
                            ) : isSynced ? (
                              <CheckCircle2 size={13} className="text-emerald-600" />
                            ) : (
                              <Bell size={13} className="text-stone-500" />
                            )}
                            <span>
                              {isSyncing
                                ? t("Syncing...", lang)
                                : isSynced
                                ? t("SMS/Calendar Active", lang)
                                : t("Set 1h Reminder", lang)}
                            </span>
                          </button>
                        </div>

                        {/* Rescheduled Notice Banner (Clean & Alert-styled) */}
                        {b.rescheduledByTherapist && (
                          <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-sky-950">
                            <CalendarDays size={16} className="text-sky-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sky-900">
                                {t("Specialist Updated Session Time", lang)}
                              </div>
                              <div className="mt-0.5 text-sky-800/90 leading-relaxed">
                                {b.rescheduleReason || t("Schedule adjusted to accommodate counseling workflow.", lang)}
                              </div>
                              {b.originalDate && b.originalTime && (
                                <div className="text-[11px] text-sky-600/80 mt-1 line-through">
                                  {t("Previously", lang)}: {fmtDate(b.originalDate)} {t("at", lang)} {b.originalTime}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Financial Aid Tag (if relief was applied) */}
                        {b.financialAidApplied && (
                          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-200/70 rounded-lg px-3 py-1.5 self-start">
                            <Percent size={13} className="text-emerald-600" />
                            <span>
                              {t("Community Relief 40% Applied", lang)}
                              {b.price && ` · $${b.price} ($${b.originalPrice || 25})`}
                            </span>
                          </div>
                        )}

                        {/* 3. Action Row */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
                          <div className="text-[11px] text-stone-400 font-mono">
                            REF #{b.id.substring(0, 8).toUpperCase()}
                          </div>

                          <div className="flex items-center gap-2.5">
                            {/* Chat button */}
                            <button
                              type="button"
                              onClick={() => onMessage(therapistObj.id)}
                              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-98"
                            >
                              <MessageCircle size={15} className="text-stone-600" />
                              <span>{t("Message", lang)}</span>
                            </button>

                            {/* Primary Join Button */}
                            {isAidPending ? (
                              <button
                                type="button"
                                disabled
                                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 opacity-90 cursor-not-allowed"
                              >
                                <Clock size={15} className="text-amber-600" />
                                <span>{lang === "so" ? "Sugaya Ogolaanshaha" : "Pending Aid Review"}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onJoinSession && onJoinSession(b)}
                                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
                              >
                                <Video size={16} className="text-emerald-400" />
                                <span>{t("Join Session", lang)}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Past Sessions & Reviews */}
        {activeTab === "past" && (
          <div>
            {past.length === 0 ? (
              <div className="py-12 bg-white rounded-2xl border border-stone-200/70 p-8 text-center shadow-xs">
                <EmptyState
                  icon={Clock}
                  title={t("No past sessions yet", lang)}
                  sub={t("Completed counseling consultations and feedback will appear in this history tab.", lang)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {past.map((b) => {
                  const therapistObj = therapists.find((x) => x.id === b.therapistId);
                  if (!therapistObj) return null;

                  const hasReviewed = typeof b.rating === "number";
                  const isFormOpen = ratingBookingId === b.id;

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <Avatar therapist={therapistObj} size={42} />
                          <div>
                            <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                              {therapistObj.name}
                            </h4>
                            <div className="text-xs text-stone-500 font-medium flex items-center gap-2 mt-0.5">
                              <span>{fmtDate(b.date)} · {b.time}</span>
                              <span className="text-stone-300">·</span>
                              <span className="text-emerald-700 font-semibold">{t("Completed", lang)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <CategoryBadge cat={b.category} size="sm" />
                          {!hasReviewed && !isFormOpen && (
                            <button
                              type="button"
                              onClick={() => {
                                setRatingBookingId(b.id);
                                setStars(5);
                                setReviewText("");
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                              <Star size={13} className="text-amber-500 fill-amber-500" />
                              <span>{t("Rate Session", lang)}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display Reviewed Feedback */}
                      {hasReviewed && (
                        <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200/60 text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={13}
                                className={s <= (b.rating || 0) ? "text-amber-400 fill-amber-400" : "text-stone-300"}
                              />
                            ))}
                            <span className="text-[11px] font-bold text-stone-600 ml-1.5">
                              {t("Your Feedback", lang)}
                            </span>
                          </div>
                          {b.review ? (
                            <p className="text-stone-700 italic mt-1 leading-relaxed">
                              "{b.review}"
                            </p>
                          ) : (
                            <p className="text-stone-400 italic mt-0.5">
                              {t("Rating submitted without comments.", lang)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Inline Rating Form */}
                      {isFormOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="bg-amber-50/40 border border-amber-200/60 rounded-xl p-4 flex flex-col gap-3"
                        >
                          <div className="text-xs font-bold text-stone-900">
                            {t("How was your consultation with", lang)} {therapistObj.name}?
                          </div>

                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setStars(star)}
                                onMouseEnter={() => setHoverStars(star)}
                                onMouseLeave={() => setHoverStars(null)}
                                className="p-1 transition-transform hover:scale-115 cursor-pointer"
                              >
                                <Star
                                  size={24}
                                  className={
                                    star <= (hoverStars || stars)
                                      ? "text-amber-500 fill-amber-500"
                                      : "text-stone-300"
                                  }
                                />
                              </button>
                            ))}
                          </div>

                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder={t("Share your confidential feedback or how this session helped you...", lang)}
                            rows={2}
                            className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
                          />

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setRatingBookingId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-200/60"
                            >
                              {t("Cancel", lang)}
                            </button>
                            <button
                              type="button"
                              onClick={() => submitReview(b.id)}
                              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#18221E] text-white hover:bg-black transition-all"
                            >
                              {t("Submit Review", lang)}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

