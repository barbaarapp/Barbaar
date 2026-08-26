/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { colors } from "../../constants";
import { motion } from "motion/react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  id?: string;
  key?: React.Key;
  className?: string;
}

export default function Card({ children, style, onClick, id, className }: CardProps) {
  const isClickable = !!onClick;
  return (
    <motion.div
      id={id}
      onClick={onClick}
      className={className}
      whileHover={isClickable ? { scale: 1.012, y: -2, boxShadow: "0 8px 24px -4px rgba(0,0,0,0.04)" } : undefined}
      whileTap={isClickable ? { scale: 0.985 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{
        background: colors.paper,
        borderRadius: 20,
        border: `1px solid ${colors.line}40`,
        padding: 18,
        cursor: isClickable ? "pointer" : "default",
        boxShadow: "0 4px 18px rgba(0,0,0,0.02)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

