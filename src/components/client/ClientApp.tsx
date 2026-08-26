/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Therapist, Booking, Message, AppContent, ClientProfile, QuizOption } from "../../types";
import { QUIZ_QUESTIONS, colors } from "../../constants";
import { uid, isoDate, loadKey, saveKey } from "../../utils";
import { translateText as t, translateTherapist, translateQuiz, translateContent, Language } from "../../utils/translations";
import { AnimatePresence, motion } from "motion/react";
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
import ClientNav from "../layout/ClientNav";
import Wordmark from "../ui/Wordmark";
import LoginModal from "../shared/LoginModal";
import HeaderMenu from "../layout/HeaderMenu";
import { Home, CalendarDays, MessageCircle, User as UserIcon, Globe, LogIn, Sparkles, ArrowRight, Menu } from "lucide-react";

import { User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

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
    financialAidCategory: undefined,
    financialAidReason: undefined,
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
  
  useEffect(() => {
    (async () => {
      const saved = await loadKey<Record<string, string>>("barbaar-last-read-times", {}, false);
      setLastReadTimes(saved);
    })();
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

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function toggleLanguage() {
    const nextLang: Language = lang === "so" ? "en" : "so";
    setClientProfile({ ...clientProfile, language: nextLang });
  }

  function startQuiz(initialCategory?: string) {
    setQuizStep(0);
    if (initialCategory) {
      setQuizScores({
        cbt: initialCategory === "cbt" ? 3 : 0,
        couples: initialCategory === "couples" ? 3 : 0,
        premium: initialCategory === "teen" || initialCategory === "premium" ? 3 : 0,
      });
    } else {
      setQuizScores({ cbt: 0, couples: 0, premium: 0 });
    }
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

  function confirmBooking(paymentDetails?: {
    paymentGateway?: string;
    paymentMethod?: "mobile" | "card";
    paymentStatus?: "paid" | "pending";
    paymentSid?: string;
    paymentAccount?: string;
  }) {
    const t = therapists.find((x) => x.id === selectedId);
    if (!t) return;

    const discountRate = 0.4;
    const finalPrice = booking.financialAidApplied ? Math.round(t.price * (1 - discountRate)) : t.price;

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
      financialAidApplied: booking.financialAidApplied || false,
      financialAidCategory: booking.financialAidApplied ? booking.financialAidCategory : undefined,
      financialAidReason: booking.financialAidApplied ? booking.financialAidReason : undefined,
      financialAidStatus: booking.financialAidApplied ? "pending" : undefined,
      originalPrice: t.price,
      paymentGateway: paymentDetails?.paymentGateway,
      paymentMethod: paymentDetails?.paymentMethod || "mobile",
      paymentStatus: paymentDetails?.paymentStatus || (booking.financialAidApplied ? "pending" : "paid"),
      paymentSid: paymentDetails?.paymentSid,
      paymentAccount: paymentDetails?.paymentAccount || booking.phone,
      paidAt: paymentDetails?.paymentStatus === "paid" ? new Date().toISOString() : undefined,
    };

    const nextBookings = [rec, ...bookings];
    saveBookings(nextBookings);

    // If the booking used approved financial relief, mark it redeemed so client can apply again in the future
    const aidUsed = booking.financialAidApplied || clientProfile.financialAidStatus === "approved";
    const updatedProfile: ClientProfile = {
      ...clientProfile,
      name: booking.name,
      phone: booking.phone,
      email: booking.email,
      financialAidStatus: aidUsed ? "none" : clientProfile.financialAidStatus,
      financialAidApprovedAt: aidUsed ? undefined : clientProfile.financialAidApprovedAt,
    };
    setClientProfile(updatedProfile);

    if (aidUsed && booking.email) {
      try {
        localStorage.setItem("barbaar-client-aid-status", "none");
        const cleanEmail = booking.email.trim().toLowerCase();
        const baseEmailId = `aid_${cleanEmail.replace(/[^a-z0-9]/g, "_")}`;
        setDoc(
          doc(db, "financial_aid_requests", baseEmailId),
          {
            financialAidStatus: "completed",
            usedInBookingId: rec.id,
            completedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      } catch (e) {}
    }

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
        paymentGateway: rec.paymentGateway,
        paymentSid: rec.paymentSid,
        paymentStatus: rec.paymentStatus,
        paymentAccount: rec.paymentAccount,
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
  const hasActiveInteractions = bookings.length > 0 || hasAnyUnread || !!currentUser;
  const showNav = (screen !== "home" || hasActiveInteractions) && 
    !["profile", "booking", "quiz", "match", "confirmation"].includes(screen) && 
    !(screen === "chat" && selectedId !== null);

  return (
    <div
      className="w-full min-h-screen relative"
      style={{
        background: "#faf9f6",
        minHeight: "100vh",
        paddingBottom: showNav ? 90 : 0,
        transition: "padding-bottom 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Premium Minimalist Header Navigation (Universal Desktop & Mobile) */}
      <header className="sticky top-0 w-full backdrop-blur-md border-b border-stone-200/80 z-40 bg-[#faf9f6]/95 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-15 sm:h-16 flex items-center justify-between">
          <button onClick={() => go("home")} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <Wordmark size={18} />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Pill */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-white text-xs font-bold text-stone-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Globe size={13} className="text-stone-500" />
              <span>{lang === "so" ? "English" : "Soomaali"}</span>
            </button>

            {/* Quick Get Started Button (Desktop & Tablet) */}
            <button
              onClick={() => startQuiz()}
              className="hidden sm:flex px-4 py-2 text-xs font-bold text-white bg-[#1e3a2f] hover:bg-[#14261f] transition-all rounded-full shadow-sm hover:shadow-md cursor-pointer items-center gap-1.5"
            >
              <span>{lang === "so" ? "Biloow Hadda" : "Get started"}</span>
              <ArrowRight size={13} />
            </button>

            {/* Clean Unified Menu Trigger Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold transition-all shadow-2xs cursor-pointer hover:border-stone-400"
              aria-label="Open navigation menu"
            >
              <Menu size={15} className="text-stone-700" />
              <span className="font-bold">{lang === "so" ? "Liiska" : "Menu"}</span>
              {hasAnyUnread && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={screen + (selectedId || "") + (settingsSub || "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          style={{ width: "100%", display: "flex", flexDirection: "column", minHeight: "100%" }}
        >
          {screen === "home" ? (
            <ClientHome
              clientProfile={clientProfile}
              bookings={bookings}
              therapists={translatedTherapists}
              onStartQuiz={startQuiz}
              onBrowse={(categoryKey) => {
                if (categoryKey) {
                  setDirectoryFilter(categoryKey);
                } else {
                  setDirectoryFilter("all");
                }
                go("directory");
              }}
              onOpenSession={() => go("sessions")}
              onOpenProfile={openProfile}
              onOpenProfileTab={() => go("settings")}
              onOpenLegalPage={openLegalPage}
              setClientProfile={setClientProfile}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenMenu={() => setIsMenuOpen(true)}
            />
          ) : screen === "chat" ? (
            <ChatScreen
              therapists={translatedTherapists}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              messages={messages}
              draft={chatDraft}
              setDraft={setChatDraft}
              onSend={sendMessage}
              onBack={() => {
                if (selectedId) {
                  setSelectedId(null);
                } else {
                  go("home");
                }
              }}
              bookings={bookings}
              onJoinSession={onJoinSession}
              onBrowse={() => go("directory")}
              onBookTherapist={(therapistId) => startBooking(therapistId)}
              lang={lang}
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
                  onOpenLegalPage={openLegalPage}
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
                  onMessage={(id) => {
                    setSelectedId(id);
                    go("chat");
                  }}
                  onRateSession={handleRateSession}
                  onBack={() => go("home")}
                  lang={lang}
                  onJoinSession={onJoinSession}
                  onBrowse={() => go("directory")}
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
      </AnimatePresence>

      {/* Persistent Bottom Nav Bar with dynamic slide-down animation */}
      <AnimatePresence>
        {showNav && (
          <motion.div
            className="md:hidden"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
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
      </AnimatePresence>

      {/* Global Quick Login & Access Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        lang={lang}
        onTherapistLogin={enterTherapistMode}
        onAdminLogin={enterAdminMode}
        onSuccess={() => {
          setIsLoginModalOpen(false);
          go("sessions");
        }}
      />

      {/* Global Minimalist Navigation Drawer Menu */}
      <HeaderMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        lang={lang}
        onToggleLanguage={toggleLanguage}
        onNavigate={(s, p) => go(s, p)}
        onStartQuiz={startQuiz}
        onOpenLegalPage={openLegalPage}
        onOpenLoginModal={() => {
          setIsMenuOpen(false);
          setIsLoginModalOpen(true);
        }}
        currentUser={currentUser}
        clientProfile={clientProfile}
        bookings={bookings}
        hasUnreadMessages={hasAnyUnread}
        onLogout={() => {
          if (onSignOut) onSignOut();
        }}
        onEnterTherapistMode={enterTherapistMode}
        onEnterAdminMode={enterAdminMode}
      />
    </div>
  );
}
