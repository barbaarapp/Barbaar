/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowLeft } from "lucide-react";
import { colors } from "../../constants";

interface TopBarProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function TopBar({ title, onBack, right }: TopBarProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: `${colors.ivory}F2`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: `1px solid ${colors.line}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 32 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              padding: 6,
              marginLeft: -6,
              color: colors.ink,
              display: "flex",
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={20} />
          </button>
        )}
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: colors.ink,
          textAlign: "center",
        }}
      >
        {title}
      </div>
      <div style={{ minWidth: 32, display: "flex", justifyContent: "flex-end" }}>{right}</div>
    </div>
  );
}
