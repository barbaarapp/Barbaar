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
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {upcoming.map((b) => {
          const initials = b.clientName
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("");

          return (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-stone-200/90 hover:border-stone-300 p-5 shadow-xs transition-all flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                    style={{ background: colors.indigo }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-stone-900 text-sm">{b.clientName}</div>
                    <div className="text-xs text-stone-500 font-medium flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-stone-800">{fmtDate(b.date)} · {b.time}</span>
                      {b.clientPhone && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span>{b.clientPhone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                    b.zoomLink
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-stone-100 text-stone-600 border-stone-200"
                  }`}
                >
                  {b.zoomLink ? "Link Ready" : "Link Pending"}
                </span>
              </div>

              {b.rescheduledByTherapist && (
                <div className="text-xs bg-amber-50/70 border border-amber-200/70 text-amber-900 px-3 py-2 rounded-xl italic">
                  Rescheduled: "{b.rescheduleReason}"
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onJoinSession) onJoinSession(b);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#18221E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <Video size={14} className="text-emerald-400" />
                  <span>Join Consultation Room</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onReschedule(b.id)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <RescheduleIcon size={13} />
                    <span>Reschedule</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onComplete(b.id)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Check size={13} />
                    <span>Complete</span>
                  </button>
                </div>
              </div>
            </div>
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
