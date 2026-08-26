/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import { 
  MessageCircle, 
  ChevronRight, 
  Video, 
  Send, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  Calendar,
  Clock,
  Sparkles,
  PhoneCall,
  CheckCheck,
  Info
} from "lucide-react";
import { Therapist, Message, Booking } from "../../types";
import { colors } from "../../constants";
import { loadKey } from "../../utils";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";
import { Language, translateText as t } from "../../utils/translations";

interface ChatScreenProps {
  therapists: Therapist[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  messages: Record<string, Message[]>;
  draft: string;
  setDraft: (text: string) => void;
  onSend: (therapistId: string, text: string) => void;
  onBack: () => void;
  bookings: Booking[];
  onJoinSession?: (booking: Booking) => void;
  onBrowse?: () => void;
  onBookTherapist?: (therapistId: string) => void;
  lang?: Language;
}

export default function ChatScreen({
  therapists,
  selectedId,
  setSelectedId,
  messages,
  draft,
  setDraft,
  onSend,
  onBack,
  bookings,
  onJoinSession,
  onBrowse,
  onBookTherapist,
  lang = "en",
}: ChatScreenProps) {
  const activeTherapist = therapists.find((t) => t.id === selectedId);
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxTab, setInboxTab] = useState<"all" | "unread">("all");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastReadTimes, setLastReadTimes] = useState<Record<string, string>>({});

  // Set of therapist IDs that this user has booked with
  const bookedTherapistIds = useMemo(() => {
    return new Set(bookings.map((b) => b.therapistId));
  }, [bookings]);

  // Load last read times from storage
  useEffect(() => {
    (async () => {
      const saved = await loadKey<Record<string, string>>("barbaar-last-read-times", {}, false);
      setLastReadTimes(saved);
    })();
  }, [selectedId]);

  // Auto scroll to bottom of chat thread smoothly
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedId]);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [draft]);

  // Format relative timestamps for inbox (e.g. "12m ago", "Yesterday")
  function formatRelativeTime(isoString?: string): string {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return t("Just now", lang);
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (yesterday.toDateString() === d.toDateString()) {
        return t("Yesterday", lang);
      }
      
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  // Format exact time for chat bubbles (e.g. "10:45 AM")
  function formatBubbleTime(isoString?: string): string {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return "";
    }
  }

  // Get date dividers text ("Today", "Yesterday", "Monday, July 13")
  function getDividerText(isoString: string): string {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return t("Today", lang);
      }
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return t("Yesterday", lang);
      }
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  // Filter threads for inbox - ONLY therapists the user has booked with
  const inboxThreads = useMemo(() => {
    const list = therapists.filter((t) => {
      // Must have at least one booking with this therapist
      const isBooked = bookedTherapistIds.has(t.id);
      if (!isBooked) return false;

      const thread = messages[t.id] || [];
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.credentials && t.credentials.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (inboxTab === "unread") {
        const lastMsg = thread[thread.length - 1];
        const isUnread =
          lastMsg &&
          lastMsg.from === "therapist" &&
          lastMsg.time > (lastReadTimes[t.id] || "0");
        return isUnread;
      }

      return true;
    });

    // Sort by latest message time
    return list.sort((a, b) => {
      const threadA = messages[a.id] || [];
      const threadB = messages[b.id] || [];
      const timeA = threadA[threadA.length - 1]?.time || "0";
      const timeB = threadB[threadB.length - 1]?.time || "0";
      return timeB.localeCompare(timeA);
    });
  }, [therapists, bookedTherapistIds, messages, searchQuery, inboxTab, lastReadTimes]);

  // Find active booking or consultation room for selected therapist
  const activeBooking = useMemo(() => {
    if (!selectedId) return null;
    return bookings.find((b) => b.therapistId === selectedId && b.status === "upcoming") || null;
  }, [bookings, selectedId]);

  // Check if active selected therapist is booked by client
  const isSelectedTherapistBooked = activeTherapist ? bookedTherapistIds.has(activeTherapist.id) : false;

  // ==========================================
  // VIEW 1: INBOX LIST (When no thread selected)
  // ==========================================
  if (!activeTherapist) {
    const hasAnyBookings = bookedTherapistIds.size > 0;

    return (
      <div className="w-full min-h-[calc(100dvh-64px)] bg-[#FAF8F5] flex flex-col items-center">
        <div className="w-full max-w-3xl px-4 py-5 md:py-8 flex flex-col gap-4">
          
          {/* Header & Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                {t("Direct Messages", lang)}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
                {t("Confidential, HIPAA-compliant communication with your care team.", lang)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>{t("Encrypted", lang)}</span>
            </div>
          </div>

          {/* Search & Filter Bar (Only show search if user has booked therapists) */}
          {hasAnyBookings && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder={t("Search conversations or doctors...", lang)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#284136]/20 focus:border-[#284136] transition-all shadow-2xs"
                />
              </div>
              
              <div className="flex items-center p-1 bg-stone-200/60 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setInboxTab("all")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inboxTab === "all"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {t("All Messages", lang)}
                </button>
                <button
                  type="button"
                  onClick={() => setInboxTab("unread")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    inboxTab === "unread"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {t("Unread", lang)}
                </button>
              </div>
            </div>
          )}

          {/* Inbox List */}
          <div className="flex flex-col gap-2 mt-2">
            {!hasAnyBookings ? (
              /* Enhanced Empty State for New Visitors with 0 bookings */
              <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-10 text-center shadow-xs flex flex-col items-center my-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 flex items-center justify-center mb-4">
                  <ShieldCheck size={32} className="text-emerald-700" />
                </div>
                
                <h3 className="font-display font-bold text-lg sm:text-xl text-stone-900 tracking-tight mb-2">
                  {lang === "so"
                    ? "Wadahadalka Tooska ah Wuxuu Furmayaa Ballanta Kadib"
                    : "Direct Chat Activates with Your Bookings"}
                </h3>
                
                <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed mb-6 font-medium">
                  {lang === "so"
                    ? "Si loo ilaaliyo xogtaada caafimaad iyo heerka xirfadeed ee adeegga, waxaad si toos ah ula sheekaysan kartaa oo kaliya dhakhaatiirta aad ballan la qabsatay."
                    : "To ensure clinical privacy and care quality, direct 1-on-1 messaging is enabled exclusively with therapists you have scheduled appointments with."}
                </p>

                {/* Value Pillars */}
                <div className="w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-3 text-left mb-7">
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {lang === "so" ? "Qarsoodi 100%" : "100% Confidential"}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {lang === "so" ? "Ilaalinta xogta bukaanka" : "HIPAA-compliant channels"}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {lang === "so" ? "Kulamada Tooska ah" : "Live Video Rooms"}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {lang === "so" ? "Isku xirka qolka kulanka" : "Direct room coordination"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action to find therapist */}
                {onBrowse && (
                  <button
                    type="button"
                    onClick={onBrowse}
                    className="px-6 py-3 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
                  >
                    <Calendar size={16} className="text-emerald-400" />
                    <span>{lang === "so" ? "Raadso Dhakhtar & Qabso Ballan" : "Find & Book a Specialist"}</span>
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>
            ) : inboxThreads.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center my-4">
                <EmptyState
                  icon={MessageCircle}
                  title={t("No messages found", lang)}
                  sub={searchQuery ? t("Try adjusting your search terms.", lang) : t("Start a conversation with one of your booked therapists.", lang)}
                />
              </div>
            ) : (
              inboxThreads.map((tItem) => {
                const thread = messages[tItem.id] || [];
                const lastMsg = thread[thread.length - 1];
                const isUnread =
                  lastMsg &&
                  lastMsg.from === "therapist" &&
                  lastMsg.time > (lastReadTimes[tItem.id] || "0");

                return (
                  <button
                    key={tItem.id}
                    type="button"
                    onClick={() => setSelectedId(tItem.id)}
                    className={`w-full text-left bg-white rounded-2xl p-4 sm:p-4.5 border transition-all duration-150 flex items-center gap-3.5 hover:shadow-sm cursor-pointer ${
                      isUnread
                        ? "border-[#284136]/40 bg-emerald-50/20 shadow-xs"
                        : "border-stone-200/80 hover:border-stone-300"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar therapist={tItem} size={48} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-bold truncate ${isUnread ? "text-stone-950 font-extrabold" : "text-stone-900"}`}>
                          {tItem.name}
                        </h4>
                        {lastMsg && (
                          <span className={`text-[11px] flex-shrink-0 ${isUnread ? "text-emerald-700 font-bold" : "text-stone-400 font-medium"}`}>
                            {formatRelativeTime(lastMsg.time)}
                          </span>
                        )}
                      </div>

                      <p className={`text-xs line-clamp-1 ${isUnread ? "text-stone-900 font-semibold" : "text-stone-500 font-normal"}`}>
                        {lastMsg?.text || t("Say hello to initiate your consultation...", lang)}
                      </p>
                    </div>

                    {isUnread ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-stone-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: UNBOOKED THERAPIST RESTRICTION NOTICE
  // ==========================================
  if (!isSelectedTherapistBooked) {
    return (
      <div className="w-full min-h-[calc(100dvh-64px)] bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 text-center shadow-sm flex flex-col items-center">
          <div className="relative mb-4">
            <Avatar therapist={activeTherapist} size={72} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
              <ShieldCheck size={14} />
            </div>
          </div>

          <h2 className="font-display font-bold text-lg sm:text-xl text-stone-900 mb-1">
            {lang === "so" ? "Ballan ayaa loo baahan yahay" : "Booking Required to Chat"}
          </h2>
          <p className="text-xs text-stone-500 font-medium mb-4">
            {activeTherapist.name} · {activeTherapist.credentials || t("Licensed Specialist", lang)}
          </p>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-6 font-medium">
            {lang === "so"
              ? `Wadahadalka tooska ah waxa uu furmayaa markaad ballan la qabsato ${activeTherapist.name}. Qabso ballantaada si aad u bilowdo la-talintaada.`
              : `Direct messaging is only available with therapists you have scheduled appointments with. Book a session with ${activeTherapist.name} to unlock 1-on-1 chat and video care.`}
          </p>

          <div className="w-full flex flex-col gap-2.5">
            {onBookTherapist ? (
              <button
                type="button"
                onClick={() => onBookTherapist(activeTherapist.id)}
                className="w-full py-3 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Calendar size={16} className="text-emerald-400" />
                <span>{lang === "so" ? "Qabso Ballantaada Hadda" : `Book Session with ${activeTherapist.name.split(" ")[0]}`}</span>
              </button>
            ) : onBrowse ? (
              <button
                type="button"
                onClick={onBrowse}
                className="w-full py-3 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <Calendar size={16} className="text-emerald-400" />
                <span>{t("Browse Therapists", lang)}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="w-full py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              {lang === "so" ? "Ku noqo Fariimaha" : "Back to Messages"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE 1:1 CONVERSATION THREAD
  // Full-viewport fit (100dvh), sticky header & sticky bottom input bar
  // ==========================================
  const thread = messages[activeTherapist.id] || [];
  let lastDateHeader = "";

  // Quick suggestion chips for new or empty conversations
  const quickSuggestions = [
    "👋 Hello, looking forward to our session.",
    "📅 Could we check our scheduled time?",
    "❓ What should I prepare for our meeting?"
  ];

  return (
    <div className="w-full h-[100dvh] md:h-[calc(100dvh-64px)] max-w-4xl mx-auto flex flex-col bg-[#FAF8F5] relative overflow-hidden">
      
      {/* 1. Sleek Chat Top Bar (Sticky, no parent scrolling) */}
      <header className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-stone-200/90 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between z-30 shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="p-1.5 -ml-1 sm:ml-0 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Back to messages"
          >
            <ArrowLeft size={19} />
          </button>

          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setSelectedId(null)}>
            <Avatar therapist={activeTherapist} size={40} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/20" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm sm:text-base text-stone-900 truncate leading-tight">
                {activeTherapist.name}
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 font-medium truncate leading-tight mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-700 font-semibold">{t("Available", lang)}</span>
              <span>·</span>
              <span>{activeTherapist.credentials || t("Licensed Specialist", lang)}</span>
            </p>
          </div>
        </div>

        {/* Action Header Button: Instant Consultation Room */}
        <div className="flex items-center gap-2">
          {onJoinSession && (
            <button
              type="button"
              onClick={() => {
                const targetBooking = activeBooking || {
                  id: `bk-virtual-${Date.now()}`,
                  therapistId: activeTherapist.id,
                  category: activeTherapist.category || "cbt",
                  clientName: "Client Participant",
                  clientPhone: "N/A",
                  clientEmail: activeTherapist.email || "",
                  date: new Date().toISOString().split("T")[0],
                  time: "Flexible",
                  price: activeTherapist.price || 0,
                  priceUnit: "session",
                  status: "upcoming",
                  zoomLink: activeTherapist.zoomLink || "In-App Room",
                  createdAt: new Date().toISOString(),
                };
                onJoinSession(targetBooking);
              }}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Video size={14} className="text-emerald-400" />
              <span className="hidden sm:inline">{t("Join Room", lang)}</span>
              <span className="sm:hidden">{t("Room", lang)}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Pinned Active Consultation Banner (Non-intrusive slim bar instead of repeating big cards) */}
      {activeBooking && (
        <div className="flex-shrink-0 bg-emerald-900 text-white px-4 py-2 flex items-center justify-between text-xs z-20 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
            <span className="font-semibold truncate">
              {t("Upcoming session scheduled with", lang)} {activeTherapist.name} ({activeBooking.date} · {activeBooking.time})
            </span>
          </div>
          {onJoinSession && (
            <button
              type="button"
              onClick={() => onJoinSession(activeBooking)}
              className="font-bold underline text-emerald-200 hover:text-white flex-shrink-0 ml-2 cursor-pointer"
            >
              {t("Open Video", lang)} →
            </button>
          )}
        </div>
      )}

      {/* 3. Messages Feed (Flex-1 scrollable area with smooth auto-scroll & overscroll containment) */}
      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-2.5 overscroll-contain"
      >
        {/* Empty State with starter suggestion chips */}
        {thread.length === 0 && (
          <div className="my-auto py-8 px-4 flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-center text-stone-700 mb-3">
              <MessageCircle size={26} className="text-[#284136]" />
            </div>
            <h3 className="font-bold text-base text-stone-900 mb-1">
              {t("Conversation with", lang)} {activeTherapist.name}
            </h3>
            <p className="text-xs text-stone-500 max-w-xs mb-6">
              {t("Send a message to ask questions, verify preparation details, or request schedule adjustments.", lang)}
            </p>

            <div className="w-full flex flex-col gap-2">
              <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                {t("Quick Suggestions", lang)}
              </div>
              {quickSuggestions.map((text, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDraft(text);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  className="w-full py-2.5 px-3.5 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-medium text-stone-700 text-left transition-all flex items-center justify-between gap-2 shadow-2xs cursor-pointer hover:border-stone-300"
                >
                  <span className="truncate">{text}</span>
                  <Sparkles size={13} className="text-amber-600 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Items */}
        {thread.map((m, idx) => {
          const isClient = m.from === "client";
          const currentDateHeader = getDividerText(m.time);
          const showDateDivider = currentDateHeader !== lastDateHeader;
          if (showDateDivider) {
            lastDateHeader = currentDateHeader;
          }

          // Message grouping check
          const prevMsg = idx > 0 ? thread[idx - 1] : null;
          const isGroupedWithPrev =
            prevMsg &&
            prevMsg.from === m.from &&
            new Date(m.time).getTime() - new Date(prevMsg.time).getTime() < 120000 &&
            !showDateDivider;

          return (
            <React.Fragment key={m.id || idx}>
              {/* Centered Date Separator Pill */}
              {showDateDivider && (
                <div className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-stone-200/70 text-stone-600 text-[10px] sm:text-[11px] font-bold rounded-full uppercase tracking-wider shadow-2xs">
                    {currentDateHeader}
                  </span>
                </div>
              )}

              <div className={`flex ${isClient ? "justify-end" : "justify-start"} ${isGroupedWithPrev ? "mt-0.5" : "mt-2"}`}>
                
                {/* Case A: In-Chat Session Consultation Room Card (Sleek, Compact, Non-redundant) */}
                {m.isSessionRoom ? (
                  <div className="max-w-[88%] sm:max-w-md bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-xs flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <div className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
                        <Video size={15} />
                      </div>
                      <span>{t("Secure Consultation Room", lang)}</span>
                    </div>

                    <p className="text-xs text-stone-600 font-normal leading-relaxed">
                      {t("Direct, encrypted consultation room. Ready for your follow-up appointment.", lang)}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        if (onJoinSession) {
                          const matchingBooking = bookings.find((b) => b.id === m.bookingId);
                          const targetBooking = matchingBooking || {
                            id: m.bookingId || `bk-virtual-${Date.now()}`,
                            therapistId: activeTherapist.id,
                            category: activeTherapist.category || "cbt",
                            clientName: "Client Participant",
                            clientPhone: "N/A",
                            clientEmail: m.clientEmail || activeTherapist.email || "",
                            date: new Date().toISOString().split("T")[0],
                            time: "Flexible",
                            price: 0,
                            priceUnit: "session",
                            status: "upcoming",
                            zoomLink: "In-App Room",
                            createdAt: new Date().toISOString(),
                          };
                          onJoinSession(targetBooking);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer mt-1"
                    >
                      <Video size={14} className="text-emerald-400" />
                      <span>{t("Join Session Room", lang)}</span>
                    </button>
                  </div>
                ) : m.isZoom ? (
                  /* Case B: Zoom link card */
                  <div className="max-w-[88%] sm:max-w-md bg-white border border-stone-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Video size={15} className="text-amber-700" />
                      <span>{t("Video Session Link", lang)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(m.text, "_blank")}
                      className="w-full py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-2xs"
                    >
                      {t("Open Video Link", lang)}
                    </button>
                  </div>
                ) : (
                  /* Case C: Standard Text Bubble with crisp modern typography */
                  <div
                    className={`max-w-[82%] sm:max-w-[70%] px-4 py-2.5 text-xs sm:text-[13.5px] leading-relaxed shadow-2xs transition-all ${
                      isClient
                        ? `bg-[#18221E] text-white ${
                            isGroupedWithPrev ? "rounded-2xl" : "rounded-2xl rounded-br-xs"
                          }`
                        : `bg-white text-stone-900 border border-stone-200/80 ${
                            isGroupedWithPrev ? "rounded-2xl" : "rounded-2xl rounded-bl-xs"
                          }`
                    }`}
                  >
                    <div className="break-words whitespace-pre-wrap">{m.text}</div>
                    
                    <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isClient ? "text-stone-400" : "text-stone-400"}`}>
                      <span>{formatBubbleTime(m.time)}</span>
                      {isClient && <CheckCheck size={12} className="text-emerald-400" />}
                    </div>
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </main>

      {/* 4. Docked Bottom Input Bar (Always pinned, safe-area padded, zero screen cutoff) */}
      <footer className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-stone-200/90 px-3 sm:px-5 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] z-30 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) {
              onSend(activeTherapist.id, draft.trim());
            }
          }}
          className="flex items-end gap-2 max-w-4xl mx-auto"
        >
          <div className="flex-1 bg-stone-100/90 border border-stone-200/90 focus-within:border-stone-400 focus-within:bg-white rounded-2xl px-3.5 py-1.5 transition-all flex items-center min-h-[42px] max-h-32">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t("Write a message...", lang)}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (draft.trim()) {
                    onSend(activeTherapist.id, draft.trim());
                  }
                }
              }}
              className="w-full bg-transparent text-xs sm:text-sm text-stone-900 placeholder-stone-400 resize-none outline-none leading-relaxed max-h-28 overflow-y-auto"
            />
          </div>

          <button
            type="submit"
            disabled={!draft.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer ${
              draft.trim()
                ? "bg-[#18221E] hover:bg-black text-white shadow-xs active:scale-95"
                : "bg-stone-200 text-stone-400 cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <Send size={15} className={draft.trim() ? "translate-x-0.5 text-white" : "translate-x-0.5 text-stone-400"} />
          </button>
        </form>
      </footer>

    </div>
  );
}
