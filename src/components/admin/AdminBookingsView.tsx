/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Check,
  X,
  Heart,
  Search,
  Clock,
  Mail,
  Phone,
  User,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  Bell,
  Send,
  MailCheck,
  ShieldCheck,
} from "lucide-react";
import { Therapist, Booking, FinancialAidRequest } from "../../types";
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
  aidRequests?: FinancialAidRequest[];
  onUpdateAidStatus?: (
    requestId: string,
    status: "approved" | "rejected",
    targetEmail?: string,
    bookingId?: string
  ) => Promise<void>;
  onUpdateUserAidStatus?: (userId: string, status: "approved" | "rejected") => Promise<void>;
  onSendApprovalEmail?: (
    requestId: string,
    email: string,
    name?: string,
    phone?: string,
    category?: string
  ) => Promise<void>;
  onSendExpiryAlert?: (
    requestId: string,
    email: string,
    name?: string,
    phone?: string,
    category?: string
  ) => Promise<void>;
}

export interface UnifiedAidItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  financialAidStatus: "pending" | "approved" | "rejected" | "completed";
  financialAidCategory: string;
  financialAidReason: string;
  createdAt: string;
  financialAidApprovedAt?: string | null;
  bookingId?: string;
  therapistName?: string;
  sessionDate?: string;
  sessionTime?: string;
  originalPrice?: number;
  discountedPrice?: number;
  source: "upfront" | "booking" | "user";
  approvalEmailSent?: boolean;
  approvalEmailSentAt?: string | null;
  expiryAlertSent?: boolean;
  expiryAlertSentAt?: string | null;
  expiryDate?: string | null;
}

