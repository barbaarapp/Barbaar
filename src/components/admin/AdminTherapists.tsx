/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Therapist } from "../../types";
import { colors, CATEGORIES } from "../../constants";
import { fmtMoney, uid } from "../../utils";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import TherapistProfileEditor from "../therapist/TherapistProfileEditor";

interface AdminTherapistsProps {
  therapists: Therapist[];
  onSave: (therapists: Therapist[]) => void;
}

export default function AdminTherapists({ therapists, onSave }: AdminTherapistsProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const defaultTherapist: Therapist = {
    id: uid("t"),
    name: "",
    credentials: "",
    category: "cbt",
    gender: "female",
    languages: ["English"],
    experience: 5,
    rating: 5.0,
    reviews: 0,
    price: 90,
    priceUnit: "session",
    sessionsIncluded: null,
    shortBio: "",
    longBio: "",
    specialties: ["CBT", "Anxiety", "Mindfulness"],
    initials: "TH",
    color: colors.indigo,
    availability: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      slots: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM"],
    },
    active: true,
    zoomLink: "",
  };

  function toggleActive(id: string) {
    onSave(therapists.map((t) => (t.id === id ? { ...t, active: !t.active } : t)));
  }

  const editingTherapist = therapists.find((t) => t.id === editing);

  if (editingTherapist) {
    return (
      <div>
        <button
          onClick={() => setEditing(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: colors.indigo,
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 16,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} /> Back to all therapists
        </button>
        <TherapistProfileEditor
          therapist={editingTherapist}
          onSave={(form) => {
            const initials = form.name
              ? form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
              : form.initials;
            onSave(therapists.map((t) => (t.id === form.id ? { ...form, initials } : t)));
            setEditing(null);
          }}
        />
      </div>
    );
  }

  if (isAdding) {
    return (
      <div>
        <button
          onClick={() => setIsAdding(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: colors.indigo,
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 16,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} /> Back to all therapists
        </button>
        <TherapistProfileEditor
          therapist={defaultTherapist}
          onSave={(form) => {
            const initials = form.name
              ? form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
              : "TH";
            onSave([...therapists, { ...form, initials }]);
            setIsAdding(false);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
          All Therapists ({therapists.length})
        </div>
        <button
          onClick={() => setIsAdding(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: colors.indigo,
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "8px 14px",
            fontWeight: 700,
            fontSize: 12.5,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(35,53,84,0.12)",
          }}
          className="active:scale-95 transition-transform"
        >
          <Plus size={15} /> Add Therapist
        </button>
      </div>

      {therapists.map((t) => (
        <Card key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Avatar therapist={t} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
            <div style={{ fontSize: "12.5px", color: colors.inkSoft }}>
              {CATEGORIES[t.category]?.name || t.category} · {fmtMoney(t.price)}
            </div>
          </div>
          
          {deleteConfirmId === t.id ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                onClick={() => {
                  onSave(therapists.filter((x) => x.id !== t.id));
                  setDeleteConfirmId(null);
                }}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 11,
                  fontWeight: 700,
                  background: colors.danger,
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${colors.line}`,
                  fontSize: 11,
                  fontWeight: 700,
                  background: colors.paper,
                  color: colors.ink,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => setEditing(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.indigo,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                }}
                title="Edit therapist"
              >
                <Pencil size={17} />
              </button>
              <button
                onClick={() => toggleActive(t.id)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  background: t.active ? colors.acaciaSoft : colors.claySoft,
                  color: t.active ? colors.acacia : colors.clay,
                  cursor: "pointer",
                }}
              >
                {t.active ? "Active" : "Hidden"}
              </button>
              <button
                onClick={() => setDeleteConfirmId(t.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.danger,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 4,
                }}
                title="Delete therapist completely"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
