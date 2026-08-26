/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowLeft, ShieldCheck, Sparkles, Check, Lock, ChevronRight } from "lucide-react";
import { QuizOption } from "../../types";
import { translateText as t, Language } from "../../utils/translations";
import { motion, AnimatePresence } from "motion/react";

interface QuizScreenProps {
  step: number;
  onAnswer: (option: QuizOption) => void;
  onBack: () => void;
  questions: any[];
  lang?: Language;
}

export default function QuizScreen({ step, onAnswer, onBack, questions, lang = "en" }: QuizScreenProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const q = questions[step];
  if (!q) return null;

  const progressPercent = Math.round(((step + 1) / questions.length) * 100);

  const handleSelect = (opt: QuizOption, index: number) => {
    setSelectedIdx(index);
    // Smooth 150ms tactile feedback delay before advancing
    setTimeout(() => {
      onAnswer(opt);
      setSelectedIdx(null);
    }, 160);
  };

  return (
    <div className="w-full min-h-[85vh] flex flex-col justify-between py-4 sm:py-6">
      {/* Top Header & Progress */}
      <div className="w-full max-w-xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-black transition-colors cursor-pointer py-1 px-2 -ml-2 rounded-lg hover:bg-stone-100"
          >
            <ArrowLeft size={16} />
            <span>{lang === "so" ? "Dib u noqo" : "Back"}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-stone-500">
              {lang === "so" ? "Su'aasha" : "Question"} {step + 1} / {questions.length}
            </span>
            <div className="w-24 sm:w-28 h-2 rounded-full bg-stone-200 overflow-hidden">
              <motion.div
                className="h-full bg-[#1e3a2f]"
                initial={{ width: `${((step) / questions.length) * 100}%` }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Intake Question Container — Seamless Vertical Flow */}
      <div className="w-full max-w-xl mx-auto px-4 my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm"
          >
            {/* Header pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-4 border border-emerald-200/60">
              <Sparkles size={13} className="text-emerald-700" />
              <span>{lang === "so" ? "Xulashada Tooska ah" : "Intake Assessment"}</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#1a2f25] leading-snug mb-6">
              {q.prompt}
            </h2>

            {/* Seamless Options list */}
            <div className="space-y-3">
              {q.options.map((opt: QuizOption, i: number) => {
                const isSelected = selectedIdx === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt, i)}
                    disabled={selectedIdx !== null}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border text-sm font-medium transition-all duration-150 flex items-center justify-between gap-3.5 cursor-pointer select-none ${
                      isSelected
                        ? "border-[#1e3a2f] bg-[#f2f7f4] text-[#1e3a2f] ring-2 ring-[#1e3a2f]/15 shadow-sm font-bold"
                        : "border-stone-200/90 hover:border-[#1e3a2f]/60 bg-white hover:bg-[#fafaf7] text-stone-800 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Check/Radio indicator */}
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-[#1e3a2f] bg-[#1e3a2f] text-white"
                            : "border-stone-300 bg-stone-50"
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="leading-relaxed truncate-lines-2">
                        {opt.label}
                      </span>
                    </div>

                    <ChevronRight 
                      size={15} 
                      className={`shrink-0 transition-transform ${
                        isSelected ? "text-[#1e3a2f] translate-x-0.5" : "text-stone-400"
                      }`} 
                    />
                  </button>
                );
              })}
            </div>

            {/* Security and privacy reassurance */}
            <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-stone-400">
              <Lock size={13} className="text-[#4e8a5b]" />
              <span>
                {lang === "so" 
                  ? "Jawaabahaagu waa 100% qarsoodi. Waxaad beddeli kartaa dhakhtarkaaga xilli kasta." 
                  : "Answers are private & confidential. You can switch therapists anytime."}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full py-2" />
    </div>
  );
}
