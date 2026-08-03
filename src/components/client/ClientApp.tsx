/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Therapist, Booking, Message, AppContent, ClientProfile, QuizOption } from "../../types";
import { QUIZ_QUESTIONS, colors } from "../../constants";
import { uid, isoDate, loadKey, saveKey } from "../../utils";
import { translateText as t, translateTherapist, translateQuiz, translateContent, Language } from "../../utils/translations";
import { motion } from "motion/react";
import ClientHome from "./ClientHome";
import QuizScreen from "./QuizScreen";
import MatchResults from "./MatchResults";
import Directory from "./Directory";
import TherapistProfileScreen from "./TherapistProfileScreen";
import BookingFlow from "./BookingFlow";
import Confirmation from "./Confirmation";
import SessionsScreen from "./SessionsScreen";
import ChatScreen from "./ChatScreen";
import SettingsScreen from "./SettingsScreen";
import LegalScreen from "./LegalScreen";
import DownloadScreen from "./DownloadScreen";
import AppDownloadBanner from "../layout/AppDownloadBanner";
import NativeAppModal from "../layout/NativeAppModal";
import ClientNav from "../layout/ClientNav";
import Wordmark from "../ui/Wordmark";
import { Home, CalendarDays, MessageCircle, User as UserIcon } from "lucide-react";

import { User } from "firebase/auth";
import { setAppPrivacyMode } from "../../utils/privacy";

interface ClientAppProps {
  therapists: Therapist[];
  bookings: Booking[];
  messages: Record<string, Message[]>;
  content: AppContent;
  clientProfile: ClientProfile;
  saveTherapists: (therapists: Therapist[]) => void;
  saveBookings: (bookings: Booking[]) => void;
  saveMessages: (messages: Record<string, Message[]>) => void;
  setClientProfile: (profile: ClientProfile) => void;
  enterTherapistMode: () => void;
  enterAdminMode: () => void;
  currentUser?: User | null;
  userRole?: "client" | "therapist" | "admin" | null;
  onSignOut?: () => void;
  onJoinSession?: (booking: Booking) => void;
  screen?: string;
  setScreen?: (screen: string) => void;
  selectedId?: string | null;
  setSelectedId?: (id: string | null) => void;
  settingsSub?: string | null;
  setSettingsSub?: (sub: string | null) => void;
}

