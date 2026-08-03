/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { CalendarDays, Check, X, ShieldAlert, Heart, Coins, Mail, Phone, Clock } from "lucide-react";
import { Therapist, Booking } from "../../types";
import { colors } from "../../constants";
import { fmtDate, fmtMoney } from "../../utils";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";

interface AdminBookingsViewProps {
  therapists: Therapist[];
  bookings: Booking[];
  onSaveBookings: (bookings: Booking[]) => void;
  users?: any[];
  onUpdateUserAidStatus?: (userId: string, status: "approved" | "rejected") => Promise<void>;
}

export default function AdminBookingsView({
  therapists,
  bookings,
  onSaveBookings,
  users = [],
  onUpdateUserAidStatus,
}: AdminBookingsViewProps) {
  const [tab, setTab] = useState<"all" | "aid">("all");

  // Build unified requests grouped by client email
  const unifiedRequests = React.useMemo(() => {
    const map = new Map<string, {
      email: string;
      name: string;
      phone: string;
      status: "pending" | "approved" | "rejected";
      category: string;
      reason: string;
      userId?: string;
      userApprovedAt?: string | null;
      bookings: Booking[];
      updatedAt: string;
    }>();

    // 1. Process upfront requests from registered users
    users.forEach((u) => {
      if (u.financialAidStatus && u.financialAidStatus !== "none") {
        const email = (u.email || "").trim().toLowerCase();
        if (!email) return;

        map.set(email, {
          email,
          name: u.name || "Anonymous Client",
          phone: u.phone || "",
          status: u.financialAidStatus,
          category: u.financialAidCategory || "General Assistance",
          reason: u.financialAidReason || "Upfront registration",
          userId: u.id,
          userApprovedAt: u.financialAidApprovedAt,
          bookings: [],
          updatedAt: u.updatedAt || u.createdAt || "",
        });
      }
    });

    // 2. Process requests from bookings (including guests and clients)
    bookings.forEach((b) => {
      if (b.financialAidApplied) {
        const email = (b.clientEmail || "").trim().toLowerCase();
        if (!email) return;

        const existing = map.get(email);
        if (existing) {
          if (!b.id.startsWith("bk_preapp_")) {
            existing.bookings.push(b);
          }
          if (b.createdAt && b.createdAt > existing.updatedAt) {
            existing.updatedAt = b.createdAt;
          }
        } else {
          map.set(email, {
            email,
            name: b.clientName || "Anonymous Client",
            phone: b.clientPhone || "",
            status: b.financialAidStatus || "pending",
            category: b.financialAidCategory || "General Assistance",
            reason: b.financialAidReason || "Requested at checkout",
            bookings: b.id.startsWith("bk_preapp_") ? [] : [b],
            updatedAt: b.createdAt || "",
          });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [users, bookings]);

  // A request group is pending if overall status is pending, OR if any associated booking is pending
  const pendingCount = React.useMemo(() => {
    return unifiedRequests.filter((r) => {
      return r.status === "pending" || r.bookings.some((b) => b.financialAidStatus === "pending");
    }).length;
  }, [unifiedRequests]);

  async function handleApproveRequest(email: string, userId?: string) {
    // 1. If user account exists, update client profile
    if (userId && onUpdateUserAidStatus) {
      try {
        await onUpdateUserAidStatus(userId, "approved");
      } catch (err) {
        console.error("Failed to update user aid status:", err);
      }
    }

    // 2. Update all pending financial aid bookings for this client automatically
    const cleanEmail = email.trim().toLowerCase();
    let hasUpdatedBooking = false;
    let targetBooking: Booking | null = null;

    const nextBookings = bookings.map((b) => {
      if (
        b.clientEmail?.trim().toLowerCase() === cleanEmail &&
        b.financialAidApplied &&
        b.financialAidStatus === "pending"
      ) {
        hasUpdatedBooking = true;
        targetBooking = b;
        return {
          ...b,
          financialAidStatus: "approved" as const,
          status: "upcoming" as const, // Activate booking upon approval
        };
      }
      return b;
    });

    if (hasUpdatedBooking) {
      onSaveBookings(nextBookings);

      // Trigger email if user profile was not present (guest checkout flow)
      // (For registered users, onUpdateUserAidStatus already dispatches the email)
      if (!userId && targetBooking && (targetBooking as any).clientEmail) {
        fetch("/api/send-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "send_approval_notification",
            clientName: (targetBooking as any).clientName,
            clientEmail: (targetBooking as any).clientEmail,
            clientPhone: (targetBooking as any).clientPhone || "",
            category: (targetBooking as any).financialAidCategory || "Somali Youth",
          }),
        }).then((res) => {
          console.log("Automated booking approval email triggered:", res.status);
        }).catch((err) => {
          console.warn("Failed to dispatch automated booking approval email:", err);
        });
      }
    }
  }

  async function handleDeclineRequest(email: string, userId?: string) {
    // 1. If user account exists, update client profile
    if (userId && onUpdateUserAidStatus) {
      try {
        await onUpdateUserAidStatus(userId, "rejected");
      } catch (err) {
        console.error("Failed to decline user aid status:", err);
      }
    }

    // 2. Update all pending financial aid bookings for this client
    const cleanEmail = email.trim().toLowerCase();
    const nextBookings = bookings.map((b) => {
      if (
        b.clientEmail?.trim().toLowerCase() === cleanEmail &&
        b.financialAidApplied &&
        b.financialAidStatus === "pending"
      ) {
        return {
          ...b,
          financialAidStatus: "rejected" as const,
          status: "upcoming" as const, // Booking stays scheduled but without discount
          price: b.originalPrice || b.price, // Revert to regular price
        };
      }
      return b;
    });

    onSaveBookings(nextBookings);
  }

  return (
    <div>
      {/* Sub-tabs header */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          borderBottom: `1px solid ${colors.line}50`,
          paddingBottom: 10,
        }}
      >
        <button
          onClick={() => setTab("all")}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: tab === "all" ? colors.indigoSoft : "transparent",
            color: tab === "all" ? colors.indigo : colors.inkSoft,
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          All Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setTab("aid")}
          style={{
            padding: "8px 16px",
            borderRadius: 999,
            border: "none",
            background: tab === "aid" ? colors.amberSoft + "40" : "transparent",
            color: tab === "aid" ? colors.amber : colors.inkSoft,
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          Financial Aid Requests ({unifiedRequests.length})
          {pendingCount > 0 && (
            <span
              style={{
                background: colors.amber,
                color: "#fff",
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: 99,
                fontWeight: 800,
              }}
            >
              {pendingCount} pending
            </span>
          )}
        </button>
      </div>

      {/* "All Bookings" Tab */}
      {tab === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bookings.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="No bookings yet"
              sub="Platform bookings will appear here as clients book sessions."
            />
          )}

          {bookings.map((b) => {
            const t = therapists.find((x) => x.id === b.therapistId);
            return (
              <Card
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "14px 16px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: "14px", color: colors.ink }}>
                      {b.clientName}
                    </span>
                    <span style={{ fontSize: 12, color: colors.inkSoft }}>→</span>
                    <span style={{ fontWeight: 600, fontSize: "13px", color: colors.indigo }}>
                      {t ? t.name : "—"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: colors.inkSoft, display: "flex", flexWrap: "wrap", gap: "6px 10px", alignItems: "center" }}>
                    <span>{fmtDate(b.date)} · {b.time}</span>
                    {b.financialAidApplied && (
                      <span
                        style={{
                          fontSize: "10.5px",
                          fontWeight: 700,
                          padding: "1px 6px",
                          borderRadius: 6,
                          background:
                            b.financialAidStatus === "approved"
                              ? "#e6f4ea"
                              : b.financialAidStatus === "rejected"
                              ? "#fce8e6"
                              : "#fef7e0",
                          color:
                            b.financialAidStatus === "approved"
                              ? "#137333"
                              : b.financialAidStatus === "rejected"
                              ? "#c5221f"
                              : "#b06000",
                        }}
                      >
                        Relief {b.financialAidStatus === "approved" ? "Approved" : b.financialAidStatus === "rejected" ? "Declined" : "Pending"}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: colors.ink }}>
                    {fmtMoney(b.price)}
                  </div>
                  {b.financialAidApplied && b.originalPrice && b.financialAidStatus !== "rejected" && (
                    <div style={{ fontSize: "11px", color: colors.inkSoft, textDecoration: "line-through" }}>
                      {fmtMoney(b.originalPrice)}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* "Financial Aid Requests" Unified Tab */}
      {tab === "aid" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {unifiedRequests.length === 0 && (
            <EmptyState
              icon={Heart}
              title="No relief requests"
              sub="Unified financial aid requests from eligible Somali youth, students, and Barbaar community members will display here."
            />
          )}

          {unifiedRequests.map((r) => {
            const status = r.status;
            const approvedAt = r.userApprovedAt;

            // Calculate remaining validity if approved
            let expirationText = "";
            if (status === "approved" && approvedAt) {
              const expiresAt = new Date(approvedAt).getTime() + 3 * 24 * 60 * 60 * 1000;
              const now = Date.now();
              const diff = expiresAt - now;
              if (diff <= 0) {
                expirationText = "Expired";
              } else {
                const totalHours = Math.floor(diff / (1000 * 60 * 60));
                const days = Math.floor(totalHours / 24);
                const hours = totalHours % 24;
                expirationText = `${days}d ${hours}h remaining`;
              }
            }

            // Actionable if either profile is pending, or if any of its bookings are pending
            const isActionable = status === "pending" || r.bookings.some((b) => b.financialAidStatus === "pending");

            return (
              <Card
                key={r.email}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  padding: 20,
                  border: `1.5px solid ${isActionable ? colors.amber + "35" : colors.line}40`,
                  boxShadow: isActionable ? "0 4px 20px rgba(217, 119, 6, 0.03)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Client Identity */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 800, fontSize: "16px", color: colors.ink }}>
                        {r.name}
                      </span>
                      {r.userId && (
                        <span style={{
                          fontSize: "9px",
                          fontWeight: 700,
                          background: colors.indigoSoft,
                          color: colors.indigo,
                          padding: "1px 6px",
                          borderRadius: 4,
                          textTransform: "uppercase"
                        }}>
                          Registered Account
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12.5px", color: colors.inkSoft, marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Mail size={13} color={colors.inkSoft} /> {r.email}
                      </span>
                      {r.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={13} color={colors.inkSoft} /> {r.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        padding: "3px 10px",
                        borderRadius: 20,
                        background:
                          status === "approved"
                            ? "#e6f4ea"
                            : status === "rejected"
                            ? "#fce8e6"
                            : "#fef7e0",
                        color:
                          status === "approved"
                            ? "#137333"
                            : status === "rejected"
                            ? "#c5221f"
                            : "#b06000",
                      }}
                    >
                      {status === "approved" ? "Approved" : status === "rejected" ? "Declined" : "Pending Approval"}
                    </span>
                    {expirationText && (
                      <span style={{ fontSize: "11px", color: expirationText === "Expired" ? "#c5221f" : colors.inkSoft, fontWeight: 600 }}>
                        ⏳ {expirationText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Justification Details */}
                <div style={{ fontSize: "13px", background: colors.ivory + "60", padding: "12px 14px", borderRadius: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, color: colors.inkSoft, fontSize: "11px", textTransform: "uppercase" }}>
                      Qualifying Category:
                    </span>
                    <span
                      style={{
                        background: colors.amberSoft + "40",
                        color: colors.amber,
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {r.category}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: colors.inkSoft, fontSize: "11px", textTransform: "uppercase", display: "block", marginBottom: 3 }}>
                      Justification Statement:
                    </span>
                    <p style={{ color: colors.ink, fontStyle: "italic", lineHeight: 1.4 }}>
                      "{r.reason || "No statement provided."}"
                    </p>
                  </div>
                </div>

                {/* Associated Bookings */}
                {r.bookings.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: colors.inkSoft, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Associated Sessions ({r.bookings.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.bookings.map((b) => {
                        const t = therapists.find((x) => x.id === b.therapistId);
                        const bStatus = b.financialAidStatus || "pending";
                        return (
                          <div
                            key={b.id}
                            style={{
                              background: "#ffffff",
                              border: `1px solid ${colors.line}40`,
                              borderRadius: 10,
                              padding: "10px 14px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              fontSize: "12.5px",
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, color: colors.ink }}>
                                Session with {t ? t.name : "Therapist"}
                              </div>
                              <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginTop: 2 }}>
                                {fmtDate(b.date)} at {b.time}
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700 }}>
                                  <span style={{ fontSize: "11.5px", color: colors.inkSoft, textDecoration: "line-through" }}>
                                    {fmtMoney(b.originalPrice || b.price)}
                                  </span>
                                  <span style={{ color: colors.amber }}>
                                    {fmtMoney(b.price)}
                                  </span>
                                </div>
                                <div style={{ fontSize: "10px", color: colors.inkSoft, fontWeight: 600 }}>
                                  40% Relief Applied
                                </div>
                              </div>
                              
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 800,
                                  textTransform: "uppercase",
                                  padding: "2px 6px",
                                  borderRadius: 6,
                                  background:
                                    bStatus === "approved"
                                      ? "#e6f4ea"
                                      : bStatus === "rejected"
                                      ? "#fce8e6"
                                      : "#fef7e0",
                                  color:
                                    bStatus === "approved"
                                      ? "#137333"
                                      : bStatus === "rejected"
                                      ? "#c5221f"
                                      : "#b06000",
                                }}
                              >
                                {bStatus}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unified Actions */}
                {isActionable && (
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6, borderTop: `1px solid ${colors.line}20`, paddingTop: 12 }}>
                    <Button
                      variant="ghost"
                      icon={X}
                      onClick={() => handleDeclineRequest(r.email, r.userId)}
                      style={{ color: "#c5221f" }}
                    >
                      Decline Relief
                    </Button>
                    <Button
                      variant="amber"
                      icon={Check}
                      onClick={() => handleApproveRequest(r.email, r.userId)}
                    >
                      Approve 40% Relief
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
