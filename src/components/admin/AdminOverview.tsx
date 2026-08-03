/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Users, CalendarDays, User, Wallet } from "lucide-react";
import { Therapist, Booking } from "../../types";
import { colors, CATEGORIES } from "../../constants";
import { fmtMoney } from "../../utils";
import StatCard from "../therapist/StatCard";
import Card from "../ui/Card";

interface AdminOverviewProps {
  therapists: Therapist[];
  bookings: Booking[];
}

export default function AdminOverview({ therapists, bookings }: AdminOverviewProps) {
  const activeCount = therapists.filter((t) => t.active).length;
  const revenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const clients = new Set(bookings.map((b) => b.clientPhone || b.clientEmail)).size;

  const byCat = Object.keys(CATEGORIES).map((k) => ({
    key: k,
    count: bookings.filter((b) => b.category === k).length,
  }));

  const max = Math.max(1, ...byCat.map((c) => c.count));

  return (
    <div>
      {/* Grid of stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 26 }}>
        <StatCard label="Active therapists" value={activeCount} icon={Users} />
        <StatCard label="Total bookings" value={bookings.length} icon={CalendarDays} />
        <StatCard label="Clients served" value={clients} icon={User} />
        <StatCard
          label="Revenue"
          value={fmtMoney(revenue)}
          icon={Wallet}
          color={colors.amber}
        />
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.inkSoft,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 12,
        }}
      >
        Bookings by category
      </div>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {byCat.map((c) => {
            const cat = CATEGORIES[c.key];
            if (!cat) return null;

            return (
              <div key={c.key}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: colors.ink }}>{cat.name}</span>
                  <span style={{ color: colors.inkSoft }}>{c.count}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: colors.ivory }}>
                  <div
                    style={{
                      width: `${(c.count / max) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: cat.color,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
