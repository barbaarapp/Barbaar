/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Therapist } from "../../types";
import { CATEGORIES, colors } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import GrowthArc from "../ui/GrowthArc";
import Button from "../ui/Button";
import TherapistRow from "./TherapistRow";

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
    const t1 = setTimeout(() => setReveal(1), 250);
    const t2 = setTimeout(() => setReveal(2), 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const cat = CATEGORIES[category] || CATEGORIES.cbt;

  return (
    <div>
      <TopBar title={t("Your match", lang)} onBack={onBack} />
      <div style={{ padding: "32px 22px", textAlign: "center" }}>
        <GrowthArc value={reveal >= 1 ? 100 : 8} size={84} stroke={7} color={cat.color}>
          {reveal >= 1 ? (
            <CheckCircle2 size={30} color={cat.color} className="pop-in" />
          ) : (
            <Loader2
              size={24}
              color={cat.color}
              style={{ animation: "spin 1s linear infinite" }}
            />
          )}
        </GrowthArc>
        {reveal < 1 && (
          <div style={{ marginTop: 14, fontSize: 14, color: colors.indigoSoft }}>
            {t("Finding your match…", lang)}
          </div>
        )}
        {reveal >= 1 && (
          <div className="fade-up">
            <div
              className="font-display"
              style={{
                fontSize: 21,
                fontWeight: 600,
                marginTop: 16,
                color: colors.ink,
              }}
            >
              {t(cat.name, lang)} {t("feels right for you", lang)}
            </div>
            <div style={{ fontSize: 14, color: colors.inkSoft, marginTop: 4 }}>
              {t(cat.short, lang)}
            </div>
          </div>
        )}
      </div>

      {reveal >= 2 && (
        <div className="fade-up" style={{ padding: "0 20px" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 10,
            }}
          >
            {t("Recommended for you", lang)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
            {matched.map((tItem, index) => (
              <TherapistRow key={tItem.id} t={tItem} onClick={() => onSelect(tItem.id)} badge={index === 0 ? t("Best Match", lang) : undefined} />
            ))}
          </div>
          <Button full variant="ghost" onClick={onBrowseAll}>
            {t("Browse everyone instead", lang)}
          </Button>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button
              onClick={onRetake}
              style={{
                background: "none",
                border: "none",
                color: colors.indigo,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("Retake the quiz", lang)}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
