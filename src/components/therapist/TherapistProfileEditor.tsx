/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Check, User, DollarSign, Award, BookOpen, Video, Globe, Mail } from "lucide-react";
import { Therapist } from "../../types";
import { colors, CATEGORIES } from "../../constants";
import Avatar from "../ui/Avatar";
import Card from "../ui/Card";
import TextField from "../ui/TextField";
import TextArea from "../ui/TextArea";
import Button from "../ui/Button";

interface TherapistProfileEditorProps {
  therapist: Therapist;
  onSave: (therapist: Therapist) => void;
}

export default function TherapistProfileEditor({ therapist, onSave }: TherapistProfileEditorProps) {
  const [form, setForm] = useState<Therapist>(therapist);
  const [saved, setSaved] = useState<boolean>(false);
  const [customLang, setCustomLang] = useState<string>("");

  const palette = [
    colors.acacia,
    colors.clay,
    colors.amber,
    colors.indigo,
    "#7B6C8D",
    "#3F7C8A",
  ];

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto pb-16">
      
      {/* SECTION 1: Identity & Personal Details */}
      <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${colors.line}40`, paddingBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.indigoSoft, display: "flex", alignItems: "center", color: colors.indigo, justifyContent: "center" }}>
            <User size={15} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Identity & Contact
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <Avatar therapist={form} size={64} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: colors.inkSoft, marginBottom: 8 }}>
              Choose Avatar color
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {palette.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, color: c });
                    setSaved(false);
                  }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: c,
                    border: form.color === c ? `2.5px solid ${colors.ink}` : "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: form.color === c ? "0 0 6px rgba(0,0,0,0.15)" : "none",
                  }}
                  className="hover:scale-105 active:scale-95"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Full name"
            value={form.name}
            onChange={(v) => {
              setForm({ ...form, name: v });
              setSaved(false);
            }}
            icon={User}
          />

          <TextField
            label="Email Address (Login & Notifications)"
            value={form.email || ""}
            onChange={(v) => {
              setForm({ ...form, email: v });
              setSaved(false);
            }}
            placeholder="e.g. sagal.nur@barbaar.com"
            icon={Mail}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Credentials & Degrees"
            value={form.credentials}
            onChange={(v) => {
              setForm({ ...form, credentials: v });
              setSaved(false);
            }}
            icon={Award}
          />

          {/* Gender selection field */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 6 }}>
              Gender
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "female", label: "Woman" },
                { value: "male", label: "Man" }
              ].map((g) => {
                const isSelected = form.gender === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, gender: g.value as any });
                      setSaved(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                      background: isSelected ? colors.indigoSoft : colors.paper,
                      color: isSelected ? colors.indigo : colors.ink,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      height: 42,
                    }}
                    className="active:scale-[0.98]"
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <TextField
          label="Real Zoom Meeting Link (For Session Video Calls)"
          value={form.zoomLink || ""}
          onChange={(v) => {
            setForm({ ...form, zoomLink: v });
            setSaved(false);
          }}
          placeholder="e.g. https://zoom.us/j/1234567890"
          icon={Video}
        />
      </Card>

      {/* SECTION 2: Care Practice & Financials */}
      <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${colors.line}40`, paddingBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.amberSoft, display: "flex", alignItems: "center", color: colors.amber, justifyContent: "center" }}>
            <DollarSign size={15} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Practice & Fees
          </span>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 8 }}>
            Primary Care Practice Category
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.values(CATEGORIES).map((c) => {
              const isSelected = form.category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    setForm({ ...form, category: c.key });
                    setSaved(false);
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 999,
                    border: `1.5px solid ${isSelected ? c.color : colors.line}`,
                    background: isSelected ? c.soft : colors.paper,
                    color: isSelected ? c.color : colors.ink,
                    fontWeight: 700,
                    fontSize: 12.5,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="active:scale-[0.98]"
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Languages Spoken Section */}
        <div style={{ borderTop: `1px solid ${colors.line}40`, paddingTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Globe size={14} color={colors.inkSoft} />
            <span>Languages Spoken</span>
          </div>
          
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {["Somali", "English", "Arabic"].map((lang) => {
              const currentLangs = form.languages || [];
              const isSelected = currentLangs.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    const next = isSelected
                      ? currentLangs.filter((l) => l !== lang)
                      : [...currentLangs, lang];
                    setForm({ ...form, languages: next });
                    setSaved(false);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                    background: isSelected ? colors.indigoSoft : colors.paper,
                    color: isSelected ? colors.indigo : colors.ink,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  className="active:scale-95"
                >
                  <span>{lang}</span>
                  <span style={{ fontSize: 10, opacity: 0.8 }}>{isSelected ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>

          {/* Show current list of all languages speaking */}
          {form.languages && form.languages.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12, background: colors.indigoSoft, padding: "8px 10px", borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: colors.inkSoft, alignSelf: "center", marginRight: 4 }}>Active:</span>
              {form.languages.map((lang) => (
                <div
                  key={lang}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "#fff",
                    border: `1px solid ${colors.line}`,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: colors.ink,
                  }}
                >
                  <span>{lang}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, languages: (form.languages || []).filter((l) => l !== lang) });
                      setSaved(false);
                    }}
                    style={{
                      border: "none",
                      background: "none",
                      color: colors.danger,
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 11,
                      padding: "0 2px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add custom language input */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <TextField
                label="Add custom language"
                value={customLang}
                onChange={(v) => setCustomLang(v)}
                placeholder="e.g. Swahili, Italian"
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <Button
                type="button"
                onClick={() => {
                  if (customLang.trim()) {
                    const trimmed = customLang.trim();
                    const current = form.languages || [];
                    if (!current.includes(trimmed)) {
                      setForm({ ...form, languages: [...current, trimmed] });
                      setSaved(false);
                    }
                    setCustomLang("");
                  }
                }}
                style={{ height: 42, padding: "0 16px", borderRadius: 12 }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <TextField
          label={`Fee in USD (${form.priceUnit === "program" ? "Per Full Program" : "Per Hourly Session"})`}
          value={form.price}
          onChange={(v) => {
            setForm({ ...form, price: Number(v) || 0 });
            setSaved(false);
          }}
          type="number"
          icon={DollarSign}
        />
      </Card>

      {/* SECTION 3: Clinical Bios & Biography */}
      <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${colors.line}40`, paddingBottom: 14 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: colors.acaciaSoft, display: "flex", alignItems: "center", color: colors.acacia, justifyContent: "center" }}>
            <BookOpen size={15} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: colors.ink, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Public Biography & Philosophy
          </span>
        </div>

        {/* Supportive Writing Assistant Tip Box */}
        <div style={{
          background: `${colors.acaciaSoft}80`,
          borderLeft: `3px solid ${colors.acacia}`,
          padding: "12px 16px",
          borderRadius: 12,
          fontSize: 13,
          color: colors.ink,
          lineHeight: 1.5,
        }}>
          💡 <strong>Writing Helper:</strong> Introduce yourself warmly and describe your care approach clearly. Somali clients appreciate an understanding of local culture, family dynamics, and faith-centered respects. Keeping it clear and honest creates instant comfort!
        </div>

        <div style={{ position: "relative" }}>
          <TextArea
            label="Short directory preview bio (shown on search listings)"
            value={form.shortBio}
            onChange={(v) => {
              setForm({ ...form, shortBio: v });
              setSaved(false);
            }}
            rows={2}
            placeholder="e.g. Quiet intrusive thoughts with compassionate, evidence-based therapy..."
          />
          <div style={{
            position: "absolute",
            right: 4,
            bottom: -6,
            fontSize: 11,
            fontWeight: 600,
            color: (form.shortBio || "").length > 180 ? colors.danger : colors.inkSoft,
          }}>
            {(form.shortBio || "").length} characters
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 8 }}>
          <TextArea
            label="Full Clinical Philosophy & Background (main profile page)"
            value={form.longBio}
            onChange={(v) => {
              setForm({ ...form, longBio: v });
              setSaved(false);
            }}
            rows={6}
            placeholder="Introduce your background, clinical orientation, training, and what a typical session with you looks like..."
          />
          <div style={{
            position: "absolute",
            right: 4,
            bottom: -6,
            fontSize: 11,
            fontWeight: 600,
            color: colors.inkSoft,
          }}>
            {(form.longBio || "").split(/\s+/).filter(Boolean).length} words · {(form.longBio || "").length} characters
          </div>
        </div>
      </Card>

      {/* Unified Action Bar (Large, full-width, mobile-friendly save button) */}
      <div style={{ display: "flex", justifyContent: "stretch", marginTop: 8 }}>
        <Button
          full
          onClick={() => {
            onSave(form);
            setSaved(true);
          }}
          icon={saved ? Check : undefined}
          style={{
            height: 48,
            borderRadius: 14,
            background: saved ? colors.acacia : colors.indigo,
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(56, 76, 67, 0.15)",
          }}
        >
          {saved ? "All Profile Changes Saved Successfully!" : "Save & Update Public Profile"}
        </Button>
      </div>
    </div>
  );
}
