/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CalendarDays, Video, MessageCircle, Star, Clock } from "lucide-react";
import { Therapist, Booking, ClientProfile } from "../../types";
import { colors } from "../../constants";
import { fmtDate } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import EmptyState from "../ui/EmptyState";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import CategoryBadge from "../ui/CategoryBadge";
import Button from "../ui/Button";

interface SessionsScreenProps {
  bookings: Booking[];
  therapists: Therapist[];
  clientProfile?: ClientProfile;
  onMessage: (therapistId: string) => void;
  onRateSession?: (bookingId: string, rating: number, review: string) => void;
  onBack: () => void;
  lang?: Language;
  onJoinSession?: (booking: Booking) => void;
}

export default function SessionsScreen({
  bookings,
  therapists,
  clientProfile,
  onMessage,
  onRateSession,
  onBack,
  lang = "en",
  onJoinSession,
}: SessionsScreenProps) {
  const upcoming = bookings
    .filter((b) => b.status === "upcoming" || b.status === "pending_financial_aid")
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = bookings.filter((b) => b.status !== "upcoming" && b.status !== "pending_financial_aid");

  const [ratingBookingId, setRatingBookingId] = React.useState<string | null>(null);
  const [stars, setStars] = React.useState<number>(5);
  const [reviewText, setReviewText] = React.useState<string>("");
  const [syncedIds, setSyncedIds] = React.useState<string[]>([]);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

  const [customRoomId, setCustomRoomId] = React.useState<string>("");

  function submitReview(bookingId: string) {
    if (onRateSession) {
      onRateSession(bookingId, stars, reviewText);
    }
    setRatingBookingId(null);
    setReviewText("");
    setStars(5);
  }

  function handleStartInstantRoom(roomIdOverride?: string) {
    if (!onJoinSession) return;
    const finalRoomId = roomIdOverride || customRoomId.trim() || `BARBAAR-ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
    const instantBooking: Booking = {
      id: finalRoomId,
      therapistId: therapists[0]?.id || "therapist_dr_layla",
      clientName: clientProfile?.name || "Somali Community Client",
      clientEmail: clientProfile?.email || "user@barbaar.org",
      clientPhone: clientProfile?.phone || "+1 (555) 019-2834",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category: "cbt",
      notes: "Instant video consultation room session",
      amount: 0,
      paymentStatus: "paid",
      status: "upcoming"
    };
    onJoinSession(instantBooking);
  }

  return (
    <div>
      <TopBar title={t("Your sessions", lang)} onBack={onBack} />
      <div style={{ padding: "18px 20px" }}>
        {/* Instant Consultation Room Banner */}
        <div 
          className="p-5 md:p-6 rounded-2xl border mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm"
          style={{ background: colors.indigoSoft, borderColor: `${colors.indigo}30` }}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
              <Video size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg text-slate-900">
                {t("Instant Video Consultation", lang)}
              </h3>
              <p className="text-xs md:text-sm text-slate-600">
                {t("Start a live video session immediately or enter a room code.", lang)}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter Room Code (e.g. BARBAAR-101)"
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border text-xs md:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-56"
              />
              {customRoomId.trim() && (
                <button
                  onClick={() => handleStartInstantRoom(customRoomId.trim())}
                  className="px-4 py-2.5 rounded-xl text-white font-semibold text-xs md:text-sm bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm whitespace-nowrap"
                >
                  Join Code
                </button>
              )}
            </div>
            <button
              onClick={() => handleStartInstantRoom()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-semibold text-xs md:text-sm bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Video size={16} /> {t("Start Instant Room", lang)}
            </button>
          </div>
        </div>

        {upcoming.length === 0 && (
          <EmptyState
            icon={CalendarDays}
            title={t("No upcoming sessions", lang)}
            sub={t("Once you book a therapist, your sessions will show up here.", lang)}
          />
        )}

        {/* Upcoming list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {upcoming.map((b) => {
            const therapistObj = therapists.find((x) => x.id === b.therapistId);
            if (!therapistObj) return null;

            const isSynced = syncedIds.includes(b.id);
            const isSyncing = syncingId === b.id;

            return (
              <div
                key={b.id}
                className="flex flex-col gap-5 p-6 md:p-8 rounded-2xl border transition-all duration-300 shadow-sm relative overflow-hidden"
                style={{
                  background: colors.paper,
                  borderColor: b.rescheduledByTherapist ? colors.amber : colors.line,
                }}
              >
                {/* Visual Category Left-Accent Bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{
                    background: b.category === "cbt" ? colors.acacia : b.category === "couples" ? colors.clay : colors.amber,
                  }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar therapist={therapistObj} size={50} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-base md:text-lg tracking-tight" style={{ color: colors.ink }}>
                        {therapistObj.name}
                      </h3>
                      <p className="text-xs md:text-sm mt-1" style={{ color: colors.inkSoft }}>
                        {fmtDate(b.date)} <span className="opacity-40">·</span> <span className="font-medium" style={{ color: colors.indigo }}>{b.time}</span>
                      </p>
                    </div>
                  </div>
                  <div className="self-start sm:self-auto flex items-center gap-2">
                    <CategoryBadge cat={b.category} />
                    <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md border" style={{ color: colors.inkSoft, borderColor: `${colors.line}80` }}>
                      ID: {b.id.substring(0, 6).toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Rescheduled Notice Banner */}
                {b.rescheduledByTherapist && (
                  <div
                    className="pop-in p-4 rounded-xl flex flex-col gap-1.5 border"
                    style={{
                      background: `${colors.amberSoft}25`,
                      borderColor: `${colors.amber}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider" style={{ color: colors.amber }}>
                      <CalendarDays size={14} /> {t("Rescheduled by Specialist", lang)}
                    </div>
                    <div className="text-xs leading-relaxed italic" style={{ color: colors.ink }}>
                      "{b.rescheduleReason}"
                    </div>
                    {b.originalDate && b.originalTime && (
                      <div className="text-[10px] mt-1 line-through" style={{ color: colors.inkSoft }}>
                        {t("Original", lang)}: {fmtDate(b.originalDate)} {t("at", lang)} {b.originalTime}
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Reminders / Calendar Sync Box */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border"
                  style={{
                    background: isSynced ? `${colors.acacia}06` : `${colors.indigoSoft}15`,
                    borderColor: isSynced ? `${colors.acacia}25` : `${colors.line}40`,
                  }}
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                      style={{
                        background: isSynced ? colors.acacia : colors.indigo,
                      }}
                    >
                      <Clock size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: isSynced ? colors.acacia : colors.ink }}>
                        {isSynced ? t("Mobile & Gmail Synced", lang) : t("Get Mobile/Gmail Reminders", lang)}
                      </h4>
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: isSynced ? colors.inkSoft : colors.inkSoft }}>
                        {isSynced ? t("Google Calendar and SMS alerts activated.", lang) : t("Notify me 1 hr before session.", lang)}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isSynced || isSyncing}
                    onClick={() => {
                      setSyncingId(b.id);
                      setTimeout(() => {
                        setSyncedIds([...syncedIds, b.id]);
                        setSyncingId(null);
                      }, 1000);
                    }}
                    style={{
                      background: isSynced ? "transparent" : colors.indigo,
                      color: isSynced ? colors.acacia : "#fff",
                      border: isSynced ? `1px solid ${colors.acacia}30` : "none",
                    }}
                    className="self-start sm:self-auto flex-shrink-0 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer hover:opacity-95 active:scale-95 transition-all duration-150"
                  >
                    {isSyncing ? t("Syncing...", lang) : isSynced ? `✓ ${t("Active", lang)}` : t("Activate", lang)}
                  </button>
                </div>

                <div className="flex gap-3 mt-1">
                  <div className="flex-1">
                    {b.status === "pending_financial_aid" ? (
                      <Button
                        full
                        variant="ghost"
                        disabled
                        icon={Clock}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          background: `${colors.amberSoft}25`,
                          color: colors.amber,
                          border: `1px solid ${colors.amber}30`,
                        }}
                      >
                        {lang === "so" ? "Sugaya Ogolaansha Maamulka" : "Pending Admin Approval"}
                      </Button>
                    ) : (
                      <Button
                        full
                        variant="amber"
                        icon={Video}
                        onClick={() => {
                          if (onJoinSession) {
                            onJoinSession(b);
                          }
                        }}
                        style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}
                      >
                        {t("Join session", lang)}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    icon={MessageCircle}
                    onClick={() => onMessage(therapistObj.id)}
                    style={{ padding: 13, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    {""}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Past list */}
        {past.length > 0 && (
          <div style={{ marginTop: 26 }}>
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
              {t("Past Sessions", lang)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {past.map((b) => {
                const therapistObj = therapists.find((x) => x.id === b.therapistId);
                if (!therapistObj) return null;

                const hasReviewed = typeof b.rating === "number";
                const isFormOpen = ratingBookingId === b.id;

                return (
                  <Card
                    key={b.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      padding: 16,
                      background: "#fff",
                      border: `1px solid ${colors.line}40`,
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar therapist={therapistObj} size={40} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "14px", color: colors.ink }}>
                            {therapistObj.name}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.inkSoft }}>
                            {fmtDate(b.date)} · {t("Completed", lang)}
                          </div>
                        </div>
                      </div>

                      {!hasReviewed && !isFormOpen && (
                        <div className="self-start sm:self-auto">
                          <Button
                            variant="subtle"
                            style={{ height: 32, fontSize: "12px", padding: "0 12px" }}
                            onClick={() => {
                              setRatingBookingId(b.id);
                              setStars(5);
                              setReviewText("");
                            }}
                          >
                            {t("Rate Session", lang)}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Already Reviewed View */}
                    {hasReviewed && (
                      <div
                        style={{
                          background: colors.indigoSoft,
                          borderRadius: 12,
                          padding: 10,
                          fontSize: "12.5px",
                          border: `1px solid ${colors.line}30`,
                        }}
                      >
                        <div style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={12}
                              color={colors.amber}
                              fill={star <= (b.rating || 0) ? colors.amber : "none"}
                            />
                          ))}
                          <span style={{ fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginLeft: 4 }}>
                            {t("Reviewed", lang)}
                          </span>
                        </div>
                        {b.review ? (
                          <div style={{ fontStyle: "italic", color: colors.ink, lineHeight: 1.4 }}>
                            "{b.review}"
                          </div>
                        ) : (
                          <div style={{ color: colors.inkSoft, fontStyle: "italic" }}>
                            {t("No text comment left.", lang)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Review Form */}
                    {isFormOpen && (
                      <div
                        className="fade-up"
                        style={{
                          background: colors.indigoSoft + "20",
                          borderRadius: 14,
                          padding: 14,
                          border: `1px solid ${colors.indigo}30`,
                          marginTop: 4,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "13px", color: colors.indigo, marginBottom: 8 }}>
                          {t("Rate your experience", lang)}
                        </div>

                        {/* Interactive Stars */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isFilled = star <= stars;
                            return (
                              <button
                                key={star}
                                onClick={() => setStars(star)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  outline: "none",
                                }}
                                className="hover:scale-110 active:scale-95 transition-transform"
                              >
                                <Star
                                  size={24}
                                  color={colors.amber}
                                  fill={isFilled ? colors.amber : "none"}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback Textarea */}
                        <textarea
                          placeholder={t("How did this session help you? Leave a brief review...", lang)}
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          rows={2}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: `1.5px solid ${colors.line}`,
                            fontSize: "13px",
                            outline: "none",
                            resize: "none",
                            background: "#fff",
                            marginBottom: 10,
                            lineHeight: 1.4,
                          }}
                        />

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <Button
                            variant="ghost"
                            onClick={() => setRatingBookingId(null)}
                          >
                            {t("Cancel", lang)}
                          </Button>
                          <Button
                            variant="amber"
                            onClick={() => submitReview(b.id)}
                          >
                            {t("Submit Feedback", lang)}
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
