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
      className="w-[270px] md:w-full shrink-0 md:shrink bg-white rounded-3xl overflow-hidden border border-stone-200/80 hover:border-stone-400/80 shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between transition-all duration-200"
    >
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Specialty Tag/Badge at top */}
        <div className="flex items-center justify-between mb-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: cat.soft, color: cat.color }}
          >
            {cat.icon && <cat.icon size={12} />}
            <span>{catName}</span>
          </span>

          {/* Price badge */}
          <div className="text-right">
            <span className="font-extrabold text-base text-[#1a2f25]">${trans.price}</span>
            <span className="text-[10px] text-stone-400 font-medium ml-1">/{trans.priceUnit === "program" ? (lang === "so" ? "barnaamij" : "prog") : (lang === "so" ? "kulan" : "ses")}</span>
          </div>
        </div>

        {/* Profile Header: Avatar, Name, Credentials */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="relative shrink-0">
            <Avatar therapist={trans} size={48} />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#4e8a5b] border-2 border-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-sm sm:text-base text-[#1a2f25] truncate">
              {trans.name}
            </h4>
            <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
              {trans.credentials}
            </p>
          </div>
        </div>

        {/* Metadata section (Languages & Experience) */}
        <div className="flex flex-wrap gap-2 text-xs text-stone-500 mb-3.5">
          <div className="inline-flex items-center gap-1 bg-stone-100/80 px-2.5 py-1 rounded-lg">
            <Languages size={12} className="text-stone-400" />
            <span className="text-[11px] font-medium">{langStr}</span>
          </div>
          <div className="inline-flex items-center gap-1 bg-stone-100/80 px-2.5 py-1 rounded-lg">
            <Award size={12} className="text-stone-400" />
            <span className="text-[11px] font-medium">{expStr}</span>
          </div>
        </div>

        {/* Short bio */}
        <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4 flex-1">
          {trans.shortBio}
        </p>

        {/* Bottom Bar: Rating & Profile Action */}
        <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold text-stone-800">{trans.rating.toFixed(1)}</span>
            <span className="text-[11px] text-stone-400">{reviewsStr}</span>
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-bold text-[#1e3a2f]">
            <span>{lang === "so" ? "Eeg Xogta" : "View Profile"}</span>
            <motion.span variants={arrowVariants} className="inline-flex items-center">
              <ArrowRight size={13} />
            </motion.span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

