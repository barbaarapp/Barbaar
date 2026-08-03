/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { colors } from "../../constants";

interface TextFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: LucideIcon;
  id?: string;
}

export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  id,
}: TextFieldProps) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.ink,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={17}
            color={colors.inkSoft}
            style={{
              position: "absolute",
              left: 14,
              top: 13,
              pointerEvents: "none",
            }}
          />
        )}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: Icon ? "12px 14px 12px 40px" : "12px 14px",
            borderRadius: 12,
            border: `1.5px solid ${colors.line}`,
            background: colors.paper,
            fontSize: 15,
            color: colors.ink,
            outline: "none",
          }}
        />
      </div>
    </label>
  );
}
