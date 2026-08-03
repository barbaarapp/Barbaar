/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Star } from "lucide-react";
import { colors } from "../../constants";

interface StarsProps {
  rating: number;
  size?: number;
}

export default function Stars({ rating, size = 13 }: StarsProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      <Star size={size} fill={colors.amber} color={colors.amber} />
      <span style={{ fontSize: size, fontWeight: 600, color: colors.ink }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}
