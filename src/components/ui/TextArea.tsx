/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { colors } from "../../constants";

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  id?: string;
  placeholder?: string;
}

export default function TextArea({ label, value, onChange, rows = 3, id, placeholder }: TextAreaProps) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
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
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 rounded-xl border border-gray-200 text-base md:text-sm focus:outline-none focus:border-[#384c43] focus:ring-1 focus:ring-[#384c43] transition-all"
        style={{
          background: colors.paper,
          color: colors.ink,
          resize: "vertical",
          lineHeight: 1.6,
          outline: "none",
          minHeight: rows * 30 + 30,
        }}
      />
    </label>
  );
}