export default function ClientApp({
  therapists,
  bookings,
  messages,
  content,
  clientProfile,
  saveTherapists,
  saveBookings,
  saveMessages,
  setClientProfile,
  enterTherapistMode,
  enterAdminMode,
  currentUser = null,
  userRole = null,
  onSignOut,
  onJoinSession,
  screen: externalScreen,
  setScreen: externalSetScreen,
  selectedId: externalSelectedId,
  setSelectedId: externalSetSelectedId,
  settingsSub: externalSettingsSub,
  setSettingsSub: externalSetSettingsSub,
}: ClientAppProps) {
  const lang: Language = clientProfile.language || "en";

  // Real-time language translation for static/prop structures
  const translatedTherapists = therapists.map((th) => translateTherapist(th, lang));
  const translatedQuiz = translateQuiz(QUIZ_QUESTIONS, lang);
  const translatedContentObj = translateContent(content, lang);

  const [internalScreen, setInternalScreen] = useState<string>(() => {
    const path = window.location.pathname.replace(/^\/|\/$/g, "").toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view")?.toLowerCase();
    const legalView = (path === "terms" || path === "privacy" || path === "about") ? path :
                      (viewParam === "terms" || viewParam === "privacy" || viewParam === "about") ? viewParam : null;
    if (legalView) {
      return "settings";
    }
    if (path === "therapists" || path === "directory") {
      return "directory";
    }
    return "home";
  });
  const screen = externalScreen !== undefined ? externalScreen : internalScreen;
  const setScreen = externalSetScreen !== undefined ? externalSetScreen : setInternalScreen;

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedId = externalSelectedId !== undefined ? externalSelectedId : internalSelectedId;
  const setSelectedId = externalSetSelectedId !== undefined ? externalSetSelectedId : setInternalSelectedId;
  const [quizStep, setQuizStep] = useState<number>(0);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({
    cbt: 0,
    couples: 0,
    premium: 0,
  });
  const [genderPref, setGenderPref] = useState<"female" | "male" | null>(null);
  const [matched, setMatched] = useState<Therapist[]>([]);
  const [matchedCategory, setMatchedCategory] = useState<string | null>(null);
  const [directoryFilter, setDirectoryFilter] = useState<string>("all");
  
  const [booking, setBooking] = useState<{
    step: number;
    date: Date | string | null;
    time: string | null;
    name: string;
    phone: string;
    email: string;
    financialAidApplied?: boolean;
    financialAidCategory?: string;
    financialAidReason?: string;
  }>({
    step: 1,
    date: null,
    time: null,
    name: "",
    phone: "",
    email: "",
    financialAidApplied: false,
    financialAidCategory: "",
    financialAidReason: "",
  });
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState<string>("");
  const [internalSettingsSub, setInternalSettingsSub] = useState<string | null>(() => {
    const path = window.location.pathname.replace(/^\/|\/$/g, "").toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view")?.toLowerCase();
    const legalView = (path === "terms" || path === "privacy" || path === "about") ? path :
                      (viewParam === "terms" || viewParam === "privacy" || viewParam === "about") ? viewParam : null;
    return legalView;
  });
  const settingsSub = externalSettingsSub !== undefined ? externalSettingsSub : internalSettingsSub;
  const setSettingsSub = externalSetSettingsSub !== undefined ? externalSetSettingsSub : setInternalSettingsSub;

  const [lastReadTimes, setLastReadTimes] = useState<Record<string, string>>({});
  const [visitCount, setVisitCount] = useState<number>(1);
  const [viewedTherapistIds, setViewedTherapistIds] = useState<string[]>([]);
  const [showNativeModal, setShowNativeModal] = useState<boolean>(false);

  useEffect(() => {
    // Show native download popup if on web
    const isNative = typeof window !== "undefined" && (
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === "file:" ||
      window.navigator.userAgent.includes("Capacitor")
    );
    if (!isNative) {
      const isDownloadUrl = typeof window !== "undefined" && (
        window.location.pathname.toLowerCase().includes("download") ||
        window.location.search.toLowerCase().includes("download") ||
        screen === "download"
      );
      const dismissedThisSession = sessionStorage.getItem("barbaar_native_popup_dismissed_session");
      if (isDownloadUrl || !dismissedThisSession) {
        setShowNativeModal(true);
      }
    }
  }, [screen]);
  
  useEffect(() => {
    (async () => {
      const saved = await loadKey<Record<string, string>>("barbaar-last-read-times", {}, false);
      setLastReadTimes(saved);
    })();
  }, []);

  useEffect(() => {
    // Track visits
    const storedCount = localStorage.getItem("barbaar-visit-count");
    let count = storedCount ? parseInt(storedCount, 10) : 0;
    if (!sessionStorage.getItem("barbaar-session-visited")) {
      count += 1;
      localStorage.setItem("barbaar-visit-count", count.toString());
      sessionStorage.setItem("barbaar-session-visited", "true");
    }
    setVisitCount(count || 1);

    // Track viewed therapists
    const storedViews = localStorage.getItem("barbaar-viewed-therapists");
    if (storedViews) {
      try {
        setViewedTherapistIds(JSON.parse(storedViews));
      } catch (e) {
        setViewedTherapistIds([]);
      }
    }
  }, []);

  const saveLastReadTimes = (next: Record<string, string>) => {
    setLastReadTimes(next);
    saveKey("barbaar-last-read-times", next, false);
  };

  useEffect(() => {
    if (screen === "chat" && selectedId) {
      const nextRead = { ...lastReadTimes, [selectedId]: new Date().toISOString() };
      saveLastReadTimes(nextRead);
    }
  }, [screen, selectedId, messages]);

  useEffect(() => {
    // Enable screenshot protection ONLY for sensitive private screens (Chat, Sessions)
    // Normal public screens (Home, Profile, Directory, Quiz, Settings, Download) allow screenshots freely
    const isSensitive = screen === "chat" || screen === "sessions";
    setAppPrivacyMode(isSensitive);
  }, [screen]);

  const hasAnyUnread = translatedTherapists.some((t) => {
    const thread = messages[t.id] || [];
    if (thread.length === 0) return false;
    const lastMsg = thread[thread.length - 1];
    if (lastMsg.from !== "therapist") return false;
    const lastRead = lastReadTimes[t.id] || "0";
    return lastMsg.time > lastRead;
  });

  function go(s: string, params: { id?: string } = {}) {
    if (params.id) {
      setSelectedId(params.id);
    }
    setScreen(s);
    window.scrollTo(0, 0);
  }

  function openLegalPage(type: "about" | "terms" | "privacy") {
    setSettingsSub(type);
    go("settings");
  }

  function startQuiz() {
    setQuizStep(0);
    setQuizScores({ cbt: 0, couples: 0, premium: 0 });
    setGenderPref(null);
    go("quiz");
  }

  function answerQuiz(opt: QuizOption) {
    const q = translatedQuiz[quizStep];
    if (q.isPreference) {
      setGenderPref(opt.value || null);
      finishQuiz(quizScores, opt.value || null);
      return;
    }

    const next = { ...quizScores };
    if (opt.weight) {
      Object.entries(opt.weight).forEach(([k, v]) => {
        if (v !== undefined) {
          next[k] = (next[k] || 0) + v;
        }
      });
    }
    setQuizScores(next);

    if (quizStep + 1 < translatedQuiz.length) {
      setQuizStep(quizStep + 1);
    } else {
      finishQuiz(next, null);
    }
  }

  function finishQuiz(scores: Record<string, number>, pref: "female" | "male" | null) {
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const pool = translatedTherapists.filter((t) => t.category === top && t.active);
    const withPref = pref ? pool.filter((t) => t.gender === pref) : pool;
    const finalPool = withPref.length ? withPref : pool;
    const sorted = [...finalPool].sort((a, b) => b.rating - a.rating).slice(0, 2);

    setMatched(sorted);
    setMatchedCategory(top);
    go("match");
  }

  function openProfile(id: string) {
    setSelectedId(id);
    
    const nextViews = viewedTherapistIds.includes(id)
      ? viewedTherapistIds
      : [...viewedTherapistIds, id];
    setViewedTherapistIds(nextViews);
    localStorage.setItem("barbaar-viewed-therapists", JSON.stringify(nextViews));

    go("profile");
  }

  function startBooking(id: string) {
    setSelectedId(id);
    setBooking({
      step: 1,
      date: null,
      time: null,
      name: clientProfile.name || "",
      phone: clientProfile.phone || "",
      email: clientProfile.email || "",
    });
    go("booking");
  }

  function confirmBooking() {
    const t = therapists.find((x) => x.id === selectedId);
    if (!t) return;

    const isProfileApproved = clientProfile.financialAidStatus === "approved";
    const isAidApplied = booking.financialAidApplied || isProfileApproved;
    const discountRate = 0.4;
    const finalPrice = isAidApplied ? Math.round(t.price * (1 - discountRate)) : t.price;

    const rec: Booking = {
      id: uid("bk"),
      therapistId: t.id,
      category: t.category,
      clientName: booking.name,
      clientPhone: booking.phone,
      clientEmail: booking.email,
      date: booking.date ? isoDate(booking.date) : "",
      time: booking.time || "",
      price: finalPrice,
      priceUnit: t.priceUnit,
      status: "upcoming",
      zoomLink: null,
      createdAt: new Date().toISOString(),
      financialAidApplied: isAidApplied,
      financialAidCategory: isAidApplied ? (booking.financialAidCategory || clientProfile.financialAidCategory || "Somali Youth") : undefined,
      financialAidReason: isAidApplied ? (booking.financialAidReason || clientProfile.financialAidReason || "Approved") : undefined,
      financialAidStatus: isProfileApproved ? "approved" : (isAidApplied ? "pending" : undefined),
      originalPrice: t.price,
    };

    const isProfileAidNone = !clientProfile.financialAidStatus || clientProfile.financialAidStatus === "none";
    
    const nextAidStatus = isProfileApproved 
      ? "approved" 
      : ((isAidApplied && isProfileAidNone) ? "pending" : (clientProfile.financialAidStatus || "none"));
    const nextAidCategory = isAidApplied ? (booking.financialAidCategory || clientProfile.financialAidCategory) : clientProfile.financialAidCategory;
    const nextAidReason = isAidApplied ? (booking.financialAidReason || clientProfile.financialAidReason) : clientProfile.financialAidReason;

    const nextBookings = [rec, ...bookings];
    saveBookings(nextBookings);
    
    setClientProfile({
      ...clientProfile,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      financialAidStatus: nextAidStatus as any,
      financialAidCategory: nextAidCategory,
      financialAidReason: nextAidReason,
    });
    setLastBookingId(rec.id);

    // Trigger serverless background email dispatch (non-blocking for user)
    fetch("/api/send-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: rec.id,
        clientName: rec.clientName,
        clientEmail: rec.clientEmail,
        clientPhone: rec.clientPhone,
        therapistName: t.name,
        category: rec.category,
        date: rec.date ? isoDate(rec.date) : "",
        time: rec.time,
        price: finalPrice,
        priceUnit: t.priceUnit,
        financialAidApplied: rec.financialAidApplied || false,
      }),
    }).catch((err) => {
      console.warn("Failed to dispatch booking notification email:", err);
    });

    go("confirmation");
  }

  function sendMessage(therapistId: string, text: string) {
    if (!text.trim()) return;
    const thread = messages[therapistId] || [];
    const email = (currentUser?.email || clientProfile?.email || "").trim().toLowerCase();
    const next = {
      ...messages,
      [therapistId]: [
        ...thread,
        {
          id: uid("m"),
          from: "client" as const,
          text,
          time: new Date().toISOString(),
          clientEmail: email,
        },
      ],
    };
    saveMessages(next);
    setChatDraft("");
  }

  function handleRateSession(bookingId: string, rating: number, reviewText: string) {
    const nextBookings = bookings.map((b) => {
      if (b.id === bookingId) {
        return { ...b, rating, review: reviewText, status: "completed" };
      }
      return b;
    });
    saveBookings(nextBookings);

    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (targetBooking) {
      const tId = targetBooking.therapistId;
      const t = therapists.find((x) => x.id === tId);
      if (t) {
        const prevReviews = t.reviews || 0;
        const prevRating = t.rating || 0;
        const nextReviews = prevReviews + 1;
        const nextRating = parseFloat(((prevRating * prevReviews + rating) / nextReviews).toFixed(1));
        const nextTherapists = therapists.map((x) =>
          x.id === tId ? { ...x, rating: nextRating, reviews: nextReviews } : x
        );
        saveTherapists(nextTherapists);
      }
    }
  }

  const selectedTherapist = translatedTherapists.find((t) => t.id === selectedId);
  const showNav = !["profile", "booking", "quiz", "match", "confirmation"].includes(screen) && !(screen === "chat" && selectedId !== null);

  return (
    <div
      className="w-full min-h-screen relative"
      style={{
        background: colors.ivory,
        minHeight: "100vh",
        paddingBottom: showNav ? 90 : 0,
        transition: "padding-bottom 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Top Banner introducing official React Native Android App */}
      <AppDownloadBanner onOpenDownload={() => setShowNativeModal(true)} lang={lang} />

      {/* Official Native App Download Modal Popup */}
      <NativeAppModal
        isOpen={showNativeModal}
        onClose={() => {
          sessionStorage.setItem("barbaar_native_popup_dismissed_session", "true");
          setShowNativeModal(false);
        }}
        lang={lang}
      />

      {/* Premium Sticky Desktop Header Navigation (BetterHelp Style) */}
      <header className="hidden md:block sticky top-0 w-full backdrop-blur-md border-b border-gray-100 z-50 shadow-sm" style={{ background: `${colors.ivory}F2` }}>
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button onClick={() => go("home")} className="cursor-pointer transition-transform hover:scale-102">
              <Wordmark size={18} />
            </button>
            <nav className="flex items-center gap-8">
              {[
                { key: "home", label: lang === "so" ? "Hoyga" : "Home", icon: Home },
                { key: "sessions", label: lang === "so" ? "Kulamada" : "Sessions", icon: CalendarDays },
                { key: "chat", label: lang === "so" ? "Farriimaha" : "Messages", icon: MessageCircle, badge: hasAnyUnread },
                { key: "download", label: lang === "so" ? "📱 Native App" : "📱 Native App", icon: UserIcon },
                { key: "settings", label: lang === "so" ? "Xogta" : "Profile", icon: UserIcon },
              ].map((item) => {
                const isActive = screen === item.key || 
                  (item.key === "home" && ["quiz", "match", "directory", "profile", "booking", "confirmation"].includes(screen)) ||
                  (item.key === "settings" && settingsSub !== null);
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setSettingsSub(null);
                      go(item.key);
                    }}
                    className={`relative py-5 text-[14px] font-semibold flex items-center gap-2 border-b-2 transition-all duration-150 cursor-pointer ${
                      isActive 
                        ? "text-[#384c43] border-[#384c43]" 
                        : "text-gray-400 border-transparent hover:text-gray-700"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse absolute top-3 right-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={startQuiz}
              className="px-5 py-2 text-xs font-bold text-white bg-[#384c43] hover:bg-[#2c3d36] transition-colors rounded-full shadow-sm cursor-pointer"
            >
              {lang === "so" ? "Hel Dhakhtar" : "Find Your Match"}
            </button>
          </div>
        </div>
      </header>

      <motion.div
        key={screen + (selectedId || "") + (settingsSub || "")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: "100%" }}
      >
          {screen === "home" ? (
            <ClientHome
              clientProfile={clientProfile}
              bookings={bookings}
              therapists={translatedTherapists}
              onStartQuiz={startQuiz}
              onBrowse={() => go("directory")}
              onOpenSession={() => go("sessions")}
              onOpenProfile={openProfile}
              onOpenProfileTab={() => go("settings")}
              onOpenLegalPage={openLegalPage}
              setClientProfile={setClientProfile}
              visitCount={visitCount}
              viewedTherapistCount={viewedTherapistIds.length}
            />
          ) : (
            <div className="w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-12">
              {screen === "quiz" && (
                <QuizScreen
                  step={quizStep}
                  onAnswer={answerQuiz}
                  questions={translatedQuiz}
                  lang={lang}
                  onBack={() => (quizStep === 0 ? go("home") : setQuizStep(quizStep - 1))}
                />
              )}

              {screen === "match" && (
                <MatchResults
                  matched={matched}
                  category={matchedCategory || "cbt"}
                  onSelect={openProfile}
                  onRetake={startQuiz}
                  onBrowseAll={() => go("directory")}
                  onBack={() => go("home")}
                  lang={lang}
                />
              )}

              {screen === "directory" && (
                <Directory
                  therapists={translatedTherapists.filter((t) => t.active)}
                  filter={directoryFilter}
                  setFilter={setDirectoryFilter}
                  onSelect={openProfile}
                  onBack={() => go("home")}
                  lang={lang}
                />
              )}

              {screen === "profile" && selectedTherapist && (
                <TherapistProfileScreen
                  therapist={selectedTherapist}
                  bookings={bookings}
                  onBook={() => startBooking(selectedTherapist.id)}
                  onBack={() => go("directory")}
                  lang={lang}
                />
              )}

              {screen === "booking" && selectedTherapist && (
                <BookingFlow
                  therapist={selectedTherapist}
                  booking={booking}
                  setBooking={setBooking}
                  onCancel={() => go("profile", { id: selectedTherapist.id })}
                  onConfirm={confirmBooking}
                  lang={lang}
                  clientProfile={clientProfile}
                  setClientProfile={setClientProfile}
                />
              )}

              {screen === "confirmation" && (
                <Confirmation
                  booking={bookings.find((b) => b.id === lastBookingId)}
                  therapist={translatedTherapists.find(
                    (t) =>
                      t.id === (bookings.find((b) => b.id === lastBookingId) || ({} as any)).therapistId
                  )}
                  onDone={() => go("sessions")}
                  onHome={() => go("home")}
                  lang={lang}
                />
              )}

              {screen === "sessions" && (
                <SessionsScreen
                  bookings={bookings}
                  therapists={translatedTherapists}
                  clientProfile={clientProfile}
                  onMessage={(id) => {
                    setSelectedId(id);
                    go("chat");
                  }}
                  onRateSession={handleRateSession}
                  onBack={() => go("home")}
                  lang={lang}
                  onJoinSession={onJoinSession}
                />
              )}

              {screen === "chat" && (
                <ChatScreen
                  therapists={translatedTherapists}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                  messages={messages}
                  draft={chatDraft}
                  setDraft={setChatDraft}
                  onSend={sendMessage}
                  onBack={() => go("home")}
                  bookings={bookings}
                  onJoinSession={onJoinSession}
                />
              )}

              {screen === "download" && (
                <DownloadScreen
                  onBack={() => go("home")}
                  lang={lang}
                />
              )}

              {screen === "settings" && !settingsSub && (
                <SettingsScreen
                  clientProfile={clientProfile}
                  setClientProfile={setClientProfile}
                  onOpen={(s) => setSettingsSub(s)}
                  onTherapistLogin={enterTherapistMode}
                  onAdminLogin={enterAdminMode}
                  currentUser={currentUser}
                  userRole={userRole}
                  onSignOut={onSignOut}
                />
              )}

              {screen === "settings" && settingsSub && (
                <LegalScreen
                  type={settingsSub}
                  title={
                    settingsSub === "about"
                      ? t("About Us", lang)
                      : settingsSub === "terms"
                      ? t("Terms of Service", lang)
                      : t("Privacy Policy", lang)
                  }
                  body={
                    settingsSub === "about"
                      ? translatedContentObj.aboutUs
                      : settingsSub === "terms"
                      ? translatedContentObj.terms
                      : translatedContentObj.privacy
                  }
                  onBack={() => setSettingsSub(null)}
                />
              )}
            </div>
          )}
        </motion.div>

      {/* Persistent Bottom Nav Bar */}
      {showNav && (
        <motion.div
          className="md:hidden"
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            marginLeft: "auto",
            marginRight: "auto",
            width: "100%",
            maxWidth: "36rem", // max-w-xl (576px)
            zIndex: 30,
          }}
        >
          <ClientNav
            screen={screen}
            go={(k) => {
              setSettingsSub(null);
              go(k);
            }}
            hasUnread={hasAnyUnread}
            lang={lang}
          />
        </motion.div>
      )}
    </div>
  );
}
