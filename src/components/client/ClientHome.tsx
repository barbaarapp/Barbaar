/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ChevronRight, 
  Sparkles, 
  User as UserIcon, 
  HeartHandshake, 
  Brain, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  Lock,
  Globe2,
  CalendarDays,
  MessageCircle,
  HelpCircle, 
  Check, 
  ArrowRight,
  Stethoscope,
  PhoneCall,
  Flame,
  CheckCircle2
} from "lucide-react";
import { Therapist, Booking, ClientProfile } from "../../types";
import { colors, CATEGORIES } from "../../constants";
import { fmtDate, timeOfDayGreeting } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import Wordmark from "../ui/Wordmark";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import { TherapistCard } from "./TherapistCard";
import { motion } from "motion/react";
import FinancialAidBanner from "./FinancialAidBanner";
import Footer from "../layout/Footer";

interface ClientHomeProps {
  clientProfile: ClientProfile;
  bookings: Booking[];
  therapists: Therapist[];
  onStartQuiz: (categoryKey?: string) => void;
  onBrowse: (categoryKey?: string) => void;
  onOpenSession: () => void;
  onOpenProfile: (id: string) => void;
  onOpenProfileTab: () => void;
  onOpenLegalPage: (type: "about" | "terms" | "privacy") => void;
  setClientProfile?: (profile: ClientProfile) => void;
  onOpenLoginModal?: () => void;
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
  onOpenLoginModal,
}: ClientHomeProps) {
  const lang: Language = clientProfile.language || "en";
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Find the first upcoming session sorted by date
  const upcoming = bookings
    .filter((b) => b.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const upcomingTherapist = upcoming
    ? therapists.find((t) => t.id === upcoming.therapistId)
    : null;

  const activeTherapists = therapists.filter((t) => t.active);

  const therapyTypes = [
    {
      key: "cbt",
      title: lang === "so" ? "Qof ahaan (aniga naftayda)" : "Individual (for myself)",
      subtitle: lang === "so" ? "Walbahaarka, niyad-jabka, xasiloonida & koritaanka nafta" : "Depression, stress, anxiety, or personal growth",
      icon: Brain,
      color: "#2d4f40",
      accent: "#eaf2ec",
    },
    {
      key: "couples",
      title: lang === "so" ? "Lamaanayaasha (aniga & lamaanahayga)" : "Couples (for myself & partner)",
      subtitle: lang === "so" ? "Wada-xiriirka, xallinta khilaafaadka & dhisidda kalsoonida" : "Communication, conflict repair, pre-marital counseling",
      icon: HeartHandshake,
      color: "#c07a34",
      accent: "#faf2e8",
    },
    {
      key: "teen",
      title: lang === "so" ? "Barnaamijka Isbeddelka & Dhallinyarada" : "Teen & 6-Week Transformation",
      subtitle: lang === "so" ? "Tababar qorsheysan, yoolal nololeed & horumar degdeg ah" : "Structured milestone coaching, purpose & deep change",
      icon: Flame,
      color: "#4e8a5b",
      accent: "#eef6f0",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#faf9f6] text-[#1a2f25]">
      {/* 1. BetterHelp-Style Botanical Forest Hero Section */}
      <section className="relative w-full bg-[#1e3a2f] text-white pt-10 pb-24 md:pt-14 md:pb-28 overflow-hidden">
        {/* Subtle background glow/organic shapes */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#4e8a5b] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#2a5142] blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 md:px-8">
          {/* Mobile Top Header */}
          <div className="flex md:hidden items-center justify-between mb-8 pb-4 border-b border-white/10">
            <Wordmark size={17} variant="dark" />
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenLoginModal}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                {lang === "so" ? "Gal" : "Log in"}
              </button>
              <button
                onClick={onOpenProfileTab}
                className="w-8 h-8 rounded-full bg-[#4e8a5b] text-white flex items-center justify-center text-xs font-bold shadow-xs cursor-pointer"
              >
                {clientProfile.name ? clientProfile.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
              </button>
            </div>
          </div>

          {/* Hero Typography */}
          <div className="max-w-2xl mx-auto text-center">
            {/* Reassuring badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xs text-xs font-medium text-emerald-200 mb-6">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>{lang === "so" ? "100% Qarsoodi & Khubaro Soomaaliyeed" : "100% Confidential & Culturally Grounded"}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.18] mb-5">
              {lang === "so" ? (
                <>
                  Daryeel cilmi-nafsi oo casri ah, la awoodi karo, kuna hadla{" "}
                  <span className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-4">
                    afkaaga
                  </span>
                  .
                </>
              ) : (
                <>
                  Convenient and affordable therapy with{" "}
                  <span className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-4">
                    Barbaar
                  </span>
                  .
                </>
              )}
            </h1>

            <p className="text-sm md:text-base text-stone-300 leading-relaxed max-w-xl mx-auto font-normal">
              {lang === "so"
                ? "Barbaar waxay kugu xiraysaa dhakhaatiir iyo khubaro cilmi-nafsi oo shati leh, ku hadla af-Soomaali, fahamsan dhaqankaaga meel kasta oo aad dunida kaga sugan tahay."
                : "Barbaar connects you to vetted, licensed Somali-speaking therapists and clinical psychologists worldwide based upon your needs, preferences, and clinical availability."}
            </p>

            {/* Minimalist carousel indicator */}
            <div className="flex items-center justify-center gap-1.5 mt-7">
              <div className="w-8 h-1 rounded-full bg-emerald-400" />
              <div className="w-2 h-1 rounded-full bg-white/30" />
              <div className="w-2 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Overlapping BetterHelp-Style Intake Flow Card */}
      <section className="relative max-w-4xl mx-auto px-4 md:px-8 -mt-16 z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-stone-200/90">
          <div className="text-center mb-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1a2f25]">
              {lang === "so"
                ? "Naga caawi inaan kuu helno dhakhtarka kugu habboon."
                : "Help us match you to the right therapist."}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
              {lang === "so"
                ? "Noocee daryeel ama la-talin ah ayaad raadinaysaa maanta?"
                : "What type of therapy are you looking for today?"}
            </p>
          </div>

          {/* 3 Intake Option Cards with tactile click feel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {therapyTypes.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedType === item.key;
              return (
                <motion.button
                  key={item.key}
                  onClick={() => {
                    setSelectedType(item.key);
                    setTimeout(() => {
                      onStartQuiz(item.key);
                    }, 200);
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`w-full text-left p-5 sm:p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? "border-[#1e3a2f] bg-[#f5f9f6] shadow-md ring-2 ring-[#1e3a2f]/10"
                      : "border-stone-200/90 hover:border-[#1e3a2f]/50 hover:bg-[#fafaf7] shadow-2xs"
                  }`}
                >
                  <div>
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ background: item.accent, color: item.color }}
                    >
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-base text-[#1a2f25] leading-snug group-hover:text-[#1e3a2f]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1e3a2f]">
                    <span>{lang === "so" ? "Biloow Hadda" : "Get Started"}</span>
                    <div className="w-6 h-6 rounded-full bg-[#1e3a2f] text-white flex items-center justify-center transition-transform group-hover:translate-x-1">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Quick reassurance bottom note */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-2">
              <Lock size={13} className="text-[#4e8a5b]" />
              <span>{lang === "so" ? "Xogtaadu waa 100% qarsoodi" : "Private & HIPAA-grade encrypted"}</span>
            </div>
            <button
              onClick={() => onBrowse()}
              className="font-bold text-[#1e3a2f] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>{lang === "so" ? "Ama eeg dhammaan dhakhaatiirta" : "Or browse all licensed specialists"}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Upcoming Session Notification (if exists) */}
      {upcoming && upcomingTherapist && (
        <section className="max-w-4xl mx-auto px-4 md:px-8 mt-10">
          <div className="bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar therapist={upcomingTherapist} size={48} />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <CalendarDays size={12} />
                  <span>{lang === "so" ? "Kulan Soo Socda" : "Upcoming Session"}</span>
                </div>
                <h4 className="font-bold text-base text-[#1a2f25]">{upcomingTherapist.name}</h4>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  {fmtDate(upcoming.date)} · <span className="text-[#1e3a2f] font-bold">{upcoming.time}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onOpenSession}
              className="px-5 py-2.5 rounded-xl bg-[#1e3a2f] hover:bg-[#14261f] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <span>{lang === "so" ? "Gal Qolka Kulanka" : "Open Video Room"}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* 4. Trust & Clinical Pillars (4 Crisp, High-Contrast Tiles) */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a2f25]">
            {lang === "so" ? "Sababta Barbaar Loo Doorto" : "Why Choose Barbaar"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            {lang === "so"
              ? "Daryeel caafimaad oo xirfad sare leh, ammaan ah, isla markaana ku saleysan dhaqankaaga."
              : "Clinical excellence, cultural fluency, and world-class care built specifically for our community."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: ShieldCheck,
              title: lang === "so" ? "100% Qarsoodi & Ammaan" : "100% Confidential",
              desc: lang === "so" ? "Wadahadallada iyo xogtaadu waa mid si buuxda loo dhowrayo loona sir-yeelay." : "HIPAA-grade end-to-end encrypted video and messaging with strict client privacy.",
              badgeColor: "bg-emerald-50 text-emerald-800",
            },
            {
              icon: Stethoscope,
              title: lang === "so" ? "Dhakhaatiir Shatiyo Leh" : "Licensed Specialists",
              desc: lang === "so" ? "Dhakhaatiir cilmi-nafsi oo heysta shatiyo caalami ah iyo khibrad dheer." : "Vetted clinical psychologists and therapists with verifiable credentials.",
              badgeColor: "bg-teal-50 text-teal-800",
            },
            {
              icon: Globe2,
              title: lang === "so" ? "Meel Kasta Ka Gal" : "Global Online Access",
              desc: lang === "so" ? "Ka gal taleefankaaga, tablet-kaaga ama computer-kaaga meel kasta oo aad joogto." : "Meet securely on phone, tablet, or desktop from anywhere in the world.",
              badgeColor: "bg-blue-50 text-blue-800",
            },
            {
              icon: Award,
              title: lang === "so" ? "Gargaar Maaliyadeed" : "Financial Relief (40%)",
              desc: lang === "so" ? "Qiimo dhimis 40% ah oo loogu talagalay ardayda iyo dakhliga hooseeya." : "Reduced rate program providing 40% assistance for eligible clients in need.",
              badgeColor: "bg-amber-50 text-amber-800",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${item.badgeColor} flex items-center justify-center mb-4`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-bold text-base text-[#1a2f25] mb-2">{item.title}</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Featured Verified Therapists */}
      <section className="bg-[#f4f7f5] py-16 border-y border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#4e8a5b] mb-1">
                {lang === "so" ? "Dhakhaatiirta La Hubiyay" : "Verified Clinical Team"}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a2f25]">
                {lang === "so" ? "La kulan dhakhaatiirta Barbaar" : "Meet Our Licensed Specialists"}
              </h2>
            </div>

            <button
              onClick={() => onBrowse()}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#1e3a2f] hover:underline cursor-pointer"
            >
              <span>{lang === "so" ? "Eeg Dhammaan Dhakhaatiirta" : "Browse All Specialists"}</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTherapists.map((th) => (
              <TherapistCard
                key={th.id}
                t={th}
                onClick={() => onOpenProfile(th.id)}
                lang={lang}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. How Barbaar Works (3 Simple Steps) */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 py-20">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a2f25]">
            {lang === "so" ? "Sidee ayay Barbaar u shaqaysaa?" : "How Barbaar Works"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-2">
            {lang === "so"
              ? "Hel daryeel tayo sare leh 3 tallaabo oo fudud oo ammaan ah."
              : "Get matched and begin your mental healthcare journey in three simple steps."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              step: "01",
              title: lang === "so" ? "Kaga jawaab 1-daqiiqo" : "1. Tell Us Your Needs",
              desc: lang === "so" ? "Ka jawaab su'aalo kooban si aan kuu helno dhakhtarka kugu habboon baahidaada." : "Answer a few brief questions about your preferences, background, and goals.",
            },
            {
              step: "02",
              title: lang === "so" ? "Doorasho & Ballan" : "2. Choose & Schedule",
              desc: lang === "so" ? "Dooro dhakhtarkaaga oo xulo waqtiga kugu habboon jadwalkiisa furan." : "Review matched profiles, select your specialist, and book a convenient time.",
            },
            {
              step: "03",
              title: lang === "so" ? "Kulan Video & Wadahadal" : "3. Private Video & Chat",
              desc: lang === "so" ? "Ku kulma qolka video-ga ee tooska ah oo farriimo kula wadaag meel kasta." : "Connect in HD encrypted video or message your therapist anytime from your device.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 border border-stone-200/80 shadow-2xs relative flex flex-col justify-between"
            >
              <div>
                <div className="text-3xl font-display font-extrabold text-[#4e8a5b] mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg text-[#1a2f25] mb-2">{item.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => onStartQuiz()}
            className="px-8 py-3.5 rounded-full bg-[#1e3a2f] hover:bg-[#14261f] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{lang === "so" ? "Biloow Xulashadaada Hadda" : "Get Matched Now"}</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* 7. Financial Aid Assistance Banner */}
      {setClientProfile && (
        <section className="max-w-5xl mx-auto px-4 md:px-8 pb-12">
          <FinancialAidBanner
            clientProfile={clientProfile}
            setClientProfile={setClientProfile}
            lang={lang}
            variant="home"
            onApplyClick={() => onBrowse()}
          />
        </section>
      )}

      {/* 8. Immediate Crisis Support Notice */}
      <section className="max-w-5xl mx-auto px-4 md:px-8 pb-12">
        <div className="bg-[#fbf4eb] rounded-2xl p-5 sm:p-6 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
              <PhoneCall size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1a2f25]">
                {lang === "so" ? "Ma u baahan tahay gargaar degdeg ah?" : "In need of immediate crisis support?"}
              </h4>
              <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                {lang === "so"
                  ? "Haddii aad ku jirto xaalad halis ah ama qof kale ku jiro, fadlan wac lambarka gurmadka degdegga ah (US: 988, UK: 111/999, Somalia/Global: 112)."
                  : "If you are in immediate danger or facing a mental health emergency, please contact 988 (USA/Canada), 111/999 (UK), or 112 (Global)."}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenLegalPage("about")}
            className="px-4 py-2 rounded-xl bg-white border border-amber-200 text-amber-900 font-bold text-xs hover:bg-amber-50 transition-colors shrink-0 cursor-pointer"
          >
            {lang === "so" ? "Eeg Xogta Caawinta" : "Crisis Resources"}
          </button>
        </div>
      </section>

      {/* 9. Minimalist, Refined Footer */}
      <Footer onOpenLegalPage={onOpenLegalPage} lang={lang} />
    </div>
  );
}
