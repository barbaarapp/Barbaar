/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Therapist } from "../../types";
import { colors, CATEGORIES } from "../../constants";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";

interface TherapistPickerProps {
  therapists: Therapist[];
  onPick: (id: string) => void;
  onCancel: () => void;
}

export default function TherapistPicker({ therapists, onPick, onCancel }: TherapistPickerProps) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <button
        onClick={onCancel}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          color: colors.indigo,
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 20,
          cursor: "pointer",
        }}
      >
        <ArrowLeft size={15} /> Back
      </button>
      <div className="font-display" style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>
        Continue as…
      </div>
      <div style={{ fontSize: 14, color: colors.inkSoft, marginBottom: 22 }}>
        Pick a therapist account to preview the dashboard.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {therapists.map((t) => (
          <Card
            key={t.id}
            onClick={() => onPick(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <Avatar therapist={t} size={42} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
              <div style={{ fontSize: "12.5px", color: colors.inkSoft }}>
                {CATEGORIES[t.category]?.name || t.category}
              </div>
            </div>
            <ChevronRight size={17} color={colors.inkSoft} />
          </Card>
        ))}
      </div>
    </div>
  );
}
