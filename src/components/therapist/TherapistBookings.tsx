/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Users, Check, CalendarDays as RescheduleIcon, Video } from "lucide-react";
import { Booking } from "../../types";
import { colors } from "../../constants";
import { fmtDate } from "../../utils";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";

interface TherapistBookingsProps {
  bookings: Booking[];
  onComplete: (bookingId: string) => void;
  onReschedule: (bookingId: string) => void;
  onJoinSession?: (booking: Booking) => void;
}

export default function TherapistBookings({
  bookings,
  onComplete,
  onReschedule,
  onJoinSession,
}: TherapistBookingsProps) {
  const upcoming = bookings
    .filter((b) => b.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = bookings.filter((b) => b.status !== "upcoming");

  return (
    <div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.inkSoft,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: 10,
        }}
      >
        Upcoming clients
      </div>

      {upcoming.length === 0 && (
        <EmptyState
          icon={Users}
          title="No bookings yet"
          sub="New client bookings will appear here."
        />
      )}

      {/* Upcoming client list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {upcoming.map((b) => {
          const initials = b.clientName
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("");

          return (
            <Card key={b.id} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    background: colors.indigo,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.clientName}</div>
                  <div style={{ fontSize: "12.5px", color: colors.inkSoft }}>
                    {fmtDate(b.date)} · {b.time} · {b.clientPhone}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: b.zoomLink ? colors.acacia : colors.inkSoft,
                  }}
                >
                  {b.zoomLink ? "Link sent" : "Link pending"}
                </span>
              </div>

              {b.rescheduledByTherapist && (
                <div style={{ fontSize: 11, background: colors.amberSoft + "25", color: colors.amber, padding: "8px 10px", borderRadius: 8, fontStyle: "italic" }}>
                  Rescheduled: "{b.rescheduleReason}"
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${colors.line}25`, paddingTop: 10, marginTop: 2 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    variant="subtle"
                    style={{ flex: 1, height: 32, fontSize: 12, background: "#e6f4ea", color: "#137333" }}
                    icon={Check}
                    onClick={() => onComplete(b.id)}
                  >
                    Complete Session
                  </Button>
                  <Button
                    variant="ghost"
                    style={{ flex: 1, height: 32, fontSize: 12, border: `1.5px solid ${colors.line}40` }}
                    icon={RescheduleIcon}
                    onClick={() => onReschedule(b.id)}
                  >
                    Reschedule
                  </Button>
                </div>
                <Button
                  variant="amber"
                  style={{ height: 34, fontSize: 12 }}
                  icon={Video}
                  onClick={() => {
                    if (onJoinSession) {
                      onJoinSession(b);
                    }
                  }}
                >
                  Join Consultation Room
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Completed client list */}
      {past.length > 0 && (
        <>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.4,
              marginBottom: 10,
            }}
          >
            Completed
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {past.map((b) => (
              <Card key={b.id} style={{ opacity: 0.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{b.clientName}</div>
                    <div style={{ fontSize: 12, color: colors.inkSoft }}>{fmtDate(b.date)}</div>
                  </div>
                  {b.rating && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, background: colors.amberSoft + "40", padding: "3px 8px", borderRadius: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: colors.amber }}>★ {b.rating}</span>
                    </div>
                  )}
                </div>
                {b.review && (
                  <div style={{ fontSize: 11.5, color: colors.inkSoft, marginTop: 6, fontStyle: "italic", borderLeft: `2.5px solid ${colors.amber}60`, paddingLeft: 6 }}>
                    "{b.review}"
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
