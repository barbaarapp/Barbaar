/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  Video, 
  Send, 
  CheckCircle2, 
  ChevronLeft, 
  Search, 
  User, 
  Clock, 
  Phone, 
  Calendar, 
  ExternalLink 
} from "lucide-react";
import { Therapist, Message, Booking } from "../../types";
import { colors } from "../../constants";
import Button from "../ui/Button";
import EmptyState from "../ui/EmptyState";

interface TherapistMessagesProps {
  therapist: Therapist;
  thread: Message[];
  onSend: (text: string, clientEmail: string) => void;
  onZoom: (clientEmail: string) => void;
  bookings: Booking[];
  onJoinSession?: (booking: Booking) => void;
}

export default function TherapistMessages({
  therapist,
  thread,
  onSend,
  onZoom,
  bookings,
  onJoinSession,
}: TherapistMessagesProps) {
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>("");
  const [draft, setDraft] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Derive unique clients who have booked with this therapist OR messaged them
  const myBookings = bookings.filter((b) => b.therapistId === therapist.id);
  const uniqueClientsMap = new Map<string, { name: string; email: string; phone?: string; latestBooking?: Booking }>();
  
  // 1. Load clients from bookings (sorting to keep latest bookings linked)
  const sortedBookings = [...myBookings].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  sortedBookings.forEach((b) => {
    if (b.clientEmail) {
      const emailLower = b.clientEmail.toLowerCase();
      if (!uniqueClientsMap.has(emailLower)) {
        uniqueClientsMap.set(emailLower, {
          name: b.clientName || "Client",
          email: b.clientEmail,
          phone: b.clientPhone,
          latestBooking: b,
        });
      }
    }
  });

  // 2. Load clients from existing message thread as fallback/complement
  thread.forEach((m) => {
    if (m.clientEmail) {
      const emailLower = m.clientEmail.toLowerCase();
      if (!uniqueClientsMap.has(emailLower)) {
        uniqueClientsMap.set(emailLower, {
          name: m.from === "client" ? "Patient" : "Patient Participant",
          email: m.clientEmail,
        });
      }
    }
  });

  const clients = Array.from(uniqueClientsMap.values());

  // Set default client on desktop load
  useEffect(() => {
    if (clients.length > 0 && !selectedClientEmail) {
      setSelectedClientEmail(clients[0].email);
    }
  }, [bookings, therapist.id, clients, selectedClientEmail]);

  const selectedClient = clients.find((c) => c.email.toLowerCase() === selectedClientEmail.toLowerCase()) || clients[0];

  // Filter messages for selected client
  const filteredThread = thread.filter((m) => {
    if (!m.clientEmail) return true; // fallback for legacy messages
    return m.clientEmail.toLowerCase() === selectedClientEmail.toLowerCase();
  });

  // Auto-scroll to bottom of thread when filteredThread or client changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredThread, selectedClientEmail]);

  // Auto-grow draft textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [draft]);

  // Retrieve last message and its timestamp for a specific email
  const getClientLastMessage = (email: string) => {
    const clientMsgs = thread.filter(
      (m) => m.clientEmail && m.clientEmail.toLowerCase() === email.toLowerCase()
    );
    if (clientMsgs.length === 0) return null;
    return clientMsgs[clientMsgs.length - 1];
  };

  // Format date helper for dividers and threads
  function getDividerText(isoString: string): string {
    try {
      const d = new Date(isoString);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return "Today";
      }
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function getMessageTime(isoString: string): string {
    try {
      return new Date(isoString).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "";
    }
  }

  function handleSendText() {
    if (!draft.trim() || !selectedClientEmail) return;
    onSend(draft.trim(), selectedClientEmail);
    setDraft("");
  }

  function handleZoomAction() {
    if (!selectedClientEmail) return;
    onZoom(selectedClientEmail);
  }

  // Filter threads based on search input
  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Dynamic Embedded Custom Styles for Premium Native Feel */}
      <style>{`
        .therapist-chat-container {
          display: flex;
          background: #ffffff;
          border: 1px solid ${colors.line}60;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(56, 76, 67, 0.04);
          height: calc(100vh - 220px);
          min-height: 520px;
          position: relative;
        }

        .tc-sidebar {
          width: 320px;
          border-right: 1px solid ${colors.line}60;
          display: flex;
          flex-direction: column;
          background: #FAF8F5;
          flex-shrink: 0;
          z-index: 20;
          transition: all 0.2s ease-in-out;
        }

        .tc-chatfeed {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: ${colors.ivory}; /* Warm brand background */
          min-width: 0;
          position: relative;
        }

        .chat-pill-indicator {
          background: ${colors.acacia};
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          box-shadow: 0 0 8px ${colors.acacia};
        }

        @media (max-width: 899px) {
          .therapist-chat-container {
            height: calc(100vh - 170px);
            border-radius: 16px;
            min-height: 460px;
          }
          
          .tc-sidebar {
            display: ${mobileView === "list" ? "flex" : "none"} !important;
            width: 100% !important;
            border-right: none !important;
          }

          .tc-chatfeed {
            display: ${mobileView === "chat" ? "flex" : "none"} !important;
            width: 100% !important;
          }
        }

        /* Message custom animations */
        .msg-bubble-mine {
          background: ${colors.indigo};
          color: #ffffff;
          border-radius: 18px 18px 4px 18px;
          box-shadow: 0 2px 4px rgba(56, 76, 67, 0.06);
        }

        .msg-bubble-partner {
          background: #ffffff;
          color: ${colors.ink};
          border: 1px solid ${colors.line}40;
          border-radius: 18px 18px 18px 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }
      `}</style>

      <div className="therapist-chat-container">
        
        {/* ================= LEFT SIDEBAR: CLIENTS & PATIENTS LIST ================= */}
        <div className="tc-sidebar">
          {/* Header & Search */}
          <div style={{ padding: "16px", borderBottom: `1px solid ${colors.line}50` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: colors.indigo, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Patient Conversations
              </span>
              <span style={{ fontSize: 11, background: colors.indigoSoft, color: colors.indigo, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                {clients.length}
              </span>
            </div>

            {/* Search Bar */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} color={colors.inkSoft} style={{ position: "absolute", left: 12, pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search patient or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 36px",
                  fontSize: 13,
                  borderRadius: 14,
                  border: `1.5px solid ${colors.line}80`,
                  background: "#ffffff",
                  outline: "none",
                  color: colors.ink,
                  transition: "border-color 0.15s ease",
                }}
              />
            </div>
          </div>

          {/* Scrollable Conversation Threads */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }} className="no-scrollbar">
            {filteredClients.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center" }}>
                <MessageCircle size={32} color={colors.inkSoft} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: colors.ink }}>
                  No threads found
                </div>
                <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 4 }}>
                  {searchQuery ? "Try another search keyword" : "Patients will appear here once they book a session with you."}
                </div>
              </div>
            ) : (
              filteredClients.map((c) => {
                const isSelected = c.email.toLowerCase() === selectedClientEmail.toLowerCase();
                const lastMsg = getClientLastMessage(c.email);
                
                return (
                  <button
                    key={c.email}
                    onClick={() => {
                      setSelectedClientEmail(c.email);
                      setMobileView("chat");
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 16,
                      background: isSelected ? colors.indigoSoft : "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      marginBottom: 6,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Rounded Custom Avatar */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 14,
                        background: isSelected ? colors.indigo : `${colors.indigo}15`,
                        color: isSelected ? "#ffffff" : colors.indigo,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {c.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                    </div>

                    {/* Patient Context & Last Message Preview */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                        <div style={{ fontWeight: 700, fontSize: "13.5px", color: colors.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.name}
                        </div>
                        {lastMsg && lastMsg.time && (
                          <div style={{ fontSize: "10px", color: colors.inkSoft, fontWeight: 500, flexShrink: 0 }}>
                            {getDividerText(lastMsg.time)}
                          </div>
                        )}
                      </div>

                      {/* Snippet preview */}
                      <div style={{ fontSize: "11.5px", color: colors.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {lastMsg ? (
                          lastMsg.isSessionRoom ? "🎥 Sent Session consultation link" : lastMsg.isZoom ? "🔗 Sent Zoom Meeting" : lastMsg.text
                        ) : (
                          "No messages yet"
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT CHAT FEED: MESSAGES & ACTIONS ================= */}
        <div className="tc-chatfeed">
          {selectedClient ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: `1px solid ${colors.line}50`,
                  background: "#ffffff",
                  zIndex: 10,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.01)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView("list")}
                    className="tc-back-btn"
                    style={{
                      background: "none",
                      border: "none",
                      color: colors.indigo,
                      padding: "4px",
                      marginRight: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>

                  {/* Avatar */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: colors.indigoSoft,
                      color: colors.indigo,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                  >
                    {selectedClient.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: colors.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedClient.name}
                    </div>
                    <div style={{ fontSize: "11px", color: colors.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedClient.email}
                    </div>
                  </div>
                </div>

                {/* Instant Actions (Send Consultation Room) */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Button
                    variant="primary"
                    icon={Video}
                    onClick={handleZoomAction}
                    style={{
                      padding: "8px 14px",
                      fontSize: "12px",
                      background: colors.indigo,
                      color: "#ffffff",
                      borderRadius: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Send Session Room
                  </Button>
                </div>
              </div>

              {/* Scrollable messages feed */}
              <div
                ref={scrollRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
                className="no-scrollbar"
              >
                {/* Clinical Header Note */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                  <div
                    style={{
                      background: "rgba(56, 76, 67, 0.05)",
                      border: `1px solid ${colors.indigo}15`,
                      padding: "6px 14px",
                      borderRadius: "14px",
                      fontSize: "11.5px",
                      color: colors.indigo,
                      maxWidth: "90%",
                      textAlign: "center",
                      lineHeight: 1.4,
                    }}
                  >
                    🔒 Encrypted Connection • Conversations with <strong>{selectedClient.name}</strong> are secure and stored locally.
                  </div>
                </div>

                {filteredThread.length === 0 ? (
                  <EmptyState
                    icon={MessageCircle}
                    title={`Start Chat with ${selectedClient.name}`}
                    sub="Welcome your patient, coordinates therapy materials, or invite them to the live consultation room."
                  />
                ) : (
                  filteredThread.map((m, idx) => {
                    const isMe = m.from === "therapist";
                    const messageDate = m.time ? m.time.split("T")[0] : "";
                    const prevMsg = idx > 0 ? filteredThread[idx - 1] : null;
                    const prevDate = prevMsg && prevMsg.time ? prevMsg.time.split("T")[0] : "";

                    const showDateDivider = messageDate && messageDate !== prevDate;
                    const currentDateHeader = showDateDivider ? getDividerText(m.time) : "";

                    const isGroupedWithPrev =
                      prevMsg &&
                      prevMsg.from === m.from &&
                      (new Date(m.time).getTime() - new Date(prevMsg.time).getTime() < 120000) &&
                      !showDateDivider;

                    return (
                      <React.Fragment key={m.id}>
                        {showDateDivider && (
                          <div style={{ display: "flex", justifyContent: "center", margin: "14px 0 8px" }}>
                            <span
                              style={{
                                background: "rgba(0, 0, 0, 0.05)",
                                padding: "4px 10px",
                                borderRadius: 99,
                                fontSize: 10.5,
                                fontWeight: 700,
                                color: colors.inkSoft,
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              {currentDateHeader}
                            </span>
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                            marginTop: isGroupedWithPrev ? 2 : 6,
                          }}
                        >
                          {m.isSessionRoom ? (
                            /* Secure Consultation Link Card */
                            <div
                              style={{
                                background: "#ffffff",
                                border: `1.5px solid ${colors.indigo}25`,
                                borderRadius: 18,
                                padding: 14,
                                width: "290px",
                                maxWidth: "85%",
                                boxShadow: "0 6px 18px rgba(56, 76, 67, 0.04)",
                              }}
                              className="pop-in"
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginBottom: 8,
                                  color: colors.indigo,
                                  fontWeight: 800,
                                  fontSize: 13,
                                }}
                              >
                                <Video size={16} color={colors.acacia} /> In-App Session Room
                              </div>
                              <div style={{ fontSize: "11.5px", color: colors.inkSoft, marginBottom: 12, lineHeight: 1.4 }}>
                                A private HIPAA-compliant video/audio consulting room is ready. Click below to initiate.
                              </div>
                              <button
                                onClick={() => {
                                  if (onJoinSession) {
                                    const matchingBooking = bookings.find(b => b.id === m.bookingId);
                                    const targetBooking = matchingBooking || {
                                      id: m.bookingId || `bk-virtual-${Date.now()}`,
                                      therapistId: therapist.id,
                                      category: "cbt",
                                      clientName: selectedClient.name,
                                      clientPhone: selectedClient.phone || "N/A",
                                      clientEmail: selectedClient.email,
                                      date: new Date().toISOString().split("T")[0],
                                      time: "Flexible",
                                      price: 0,
                                      priceUnit: "session",
                                      status: "upcoming",
                                      zoomLink: "In-App Room",
                                      createdAt: new Date().toISOString(),
                                    };
                                    onJoinSession(targetBooking);
                                  }
                                }}
                                style={{
                                  width: "100%",
                                  padding: "9px 14px",
                                  borderRadius: 12,
                                  background: colors.indigo,
                                  color: "#ffffff",
                                  fontWeight: 700,
                                  fontSize: 12.5,
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 6,
                                  boxShadow: "0 4px 10px rgba(56,76,67,0.15)",
                                }}
                              >
                                Enter Consultation <ExternalLink size={13} />
                              </button>
                            </div>
                          ) : m.isZoom ? (
                            /* Classic Zoom Link Card */
                            <div
                              style={{
                                background: "#ffffff",
                                border: `1.5px solid ${colors.line}60`,
                                borderRadius: 18,
                                padding: 14,
                                width: "290px",
                                maxWidth: "85%",
                                boxShadow: "0 6px 18px rgba(0,0,0,0.03)",
                              }}
                              className="pop-in"
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  marginBottom: 8,
                                  color: colors.amber,
                                  fontWeight: 800,
                                  fontSize: 13,
                                }}
                              >
                                <Video size={16} /> Video Meeting
                              </div>
                              <button
                                onClick={() => window.open(m.text, "_blank")}
                                style={{
                                  width: "100%",
                                  padding: "9px 14px",
                                  borderRadius: 12,
                                  background: colors.amber,
                                  color: "#ffffff",
                                  fontWeight: 700,
                                  fontSize: 12.5,
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                Join Zoom
                              </button>
                            </div>
                          ) : (
                            /* Simple Message Bubbles with meta timestamps */
                            <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                              <div
                                className={isMe ? "msg-bubble-mine pop-in" : "msg-bubble-partner pop-in"}
                                style={{
                                  maxWidth: "280px",
                                  padding: "10px 14px",
                                  fontSize: 13.5,
                                  lineHeight: 1.45,
                                }}
                              >
                                {m.text}
                              </div>
                              {!isGroupedWithPrev && m.time && (
                                <span style={{ fontSize: "9px", color: colors.inkSoft, marginTop: 2, padding: "0 4px", fontWeight: 500 }}>
                                  {getMessageTime(m.time)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Reply compose bar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 10,
                  padding: "12px 16px",
                  borderTop: `1px solid ${colors.line}50`,
                  background: "#ffffff",
                  boxShadow: "0 -4px 16px rgba(0,0,0,0.01)",
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Reply to ${selectedClient.name}…`}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendText();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 18,
                    border: `1.5px solid ${colors.line}`,
                    fontSize: 14,
                    outline: "none",
                    resize: "none",
                    maxHeight: 140,
                    minHeight: 40,
                    lineHeight: 1.4,
                    background: "#ffffff",
                    color: colors.ink,
                  }}
                />
                <button
                  onClick={handleSendText}
                  disabled={!draft.trim()}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: draft.trim() ? colors.indigo : colors.line,
                    border: "none",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: draft.trim() ? "pointer" : "default",
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", padding: 24 }}>
              <EmptyState
                icon={MessageCircle}
                title="Select a patient thread"
                sub="Your direct chat conversations with active patients will appear here."
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
