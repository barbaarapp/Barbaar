/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { colors } from "../../constants";
import { Language, translateText as t } from "../../utils/translations";
import Wordmark from "../ui/Wordmark";

interface FooterProps {
  onOpenLegalPage: (type: "about" | "terms" | "privacy") => void;
  lang?: Language;
  className?: string;
}

export default function Footer({ onOpenLegalPage, lang = "en", className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`w-full border-t border-stone-200/80 bg-transparent ${className}`}
      style={{
        paddingTop: "36px",
        paddingBottom: "36px",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 md:gap-8">
          {/* Brand & Mission Tagline */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md">
            <div className="mb-2.5">
              <Wordmark size={17} />
            </div>
            {/* One minimalist line to know about Barbaar Wellness */}
            <p
              className="text-xs md:text-sm leading-relaxed"
              style={{ color: colors.inkSoft }}
            >
              {lang === "so"
                ? "Barbaar Wellness waxay bulshada Soomaaliyeed ee aduunka ku xidhiidhisaa daryeel maskaxeed oo ammaan ah, kalsooni leh, dhaqankana ku saleysan."
                : "Barbaar Wellness connects Somali individuals and families worldwide with culturally-grounded, confidential, and licensed mental healthcare."}
            </p>
          </div>

          {/* Quick Legal & Informational Links */}
          <div className="flex flex-col items-center md:items-end gap-3.5">
            <nav
              aria-label="Footer Quick Links"
              className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs font-semibold"
              style={{ color: colors.ink }}
            >
              <button
                type="button"
                onClick={() => onOpenLegalPage("about")}
                className="px-2 py-1 rounded transition-colors hover:text-[#384c43] hover:underline cursor-pointer"
                style={{ color: colors.ink }}
              >
                {lang === "so" ? "Ku Saabsan" : "About Us"}
              </button>
              <span className="text-stone-300 select-none">•</span>
              <button
                type="button"
                onClick={() => onOpenLegalPage("terms")}
                className="px-2 py-1 rounded transition-colors hover:text-[#384c43] hover:underline cursor-pointer"
                style={{ color: colors.ink }}
              >
                {lang === "so" ? "Shuruudaha Adeegga" : "Terms of Service"}
              </button>
              <span className="text-stone-300 select-none">•</span>
              <button
                type="button"
                onClick={() => onOpenLegalPage("privacy")}
                className="px-2 py-1 rounded transition-colors hover:text-[#384c43] hover:underline cursor-pointer"
                style={{ color: colors.ink }}
              >
                {lang === "so" ? "Xog-dhawrka (Privacy)" : "Privacy Policy"}
              </button>
            </nav>

            {/* Minimalist Copyright */}
            <div
              className="text-[11px] tracking-wide"
              style={{ color: `${colors.inkSoft}B3` }}
            >
              © {currentYear} Barbaar Wellness.{" "}
              {lang === "so" ? "Dhammaan xuquuqdu waa dhowran tahay." : "All rights reserved."}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
