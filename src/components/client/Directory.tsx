/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { Therapist } from "../../types";
import { CATEGORIES } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import { TherapistCard } from "./TherapistCard";
import EmptyState from "../ui/EmptyState";
import { motion } from "motion/react";
import Footer from "../layout/Footer";

interface DirectoryProps {
  therapists: Therapist[];
  filter: string;
  setFilter: (filter: string) => void;
  onSelect: (id: string) => void;
  onBack: () => void;
  lang?: Language;
  onOpenLegalPage?: (type: "about" | "terms" | "privacy") => void;
}

export default function Directory({
  therapists,
  filter,
  setFilter,
  onSelect,
  onBack,
  lang = "en",
  onOpenLegalPage,
}: DirectoryProps) {
  const [langFilter, setLangFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filtered = useMemo(() => {
    return therapists.filter((t) => {
      // Category filter
      if (filter !== "all" && t.category !== filter) return false;
      // Language filter
      if (langFilter !== "all" && (!t.languages || !t.languages.includes(langFilter))) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesCreds = t.credentials?.toLowerCase().includes(q);
        const matchesBio = t.shortBio?.toLowerCase().includes(q);
        if (!matchesName && !matchesCreds && !matchesBio) return false;
      }
      return true;
    });
  }, [therapists, filter, langFilter, searchQuery]);

  return (
    <div className="w-full min-h-screen pb-16">
      {/* Top Bar / Navigation Header */}
      <div className="sticky top-0 z-40 bg-[#faf9f6]/90 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{lang === "so" ? "Dib u noqo" : "Back"}</span>
          </button>

          <h1 className="text-sm sm:text-base font-bold text-[#1e3a2f]">
            {lang === "so" ? "Dhakhaatiirta & Khabiirada" : "Licensed Specialists"}
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
            <ShieldCheck size={13} className="text-emerald-700" />
            <span>{lang === "so" ? "Shahaadaysan" : "Vetted"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex flex-col gap-6">
        {/* Intro banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-stone-200/60">
          <div>
            <span className="text-xs font-bold tracking-wider text-[#4e8a5b] uppercase mb-1 block">
              {lang === "so" ? "Liiska Khabiirada" : "Direct Provider Directory"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a2f25] tracking-tight">
              {lang === "so" ? "Hel dhakhtarka kugu habboon" : "Connect with specialized care"}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
              {lang === "so"
                ? "Dhammaan dhakhaatiirtu waa khubaro shahaado heysata oo luqadaha Soomaaliga, Ingiriiska ama Carabiga ku hadla."
                : "All specialists are licensed clinicians offering culturally attuned, confidential therapy in Somali, English, and Arabic."}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={lang === "so" ? "Raadi dhakhtar..." : "Search by name or focus..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-full text-xs sm:text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a2f]/20 focus:border-[#1e3a2f] transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Filter Badges: Category & Language */}
        <div className="flex flex-col gap-3">
          {/* Category tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {["all", ...Object.keys(CATEGORIES)].map((k) => {
              const isAll = k === "all";
              const active = filter === k;
              const c = isAll ? null : CATEGORIES[k];

              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#1e3a2f] text-white shadow-xs"
                      : "bg-white text-stone-600 border border-stone-200 hover:border-stone-400"
                  }`}
                >
                  {isAll ? (lang === "so" ? "Dhammaan" : "All Specializations") : t(c?.name || "", lang)}
                </button>
              );
            })}
          </div>

          {/* Language filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-400 font-bold text-[11px] uppercase tracking-wider shrink-0 mr-1">
              {lang === "so" ? "Luqadda:" : "Language:"}
            </span>
            {["all", "Somali", "English", "Arabic"].map((langStr) => {
              const isAll = langStr === "all";
              const active = langFilter === langStr;

              return (
                <button
                  key={langStr}
                  onClick={() => setLangFilter(langStr)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-stone-800 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {isAll ? (lang === "so" ? "Luqad Kasta" : "Any Language") : t(langStr, lang)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specialists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {filtered.map((t) => (
            <TherapistCard
              key={t.id}
              t={t}
              onClick={() => onSelect(t.id)}
              lang={lang}
            />
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center my-4">
            <EmptyState
              icon={Search}
              title={lang === "so" ? "Dhakhtar laguma helin xogtaan" : "No specialists found"}
              sub={lang === "so" ? "Fadlan bedel qeybta ama baaritaankaaga." : "Try adjusting your category or search keywords."}
            />
          </div>
        )}
      </div>

      {onOpenLegalPage && (
        <div className="mt-16 border-t border-stone-200">
          <Footer onOpenLegalPage={onOpenLegalPage} lang={lang} />
        </div>
      )}
    </div>
  );
}
