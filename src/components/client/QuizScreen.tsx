/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChevronRight } from "lucide-react";
import { colors } from "../../constants";
import { QuizOption } from "../../types";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import GrowthArc from "../ui/GrowthArc";
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

  return (
    <div>
      <TopBar
        title={t("Find your match", lang)}
        onBack={onBack}
        right={
          <GrowthArc
            value={(step / questions.length) * 100}
            size={34}
            stroke={4}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: colors.ink }}>
              {step + 1}/{questions.length}
            </span>
          </GrowthArc>
        }
      />
      <div key={q.id} className="fade-up" style={{ padding: "28px 22px" }}>
        <div
          className="font-display"
          style={{
            fontSize: 23,
            fontWeight: 500,
            color: colors.ink,
            lineHeight: 1.3,
            marginBottom: 24,
          }}
        >
          {q.prompt}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt: QuizOption, i: number) => (
            <motion.button
              key={i}
              onClick={() => onAnswer(opt)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 350, damping: 25 }}
              whileHover={{ scale: 1.015, borderColor: `${colors.indigo}80`, boxShadow: "0 6px 16px rgba(0,0,0,0.02)" }}
              whileTap={{ scale: 0.985 }}
              style={{
                textAlign: "left",
                padding: "16px 18px",
                borderRadius: 16,
                border: `1.5px solid ${colors.line}`,
                background: colors.paper,
                fontSize: 15,
                color: colors.ink,
                fontWeight: 500,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <span>{opt.label}</span>
              <ChevronRight
                size={17}
                color={colors.inkSoft}
                style={{ flexShrink: 0 }}
              />
            </motion.button>
          ))}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 12.5,
            color: colors.inkSoft,
            textAlign: "center",
          }}
        >
          {t("No wrong answers — you can change therapists any time.", lang)}
        </div>
      </div>
    </div>
  );
}

