/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2, ArrowLeft, Sparkles, RotateCcw, ArrowRight, ShieldCheck } from "lucide-react";
import { Therapist } from "../../types";
import { CATEGORIES } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import { TherapistCard } from "./TherapistCard";
import { motion } from "motion/react";

interface MatchResultsProps {
  matched: Therapist[];
  category: string;
  onSelect: (id: string) => void;
  onRetake: () => void;
  onBrowseAll: () => void;
  onBack: () => void;
  lang?: Language;
}

export default function MatchResults({
  matched,
  category,
  onSelect,
  onRetake,
  onBrowseAll,
  onBack,
  lang = "en",
}: MatchResultsProps) {
  const [reveal, setReveal] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setReveal(1), 200);
    const t2 = setTimeout(() => setReveal(2), 600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const cat = CATEGORIES[category] || CATEGORIES.cbt;

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-8">
      {/* Top Breadcrumb & Action Row */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-200/80">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-black transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-stone-100"
        >
          <ArrowLeft size={16} />
          <span>{lang === "so" ? "Ku noqo Bogga Hore" : "Home"}</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
          <Sparkles size={12} className="text-emerald-700" />
          <span>{lang === "so" ? "Natiijada Xulashada" : "Clinical Match Recommendation"}</span>
        </span>

        <button
          onClick={onRetake}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e3a2f] hover:underline cursor-pointer py-1 px-2 rounded-lg hover:bg-stone-100"
        >
          <RotateCcw size={13} />
          <span>{lang === "so" ? "Ku celi" : "Retake"}</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Loading / Matched Announcement */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 mb-4 border border-emerald-200/60 shadow-2xs">
            {reveal >= 1 ? (
              <CheckCircle2 size={28} className="text-emerald-700 animate-in zoom-in-75 duration-300" />
            ) : (
              <Loader2 size={24} className="animate-spin text-emerald-700" />
            )}
          </div>

          {reveal < 1 ? (
            <h2 className="text-lg sm:text-xl font-bold text-stone-600">
              {lang === "so" ? "Waxaan kuu raadineynaa dhakhtarka kugu habboon..." : "Matching you with qualified clinicians..."}
            </h2>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-xs font-bold uppercase tracking-wider text-[#4e8a5b] mb-1">
                {lang === "so" ? "Khabiirka Kuugu Habboon" : "Best Recommended Fit"}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1a2f25]">
                {t(cat.name, lang)}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
                {t(cat.short, lang)}
              </p>
            </motion.div>
          )}
        </div>

        {/* Matched Specialist Cards */}
        {reveal >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {matched.map((th) => (
                <TherapistCard
                  key={th.id}
                  t={th}
                  onClick={() => onSelect(th.id)}
                  lang={lang}
                />
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 border-t border-stone-200/60 mt-8">
              <button
                onClick={onBrowseAll}
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-stone-300 hover:border-stone-500 bg-white text-stone-800 font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{lang === "so" ? "Eeg Dhammaan Dhakhaatiirta Kale" : "Browse All Specialists Instead"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
