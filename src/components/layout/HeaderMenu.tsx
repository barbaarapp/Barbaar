/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Home, 
  Sparkles, 
  Search, 
  CalendarDays, 
  MessageCircle, 
  User as UserIcon, 
  ShieldCheck, 
  HelpCircle, 
  Award, 
  PhoneCall, 
  LogIn, 
  LogOut, 
  Globe, 
  ArrowRight,
  Stethoscope,
  Lock,
  ChevronRight
} from "lucide-react";
import { Language } from "../../utils/translations";
import { ClientProfile, Booking } from "../../types";
import Wordmark from "../ui/Wordmark";

interface HeaderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onToggleLanguage: () => void;
  onNavigate: (screenKey: string, params?: any) => void;
  onStartQuiz: (categoryKey?: string) => void;
  onOpenLegalPage: (type: "about" | "terms" | "privacy") => void;
  onOpenLoginModal: () => void;
  currentUser: any;
  clientProfile: ClientProfile;
  bookings: Booking[];
  hasUnreadMessages: boolean;
  onLogout: () => void;
  onEnterTherapistMode: () => void;
  onEnterAdminMode: () => void;
}

export default function HeaderMenu({
  isOpen,
  onClose,
  lang,
  onToggleLanguage,
  onNavigate,
  onStartQuiz,
  onOpenLegalPage,
  onOpenLoginModal,
  currentUser,
  clientProfile,
  bookings,
  hasUnreadMessages,
  onLogout,
  onEnterTherapistMode,
  onEnterAdminMode,
}: HeaderMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
          />

          {/* Sliding Menu Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#faf9f6] shadow-2xl flex flex-col justify-between border-l border-stone-200 z-10 overflow-y-auto"
          >
            {/* Menu Header */}
            <div>
              <div className="p-5 sm:p-6 border-b border-stone-200/80 flex items-center justify-between bg-white sticky top-0 z-10">
                <Wordmark size={18} />
                <div className="flex items-center gap-2">
                  {/* Language Switcher inside Menu Header */}
                  <button
                    onClick={onToggleLanguage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-400 bg-stone-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                  >
                    <Globe size={13} className="text-stone-500" />
                    <span>{lang === "so" ? "English" : "Soomaali"}</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* User Profile Bar (if logged in) */}
              {currentUser && (
                <div className="mx-5 my-4 p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1e3a2f] text-white flex items-center justify-center font-bold text-sm">
                      {clientProfile.name ? clientProfile.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#1a2f25]">
                        {clientProfile.name || (lang === "so" ? "Bukaanka Barbaar" : "Barbaar Client")}
                      </div>
                      <div className="text-xs text-stone-500 truncate max-w-[180px]">
                        {currentUser.email || clientProfile.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate("settings");
                    }}
                    className="text-xs font-bold text-[#1e3a2f] hover:underline cursor-pointer"
                  >
                    {lang === "so" ? "Maamul" : "Manage"}
                  </button>
                </div>
              )}

              {/* Main Nav Items Group */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* 1. Therapy Intake & Discovery */}
                <div>
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                    {lang === "so" ? "Daryeelka & Xulashada" : "Intake & Discovery"}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("home");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-stone-800 font-semibold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Home size={17} className="text-[#1e3a2f]" />
                        <span>{lang === "so" ? "Hoyga" : "Home"}</span>
                      </div>
                      <ChevronRight size={15} className="text-stone-400" />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onStartQuiz();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-[#1e3a2f]/5 hover:bg-[#1e3a2f]/10 text-[#1e3a2f] font-bold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles size={17} className="text-[#4e8a5b]" />
                        <span>{lang === "so" ? "Qiimeynta Qofka (Matching)" : "Therapist Matching Assessment"}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[#1e3a2f] text-white text-[10px] font-bold uppercase">
                        {lang === "so" ? "3 Nooc" : "3 Tracks"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("directory");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-stone-800 font-semibold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Search size={17} className="text-stone-600" />
                        <span>{lang === "so" ? "Liiska Dhakhaatiirta (Directory)" : "All Licensed Specialists"}</span>
                      </div>
                      <ChevronRight size={15} className="text-stone-400" />
                    </button>
                  </div>
                </div>

                {/* 2. Patient Hub (Sessions & Messages) */}
                <div>
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                    {lang === "so" ? "Kulamada & Farriimaha" : "Patient Portal"}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("sessions");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-stone-800 font-semibold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarDays size={17} className="text-emerald-700" />
                        <span>{lang === "so" ? "Kulamada Jadwalsan" : "My Scheduled Sessions"}</span>
                      </div>
                      {bookings.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          {bookings.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("chat");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-stone-800 font-semibold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <MessageCircle size={17} className="text-emerald-700" />
                        <span>{lang === "so" ? "Farriimaha Dhakhtarka" : "Direct Messages"}</span>
                      </div>
                      {hasUnreadMessages && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("settings");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-stone-800 font-semibold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <UserIcon size={17} className="text-stone-600" />
                        <span>{lang === "so" ? "Xogta & Xisaabta" : "Account & Preferences"}</span>
                      </div>
                      <ChevronRight size={15} className="text-stone-400" />
                    </button>
                  </div>
                </div>

                {/* 3. Clinical Standards, Financial Relief & Support */}
                <div>
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                    {lang === "so" ? "Xogta & Kaalmada" : "Clinical & Support"}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenLegalPage("about");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-stone-800 font-semibold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck size={17} className="text-[#4e8a5b]" />
                        <span>{lang === "so" ? "Ku Saabsan Barbaar & Shuruucda" : "Clinical Standards & About"}</span>
                      </div>
                      <ChevronRight size={15} className="text-stone-400" />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigate("directory");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white hover:shadow-2xs text-stone-800 font-semibold text-sm transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Award size={17} className="text-amber-600" />
                        <span>{lang === "so" ? "Barnaamijka Gargaarka Maaliyadeed (40%)" : "Financial Relief Program (40%)"}</span>
                      </div>
                      <ChevronRight size={15} className="text-stone-400" />
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenLegalPage("about");
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 font-bold text-sm transition-all cursor-pointer text-left border border-amber-200/60"
                    >
                      <div className="flex items-center gap-3">
                        <PhoneCall size={17} className="text-amber-800" />
                        <span>{lang === "so" ? "Khadka Gurmadka Degdegga ah" : "24/7 Crisis Hotline Info"}</span>
                      </div>
                      <ChevronRight size={15} className="text-amber-600" />
                    </button>
                  </div>
                </div>

                {/* 4. Provider & Admin Switcher */}
                <div className="pt-2 border-t border-stone-200/70">
                  <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                    {lang === "so" ? "Albaabada Kale" : "Portals & Access"}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onClose();
                        onEnterTherapistMode();
                      }}
                      className="p-3 rounded-xl bg-white border border-stone-200 hover:border-[#1e3a2f] text-left text-xs font-bold text-[#1a2f25] transition-all cursor-pointer"
                    >
                      <Stethoscope size={15} className="text-[#4e8a5b] mb-1.5" />
                      <div>{lang === "so" ? "Dhakhtarka" : "Therapist Portal"}</div>
                      <div className="text-[10px] text-stone-400 font-normal">Provider sign-in</div>
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onEnterAdminMode();
                      }}
                      className="p-3 rounded-xl bg-white border border-stone-200 hover:border-stone-500 text-left text-xs font-bold text-[#1a2f25] transition-all cursor-pointer"
                    >
                      <Lock size={15} className="text-stone-600 mb-1.5" />
                      <div>{lang === "so" ? "Maamulka" : "Admin Console"}</div>
                      <div className="text-[10px] text-stone-400 font-normal">Platform control</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Footer */}
            <div className="p-5 border-t border-stone-200/80 bg-white">
              {currentUser ? (
                <button
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full py-2.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>{lang === "so" ? "Ka Bax Xisaabta" : "Sign Out"}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLoginModal();
                  }}
                  className="w-full py-3 rounded-xl bg-[#1e3a2f] hover:bg-[#14261f] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn size={15} />
                  <span>{lang === "so" ? "Gal / Is-diiwaangeli" : "Log In / Register"}</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
