/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { CalendarDays, Clock, Users, Star, Check, CalendarDays as RescheduleIcon, Video } from "lucide-react";
import { Therapist, Booking } from "../../types";
import { colors } from "../../constants";
import { isoDate, timeOfDayGreeting, fmtDate } from "../../utils";
import StatCard from "./StatCard";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";

interface TherapistOverviewProps {
  therapist: Therapist;
  bookings: Booking[];
  go: (key: string) => void;
  onComplete: (bookingId: string) => void;
  onReschedule: (bookingId: string) => void;
  onJoinSession?: (booking: Booking) => void;
}

export default function TherapistOverview({
  therapist,
  bookings,
  go,
  onComplete,
  onReschedule,
  onJoinSession,
}: TherapistOverviewProps) {
  const today = isoDate(new Date());
  const todays = bookings.filter((b) => b.date === today);
  const upcoming = bookings.filter((b) => b.status === "upcoming");
  const nonTodayUpcoming = upcoming.filter((b) => b.date !== today).sort((a, b) => a.date.localeCompare(b.date));
  const uniqueClients = new Set(bookings.map((b) => b.clientPhone || b.clientEmail)).size;
  const [instantRoomInput, setInstantRoomInput] = React.useState<string>("");

  function handleStartInstantRoom(roomIdOverride?: string) {
    if (!onJoinSession) return;
    const finalRoomId = roomIdOverride || instantRoomInput.trim() || `BARBAAR-ROOM-${Math.floor(1000 + Math.random() * 9000)}`;
    const instantBooking: Booking = {
      id: finalRoomId,
      therapistId: therapist.id,
      clientName: "Client Participant",
      clientEmail: "client@barbaar.org",
      clientPhone: "+1 (555) 019-2834",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      category: "cbt",
      notes: "Instant therapist session room",
      amount: 0,
      paymentStatus: "paid",
      status: "upcoming"
    };
    onJoinSession(instantBooking);
  }

  return (
    <div>
      <div className="font-display" style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        {timeOfDayGreeting()}, {therapist.name.split(" ")[0]}
      </div>
      <div style={{ fontSize: 14, color: colors.inkSoft, marginBottom: 18 }}>
        Here's what's happening with your practice.
      </div>

      {/* Instant Session Room Box for Therapist */}
      <div 
        className="p-4 rounded-xl border mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm bg-white"
        style={{ borderColor: `${colors.indigo}30` }}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <Video size={18} />
          </div>
          <div>
            <div className="font-bold text-xs md:text-sm text-slate-900">Instant Consultation Room</div>
            <div className="text-[11px] text-slate-500">Launch or join a live room by ID</div>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Room ID (e.g. ROOM-101)"
            value={instantRoomInput}
            onChange={(e) => setInstantRoomInput(e.target.value)}
            className="px-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-44"
          />
          <Button
            variant="amber"
            style={{ height: 32, fontSize: 11, padding: "0 12px", whiteSpace: "nowrap" }}
            icon={Video}
            onClick={() => handleStartInstantRoom()}
          >
            Start Room
          </Button>
        </div>
      </div>

      {/* Grid of stats */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Today" value={todays.length} icon={CalendarDays} />
        <StatCard label="Upcoming" value={upcoming.length} icon={Clock} />
        <StatCard label="Clients" value={uniqueClients} icon={Users} />
        <StatCard
          label="Rating"
          value={therapist.rating.toFixed(1)}
          icon={Star}
          color={colors.amber}
        />
      </div>

      {/* Today's schedule section */}
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
        Today's schedule
      </div>

      {todays.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing booked today"
          sub="Update your availability so more clients can find open times."
          action={
            <Button variant="subtle" onClick={() => go("availability")}>
              Edit availability
            </Button>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {todays.map((b) => {
            const [timeHour, timePeriod] = b.time.split(" ");
            const hourValue = timeHour.split(":")[0];
            const isUpcoming = b.status === "upcoming";

            return (
              <Card key={b.id} style={{ display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: colors.indigoSoft,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      color: colors.indigo,
                      fontSize: 12,
                      flexDirection: "row",
                    }}
                  >
                    <span>{hourValue}</span>
                    <span style={{ fontSize: 9, marginLeft: 1 }}>{timePeriod}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.clientName}</div>
                    <div style={{ fontSize: "12.5px", color: colors.inkSoft }}>{b.time} · {b.clientPhone}</div>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 20,
                      background: b.status === "completed" ? "#e6f4ea" : colors.indigoSoft,
                      color: b.status === "completed" ? "#137333" : colors.indigo,
                      textTransform: "capitalize",
                    }}
                  >
                    {b.status}
                  </span>
                </div>

                {isUpcoming && (
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
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* All Upcoming schedule section */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: colors.inkSoft,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginTop: 24,
          marginBottom: 10,
        }}
      >
        Upcoming Sessions
      </div>

      {nonTodayUpcoming.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No upcoming sessions"
          sub="Future scheduled client bookings will show up here."
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {nonTodayUpcoming.map((b) => {
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
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.clientName}</div>
                    <div style={{ fontSize: "12.5px", color: colors.inkSoft }}>
                      {fmtDate(b.date)} · {b.time}
                    </div>
                  </div>
                  {b.rescheduledByTherapist && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        background: colors.amberSoft + "40",
                        color: colors.amber,
                        padding: "2px 6px",
                        borderRadius: 6,
                      }}
                    >
                      Rescheduled
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${colors.line}25`, paddingTop: 10, marginTop: 2 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      variant="subtle"
                      style={{ flex: 1, height: 32, fontSize: 12, background: "#e6f4ea", color: "#137333" }}
                      icon={Check}
                      onClick={() => onComplete(b.id)}
                    >
                      Complete
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
      )}
    </div>
  );
}
