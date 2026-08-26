/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { colors } from "../../constants";

interface WordmarkProps {
  size?: number;
  variant?: "dark" | "light";
}

export default function Wordmark({ size = 20, variant = "light" }: WordmarkProps) {
  const textColor = variant === "dark" ? "#ffffff" : colors.ink;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src="/barbaar_icon.svg"
        alt="Barbaar Logo"
        style={{
          width: size + 14,
          height: size + 14,
          borderRadius: 9,
          objectFit: "cover",
          boxShadow: variant === "dark" ? "0 2px 10px rgba(0, 0, 0, 0.25)" : "0 2px 8px rgba(56, 76, 67, 0.08)",
        }}
        referrerPolicy="no-referrer"
      />
      <span
        className="font-display tracking-tight"
        style={{
          fontSize: size,
          fontWeight: 700,
          color: textColor,
          letterSpacing: "-0.02em",
        }}
      >
        Barbaar<span style={{ fontWeight: 400, opacity: 0.85, marginLeft: 4 }}>Wellness</span>
      </span>
    </div>
  );
}
