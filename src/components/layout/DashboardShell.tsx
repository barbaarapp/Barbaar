/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, ArrowRightLeft, LucideIcon } from "lucide-react";
import { colors } from "../../constants";

interface DashboardShellItem {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardShellProps {
  title: string;
  items: DashboardShellItem[];
  active: string;
  go: (key: string) => void;
  onExit: () => void;
  exitLabel: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  userName?: string;
  userInitials?: string;
  userSubtitle?: string;
}

export default function DashboardShell({
  title,
  items,
  active,
  go,
  onExit,
  exitLabel,
  children,
  badge,
  userName,
  userInitials,
  userSubtitle,
}: DashboardShellProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Sidebar for desktop */}
      <div
        className="hide-mobile"
        style={{
          width: 240,
          background: colors.indigoDeep,
          color: "#fff",
          padding: "24px 16px",
          display: "none",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
        id="sidebar"
      >
        {/* Profile Chip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255,255,255,0.06)",
          padding: "10px 12px",
          borderRadius: 16,
          marginBottom: 24,
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: title.includes("Admin") ? colors.clay : colors.acacia,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
          }}>
            {userInitials || (title.includes("Admin") ? "DG" : "TH")}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userName || (title.includes("Admin") ? "Deqa Gure" : "Therapist")}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {userSubtitle || (title.includes("Admin") ? "Lead Admin" : "Licensed Professional")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => go(it.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "10px 12px 10px 18px",
                borderRadius: 11,
                background: active === it.key ? "rgba(255,255,255,0.12)" : "transparent",
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: active === it.key ? 700 : 500,
                textAlign: "left",
                cursor: "pointer",
                position: "relative",
              }}
            >
              {active === it.key && (
                <div style={{
                  position: "absolute",
                  left: 6,
                  top: 10,
                  bottom: 10,
                  width: 3,
                  backgroundColor: colors.amber,
                  borderRadius: 99,
                }} />
              )}
              <it.icon size={17} /> {it.label}
            </button>
          ))}
        </div>

        <button
          onClick={onExit}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 11,
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.75)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <ArrowRightLeft size={16} /> {exitLabel}
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: 90 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: `1px solid ${colors.line}`,
            background: `${colors.ivory}F2`,
            position: "sticky",
            top: 0,
            zIndex: 20,
          }}
        >
          <div className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>
            {items.find((i) => i.key === active)?.label || title}
          </div>
          {badge}
        </div>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "20px" }}>{children}</div>
      </div>

      {/* Navigation for mobile */}
      <div
        className="hide-desktop"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: `${colors.paper}F7`,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderTop: `1px solid ${colors.line}`,
          display: "flex",
          zIndex: 30,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {items.map((it) => {
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => go(it.key)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                padding: "9px 0 7px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: isActive ? colors.indigo : colors.inkSoft,
                cursor: "pointer",
              }}
            >
              <it.icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}>
                {it.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={onExit}
          style={{
            flex: 1,
            background: "none",
            border: "none",
            padding: "9px 0 7px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: colors.inkSoft,
            cursor: "pointer",
          }}
        >
          <ArrowRightLeft size={19} />
          <span style={{ fontSize: 10 }}>Exit</span>
        </button>
      </div>

      <style>{`
        @media (min-width: 900px) {
          #sidebar { display: flex !important; }
          .hide-desktop { display: none !important; }
        }
        @media (max-width: 899px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
