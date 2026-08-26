/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronRight, ArrowLeft, ShieldCheck, Sparkles, Check } from "lucide-react";
import { QuizOption } from "../../types";
import { translateText as t, Language } from "../../utils/translations";
import { motion } from "motion/react";

interface QuizScreenProps {
  step: number;
  onAnswer: (option: QuizOption) => void;
  onBack: () => void;
  questions: any[];
  lang?: Language;
}

export default function QuizScreen({ step, onAnswer, onBack, questions, lang = "en" }: QuizScreenProps) {
  const q = questions[step];
  if (!q) return null;

  const progressPercent = Math.round(((step + 1) / questions.length) * 100);

  return (
    <div className="w-full min-h-screen bg-[#faf9f6] text-[#1a2f25] pb-16">
      {/* Top Header with Back Button & Progress */}
      <div className="sticky top-0 z-40 bg-[#faf9f6]/95 backdrop-blur-md border-b border-stone-200/80 px-4 py-3 sm:py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-stone-700 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>{lang === "so" ? "Dib u noqo" : "Back"}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-500">
              {lang === "so" ? "Tallaabada" : "Step"} {step + 1}/{questions.length}
            </span>
            <div className="w-24 sm:w-32 h-2 rounded-full bg-stone-200 overflow-hidden">
              <motion.div
                className="h-full bg-[#1e3a2f]"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Intake Form Container */}
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm">
          {/* Header pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-4 border border-emerald-200/60">
            <Sparkles size={13} className="text-emerald-700" />
            <span>{lang === "so" ? "Xulashada Dhakhtarka" : "Therapist Matching Engine"}</span>
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1a2f25] leading-snug mb-6">
            {q.prompt}
          </h2>

          {/* Options list */}
          <div className="space-y-3">
            {q.options.map((opt: QuizOption, i: number) => (
              <motion.button
                key={i}
                onClick={() => onAnswer(opt)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 350, damping: 25 }}
                whileHover={{ scale: 1.01, borderColor: "#1e3a2f" }}
                whileTap={{ scale: 0.985 }}
                className="w-full text-left p-4 sm:p-4.5 rounded-2xl border border-stone-200 hover:border-[#1e3a2f] bg-white hover:bg-[#fafaf7] text-stone-800 font-semibold text-sm transition-all shadow-2xs flex items-center justify-between gap-3 cursor-pointer group"
              >
                <span className="group-hover:text-[#1e3a2f] leading-relaxed">
                  {opt.label}
                </span>
                <div className="w-6 h-6 rounded-full bg-stone-100 group-hover:bg-[#1e3a2f] group-hover:text-white text-stone-500 flex items-center justify-center shrink-0 transition-colors">
                  <ChevronRight size={14} />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Bottom security notice */}
          <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-stone-400">
            <ShieldCheck size={14} className="text-[#4e8a5b]" />
            <span>{lang === "so" ? "Jawaabahaagu waa 100% qarsoodi waxaadna beddeli kartaa xilli kasta" : "Responses are private & confidential. You can switch therapists anytime."}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
