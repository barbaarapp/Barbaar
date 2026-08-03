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
    { key: "home", label: "Home", icon: Home },
    { key: "sessions", label: "Sessions", icon: CalendarDays },
    { key: "chat", label: "Messages", icon: MessageCircle, badge: hasUnread },
    { key: "settings", label: "Profile", icon: UserIcon },
  ];

  const active = ["home", "quiz", "match", "directory", "profile", "booking", "confirmation"].includes(screen)
    ? "home"
    : ["sessions"].includes(screen)
    ? "sessions"
    : ["chat"].includes(screen)
    ? "chat"
    : "settings";

  return (
    <div
      style={{
        background: `${colors.ivory}F9`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: `1px solid ${colors.line}40`,
        display: "flex",
        width: "100%",
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.02)",
      }}
    >
      {items.map((it) => {
        const isActive = active === it.key;
        return (
          <motion.button
            key={it.key}
            onClick={() => go(it.key)}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 450, damping: 25 }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              padding: "10px 0 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              color: isActive ? colors.indigo : colors.inkSoft,
              cursor: "pointer",
              position: "relative",
            }}
          >
            <div style={{ position: "relative", display: "inline-block" }}>
              {/* Scale icon slightly when active */}
              <motion.div
                animate={{ scale: isActive ? 1.05 : 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <it.icon size={21} strokeWidth={isActive ? 2.5 : 1.9} />
              </motion.div>
              
              {it.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: -1,
                    right: -2,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: colors.amber,
                    border: `1.5px solid ${colors.ivory}`,
                  }}
                />
              )}
            </div>
            
            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>
              {t(it.label, lang)}
            </span>

            {/* Premium under-dot indicator that transitions elastically */}
            {isActive && (
              <motion.div
                layoutId="nav-dot"
                style={{
                  position: "absolute",
                  bottom: 3,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: colors.indigo,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

