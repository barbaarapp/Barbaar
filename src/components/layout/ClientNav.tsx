/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Home, CalendarDays, MessageCircle, User as UserIcon } from "lucide-react";
import { colors } from "../../constants";
import { translateText as t, Language } from "../../utils/translations";
import { motion } from "motion/react";

interface ClientNavProps {
  screen: string;
  go: (screen: string) => void;
  hasUnread?: boolean;
  lang?: Language;
}

export default function ClientNav({ screen, go, hasUnread, lang = "en" }: ClientNavProps) {
  const items = [
    { key: "home", label: lang === "so" ? "Hoyga" : "Home", icon: Home },
    { key: "sessions", label: lang === "so" ? "Kulamada" : "Sessions", icon: CalendarDays },
    { key: "chat", label: lang === "so" ? "Farriimaha" : "Messages", icon: MessageCircle, badge: hasUnread },
    { key: "settings", label: lang === "so" ? "Xogta" : "Profile", icon: UserIcon },
  ];

  const active = ["home", "quiz", "match", "directory", "profile", "booking", "confirmation"].includes(screen)
    ? "home"
    : ["sessions"].includes(screen)
    ? "sessions"
    : ["chat"].includes(screen)
    ? "chat"
    : "settings";

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-stone-200/90 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <motion.button
              key={it.key}
              onClick={() => go(it.key)}
              whileTap={{ scale: 0.93 }}
              transition={{ type: "spring", stiffness: 450, damping: 25 }}
              className={`flex-1 py-1.5 flex flex-col items-center gap-1 transition-colors relative cursor-pointer ${
                isActive ? "text-[#1e3a2f]" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <div className="relative">
                <it.icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                {it.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? "text-[#1e3a2f]" : "text-stone-500"}`}>
                {it.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#1e3a2f]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

