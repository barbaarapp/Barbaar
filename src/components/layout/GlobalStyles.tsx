/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { FONT_LINK, colors } from "../../constants";

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('${FONT_LINK}');
      * { box-sizing: border-box; }
      body { margin: 0; }
      .font-display { font-family: 'Fraunces', serif; }
      .font-body { font-family: 'Inter', sans-serif; }
      ::-webkit-scrollbar { display: none; }
      * { scrollbar-width: none; -ms-overflow-style: none; }
      button { font-family: inherit; cursor: pointer; }
      input, textarea, select { font-family: inherit; }
      button:focus-visible, input:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
        outline: 2px solid ${colors.indigo};
        outline-offset: 2px;
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .fade-up { animation: fadeUp 0.24s cubic-bezier(0.16, 1, 0.3, 1) both; }
      .pop-in { animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }
      @media (prefers-reduced-motion: reduce) {
        .fade-up, .pop-in { animation: none !important; }
        * { transition: none !important; }
      }
    `}</style>
  );
}
