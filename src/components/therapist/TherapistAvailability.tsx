/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Therapist } from "../../types";
import { colors, ALL_DAYS, ALL_SLOTS } from "../../constants";
import Button from "../ui/Button";

interface TherapistAvailabilityProps {
  therapist: Therapist;
  onSave: (availability: { days: string[]; slots: string[] }) => void;
}

export default function TherapistAvailability({ therapist, onSave }: TherapistAvailabilityProps) {
  const [days, setDays] = useState<string[]>(therapist.availability.days);
  const [slots, setSlots] = useState<string[]>(therapist.availability.slots);
  const [saved, setSaved] = useState<boolean>(false);

  function toggle(arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) {
    setSaved(false);
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.inkSoft,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 10,
        }}
      >
        Days you're available
      </div>
      
      {/* Day toggles row */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {ALL_DAYS.map((d) => {
          const active = days.includes(d);
          return (
            <button
              key={d}
              onClick={() => toggle(days, setDays, d)}
              style={{
                width: 52,
                padding: "10px 0",
                borderRadius: 12,
                border: `1.5px solid ${active ? colors.indigo : colors.line}`,
                background: active ? colors.indigo : colors.paper,
                color: active ? "#fff" : colors.ink,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.inkSoft,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 10,
        }}
      >
        Time slots you offer
      </div>

      {/* Grid of slots toggles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
          gap: 8,
          marginBottom: 24,
        }}
      >
        {ALL_SLOTS.map((s) => {
          const active = slots.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggle(slots, setSlots, s)}
              style={{
                padding: "10px 4px",
                borderRadius: 12,
                border: `1.5px solid ${active ? colors.indigo : colors.line}`,
                background: active ? colors.indigoSoft : colors.paper,
                color: colors.ink,
                fontWeight: 700,
                fontSize: "12.5px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 260 }}>
        <Button
          full
          onClick={() => {
            onSave({ days, slots });
            setSaved(true);
          }}
          icon={saved ? Check : undefined}
        >
          {saved ? "Saved" : "Save availability"}
        </Button>
      </div>
    </div>
  );
}
