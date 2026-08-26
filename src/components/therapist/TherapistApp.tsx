/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LayoutDashboard, Users, CalendarDays, User, MessageCircle, Clock, FileText, Check, X, AlertCircle, MoreHorizontal, ArrowLeft, ChevronRight } from "lucide-react";
import { Therapist, Booking, Message } from "../../types";
import { uid, nextAvailableDates, isoDate, fmtDate } from "../../utils";
import { colors } from "../../constants";
import DashboardShell from "../layout/DashboardShell";
import Avatar from "../ui/Avatar";
import TherapistOverview from "./TherapistOverview";
import TherapistBookings from "./TherapistBookings";
import TherapistAvailability from "./TherapistAvailability";
import TherapistProfileEditor from "./TherapistProfileEditor";
import TherapistMessages from "./TherapistMessages";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface TherapistAppProps {
  therapist: Therapist;
  therapists: Therapist[];
  bookings: Booking[];
  messages: Record<string, Message[]>;
  saveTherapists: (therapists: Therapist[]) => void;
  saveBookings: (bookings: Booking[]) => void;
  saveMessages: (messages: Record<string, Message[]>) => void;
  onExit: () => void;
  onJoinSession?: (booking: Booking) => void;
  screen?: string;
  setScreen?: (screen: string) => void;
}

