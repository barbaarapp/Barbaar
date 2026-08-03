/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Search } from "lucide-react";
import { Therapist } from "../../types";
import { CATEGORIES, colors } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import TopBar from "../ui/TopBar";
import EmptyState from "../ui/EmptyState";
import TherapistRow from "./TherapistRow";
import { motion } from "motion/react";


interface DirectoryProps {
  therapists: Therapist[];
  filter: string;
  setFilter: (filter: string) => void;
  onSelect: (id: string) => void;
  onBack: () => void;
  lang?: Language;
}

export default function Directory({
  therapists,
  filter,
  setFilter,
  onSelect,
  onBack,
  lang = "en",
}: DirectoryProps) {
  const [langFilter, setLangFilter] = React.useState<string>("all");

  const filteredByCategory = filter === "all" ? therapists : therapists.filter((t) => t.category === filter);
  const filtered = langFilter === "all"
    ? filteredByCategory
    : filteredByCategory.filter((t) => t.languages && t.languages.includes(langFilter));

  return (
    <div>
      <TopBar title={t("All therapists", lang)} onBack={onBack} />
      {/* Horizontal Category filter scrollbar */}
      <div style={{ display: "flex", gap: 8, padding: "16px 20px 8px", overflowX: "auto" }}>
        {["all", ...Object.keys(CATEGORIES)].map((k) => {
          const isAll = k === "all";
          const active = filter === k;
          const c = isAll ? null : CATEGORIES[k];

          return (
            <motion.button
              key={k}
              onClick={() => setFilter(k)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                flexShrink: 0,
                padding: "9px 15px",
                borderRadius: 999,
                border: `1.5px solid ${active ? "transparent" : colors.line}`,
                background: active ? (isAll ? colors.indigo : c?.color) : colors.paper,
                color: active ? "#fff" : colors.ink,
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isAll ? t("All", lang) : t(c?.name || "", lang)}
            </motion.button>
          );
        })}
      </div>

      {/* Horizontal Language filter scrollbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 20px 16px", overflowX: "auto" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0, marginRight: 4 }}>
          {t("Language:", lang)}
        </span>
        {["all", "Somali", "English", "Arabic"].map((langStr) => {
          const isAll = langStr === "all";
          const active = langFilter === langStr;

          return (
            <motion.button
              key={langStr}
              onClick={() => setLangFilter(langStr)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                flexShrink: 0,
                padding: "6px 12px",
                borderRadius: 999,
                border: `1.5px solid ${active ? "transparent" : colors.line}`,
                background: active ? colors.indigo : colors.paper,
                color: active ? "#fff" : colors.ink,
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isAll ? t("Any", lang) : t(langStr, lang)}
            </motion.button>
          );
        })}
      </div>

      {/* Directory grid */}
      <div
        style={{
          padding: "4px 20px 24px",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 10,
        }}
        className="directory-grid"
      >
        {filtered.map((t) => (
          <TherapistRow key={t.id} t={t} onClick={() => onSelect(t.id)} />
        ))}
        {filtered.length === 0 && (
          <EmptyState
            icon={Search}
            title={t("No therapists here yet", lang)}
            sub={t("Try another category.", lang)}
          />
        )}
      </div>

      <style>{`
        @media (min-width: 700px) {
          .directory-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
