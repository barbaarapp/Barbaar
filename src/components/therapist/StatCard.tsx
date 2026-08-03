/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { colors } from "../../constants";
import Card from "../ui/Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

export default function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const finalColor = color || colors.indigo;
  const softBg = finalColor === colors.indigo ? colors.indigoSoft : `${finalColor}15`;

  return (
    <Card 
      style={{ 
        flex: 1, 
        minWidth: 130, 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "space-between",
        padding: "16px 18px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
        border: `1px solid ${colors.line}30`,
      }}
      className="hover:shadow-sm"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {label}
        </div>
        <div style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: softBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={14} color={finalColor} strokeWidth={2.3} />
        </div>
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: colors.ink,
          marginTop: 8,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </Card>
  );
}
