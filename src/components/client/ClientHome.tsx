/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  ChevronRight, 
  ChevronLeft,
  Sparkles, 
  User as UserIcon, 
  HeartHandshake, 
  Brain, 
  Flame,
  ShieldCheck, 
  Lock,
  Globe2,
  CalendarDays,
  MessageCircle,
  Check, 
  ArrowRight,
  PhoneCall,
  Star,
  Clock,
  Video,
  Award,
  CheckCircle2
} from "lucide-react";
import { Therapist, Booking, ClientProfile } from "../../types";
import { fmtDate } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
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
  onOpenMenu?: () => void;
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
  onOpenMenu,
}: ClientHomeProps) {
  const lang: Language = clientProfile.language || "en";
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeTrustTab, setActiveTrustTab] = useState<number>(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Find the first upcoming session sorted by date
  const upcoming = bookings
    .filter((b) => b.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const upcomingTherapist = upcoming
    ? therapists.find((t) => t.id === upcoming.therapistId)
    : null;

  const activeTherapists = therapists.filter((t) => t.active);

  const scrollSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -330 : 330;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const therapyTracks = [
    {
      key: "cbt",
      title: lang === "so" ? "Qof ahaan (Individual)" : "Individual Therapy",
      target: lang === "so" ? "Naftaada & Caafimaadkaaga" : "For Myself",
      subtitle: lang === "so" 
        ? "Walbahaarka, niyad-jabka, xasiloonida maskaxda & koritaanka nafta" 
        : "For depression, anxiety, work stress, or navigating emotional balance",
      icon: Brain,
      color: "#2d4f40",
      accent: "#eaf2ec",
      badge: lang === "so" ? "Ugu Doonashada Badan" : "Most Popular",
    },
    {
      key: "couples",
      title: lang === "so" ? "Lamaanaha (Couples)" : "Couples & Marriage",
      target: lang === "so" ? "Aniga & Lamaanahayga" : "For Myself & Partner",
      subtitle: lang === "so" 
        ? "Wada-xiriirka, xallinta khilaafaadka & dhisidda kalsoonida qoyska" 
        : "Communication, conflict repair, trust, and pre-marital guidance",
      icon: HeartHandshake,
      color: "#b56254",
      accent: "#fbf2f0",
      badge: lang === "so" ? "Wadajir" : "Partnership",
    },
    {
      key: "teen",
      title: lang === "so" ? "Isbeddelka (Transformation)" : "6-Week Intensive",
      target: lang === "so" ? "Qorshe 6-Toddobaad ah" : "Milestone Coaching",
      subtitle: lang === "so" 
        ? "Tababar qorsheysan, yoolal nololeed & jebinta caadooyinka xunxun" 
        : "Structured milestones for high performers, identity, and deep change",
      icon: Flame,
      color: "#c07a34",
      accent: "#faf2e8",
      badge: lang === "so" ? "Intensive" : "Goal-Oriented",
    },
  ];

  const clinicalTrustFeatures = [
    {
      id: "vetting",
      title: lang === "so" ? "Shahaadooyin & Shatiyo La Hubiyay" : "Verified Clinical Licensure",
      subtitle: lang === "so" ? "Khabiir kasta waxaa la mariyaa baaris adag oo xirfadeed" : "Rigorous credential verification against medical licensing boards",
      icon: ShieldCheck,
      color: "text-emerald-800",
      bg: "bg-emerald-50",
      badge: lang === "so" ? "100% Shahaadaysan" : "100% Licensed",
      stat: "100%",
      statLabel: lang === "so" ? "Dhakhaatiir Shatiyo Leh" : "Licensed Clinicians",
      details: [
        lang === "so" ? "Dhammaan khabiirada waxay heystaan shahaado heer Master ama PhD ah" : "All clinicians hold verified Master's or Doctoral degrees in clinical psychology",
        lang === "so" ? "Hubinta shatiga shaqada iyo taariikhda xirfadeed ee dalalka kala duwan" : "Independent credential checks with regulatory boards in USA, UK, EU, and East Africa",
        lang === "so" ? "Kormeer joogto ah iyo tababarro casri ah oo ku saabsan daryeelka tayada leh" : "Continuous clinical peer review and evidence-based therapeutic supervision",
      ],
      actionText: lang === "so" ? "Eeg Dhammaan Dhakhaatiirta" : "Browse Licensed Specialists",
      actionType: "directory",
    },
    {
      id: "culture",
      title: lang === "so" ? "Dhaqan & Luqad Faham Buuxa" : "Cultural & Faith Fluency",
      subtitle: lang === "so" ? "Afkaaga iyo dareenkaaga oo aan fasiraad dheeraad ah u baahnayn" : "Compassionate therapy that honors your heritage and faith without judgment",
      icon: Globe2,
      color: "text-teal-800",
      bg: "bg-teal-50",
      badge: lang === "so" ? "Af-Soomaali & Diin" : "Bilingual & Stigma-Free",
      stat: "3+",
      statLabel: lang === "so" ? "Luqadood (Soomaali, EN, Carabi)" : "Languages Spoken",
      details: [
        lang === "so" ? "Khabiirro si dabiici ah u yaqaanna af-Soomaaliga, dhaqanka iyo qiyamka suuban" : "Native fluency in Somali, English, and Arabic to express complex emotional nuances",
        lang === "so" ? "Faham qoto dheer oo ku saabsan qoyska, hijrada iyo culaysyada bulshada" : "Deep understanding of diaspora migration, multi-generational dynamics, and expectations",
        lang === "so" ? "Meel ammaan ah oo aan lagaa xukumin, loona dhowrayo waxyaabaha aad aaminsan tahay" : "Compassionate, faith-sensitive environment free from social stigma",
      ],
      actionText: lang === "so" ? "Biloow Xulashadaada" : "Find Your Matched Specialist",
      actionType: "quiz",
    },
    {
      id: "privacy",
      title: lang === "so" ? "100% Qarsoodi & Sir-Ilaalin" : "Bank-Grade Privacy & Encryption",
      subtitle: lang === "so" ? "Xogtaada lama iibiyo, cidina ma arki karto wadahadalkaaga" : "End-to-end encrypted video rooms and private messaging protocols",
      icon: Lock,
      color: "text-blue-800",
      bg: "bg-blue-50",
      badge: lang === "so" ? "Sir Buuxda" : "HIPAA & GDPR Compliant",
      stat: "256-bit",
      statLabel: lang === "so" ? "Sir-Yeelid TLS/SSL" : "TLS/SSL Encryption",
      details: [
        lang === "so" ? "Muuqaalka tooska ah iyo farriimuhu waxay u dhacaan si buuxda oo qarsoodi ah" : "Encrypted WebRTC peer-to-peer video rooms and secure chat channels",
        lang === "so" ? "Xogtaada caafimaad marnaba lama wadaago hay'ado saddexaad ama suuqgeyn" : "Zero third-party telemetry or ad trackers — absolute client confidentiality",
        lang === "so" ? "Waxaad xisaabtaada iyo taariikhdaada tiri kartaa xilli kasta" : "Full data autonomy with complete account and transcript deletion at any time",
      ],
      actionText: lang === "so" ? "Akhri Shuruucda Qarsoodiga" : "Read Privacy Policy",
      actionType: "privacy",
    },
    {
      id: "relief",
      title: lang === "so" ? "Gargaar Maaliyadeed (40% Qiimo Dhimis)" : "Financial Relief Program (40%)",
      subtitle: lang === "so" ? "Daryeel caafimaad oo qof kasta oo u baahan awoodi karo" : "Reduced rate program for students, job seekers, and low-income families",
      icon: Award,
      color: "text-amber-800",
      bg: "bg-amber-50",
      badge: lang === "so" ? "Kaalmo 40%" : "40% Relief",
      stat: "40%",
      statLabel: lang === "so" ? "Qiimo Dhimis Toos ah" : "Direct Rate Reduction",
      details: [
        lang === "so" ? "Qiimo dhimis toos ah oo loogu talagalay ardayda iyo dadka dakhligoodu yar yahay" : "Sliding scale financial relief applying a 40% reduction across all sessions",
        lang === "so" ? "Hab codsi fudud oo aan u baahnayn waraaqo badan ama dib u dhac" : "Instant, self-attested application with immediate checkout qualification",
        lang === "so" ? "Taageero buuxda oo lacag-bixinta taleefanka (Zaad, Sahal, EVC Plus) iyo kaararka" : "Multiple flexible payment methods including mobile money and international cards",
      ],
      actionText: lang === "so" ? "Codso Gargaarka Maaliyadeed" : "Apply for Financial Relief",
      actionType: "directory",
    },
  ];

  const currentTrust = clinicalTrustFeatures[activeTrustTab];

  return (
    <div className="w-full min-h-screen bg-[#faf9f6] text-[#1a2f25]">
      {/* 1. Hero Section — BetterHelp / Modern Clinical Aesthetics */}
      <section className="relative w-full bg-[#173024] text-white pt-10 pb-20 sm:pt-14 sm:pb-24 overflow-hidden">
        {/* Ambient subtle light accents */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#4e8a5b] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#2a5142] blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Reassuring badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xs text-xs font-medium text-emerald-200 mb-5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>{lang === "so" ? "100% Qarsoodi · Dhakhaatiir Soomaaliyeed oo Shatiyo Leh" : "100% Confidential · Vetted Somali Clinicians"}</span>
          </div>

          {/* Primary Display Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.18] mb-4">
            {lang === "so" ? (
              <>
                Daryeel cilmi-nafsi oo casri ah, laguna hadlayo{" "}
                <span className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-6">
                  afkaaga
                </span>
                .
              </>
            ) : (
              <>
                Professional, licensed therapy tailored to{" "}
                <span className="text-emerald-300 underline decoration-emerald-400/40 underline-offset-6">
                  you
                </span>
                .
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-stone-300 leading-relaxed max-w-xl mx-auto font-normal mb-8">
            {lang === "so"
              ? "Ku xirnow dhakhaatiir iyo khubaro cilmi-nafsi oo shati leh, ku hadla af-Soomaali, fahamsan dhaqankaaga meel kasta oo aad dunida kaga sugan tahay."
              : "Connect with vetted, licensed Somali-speaking therapists and psychologists worldwide for private video, phone, and messaging therapy."}
          </p>

          {/* Quick reassurance metrics */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-stone-300/80">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>{lang === "so" ? "Ma jiro saf sugitaan" : "No waiting lists"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>{lang === "so" ? "Xulasho 2 daqiiqo gudahood" : "Matched in < 2 mins"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>{lang === "so" ? "Beddel dhakhtarka xilli kasta" : "Switch therapist anytime"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Unified Intake Flow (3 Clear Cards — BetterHelp Style) */}
      <section className="relative max-w-4xl mx-auto px-4 sm:px-6 -mt-12 z-20">
        <div className="bg-white rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl border border-stone-200/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-stone-100">
            <div>
              <div className="text-[11px] font-bold text-[#4e8a5b] uppercase tracking-wider">
                {lang === "so" ? "Nidaamka Xulashada Tooska ah" : "Therapist Matching Console"}
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#1a2f25]">
                {lang === "so"
                  ? "Noocee daryeel ayaad raadinaysaa maanta?"
                  : "What type of therapy are you looking for?"}
              </h2>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {lang === "so" ? "Xulo qeybta kugu habboon" : "Select an intake category"}
            </span>
          </div>

          {/* 3 Streamlined Intake Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {therapyTracks.map((item) => {
              const Icon = item.icon;
              const isSelected = selectedType === item.key;
              return (
                <motion.button
                  key={item.key}
                  onClick={() => {
                    setSelectedType(item.key);
                    setTimeout(() => {
                      onStartQuiz(item.key);
                    }, 140);
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? "border-[#1e3a2f] bg-[#f5f9f6] shadow-md ring-2 ring-[#1e3a2f]/15"
                      : "border-stone-200/85 hover:border-[#1e3a2f]/50 hover:bg-[#fafaf7] shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                        style={{ background: item.accent, color: item.color }}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                        {item.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {item.target}
                    </div>
                    <h3 className="font-bold text-base text-[#1a2f25] leading-snug group-hover:text-[#1e3a2f] mt-0.5">
                      {item.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-[#1e3a2f]">
                    <span>{lang === "so" ? "Biloow Qiimeynta" : "Start Assessment"}</span>
                    <div className="w-5 h-5 rounded-full bg-[#1e3a2f] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Quick reassurance bottom bar */}
          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <Lock size={13} className="text-[#4e8a5b]" />
              <span>{lang === "so" ? "Xogtaadu waa 100% qarsoodi waxaana lagu ilaaliyaa shuruucda caafimaadka" : "Private, confidential & HIPAA-compliant"}</span>
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

      {/* 3. Upcoming Session Notification (if active) */}
      {upcoming && upcomingTherapist && (
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
          <div className="bg-white rounded-2xl p-5 border border-emerald-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
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
              <Video size={14} />
              <span>{lang === "so" ? "Gal Qolka Kulanka" : "Enter Video Room"}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </section>
      )}

      {/* 4. How Barbaar Works (3 Simple Steps) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-[#4e8a5b] mb-1">
            {lang === "so" ? "Tallaabooyinka Fudud" : "Simple Process"}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a2f25]">
            {lang === "so" ? "Sidee ayay Barbaar u shaqaysaa?" : "How Barbaar Works"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
            {lang === "so"
              ? "Hel daryeel tayo sare leh 3 tallaabo oo fudud oo ammaan ah."
              : "Get matched and begin your mental healthcare journey in three simple steps."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              step: "01",
              title: lang === "so" ? "Ka jawaab su'aalo kooban" : "1. Take Quick Assessment",
              desc: lang === "so" ? "Ka jawaab su'aalo kooban si aan kuu helno dhakhtarka kugu habboon baahidaada iyo waqtigaaga." : "Answer a few brief questions about your goals, preferences, and background.",
            },
            {
              step: "02",
              title: lang === "so" ? "Xulo dhakhtarkaaga" : "2. Choose Your Clinician",
              desc: lang === "so" ? "Dooro dhakhtarkaaga kuugu habboon oo xulo waqtiga kugu habboon jadwalkiisa furan." : "Review matched profiles, select your specialist, and book a convenient session.",
            },
            {
              step: "03",
              title: lang === "so" ? "Kulan Video & Farriimo" : "3. Private Video & Chat",
              desc: lang === "so" ? "Ku kulma qolka video-ga ee tooska ah oo farriimo kula wadaag meel kasta oo aad joogto." : "Connect in HD encrypted video or message your therapist anytime from your device.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs relative flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl font-display font-extrabold text-[#4e8a5b] mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold text-base sm:text-lg text-[#1a2f25] mb-2">{item.title}</h3>
                <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => onStartQuiz()}
            className="px-8 py-3 rounded-full bg-[#1e3a2f] hover:bg-[#14261f] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{lang === "so" ? "Biloow Xulashadaada Hadda" : "Get Matched Now"}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* 5. Minimalist Interactive Therapist Slides / Carousel */}
      <section className="bg-[#f4f7f5] py-16 border-y border-stone-200/70 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#4e8a5b] mb-1">
                {lang === "so" ? "Khabiirada La Hubiyay" : "Verified Specialists"}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a2f25]">
                {lang === "so" ? "La kulan dhakhaatiirta Barbaar" : "Meet Our Licensed Specialists"}
              </h2>
            </div>

            {/* Carousel Navigation Buttons & Directory link */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onBrowse()}
                className="text-xs font-bold text-[#1e3a2f] hover:underline cursor-pointer mr-2"
              >
                {lang === "so" ? "Eeg Dhammaan" : "View All"}
              </button>

              <button
                onClick={() => scrollSlider("left")}
                className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                aria-label="Previous therapists"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollSlider("right")}
                className="w-9 h-9 rounded-full bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                aria-label="Next therapists"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Horizontal Smooth Swipeable Slider */}
          <div
            ref={sliderRef}
            className="flex items-stretch gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {activeTherapists.map((th) => (
              <div key={th.id} className="snap-start shrink-0 w-[280px] sm:w-[310px]">
                <TherapistCard
                  t={th}
                  onClick={() => onOpenProfile(th.id)}
                  lang={lang}
                />
              </div>
            ))}
          </div>

          {/* Slider navigation hint */}
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-stone-400">
            <span>← {lang === "so" ? "U jiid bidix/midig" : "Swipe horizontally to explore"} →</span>
          </div>
        </div>
      </section>

      {/* 6. Clinical Standards & Trust Console */}
      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="text-xs font-bold uppercase tracking-wider text-[#4e8a5b] mb-1">
            {lang === "so" ? "Halbeega Tayada & Shuruucda" : "Clinical & Ethical Standards"}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a2f25]">
            {lang === "so" ? "Sababta Barbaar Loo Doorto" : "Why Choose Barbaar"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
            {lang === "so"
              ? "Daryeel caafimaad oo xirfad sare leh, ammaan ah, isla markaana ku saleysan dhaqankaaga."
              : "Clinical excellence, cultural fluency, and world-class care built specifically for our community."}
          </p>
        </div>

        {/* Dual-Pane Trust Console */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-sm">
          {/* Left: Tab Selectors */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            {clinicalTrustFeatures.map((item, idx) => {
              const Icon = item.icon;
              const isActive = activeTrustTab === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTrustTab(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                    isActive
                      ? "bg-[#f5f9f6] border-[#1e3a2f] shadow-xs"
                      : "bg-stone-50/50 border-stone-200/70 hover:bg-stone-50 hover:border-stone-300"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-sm font-bold truncate ${isActive ? "text-[#1e3a2f]" : "text-[#1a2f25]"}`}>
                        {item.title}
                      </h4>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-[#4e8a5b]" />
                      )}
                    </div>
                    <p className="text-xs text-stone-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Active Detail Pane */}
          <div className="lg:col-span-7 bg-[#faf9f6] rounded-2xl p-6 sm:p-8 border border-stone-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-200/60">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-bold text-[#1e3a2f] shadow-2xs">
                  <currentTrust.icon size={13} className="text-[#4e8a5b]" />
                  <span>{currentTrust.badge}</span>
                </span>

                <div className="text-right">
                  <span className="font-extrabold text-xl sm:text-2xl text-[#1a2f25]">{currentTrust.stat}</span>
                  <span className="text-[11px] text-stone-500 font-medium block">{currentTrust.statLabel}</span>
                </div>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-bold text-[#1a2f25] mb-2">
                {currentTrust.title}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mb-5 leading-relaxed">
                {currentTrust.subtitle}
              </p>

              {/* Checklist details */}
              <div className="space-y-3 mb-6">
                {currentTrust.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-xs text-stone-700 font-medium leading-relaxed">
                      {detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Action Link */}
            <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between">
              <button
                onClick={() => {
                  if (currentTrust.actionType === "directory") onBrowse();
                  else if (currentTrust.actionType === "quiz") onStartQuiz();
                  else if (currentTrust.actionType === "privacy") onOpenLegalPage("privacy");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1e3a2f] hover:bg-[#14261f] text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>{currentTrust.actionText}</span>
                <ArrowRight size={13} />
              </button>

              <span className="text-[11px] text-stone-400 font-medium hidden sm:inline">
                {lang === "so" ? "Dammaanad qaad rasmi ah" : "Verified Clinical Standard"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Financial Aid Assistance Banner */}
      {setClientProfile && (
        <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-10">
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
      <section className="max-w-5xl mx-auto px-4 sm:px-8 pb-12">
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