export default function TherapistApp({
  therapist,
  therapists,
  bookings,
  messages,
  saveTherapists,
  saveBookings,
  saveMessages,
  onExit,
  onJoinSession,
  screen: externalScreen,
  setScreen: externalSetScreen,
}: TherapistAppProps) {
  const [internalScreen, setInternalScreen] = useState<string>("overview");
  const screen = externalScreen !== undefined ? externalScreen : internalScreen;
  const setScreen = externalSetScreen !== undefined ? externalSetScreen : setInternalScreen;
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState<string>("");
  const [newTime, setNewTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const myBookings = bookings.filter((b) => b.therapistId === therapist.id);

  const items = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "messages", label: "Messages", icon: MessageCircle },
    { key: "bookings", label: "Clients", icon: Users },
    { key: "more", label: "More", icon: MoreHorizontal },
  ];

  function updateTherapist(patch: Partial<Therapist>) {
    if (patch.name) {
      patch.initials = patch.name.trim().split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    }
    const next = therapists.map((t) => (t.id === therapist.id ? { ...t, ...patch } : t));
    saveTherapists(next);
  }

  function handleCompleteBooking(bookingId: string) {
    const nextBookings = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: "completed" } : b
    );
    saveBookings(nextBookings);
  }

  function handleOpenReschedule(bookingId: string) {
    const target = bookings.find((b) => b.id === bookingId);
    if (target) {
      setRescheduleId(bookingId);
      setNewDate(target.date);
      setNewTime(target.time);
      setReason("");
    }
  }

  function handleSaveReschedule() {
    if (!rescheduleId || !newDate || !newTime) return;

    const target = bookings.find((b) => b.id === rescheduleId);
    const originalDate = target?.date || "";
    const originalTime = target?.time || "";

    const nextBookings = bookings.map((b) => {
      if (b.id === rescheduleId) {
        return {
          ...b,
          date: newDate,
          time: newTime,
          rescheduledByTherapist: true,
          rescheduleReason: reason || "Therapist rescheduled the session.",
          originalDate,
          originalTime,
        };
      }
      return b;
    });

    saveBookings(nextBookings);

    // Also send a chat notification message to the client
    const thread = messages[therapist.id] || [];
    const notificationText = `📅 RESCHEDULED: Your session originally scheduled for ${fmtDate(originalDate)} at ${originalTime} has been rescheduled to ${fmtDate(newDate)} at ${newTime}. Reason: ${reason || "Practice rescheduling"}.`;
    
    const nextMessages = {
      ...messages,
      [therapist.id]: [
        ...thread,
        {
          id: uid("m"),
          from: "therapist" as const,
          text: notificationText,
          time: new Date().toISOString(),
        },
      ],
    };
    saveMessages(nextMessages);

    setRescheduleId(null);
  }

  function sendZoomLink(clientEmail: string) {
    // Find the latest booking between therapist and client (can be of any status)
    let booking = bookings.find(
      (b) => b.therapistId === therapist.id && b.clientEmail?.toLowerCase() === clientEmail.toLowerCase()
    );

    // If none exists, create a virtual session booking so they have a valid room and history entry!
    if (!booking) {
      booking = {
        id: `bk-virtual-${Date.now()}`,
        therapistId: therapist.id,
        category: "cbt",
        clientName: clientEmail.split("@")[0],
        clientPhone: "N/A",
        clientEmail: clientEmail,
        date: new Date().toISOString().split("T")[0],
        time: "Flexible",
        price: 0,
        priceUnit: "session",
        status: "upcoming",
        zoomLink: "In-App Room",
        createdAt: new Date().toISOString(),
      };
      const nextBookings = [...bookings, booking];
      saveBookings(nextBookings);
    }

    const thread = messages[therapist.id] || [];
    
    // Add virtual consult link to chat thread as a secure in-app Session Room message
    const nextMessages = {
      ...messages,
      [therapist.id]: [
        ...thread,
        {
          id: uid("m"),
          from: "therapist" as const,
          text: "In-App Secure Session Room - Click to Join",
          time: new Date().toISOString(),
          isZoom: false,
          isSessionRoom: true,
          bookingId: booking.id,
          clientEmail,
        },
      ],
    };
    saveMessages(nextMessages);
  }

  function sendMessage(text: string, clientEmail: string) {
    if (!text.trim()) return;
    const thread = messages[therapist.id] || [];
    const next = {
      ...messages,
      [therapist.id]: [
        ...thread,
        {
          id: uid("m"),
          from: "therapist" as const,
          text,
          time: new Date().toISOString(),
          clientEmail,
        },
      ],
    };
    saveMessages(next);
  }

  const availableDates = nextAvailableDates(therapist.availability.days);
  const targetBooking = rescheduleId ? bookings.find((b) => b.id === rescheduleId) : null;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <DashboardShell
        title="Therapist"
        items={items}
        active={screen}
        go={setScreen}
        onExit={onExit}
        exitLabel="Switch role"
        badge={<Avatar therapist={therapist} size={34} />}
        userName={therapist.name}
        userInitials={therapist.initials}
        userSubtitle={therapist.credentials}
      >
        {screen === "overview" && (
          <TherapistOverview
            therapist={therapist}
            bookings={myBookings}
            go={setScreen}
            onComplete={handleCompleteBooking}
            onReschedule={handleOpenReschedule}
            onJoinSession={onJoinSession}
          />
        )}
        {screen === "bookings" && (
          <TherapistBookings
            bookings={myBookings}
            onComplete={handleCompleteBooking}
            onReschedule={handleOpenReschedule}
            onJoinSession={onJoinSession}
          />
        )}
        {screen === "more" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }} className="fade-in">
            {/* Minimalist Profile Hero & Header */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 16, 
              background: "#ffffff", 
              padding: "20px 24px", 
              borderRadius: 24, 
              border: `1.5px solid ${colors.line}40`,
              boxShadow: "0 8px 24px rgba(56, 76, 67, 0.02)"
            }}>
              <Avatar therapist={therapist} size={54} />
              <div>
                <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, color: colors.ink }}>
                  {therapist.name}
                </h2>
                <p style={{ fontSize: 12.5, color: colors.inkSoft, marginTop: 2, fontWeight: 500 }}>
                  {therapist.credentials} • {therapist.email}
                </p>
              </div>
            </div>

            {/* Config & Setup Group Header */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                Practice Settings & Admin
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Option 1: Profile Editor */}
                <button
                  onClick={() => setScreen("profile")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: 18,
                    background: "#ffffff",
                    border: `1.5px solid ${colors.line}40`,
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: "0 4px 12px rgba(56, 76, 67, 0.01)",
                    width: "100%",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:translate-x-1"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: `${colors.acacia}12`,
                      color: colors.acacia,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <User size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink }}>
                        Edit Public Biography & Details
                      </div>
                      <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 2 }}>
                        Update credentials, bio, language list, and clinical specialties.
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={colors.inkSoft} />
                </button>

                {/* Option 2: Availability */}
                <button
                  onClick={() => setScreen("availability")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: 18,
                    background: "#ffffff",
                    border: `1.5px solid ${colors.line}40`,
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: "0 4px 12px rgba(56, 76, 67, 0.01)",
                    width: "100%",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:translate-x-1"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: `${colors.indigo}12`,
                      color: colors.indigo,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <CalendarDays size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink }}>
                        Configure Scheduling Hours
                      </div>
                      <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 2 }}>
                        Select your practice days and available daily therapy session slots.
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={colors.inkSoft} />
                </button>

                {/* Option 3: Role Switcher */}
                <button
                  onClick={onExit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: 18,
                    background: "#ffffff",
                    border: `1.5px solid ${colors.line}40`,
                    cursor: "pointer",
                    textAlign: "left",
                    boxShadow: "0 4px 12px rgba(56, 76, 67, 0.01)",
                    width: "100%",
                    transition: "all 0.15s ease",
                  }}
                  className="hover:translate-x-1"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: `${colors.clay}12`,
                      color: colors.clay,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <ArrowLeft size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: colors.ink }}>
                        Return to Client Hub
                      </div>
                      <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 2 }}>
                        Switch back to the patient overview or book wellness sessions.
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} color={colors.inkSoft} />
                </button>
              </div>
            </div>
          </div>
        )}
        {(screen === "availability" || screen === "profile") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }} className="fade-in">
            <button
              onClick={() => setScreen("more")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: colors.indigoSoft,
                border: "none",
                color: colors.indigo,
                cursor: "pointer",
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 12,
                alignSelf: "flex-start",
                transition: "all 0.15s ease",
              }}
            >
              <ArrowLeft size={14} /> Back to Settings Menu
            </button>
            {screen === "availability" && (
              <TherapistAvailability
                therapist={therapist}
                onSave={(av) => updateTherapist({ availability: av })}
              />
            )}
            {screen === "profile" && (
              <TherapistProfileEditor therapist={therapist} onSave={updateTherapist} />
            )}
          </div>
        )}
        {screen === "messages" && (
          <TherapistMessages
            therapist={therapist}
            thread={messages[therapist.id] || []}
            onSend={sendMessage}
            onZoom={sendZoomLink}
            bookings={bookings}
            onJoinSession={onJoinSession}
          />
        )}
      </DashboardShell>

      {/* RETHINK RESCHEDULING MODAL (Polished Overlay) */}
      {rescheduleId && targetBooking && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(31, 44, 61, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
          className="fade-in"
        >
          <Card
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 24,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: `1.5px solid ${colors.line}40`,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
            className="scale-up"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${colors.line}40`, paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={18} color={colors.indigo} />
                <div style={{ fontWeight: 800, fontSize: 15, color: colors.ink }}>
                  Reschedule Session
                </div>
              </div>
              <button
                onClick={() => setRescheduleId(null)}
                style={{ background: "none", border: "none", color: colors.inkSoft, cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: colors.inkSoft }}>
              Rescheduling session for <strong style={{ color: colors.ink }}>{targetBooking.clientName}</strong>. 
              The original slot was <strong style={{ color: colors.indigo }}>{fmtDate(targetBooking.date)} · {targetBooking.time}</strong>.
            </div>

            {/* Choose new date */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Pick New Available Date
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
                {availableDates.map((d) => {
                  const dateStr = isoDate(d);
                  const isSelected = newDate === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setNewDate(dateStr)}
                      style={{
                        flexShrink: 0,
                        width: 60,
                        padding: "8px 0",
                        borderRadius: 12,
                        border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                        background: isSelected ? colors.indigo : colors.paper,
                        color: isSelected ? "#fff" : colors.ink,
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, marginTop: 1 }}>
                        {d.getDate()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choose new time slot */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Pick New Time Slot
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {therapist.availability.slots.map((slot) => {
                  const isSelected = newTime === slot;
                  return (
                    <button
                      key={slot}
                      onClick={() => setNewTime(slot)}
                      style={{
                        padding: "8px 4px",
                        borderRadius: 10,
                        border: `1.5px solid ${isSelected ? colors.indigo : colors.line}`,
                        background: isSelected ? colors.indigoSoft : colors.paper,
                        color: colors.ink,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason for Rescheduling */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                Reason for Rescheduling
              </div>
              <textarea
                placeholder="Let the client know why you are rescheduling (e.g., Clinical conflict, emergency, etc.)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: `1.5px solid ${colors.line}`,
                  fontSize: 13,
                  outline: "none",
                  resize: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Button
                full
                onClick={handleSaveReschedule}
                disabled={!newDate || !newTime}
              >
                Confirm Reschedule
              </Button>
              <Button
                variant="ghost"
                style={{ border: `1px solid ${colors.line}` }}
                onClick={() => setRescheduleId(null)}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
