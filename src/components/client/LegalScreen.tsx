/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";
import { colors } from "../../constants";
import TopBar from "../ui/TopBar";

interface LegalScreenProps {
  type: string; // "about", "terms", "privacy"
  title: string;
  body: string;
  onBack: () => void;
}

export default function LegalScreen({ type, title, body, onBack }: LegalScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/${type}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareButton = (
    <button
      onClick={handleShare}
      style={{
        background: copied ? `${colors.acacia}15` : `${colors.indigo}08`,
        border: `1px solid ${copied ? colors.acacia : colors.indigo}25`,
        padding: "6px 12px",
        borderRadius: 12,
        color: copied ? colors.acacia : colors.indigo,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700,
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      title="Copy shareable link"
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      <span>{copied ? "Copied!" : "Share"}</span>
    </button>
  );

  return (
    <div>
      <TopBar title={title} onBack={onBack} right={shareButton} />
      <div
        style={{
          padding: "24px 22px 50px",
          fontSize: "14.5px",
          lineHeight: 1.75,
          color: colors.ink,
          whiteSpace: "pre-line",
          fontFamily: "var(--font-sans)",
        }}
      >
        {body}
      </div>
    </div>
  );
}

