/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Star, Award, Languages, ArrowRight } from "lucide-react";
import { Therapist } from "../../types";
import { colors, CATEGORIES } from "../../constants";
import Avatar from "../ui/Avatar";
import { motion } from "motion/react";
import { translateTherapist, translateText as translate, Language } from "../../utils/translations";

interface TherapistCardProps {
  t: Therapist;
  onClick: () => void;
  lang?: Language;
  key?: React.Key;
}

export function TherapistCard({ t, onClick, lang = "en" }: TherapistCardProps) {
  const trans = translateTherapist(t, lang);
  const defaultCat = {
    key: trans.category,
    name: trans.category,
    short: "",
    icon: null,
    color: colors.indigo,
    soft: colors.indigoSoft,
  };
  const cat = CATEGORIES[trans.category] || defaultCat;
  const catName = translate(cat.name, lang);
  const langStr = trans.languages.join(" · ");
  const expStr = `${trans.experience} ${lang === "so" ? "Sannadood" : "Yrs Exp"}`;
  const reviewsStr = `(${trans.reviews} ${lang === "so" ? "faallo" : "reviews"})`;
  
  const priceLabel = trans.priceUnit === "program" 
    ? `${translate("per program", lang)}` 
    : `${translate("per session", lang)}`;

  const arrowVariants = {
    initial: { x: 0 },
    hover: { x: 4, transition: { type: "spring" as const, stiffness: 400, damping: 10 } }
  };

  return (
    <motion.div
      onClick={onClick}
      initial="initial"
      whileHover="hover"
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className="w-[260px] md:w-full shrink-0 md:shrink"
      style={{
        background: colors.paper,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(56, 76, 67, 0.02)",
        border: `1.5px solid ${colors.line}45`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Subtle top accent line with brand Cagaar or specific category color */}
      <div style={{ height: 4, background: cat.color }} />
      
      <div style={{ padding: "20px 20px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Specialty Tag/Badge at top */}
        <div style={{ display: "flex", marginBottom: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: cat.soft,
              color: cat.color,
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {cat.icon && <cat.icon size={12} />}
            {catName}
          </span>
        </div>

        {/* Profile Header: Avatar, Name, Credentials */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ position: "relative" }}>
            <Avatar therapist={trans} size={46} />
            {/* Tiny green active dot in Cagaar */}
            <span 
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: 10,
                height: 10,
                backgroundColor: colors.acacia,
                borderRadius: "50%",
                border: "2px solid #fff"
              }}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: "14.5px", color: colors.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
              {trans.name}
            </div>
            <div style={{ fontSize: "11px", color: colors.inkSoft, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
              {trans.credentials}
            </div>
          </div>
        </div>

        {/* Metadata section (Languages & Experience) */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", fontSize: "11.5px", color: colors.inkSoft, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Languages size={13} color={colors.inkSoft} style={{ opacity: 0.8 }} />
            <span>{langStr}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Award size={13} color={colors.inkSoft} style={{ opacity: 0.8 }} />
            <span>{expStr}</span>
          </div>
        </div>

        {/* Short bio */}
        <div style={{ 
          fontSize: "12.5px", 
          color: colors.inkSoft, 
          lineHeight: 1.45, 
          marginBottom: 16,
          flex: 1,
          display: "-webkit-box", 
          WebkitLineClamp: 3, 
          WebkitBoxOrient: "vertical", 
          overflow: "hidden" 
        }}>
          {trans.shortBio}
        </div>

        {/* Bottom Section: Separator and Rating/Pricing/Action */}
        <div style={{ borderTop: `1px dashed ${colors.line}60`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Rating styled with Cagaar (wellness green) for custom touch */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={13} color={colors.acacia} fill={colors.acacia} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: colors.ink }}>{trans.rating.toFixed(1)}</span>
              <span style={{ fontSize: "11px", color: colors.inkSoft, opacity: 0.8 }}>{reviewsStr}</span>
            </div>

            {/* Price styled in our brand Dark color */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ fontSize: "15px", fontWeight: 800, color: colors.indigo }}>
                ${trans.price}
              </div>
              <div style={{ fontSize: "9.5px", color: colors.inkSoft, fontWeight: 500 }}>
                {priceLabel}
              </div>
            </div>
          </div>

          {/* Micro Action link styled in our brand Dark color */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: "11.5px", fontWeight: 700, color: colors.indigo, marginTop: 4 }}>
            <span>{lang === "so" ? "Eeg Xogta" : "View Profile"}</span>
            <motion.span variants={arrowVariants} style={{ display: "inline-flex", alignItems: "center" }}>
              <ArrowRight size={13} />
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

