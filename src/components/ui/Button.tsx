/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { LucideIcon } from "lucide-react";
import { colors } from "../../constants";
import { motion } from "motion/react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "amber" | "ghost" | "subtle" | "danger";
  full?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
  id?: string;
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  full,
  disabled,
  icon: Icon,
  style,
  type = "button",
  id,
}: ButtonProps) {
  const base: React.CSSProperties = {
    padding: "13px 20px",
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: full ? "100%" : "auto",
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
  };

  const variants = {
    primary: { background: colors.indigo, color: "#fff" },
    amber: { background: colors.amber, color: "#fff" },
    ghost: {
      background: "transparent",
      color: colors.indigo,
      border: `1.5px solid ${colors.line}`,
    },
    subtle: { background: colors.indigoSoft, color: colors.indigo },
    danger: { background: colors.danger, color: "#fff" },
  };

  return (
    <motion.button
      id={id}
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: disabled ? 1 : 1.015 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {Icon && <Icon size={17} />}
      {children}
    </motion.button>
  );
}

