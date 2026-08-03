/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Therapist } from "../../types";
import { colors } from "../../constants";
import { fmtMoney } from "../../utils";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import CategoryBadge from "../ui/CategoryBadge";
import Stars from "../ui/Stars";

interface TherapistRowProps {
  t: Therapist;
  onClick: () => void;
  key?: React.Key;
  badge?: string;
}

export default function TherapistRow({ t, onClick, badge }: TherapistRowProps) {
  return (
    <Card 
      onClick={onClick} 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 13,
        position: "relative",
        padding: "16px 14px",
        overflow: "hidden"
      }}
    >
      {badge && (
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          background: colors.amberSoft,
          color: colors.amber,
          fontSize: 10,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          padding: "4px 10px",
          borderRadius: "0 0 0 10px",
          boxShadow: "0 2px 6px rgba(193, 122, 61, 0.06)",
        }}>
          {badge}
        </div>
      )}
      
      <Avatar therapist={t} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: colors.ink }}>
            {t.name}
          </div>
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: colors.inkSoft,
            margin: "3px 0 6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {t.credentials}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CategoryBadge cat={t.category} />
          <Stars rating={t.rating} />
        </div>
        {t.languages && t.languages.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
            {t.languages.map((l) => (
              <span
                key={l}
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: colors.indigo,
                  background: colors.indigoSoft,
                  padding: "1px 6px",
                  borderRadius: 4,
                  textTransform: "uppercase",
                  letterSpacing: 0.3,
                }}
              >
                {l}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, paddingRight: badge ? 8 : 0 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: colors.ink }}>
          {fmtMoney(t.price)}
        </div>
        <div style={{ fontSize: 11, color: colors.inkSoft }}>
          /{t.priceUnit === "program" ? `${t.sessionsIncluded}-wk` : "session"}
        </div>
      </div>
    </Card>
  );
}
