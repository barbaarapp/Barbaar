/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { colors } from "../../constants";

interface WordmarkProps {
  size?: number;
}

export default function Wordmark({ size = 20 }: WordmarkProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img
        src="/barbaar_icon.svg"
        alt="Barbaar Logo"
        style={{
          width: size + 14,
          height: size + 14,
          borderRadius: 8,
          objectFit: "cover",
          boxShadow: "0 2px 8px rgba(56, 76, 67, 0.06)",
        }}
        referrerPolicy="no-referrer"
      />
      <span
        className="font-display"
        style={{
          fontSize: size,
          fontWeight: 700,
          color: colors.ink,
          letterSpacing: "-0.01em",
        }}
      >
        Barbaar Wellness
      </span>
    </div>
  );
}
