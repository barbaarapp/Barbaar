/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, ChevronRight, Video, Send } from "lucide-react";
import { Therapist, Message, Booking } from "../../types";
import { colors } from "../../constants";
import { loadKey } from "../../utils";
import TopBar from "../ui/TopBar";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";

interface ChatScreenProps {
  therapists: Therapist[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  messages: Record<string, Message[]>;
  draft: string;
  setDraft: (text: string) => void;
  onSend: (therapistId: string, text: string) => void;
  onBack: () => void;
  bookings: Booking[];
  onJoinSession?: (booking: Booking) => void;
}

export default function ChatScreen({
  therapists,
  selectedId,
  setSelectedId,
  messages,
  draft,
  setDraft,
  onSend,
  onBack,
  bookings,
  onJoinSession,
}: ChatScreenProps) {
  const active = therapists.find((t) => t.id === selectedId);
  const withThread = therapists.filter(
    (t) => (messages[t.id] || []).length > 0 || t.id === selectedId
  );
  const listToShow = withThread.length ? withThread : therapists.slice(0, 3);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastReadTimes, setLastReadTimes] = useState<Record<string, string>>({});
  const lang = typeof window !== "undefined" && localStorage.getItem("barbaar-language") === "so" ? "so" : "en";

  // Load last read times from storage to mark unread threads
  useEffect(() => {
    (async () => {
      const saved = await loadKey<Record<string, string>>("barbaar-last-read-times", {}, false);
      setLastReadTimes(saved);
    })();
  }, [selectedId]);

