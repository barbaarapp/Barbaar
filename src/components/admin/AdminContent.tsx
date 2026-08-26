/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, Scale, Shield, ArrowLeft, Check } from "lucide-react";
import { AppContent } from "../../types";
import { colors } from "../../constants";
import TextArea from "../ui/TextArea";
import Button from "../ui/Button";
import Card from "../ui/Card";

interface AdminContentProps {
  content: AppContent;
  onSave: (content: AppContent) => void;
}

export default function AdminContent({ content, onSave }: AdminContentProps) {
  const [form, setForm] = useState<AppContent>(content);
  const [editingPage, setEditingPage] = useState<"aboutUs" | "terms" | "privacy" | null>(null);
  const [saved, setSaved] = useState<boolean>(false);

  const pages = [
    {
      key: "aboutUs" as const,
      title: "About Us",
      desc: "Edit company story, clinical philosophy, and core mission statements.",
      icon: BookOpen,
      color: colors.indigo,
      bg: colors.indigoSoft,
    },
    {
      key: "terms" as const,
      title: "Terms of Service",
      desc: "Edit terms of service, platform rules, and patient agreements.",
      icon: Scale,
      color: colors.amber,
      bg: colors.amberSoft,
    },
    {
      key: "privacy" as const,
      title: "Privacy Policy",
      desc: "Edit data protection policies, HIPPA practices, and privacy standards.",
      icon: Shield,
      color: colors.acacia,
      bg: colors.acaciaSoft,
    },
  ];

  if (editingPage) {
    const selected = pages.find((p) => p.key === editingPage)!;
    const Icon = selected.icon;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="pop-in">
        <button
          onClick={() => {
            setEditingPage(null);
            setSaved(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            color: colors.indigo,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          <ArrowLeft size={15} /> Back to pages
        </button>

        <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${colors.line}40`, paddingBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: selected.bg, display: "flex", alignItems: "center", justifyContent: "center", color: selected.color }}>
              <Icon size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.ink }}>
                Editing {selected.title}
              </div>
              <div style={{ fontSize: 11, color: colors.inkSoft }}>
                App Content Manager
              </div>
            </div>
          </div>

          <TextArea
            label="Page Content"
            value={form[editingPage]}
            onChange={(v) => {
              setForm({ ...form, [editingPage]: v });
              setSaved(false);
            }}
            rows={12}
            placeholder={`Provide your content details for ${selected.title}...`}
          />

          <div style={{ maxWidth: 220, marginTop: 4 }}>
            <Button
              full
              onClick={() => {
                onSave(form);
                setSaved(true);
              }}
              icon={saved ? Check : undefined}
            >
              {saved ? "Saved successfully" : "Save changes"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
        App Page Contents
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pages.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => setEditingPage(p.key)}
              style={{
                background: "#fff",
                border: `1.5px solid ${colors.line}40`,
                borderRadius: 16,
                padding: 20,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
              }}
              className="hover:shadow-md hover:border-indigo-400 active:scale-98"
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", color: p.color }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: colors.ink, marginBottom: 4 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: "12px", color: colors.inkSoft, lineHeight: 1.4 }}>
                  {p.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