export default function AdminBookingsView({
  therapists,
  bookings,
  onSaveBookings,
  users = [],
  aidRequests = [],
  onUpdateAidStatus,
  onUpdateUserAidStatus,
  onSendApprovalEmail,
  onSendExpiryAlert,
}: AdminBookingsViewProps) {
  // Only two simple tabs: "all" bookings and "aid" (unified Financial Aid Requests)
  const [tab, setTab] = useState<"all" | "aid">("all");
  const [aidFilter, setAidFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [bookingFilter, setBookingFilter] = useState<"all" | "upcoming" | "completed" | "aid">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Aggregate and deduplicate ALL financial aid requests (always showing latest submission)
  const unifiedAidList = useMemo(() => {
    const allItems: UnifiedAidItem[] = [];

    // 1. From dedicated aidRequests state (standalone / upfront applications)
    aidRequests.forEach((req) => {
      if (!req) return;
      allItems.push({
        id: req.id,
        name: req.name || "Client Applicant",
        email: (req.email || "").trim().toLowerCase(),
        phone: req.phone || "",
        financialAidStatus: req.financialAidStatus || "pending",
        financialAidCategory: req.financialAidCategory || "Somali Youth",
        financialAidReason: req.financialAidReason || "Financial relief requested.",
        createdAt: req.createdAt || new Date().toISOString(),
        financialAidApprovedAt: req.financialAidApprovedAt || null,
        bookingId: req.bookingId,
        therapistName: req.therapistName,
        sessionDate: req.sessionDate,
        sessionTime: req.sessionTime,
        originalPrice: req.originalPrice,
        discountedPrice: req.discountedPrice,
        source: req.source || "upfront",
        approvalEmailSent: req.approvalEmailSent,
        approvalEmailSentAt: req.approvalEmailSentAt,
        expiryAlertSent: req.expiryAlertSent,
        expiryAlertSentAt: req.expiryAlertSentAt,
        expiryDate: req.expiryDate,
      });
    });

    // 2. From bookings with financial aid applied
    bookings.forEach((b) => {
      if (b.financialAidApplied) {
        const t = therapists.find((x) => x.id === b.therapistId);
        allItems.push({
          id: `aid_bk_${b.id}`,
          name: b.clientName || "Client Applicant",
          email: (b.clientEmail || "").trim().toLowerCase(),
          phone: b.clientPhone || "",
          financialAidStatus: (b.financialAidStatus as any) || "pending",
          financialAidCategory: b.financialAidCategory || "Somali Youth",
          financialAidReason: b.financialAidReason || "Applied during session booking.",
          createdAt: b.createdAt || new Date().toISOString(),
          financialAidApprovedAt: null,
          bookingId: b.id,
          therapistName: t ? t.name : "Therapist",
          sessionDate: b.date,
          sessionTime: b.time,
          originalPrice: b.originalPrice || b.price,
          discountedPrice: b.price,
          source: "booking",
        });
      }
    });

    // 3. From users collection with financial aid status
    users.forEach((u) => {
      if (u.financialAidStatus && u.financialAidStatus !== "none") {
        allItems.push({
          id: u.id,
          name: u.name || "Client User",
          email: (u.email || "").trim().toLowerCase(),
          phone: u.phone || "",
          financialAidStatus: u.financialAidStatus,
          financialAidCategory: u.financialAidCategory || "General Assistance",
          financialAidReason: u.financialAidReason || "Financial aid profile application.",
          createdAt: u.createdAt || u.updatedAt || new Date().toISOString(),
          financialAidApprovedAt: u.financialAidApprovedAt || null,
          source: "user",
        });
      }
    });

    // Sort strictly by newest createdAt first
    allItems.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    // Deduplicate by applicant email: the NEWEST submission wins!
    const map = new Map<string, UnifiedAidItem>();
    allItems.forEach((item) => {
      const key = item.email || item.id;
      if (!map.has(key)) {
        map.set(key, { ...item });
      } else {
        // Supplement booking details if the newer record doesn't have them
        const newer = map.get(key)!;
        if (!newer.bookingId && item.bookingId) {
          newer.bookingId = item.bookingId;
          newer.therapistName = item.therapistName;
          newer.sessionDate = item.sessionDate;
          newer.sessionTime = item.sessionTime;
          newer.originalPrice = item.originalPrice;
          newer.discountedPrice = item.discountedPrice;
        }
        if (!newer.approvalEmailSent && item.approvalEmailSent) {
          newer.approvalEmailSent = item.approvalEmailSent;
          newer.approvalEmailSentAt = item.approvalEmailSentAt;
        }
        if (!newer.expiryAlertSent && item.expiryAlertSent) {
          newer.expiryAlertSent = item.expiryAlertSent;
          newer.expiryAlertSentAt = item.expiryAlertSentAt;
        }
      }
    });

    // Return list sorted: pending requests first (so admin sees them immediately to approve), then by latest date
    return Array.from(map.values()).sort((a, b) => {
      if (a.financialAidStatus === "pending" && b.financialAidStatus !== "pending") return -1;
      if (a.financialAidStatus !== "pending" && b.financialAidStatus === "pending") return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [aidRequests, bookings, users, therapists]);

  const pendingAidCount = useMemo(() => {
    return unifiedAidList.filter((item) => item.financialAidStatus === "pending").length;
  }, [unifiedAidList]);

  // Filtered Aid List
  const filteredAidList = useMemo(() => {
    return unifiedAidList.filter((item) => {
      if (aidFilter !== "all" && item.financialAidStatus !== aidFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.financialAidCategory.toLowerCase().includes(q) ||
          (item.therapistName && item.therapistName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [unifiedAidList, aidFilter, searchQuery]);

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingFilter === "upcoming" && b.status !== "upcoming") return false;
      if (bookingFilter === "completed" && b.status !== "completed") return false;
      if (bookingFilter === "aid" && !b.financialAidApplied) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = therapists.find((x) => x.id === b.therapistId);
        const match =
          b.clientName.toLowerCase().includes(q) ||
          b.clientEmail.toLowerCase().includes(q) ||
          b.clientPhone.toLowerCase().includes(q) ||
          (t && t.name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [bookings, bookingFilter, searchQuery, therapists]);

  // Approval handler
  async function handleApproveAid(item: UnifiedAidItem) {
    if (onUpdateAidStatus) {
      await onUpdateAidStatus(item.id, "approved", item.email, item.bookingId);
      showToast(`Financial aid approved for ${item.name || item.email}. Approval email with session details dispatched!`);
    } else if (onUpdateUserAidStatus) {
      await onUpdateUserAidStatus(item.id, "approved");
      showToast(`Financial aid approved for ${item.name || item.email}.`);
    } else {
      // Fallback local booking updater
      const next = bookings.map((b) => {
        if (b.id === item.bookingId || (b.clientEmail && b.clientEmail.toLowerCase() === item.email.toLowerCase())) {
          return {
            ...b,
            financialAidStatus: "approved" as const,
            status: "upcoming" as const,
          };
        }
        return b;
      });
      onSaveBookings(next);
    }
  }

  // Decline handler
  async function handleDeclineAid(item: UnifiedAidItem) {
    if (onUpdateAidStatus) {
      await onUpdateAidStatus(item.id, "rejected", item.email, item.bookingId);
      showToast(`Financial aid request declined for ${item.name || item.email}.`);
    } else if (onUpdateUserAidStatus) {
      await onUpdateUserAidStatus(item.id, "rejected");
      showToast(`Financial aid request declined for ${item.name || item.email}.`);
    } else {
      // Fallback local booking updater
      const next = bookings.map((b) => {
        if (b.id === item.bookingId || (b.clientEmail && b.clientEmail.toLowerCase() === item.email.toLowerCase())) {
          return {
            ...b,
            financialAidStatus: "rejected" as const,
            price: b.originalPrice || b.price,
          };
        }
        return b;
      });
      onSaveBookings(next);
    }
  }

  // Manual trigger: Send / Resend Approval Notification Email
  async function handleSendApprovalEmailNow(item: UnifiedAidItem) {
    if (!item.email || !onSendApprovalEmail) return;
    setSendingEmailId(`approval_${item.id}`);
    try {
      await onSendApprovalEmail(
        item.id,
        item.email,
        item.name,
        item.phone,
        item.financialAidCategory
      );
      showToast(`Approval email successfully sent to ${item.email} with therapy details.`);
    } catch (err: any) {
      showToast(`Failed to send approval email: ${err?.message || err}`);
    } finally {
      setSendingEmailId(null);
    }
  }

  // Manual trigger: Send 24-Hour Expiration Warning Notification Alert
  async function handleSendExpiryAlertNow(item: UnifiedAidItem) {
    if (!item.email || !onSendExpiryAlert) return;
    setSendingEmailId(`expiry_${item.id}`);
    try {
      await onSendExpiryAlert(
        item.id,
        item.email,
        item.name,
        item.phone,
        item.financialAidCategory
      );
      showToast(`24-hour expiration reminder alert dispatched to ${item.email}.`);
    } catch (err: any) {
      showToast(`Failed to send expiry alert: ${err?.message || err}`);
    } finally {
      setSendingEmailId(null);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: "100%", position: "relative" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: colors.indigoDeep,
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: "13.5px",
            fontWeight: 600,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 420,
          }}
        >
          <MailCheck size={18} style={{ color: "#86efac", flexShrink: 0 }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-tabs header - Simple 2 tabs */}
      <div
        id="admin-bookings-tab-bar"
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 18,
          borderBottom: `1px solid ${colors.line}60`,
          paddingBottom: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            id="tab-all-bookings"
            onClick={() => {
              setTab("all");
              setSearchQuery("");
            }}
            style={{
              padding: "9px 18px",
              borderRadius: 999,
              border: "none",
              background: tab === "all" ? colors.indigoDeep : "#f1f5f9",
              color: tab === "all" ? "#ffffff" : colors.inkSoft,
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CalendarDays size={15} />
            All Bookings ({bookings.length})
          </button>

          <button
            id="tab-financial-aid-requests"
            onClick={() => {
              setTab("aid");
              setSearchQuery("");
            }}
            style={{
              padding: "9px 18px",
              borderRadius: 999,
              border: "none",
              background: tab === "aid" ? colors.amber : "#f1f5f9",
              color: tab === "aid" ? "#ffffff" : colors.inkSoft,
              fontWeight: 700,
              fontSize: "13.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
          >
            <Heart size={15} />
            Financial Aid Requests ({unifiedAidList.length})
            {pendingAidCount > 0 && (
              <span
                style={{
                  background: tab === "aid" ? "#ffffff" : colors.amber,
                  color: tab === "aid" ? colors.amber : "#ffffff",
                  fontSize: "11px",
                  padding: "2px 7px",
                  borderRadius: 99,
                  fontWeight: 800,
                }}
              >
                {pendingAidCount} pending
              </span>
            )}
          </button>
        </div>

        {/* Global Search Input */}
        <div
          style={{
            position: "relative",
            minWidth: 200,
            flex: "1 1 200px",
            maxWidth: 320,
          }}
        >
          <Search
            size={15}
            color={colors.inkSoft}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              fontSize: "13px",
              color: colors.ink,
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: colors.inkSoft,
                padding: 2,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL BOOKINGS */}
      {/* ========================================================================= */}
      {tab === "all" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Sub Filter Chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            {[
              { key: "all", label: `All (${bookings.length})` },
              { key: "upcoming", label: `Upcoming (${bookings.filter((b) => b.status === "upcoming").length})` },
              { key: "completed", label: `Completed (${bookings.filter((b) => b.status === "completed").length})` },
              { key: "aid", label: `Aid Applied (${bookings.filter((b) => b.financialAidApplied).length})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setBookingFilter(f.key as any)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "1px solid",
                  borderColor: bookingFilter === f.key ? colors.indigo : "#e2e8f0",
                  background: bookingFilter === f.key ? colors.indigoSoft + "40" : "#ffffff",
                  color: bookingFilter === f.key ? colors.indigo : colors.inkSoft,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No bookings match"
              sub="Platform bookings will appear here as clients schedule counseling sessions."
            />
          ) : (
            filteredBookings.map((b) => {
              const t = therapists.find((x) => x.id === b.therapistId);
              return (
                <Card
                  key={b.id}
                  style={{
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: "15px", color: colors.ink }}>
                          {b.clientName}
                        </span>
                        <span style={{ fontSize: 13, color: colors.inkSoft }}>with</span>
                        <span style={{ fontWeight: 700, fontSize: "14px", color: colors.indigo }}>
                          {t ? t.name : "Therapist"}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "12.5px",
                          color: colors.inkSoft,
                          marginTop: 4,
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>📅 {fmtDate(b.date)} at {b.time}</span>
                        {b.clientEmail && <span>✉️ {b.clientEmail}</span>}
                        {b.clientPhone && <span>📞 {b.clientPhone}</span>}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "16px", color: colors.ink }}>
                        {fmtMoney(b.price)}
                      </div>
                      {b.financialAidApplied && b.originalPrice && b.financialAidStatus !== "rejected" && (
                        <div
                          style={{
                            fontSize: "11.5px",
                            color: colors.inkSoft,
                            textDecoration: "line-through",
                          }}
                        >
                          {fmtMoney(b.originalPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badges Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      paddingTop: 8,
                      borderTop: "1px solid #f1f5f9",
                      fontSize: "11.5px",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: b.status === "completed" ? "#e6f4ea" : "#e0f2fe",
                        color: b.status === "completed" ? "#137333" : "#0284c7",
                      }}
                    >
                      Status: {b.status}
                    </span>

                    {b.paymentStatus && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                          background: b.paymentStatus === "paid" ? "#dcfce7" : "#fef3c7",
                          color: b.paymentStatus === "paid" ? "#15803d" : "#b45309",
                        }}
                      >
                        Payment: {b.paymentStatus.toUpperCase()} {b.paymentGateway ? `(${b.paymentGateway})` : ""}
                      </span>
                    )}

                    {b.financialAidApplied && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontWeight: 700,
                          background:
                            b.financialAidStatus === "approved"
                              ? "#dcfce7"
                              : b.financialAidStatus === "rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                          color:
                            b.financialAidStatus === "approved"
                              ? "#15803d"
                              : b.financialAidStatus === "rejected"
                              ? "#b91c1c"
                              : "#b45309",
                        }}
                      >
                        40% Relief: {b.financialAidStatus === "approved" ? "Approved" : b.financialAidStatus === "rejected" ? "Declined" : "Pending Review"}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FINANCIAL AID REQUESTS (CONSOLIDATED & APPROVABLE) */}
      {/* ========================================================================= */}
      {tab === "aid" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Aid Filter Chips */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { key: "all", label: `All Requests (${unifiedAidList.length})` },
                {
                  key: "pending",
                  label: `Pending Approval (${unifiedAidList.filter((x) => x.financialAidStatus === "pending").length})`,
                },
                {
                  key: "approved",
                  label: `Approved (${unifiedAidList.filter((x) => x.financialAidStatus === "approved").length})`,
                },
                {
                  key: "rejected",
                  label: `Declined (${unifiedAidList.filter((x) => x.financialAidStatus === "rejected").length})`,
                },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAidFilter(f.key as any)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: "12.5px",
                    fontWeight: 600,
                    border: "1px solid",
                    borderColor: aidFilter === f.key ? colors.amber : "#e2e8f0",
                    background: aidFilter === f.key ? colors.amberSoft + "40" : "#ffffff",
                    color: aidFilter === f.key ? colors.amber : colors.inkSoft,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: "12px", color: colors.inkSoft }}>
              Showing {filteredAidList.length} of {unifiedAidList.length} requests
            </div>
          </div>

          {filteredAidList.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No financial aid requests"
              sub="Applications from Somali youth, students, and low-income community members will appear here."
            />
          ) : (
            filteredAidList.map((item) => {
              const status = item.financialAidStatus || "pending";
              const approvedAt = item.financialAidApprovedAt;

              // Calculate live 72-hour expiration timer if approved
              let expirationText = "";
              let isExpired = false;
              if (status === "approved" && approvedAt) {
                const expiresAt = new Date(approvedAt).getTime() + 3 * 24 * 60 * 60 * 1000;
                const now = Date.now();
                const diff = expiresAt - now;
                if (diff <= 0) {
                  isExpired = true;
                  expirationText = "Expired (72h passed)";
                } else {
                  const totalHours = Math.floor(diff / (1000 * 60 * 60));
                  const days = Math.floor(totalHours / 24);
                  const hours = totalHours % 24;
                  expirationText = `${days}d ${hours}h validity remaining`;
                }
              }

              return (
                <Card
                  key={item.id}
                  style={{
                    padding: "18px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    border: `1.5px solid ${
                      status === "pending"
                        ? colors.amber + "60"
                        : status === "approved"
                        ? "#86efac"
                        : "#fca5a5"
                    }`,
                    background: status === "pending" ? "#fffcf5" : "#ffffff",
                    borderRadius: 14,
                  }}
                >
                  {/* Top Bar: Applicant Info + Status Badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 800, fontSize: "16px", color: colors.ink }}>
                          {item.name}
                        </span>
                        <span
                          style={{
                            background: colors.amberSoft + "50",
                            color: colors.amber,
                            fontSize: "11.5px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {item.financialAidCategory}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "12.5px",
                          color: colors.inkSoft,
                          marginTop: 4,
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {item.email && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Mail size={13} /> {item.email}
                          </span>
                        )}
                        {item.phone && (
                          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={13} /> {item.phone}
                          </span>
                        )}
                        <span>
                          Applied: {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background:
                            status === "approved"
                              ? "#dcfce7"
                              : status === "rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                          color:
                            status === "approved"
                              ? "#15803d"
                              : status === "rejected"
                              ? "#b91c1c"
                              : "#b45309",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {status === "approved" && <CheckCircle2 size={13} />}
                        {status === "rejected" && <XCircle size={13} />}
                        {status === "pending" && <AlertCircle size={13} />}
                        {status === "approved"
                          ? "Approved 40% Relief"
                          : status === "rejected"
                          ? "Declined"
                          : "Pending Approval"}
                      </span>

                      {expirationText && (
                        <span
                          style={{
                            fontSize: "11.5px",
                            fontWeight: 600,
                            color: isExpired ? "#b91c1c" : colors.inkSoft,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={12} /> {expirationText}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Justification Statement Quote Box */}
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: colors.inkSoft,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: 4,
                      }}
                    >
                      Applicant Justification Statement
                    </div>
                    <div
                      style={{
                        background: "#f8fafc",
                        borderLeft: `3px solid ${status === "approved" ? "#22c55e" : colors.amber}`,
                        padding: "10px 14px",
                        borderRadius: "0 8px 8px 0",
                        fontSize: "13.5px",
                        lineHeight: 1.5,
                        color: colors.ink,
                        fontStyle: "italic",
                      }}
                    >
                      "{item.financialAidReason}"
                    </div>
                  </div>

                  {/* If Tied to a Booking Session */}
                  {item.bookingId && (
                    <div
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "13px",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: colors.ink }}>
                          Counseling Session with {item.therapistName || "Therapist"}
                        </div>
                        <div style={{ fontSize: "12px", color: colors.inkSoft }}>
                          {item.sessionDate ? fmtDate(item.sessionDate) : "Scheduled"} {item.sessionTime ? `at ${item.sessionTime}` : ""}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 800 }}>
                          {item.originalPrice && (
                            <span style={{ fontSize: "12px", color: colors.inkSoft, textDecoration: "line-through" }}>
                              {fmtMoney(item.originalPrice)}
                            </span>
                          )}
                          <span style={{ color: colors.amber, fontSize: "15px" }}>
                            {fmtMoney(item.discountedPrice || (item.originalPrice ? Math.round(item.originalPrice * 0.6) : 0))}
                          </span>
                        </div>
                        <span style={{ fontSize: "11px", color: "#15803d", fontWeight: 700 }}>
                          40% Barbaar Community Discount
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Email & 24h Expiration Alert Tracking Panel */}
                  {status === "approved" && (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: colors.ink,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Mail size={14} style={{ color: colors.amber }} />
                          Automated Client Email Lifecycle
                        </span>
                        <span style={{ fontSize: "11px", color: colors.inkSoft }}>
                          3-Day Validity Period
                        </span>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                          gap: 10,
                        }}
                      >
                        {/* 1. Approval Notification Email */}
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "8px 12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "11.5px", fontWeight: 700, color: colors.ink }}>
                              Approval Email
                            </div>
                            <div style={{ fontSize: "11px", color: item.approvalEmailSent ? "#15803d" : colors.inkSoft }}>
                              {item.approvalEmailSent
                                ? `Sent ${item.approvalEmailSentAt ? new Date(item.approvalEmailSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "to client"}`
                                : "Dispatched on approval"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendApprovalEmailNow(item)}
                            disabled={sendingEmailId === `approval_${item.id}`}
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#f8fafc",
                              color: colors.ink,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Send size={11} />
                            {sendingEmailId === `approval_${item.id}`
                              ? "Sending..."
                              : item.approvalEmailSent
                              ? "Resend"
                              : "Send Now"}
                          </button>
                        </div>

                        {/* 2. 24h Expiry Warning Notification */}
                        <div
                          style={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "8px 12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "11.5px", fontWeight: 700, color: colors.ink }}>
                              24h Expiry Alert
                            </div>
                            <div style={{ fontSize: "11px", color: item.expiryAlertSent ? "#15803d" : colors.amber }}>
                              {item.expiryAlertSent
                                ? `Alert sent ${item.expiryAlertSentAt ? new Date(item.expiryAlertSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}`
                                : "Auto-sends 1 day before expiry"}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendExpiryAlertNow(item)}
                            disabled={sendingEmailId === `expiry_${item.id}`}
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: `1px solid ${item.expiryAlertSent ? "#cbd5e1" : colors.amber + "60"}`,
                              background: item.expiryAlertSent ? "#f8fafc" : colors.amberSoft + "40",
                              color: item.expiryAlertSent ? colors.inkSoft : colors.amber,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Bell size={11} />
                            {sendingEmailId === `expiry_${item.id}`
                              ? "Sending..."
                              : item.expiryAlertSent
                              ? "Resend Alert"
                              : "Send Alert"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 10,
                      paddingTop: 10,
                      borderTop: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                    }}
                  >
                    {status === "pending" && (
                      <>
                        <Button
                          variant="ghost"
                          icon={X}
                          onClick={() => handleDeclineAid(item)}
                          style={{
                            color: "#b91c1c",
                            borderColor: "#fecaca",
                            fontSize: "13px",
                          }}
                        >
                          Decline Request
                        </Button>
                        <Button
                          variant="amber"
                          icon={Check}
                          onClick={() => handleApproveAid(item)}
                          style={{
                            background: colors.amber,
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Approve 40% Relief
                        </Button>
                      </>
                    )}

                    {status === "approved" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                          <Check size={14} /> Active Relief: Client receives 40% off across all sessions.
                        </span>
                        <Button
                          variant="ghost"
                          icon={X}
                          onClick={() => handleDeclineAid(item)}
                          style={{
                            color: "#b91c1c",
                            fontSize: "12px",
                            padding: "4px 10px",
                          }}
                        >
                          Revoke Relief
                        </Button>
                      </div>
                    )}

                    {status === "rejected" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 500 }}>
                          Request was declined.
                        </span>
                        <Button
                          variant="ghost"
                          icon={RotateCcw}
                          onClick={() => handleApproveAid(item)}
                          style={{
                            color: colors.amber,
                            fontSize: "12px",
                            padding: "4px 10px",
                          }}
                        >
                          Re-approve 40% Relief
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