  // Auto scroll to bottom of chat thread
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedId]);

  // Auto-grow reply textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [draft]);

  // Format relative timestamps for message lists (e.g. "12m ago", "Yesterday")
  function formatRelativeTime(isoString?: string): string {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (yesterday.toDateString() === d.toDateString()) {
        return "Yesterday";
      }
      
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  // Get date dividers text ("Today", "Yesterday", "Monday, July 13")
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
      return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  // Render Inbox screen if no active thread is selected
  if (!active) {
    return (
      <div style={{ background: colors.ivory, minHeight: "100vh", paddingBottom: 80 }}>
        <TopBar title="Messages" onBack={onBack} />
        <div className="fade-up" style={{ padding: "14px 20px" }}>
          {listToShow.map((t) => {
            const thread = messages[t.id] || [];
            const lastMsg = thread[thread.length - 1];
            
            // Check if thread has unread messages from therapist
            const isUnread = 
              lastMsg && 
              lastMsg.from === "therapist" && 
              lastMsg.time > (lastReadTimes[t.id] || "0");

            return (
              <Card
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                  padding: "16px 14px",
                  border: isUnread ? `1.5px solid ${colors.amber}50` : `1px solid ${colors.line}40`,
                  background: isUnread ? `${colors.amberSoft}12` : "#fff",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
                  position: "relative",
                }}
                className="hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                <Avatar therapist={t} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                    <div style={{ fontWeight: isUnread ? 800 : 700, fontSize: 14.5, color: colors.ink }}>
                      {t.name}
                    </div>
                    {lastMsg && (
                      <span style={{ fontSize: 11, color: isUnread ? colors.amber : colors.inkSoft, fontWeight: isUnread ? 700 : 500 }}>
                        {formatRelativeTime(lastMsg.time)}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "12.5px",
                      color: isUnread ? colors.ink : colors.inkSoft,
                      fontWeight: isUnread ? 600 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lastMsg?.text || "Say hello"}
                  </div>
                </div>
                
                {isUnread && (
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: colors.amber,
                    marginLeft: 8,
                    boxShadow: "0 0 8px rgba(193, 122, 61, 0.6)",
                  }} />
                )}
                {!isUnread && <ChevronRight size={16} color={colors.inkSoft} style={{ marginLeft: 6, opacity: 0.6 }} />}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  const thread = messages[active.id] || [];

  // Group messages and track dates
  let lastDateHeader = "";

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: colors.ivory }}
    >
      {/* Thread Top Bar (full-screen, bottom nav hidden) */}
      <TopBar title={active.name} onBack={() => setSelectedId(null)} />
      
      {/* Privacy Protection Sub-Header */}
      <div className="bg-[#1b2b24] text-[#e6cca0] px-4 py-1.5 flex items-center justify-between text-[11px] border-b border-[#c8a97e]/20 shadow-inner">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>🔒 {lang === "so" ? "Duubista & sawirrada ma bannaana" : "No recording or screenshots allowed"}</span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-[#c8a97e]/20 text-[#e6cca0] font-bold text-[9px] uppercase border border-[#c8a97e]/30">
          {lang === "so" ? "Amni" : "Protected"}
        </span>
      </div>
      
      {/* Scrollable messages canvas */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6, // tighter gap for messaging grouping
        }}
        className="no-scrollbar"
      >
        {thread.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="Say hello"
            sub={`${active.name} usually replies within a few hours.`}
          />
        )}

        {thread.map((m, idx) => {
          const isClient = m.from === "client";
          
          // Date separator check
          const currentDateHeader = getDividerText(m.time);
          const showDateDivider = currentDateHeader !== lastDateHeader;
          if (showDateDivider) {
            lastDateHeader = currentDateHeader;
          }

          // Message grouping check (if consecutive messages are from same person within 2 minutes)
          const prevMsg = idx > 0 ? thread[idx - 1] : null;
          const isGroupedWithPrev = 
            prevMsg && 
            prevMsg.from === m.from && 
            (new Date(m.time).getTime() - new Date(prevMsg.time).getTime() < 120000) &&
            !showDateDivider;

          return (
            <React.Fragment key={m.id}>
              {showDateDivider && (
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  margin: "18px 0 12px",
                }}>
                  <span style={{
                    background: "rgba(0, 0, 0, 0.05)",
                    padding: "4px 12px",
                    borderRadius: 99,
                    fontSize: 11,
                    fontWeight: 700,
                    color: colors.inkSoft,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>
                    {currentDateHeader}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: isClient ? "flex-end" : "flex-start",
                  marginTop: isGroupedWithPrev ? 2 : 8,
                }}
              >
                {m.isSessionRoom ? (
                  <div
                    style={{
                      background: colors.paper,
                      border: `1.5px solid ${colors.indigo}30`,
                      borderRadius: 18,
                      padding: 14,
                      maxWidth: "80%",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    }}
                    className="pop-in"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                        color: colors.indigo,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      <Video size={16} /> Secure Consultation Room
                    </div>
                    <div style={{ fontSize: "12px", color: colors.inkSoft, marginBottom: 12 }}>
                      Direct, secure HIPAA-compliant room. You can join this session room for follow-ups anytime.
                    </div>
                    <button
                      onClick={() => {
                        if (onJoinSession) {
                          const matchingBooking = bookings.find(b => b.id === m.bookingId);
                          const targetBooking = matchingBooking || {
                            id: m.bookingId || `bk-virtual-${Date.now()}`,
                            therapistId: selectedId || "",
                            category: "cbt",
                            clientName: "Client Participant",
                            clientPhone: "N/A",
                            clientEmail: m.clientEmail || "",
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
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: colors.indigo,
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(19,115,211,0.2)",
                      }}
                    >
                      Join Session Room
                    </button>
                  </div>
                ) : m.isZoom ? (
                  <div
                    style={{
                      background: colors.paper,
                      border: `1.5px solid ${colors.line}`,
                      borderRadius: 18,
                      padding: 14,
                      maxWidth: "80%",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                    }}
                    className="pop-in"
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 10,
                        color: colors.indigo,
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      <Video size={16} /> Video session link
                    </div>
                    <button
                      onClick={() => window.open(m.text, "_blank")}
                      style={{
                        width: "100%",
                        padding: "10px 16px",
                        borderRadius: 12,
                        background: colors.amber,
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(193,122,61,0.2)",
                      }}
                    >
                      Join Zoom
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "10px 14px",
                      borderRadius: isClient 
                        ? `${isGroupedWithPrev ? "16px" : "16px 16px 4px 16px"}`
                        : `${isGroupedWithPrev ? "16px" : "16px 16px 16px 4px"}`,
                      fontSize: 14,
                      lineHeight: 1.45,
                      background: isClient ? colors.indigo : colors.paper,
                      color: isClient ? "#fff" : colors.ink,
                      border: isClient ? "none" : `1px solid ${colors.line}50`,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                    className="pop-in"
                  >
                    {m.text}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Reply bar / Input panel */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          padding: "10px 16px",
          borderTop: `1px solid ${colors.line}40`,
          paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)",
          background: colors.ivory,
          boxShadow: "0 -4px 16px rgba(0,0,0,0.02)",
        }}
      >
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (draft.trim()) {
                onSend(active.id, draft);
              }
            }
          }}
          style={{
            flex: 1,
            padding: "11px 16px",
            borderRadius: 20,
            border: `1.5px solid ${colors.line}`,
            fontSize: 14,
            outline: "none",
            resize: "none",
            maxHeight: 120,
            minHeight: 40,
            lineHeight: 1.4,
          }}
        />
        <button
          onClick={() => {
            if (draft.trim()) onSend(active.id, draft);
          }}
          disabled={!draft.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: draft.trim() ? colors.indigo : colors.line,
            border: "none",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: draft.trim() ? "pointer" : "default",
            flexShrink: 0,
            transition: "all 0.15s ease",
          }}
          className="active:scale-90"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
