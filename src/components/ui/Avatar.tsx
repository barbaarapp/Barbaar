/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface AvatarProps {
  therapist: {
    initials: string;
    color: string;
  };
  size?: number;
}

export default function Avatar({ therapist, size = 48 }: AvatarProps) {
  return (
    <div
      className="font-display"
      style={{
        width: size,
        height: size,
        borderRadius: "999px",
        background: therapist.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        fontWeight: 600,
        flexShrink: 0,
        letterSpacing: 0.5,
      }}
    >
      {therapist.initials}
    </div>
  );
}
