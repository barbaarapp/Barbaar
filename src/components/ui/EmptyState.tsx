/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { colors } from "../../constants";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  sub: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, sub, action }: EmptyStateProps) {
  return (
    <div
      className="fade-up"
      style={{
        textAlign: "center",
        padding: "48px 24px",
        color: colors.inkSoft,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: colors.indigoSoft,
          color: colors.indigo,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <Icon size={26} />
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 17,
          color: colors.ink,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.5,
          maxWidth: 280,
          margin: "0 auto",
        }}
      >
        {sub}
      </div>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}
