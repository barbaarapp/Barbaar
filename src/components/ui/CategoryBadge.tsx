/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CATEGORIES } from "../../constants";

interface CategoryBadgeProps {
  cat: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({ cat, size = "sm" }: CategoryBadgeProps) {
  const c = CATEGORIES[cat];
  if (!c) return null;
  const Icon = c.icon;
  const pad = size === "sm" ? "3px 9px" : "5px 12px";
  const fs = size === "sm" ? 11 : 13;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: pad,
        borderRadius: 999,
        background: c.soft,
        color: c.color,
        fontSize: fs,
        fontWeight: 700,
      }}
    >
      <Icon size={fs + 2} /> {c.name}
    </span>
  );
}
