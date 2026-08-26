/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Therapist, Booking, Message, AppContent, ClientProfile, FinancialAidRequest } from "./types";
import { colors, DEFAULT_THERAPISTS, DEFAULT_CONTENT } from "./constants";
import { loadKey, saveKey, uid, getTherapistSlug } from "./utils";
import GlobalStyles from "./components/layout/GlobalStyles";
import GrowthArc from "./components/ui/GrowthArc";
import ClientApp from "./components/client/ClientApp";
import TherapistPicker from "./components/therapist/TherapistPicker";
import TherapistApp from "./components/therapist/TherapistApp";
import AdminApp from "./components/admin/AdminApp";
import ConsultationRoom from "./components/shared/ConsultationRoom";

// Import Firebase
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  User,
  OperationType,
  handleFirestoreError
} from "./lib/firebase";

// Helper to parse initial route from URL path or query params
function getInitialRoute() {
  const rawPath = window.location.pathname.replace(/^\/|\/$/g, "");
  const path = rawPath.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view")?.toLowerCase();

  const legalView = (path === "terms" || path === "privacy" || path === "about") ? path :
                    (viewParam === "terms" || viewParam === "privacy" || viewParam === "about") ? viewParam : null;

  if (legalView) {
    return {
      mode: "client" as const,
      clientScreen: "settings",
      activeTherapistId: null,
      settingsSub: legalView
    };
  }

  // Therapist deep linking: /therapist/:id or ?therapist=:id or ?id=:id
  let therapistId: string | null = null;
  if (path.startsWith("therapist/")) {
    therapistId = rawPath.substring("therapist/".length);
  } else {
    therapistId = params.get("therapist") || params.get("id") || params.get("t");
  }

  if (therapistId) {
    // Try to resolve name slug or ID to actual ID using DEFAULT_THERAPISTS
    const matched = DEFAULT_THERAPISTS.find(
      t => t.id.toLowerCase() === therapistId?.toLowerCase() ||
           getTherapistSlug(t.name) === therapistId
    );
    if (matched) {
      therapistId = matched.id;
    }
    return {
      mode: "client" as const,
      clientScreen: "profile",
      activeTherapistId: therapistId,
      settingsSub: null
    };
  }

  // Support other simple top-level screens if path matches
  const clientScreens = ["directory", "therapists", "quiz", "match", "sessions", "chat", "settings"];
  if (clientScreens.includes(path)) {
    return {
      mode: "client" as const,
      clientScreen: path === "therapists" ? "directory" : path,
      activeTherapistId: null,
      settingsSub: null
    };
  }

  return {
    mode: "client" as const,
    clientScreen: "home",
    activeTherapistId: null,
    settingsSub: null
  };
}

export default function App() {
  const initialRoute = getInitialRoute();

  const [ready, setReady] = useState(false);
  const [therapists, setTherapists] = useState<Therapist[]>(DEFAULT_THERAPISTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [content, setContent] = useState<AppContent>(DEFAULT_CONTENT);
  const [clientProfile, setClientProfileState] = useState<ClientProfile>(() => {
    let initial: ClientProfile = {
      name: "",
      phone: "",
      email: "",
      financialAidStatus: "none",
    };
    try {
      const stored = localStorage.getItem("barbaar-client-profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        initial = { ...initial, ...parsed };
      }
      const fallbackEmail = localStorage.getItem("barbaar-client-aid-email") || "";
      const fallbackStatus = localStorage.getItem("barbaar-client-aid-status") || "";
      if (fallbackEmail && !initial.email) {
        initial.email = fallbackEmail;
      }
      if (fallbackStatus && (!initial.financialAidStatus || initial.financialAidStatus === "none")) {
        initial.financialAidStatus = fallbackStatus as any;
      }
    } catch (e) {}
    return initial;
  });

  const [mode, setMode] = useState<"client" | "therapist-picker" | "therapist" | "admin">(initialRoute.mode);
  const [activeTherapistId, setActiveTherapistId] = useState<string | null>(initialRoute.activeTherapistId);
  const [activeSessionBooking, setActiveSessionBooking] = useState<Booking | null>(null);

  // Lifted navigation states for unified native-like back button and scroll control
  const [clientScreen, setClientScreen] = useState<string>(initialRoute.clientScreen);
  const [settingsSub, setSettingsSub] = useState<string | null>(initialRoute.settingsSub);
  const [therapistScreen, setTherapistScreen] = useState<string>("overview");
  const [adminScreen, setAdminScreen] = useState<string>("overview");

  // Navigation stack synchronization with the physical back button
  const isPopStateRef = React.useRef(false);
  const lastPushedStateRef = React.useRef<any>(null);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && typeof state === "object") {
        isPopStateRef.current = true;
        
        if (state.mode) setMode(state.mode);
        if (state.clientScreen) setClientScreen(state.clientScreen);
        if (state.therapistScreen) setTherapistScreen(state.therapistScreen);
        if (state.adminScreen) setAdminScreen(state.adminScreen);
        setActiveTherapistId(state.activeTherapistId || null);
        if (state.settingsSub !== undefined) setSettingsSub(state.settingsSub);
        
        if (state.activeSessionBookingId) {
          const booking = bookings.find(b => b.id === state.activeSessionBookingId);
          if (booking) {
            setActiveSessionBooking(booking);
          } else {
            setActiveSessionBooking({ id: state.activeSessionBookingId } as any);
          }
        } else {
          setActiveSessionBooking(null);
        }

        // Instantly reset scroll to top during back navigation
        window.scrollTo(0, 0);

        setTimeout(() => {
          isPopStateRef.current = false;
        }, 80);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [bookings]);

  // Synchronize state changes to browser history
  useEffect(() => {
    if (isPopStateRef.current) return;

    const currentState = {
      mode,
      clientScreen,
      therapistScreen,
      adminScreen,
      activeTherapistId,
      settingsSub,
      activeSessionBookingId: activeSessionBooking?.id || null,
    };

    const last = lastPushedStateRef.current;
    const changed = !last ||
      last.mode !== currentState.mode ||
      last.clientScreen !== currentState.clientScreen ||
      last.therapistScreen !== currentState.therapistScreen ||
      last.adminScreen !== currentState.adminScreen ||
      last.activeTherapistId !== currentState.activeTherapistId ||
      last.settingsSub !== currentState.settingsSub ||
      last.activeSessionBookingId !== currentState.activeSessionBookingId;

    if (changed) {
      // Smoothly reset the scroll view to top on any navigation change
      window.scrollTo(0, 0);

      let urlPath = "/";
      if (mode === "client") {
        if (clientScreen === "profile" && activeTherapistId) {
          const t = therapists.find(x => x.id === activeTherapistId);
          const slug = t ? getTherapistSlug(t.name) : activeTherapistId;
          urlPath = `/therapist/${slug}`;
        } else if (clientScreen === "settings") {
          if (settingsSub === "terms") {
            urlPath = "/terms";
          } else if (settingsSub === "privacy") {
            urlPath = "/privacy";
          } else if (settingsSub === "about") {
            urlPath = "/about";
          } else {
            urlPath = "/settings";
          }
        } else if (clientScreen !== "home") {
          if (clientScreen === "directory") {
            urlPath = "/therapists";
          } else {
            urlPath = `/${clientScreen}`;
          }
        }
      } else if (mode === "therapist") {
        urlPath = "/therapist-portal";
      } else if (mode === "admin") {
        urlPath = "/admin-portal";
      }

      if (!last) {
        window.history.replaceState(currentState, "", urlPath);
      } else {
        window.history.pushState(currentState, "", urlPath);
      }
      lastPushedStateRef.current = currentState;
    }
  }, [mode, clientScreen, therapistScreen, adminScreen, activeTherapistId, settingsSub, activeSessionBooking]);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<"client" | "therapist" | "admin" | null>(null);
  const [loggedInTherapist, setLoggedInTherapist] = useState<Therapist | null>(null);

  // Load local state initially as a fast fallback, then override with Firestore
  const [aidRequests, setAidRequests] = useState<FinancialAidRequest[]>([]);

  useEffect(() => {
    (async () => {
      const [t, b, m, c, p, ar] = await Promise.all([
        loadKey<Therapist[]>("barbaar-therapists", DEFAULT_THERAPISTS, true),
        loadKey<Booking[]>("barbaar-bookings", [], true),
        loadKey<Record<string, Message[]>>("barbaar-messages", {}, true),
        loadKey<AppContent>("barbaar-content", DEFAULT_CONTENT, true),
        loadKey<ClientProfile>("barbaar-client-profile", { name: "", phone: "", email: "" }, false),
        loadKey<FinancialAidRequest[]>("barbaar-aid-requests", [], true),
      ]);

      // Check if there is a saved aid email or aid status in localStorage
      let fallbackEmail = "";
      let fallbackAidStatus = "";
      try {
        fallbackEmail = localStorage.getItem("barbaar-client-aid-email") || "";
        fallbackAidStatus = localStorage.getItem("barbaar-client-aid-status") || "";
      } catch (e) {}

      const effectiveProfile: ClientProfile = {
        ...p,
        email: p.email || fallbackEmail || "",
        financialAidStatus: p.financialAidStatus || (fallbackAidStatus as any) || "none",
      };

      setTherapists(t);
      setBookings(b);
      setMessages(m);
      setContent(c);
      setClientProfileState(effectiveProfile);
      setAidRequests(ar);
      setReady(true);
    })();
  }, []);

  // 1. Listen for Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  // 1.5. Dynamically resolve user role based on currentUser and live therapists list
  useEffect(() => {
    if (currentUser) {
      const userEmail = currentUser.email?.toLowerCase() || "";

      // Determine user role
      // Admin: barbaaryp@gmail.com
      if (userEmail === "barbaaryp@gmail.com") {
        setUserRole("admin");
        setLoggedInTherapist(null);
        setClientProfileState((prev) => ({
          ...prev,
          name: prev.name || currentUser.displayName || "Barbaar Admin",
          email: userEmail,
        }));
      } else {
        // Check if this matches a therapist's email dynamically from live therapists state
        const matchingTherapist = therapists.find(
          (t) => t.email?.toLowerCase() === userEmail
        );

        if (matchingTherapist) {
          setUserRole("therapist");
          setLoggedInTherapist(matchingTherapist);
          setActiveTherapistId(matchingTherapist.id);
          setClientProfileState({
            name: matchingTherapist.name,
            email: userEmail,
            phone: "",
          });
        } else {
          setUserRole("client");
          setLoggedInTherapist(null);
          // Client user: populate clientProfile
          setClientProfileState((prev) => ({
            ...prev,
            name: prev.name || currentUser.displayName || "",
            email: userEmail,
          }));
        }
      }
    } else {
      setUserRole(null);
      setLoggedInTherapist(null);
    }
  }, [currentUser, therapists]);

  // 1.6. Listen for Client user document changes (to sync profile and financial aid status in real-time)
  useEffect(() => {
    if (currentUser && userRole === "client") {
      const docRef = doc(db, "users", currentUser.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClientProfileState((prev) => {
            // Keep pending or approved status if data.financialAidStatus is empty/none
            const incomingStatus = data.financialAidStatus;
            const resolvedStatus =
              incomingStatus && incomingStatus !== "none"
                ? incomingStatus
                : prev.financialAidStatus && prev.financialAidStatus !== "none"
                ? prev.financialAidStatus
                : "none";

            const updated: ClientProfile = {
              ...prev,
              name: data.name || prev.name || "",
              phone: data.phone || prev.phone || "",
              email: data.email || prev.email || currentUser.email || "",
              language: data.language || prev.language || "en",
              financialAidStatus: resolvedStatus,
              financialAidCategory: data.financialAidCategory || prev.financialAidCategory,
              financialAidReason: data.financialAidReason || prev.financialAidReason,
              financialAidApprovedAt: data.financialAidApprovedAt || prev.financialAidApprovedAt,
            };
            saveKey("barbaar-client-profile", updated, false);
            return updated;
          });
        }
      }, (error) => {
        console.warn("Could not sync user profile in real-time:", error);
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // 1.7. Real-time sync of all Financial Aid Requests for Admin and Client
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "financial_aid_requests"),
      (snapshot) => {
        const list: FinancialAidRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as FinancialAidRequest);
        });

        if (list.length > 0) {
          // Sort strictly by newest createdAt first so latest submission is at index 0
          const sorted = [...list].sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          setAidRequests(sorted);
          saveKey("barbaar-aid-requests", sorted, true);

          // Check if current client matches newest aid request
          let activeEmail = (clientProfile?.email || currentUser?.email || "").trim().toLowerCase();
          if (!activeEmail) {
            try {
              activeEmail = (localStorage.getItem("barbaar-client-aid-email") || "").trim().toLowerCase();
            } catch (e) {}
          }

          if (activeEmail) {
            const clientMatch = sorted.find(
              (r) => (r.email || "").trim().toLowerCase() === activeEmail
            );
            if (clientMatch && clientMatch.financialAidStatus) {
              const reqStatus = clientMatch.financialAidStatus;

              if (reqStatus === "pending") {
                setClientProfileState((prev) => {
                  const updated: ClientProfile = {
                    ...prev,
                    name: prev.name || clientMatch.name || "",
                    phone: prev.phone || clientMatch.phone || "",
                    email: prev.email || clientMatch.email || activeEmail,
                    financialAidStatus: "pending",
                    financialAidApprovedAt: undefined,
                    financialAidCategory: clientMatch.financialAidCategory || prev.financialAidCategory,
                    financialAidReason: clientMatch.financialAidReason || prev.financialAidReason,
                  };
                  saveKey("barbaar-client-profile", updated, false);
                  try {
                    localStorage.setItem("barbaar-client-aid-status", "pending");
                    localStorage.setItem("barbaar-client-aid-email", activeEmail);
                  } catch (e) {}
                  return updated;
                });
              } else if (reqStatus === "approved") {
                const approvedTime = clientMatch.financialAidApprovedAt
                  ? new Date(clientMatch.financialAidApprovedAt).getTime()
                  : 0;
                const isExpired =
                  approvedTime > 0 &&
                  Date.now() - approvedTime > 3 * 24 * 60 * 60 * 1000;

                const effectiveStatus = isExpired ? "none" : "approved";

                setClientProfileState((prev) => {
                  const updated: ClientProfile = {
                    ...prev,
                    name: prev.name || clientMatch.name || "",
                    phone: prev.phone || clientMatch.phone || "",
                    email: prev.email || clientMatch.email || activeEmail,
                    financialAidStatus: effectiveStatus,
                    financialAidApprovedAt: isExpired ? undefined : (clientMatch.financialAidApprovedAt || undefined),
                    financialAidCategory: clientMatch.financialAidCategory || prev.financialAidCategory,
                    financialAidReason: clientMatch.financialAidReason || prev.financialAidReason,
                  };
                  saveKey("barbaar-client-profile", updated, false);
                  try {
                    localStorage.setItem("barbaar-client-aid-status", effectiveStatus);
                    localStorage.setItem("barbaar-client-aid-email", activeEmail);
                  } catch (e) {}
                  return updated;
                });
              } else if (reqStatus === "completed" || reqStatus === "rejected") {
                setClientProfileState((prev) => {
                  const updated: ClientProfile = {
                    ...prev,
                    financialAidStatus: reqStatus === "rejected" ? "rejected" : "none",
                    financialAidApprovedAt: undefined,
                  };
                  saveKey("barbaar-client-profile", updated, false);
                  try {
                    localStorage.setItem("barbaar-client-aid-status", reqStatus === "rejected" ? "rejected" : "none");
                  } catch (e) {}
                  return updated;
                });
              }
            }
          }
        }
      },
      (error) => {
        console.warn("Could not sync financial aid requests in real-time:", error);
      }
    );
    return () => unsubscribe();
  }, [clientProfile.email, currentUser?.email]);

  // 1.8. Admin: Real-time sync of all users for managing financial aid requests
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    if (currentUser && userRole === "admin") {
      const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setUsers(list);
      }, (error) => {
        console.warn("Could not sync users list for admin:", error);
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // Send Approval Email to Client with full therapy details
  async function handleSendApprovalEmail(
    requestId: string,
    email: string,
    name?: string,
    phone?: string,
    category?: string
  ) {
    if (!email) return;
    try {
      await fetch("/api/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: requestId,
          clientName: name || email.split("@")[0],
          clientEmail: email,
          clientPhone: phone || "",
          therapistName: "Barbaar Care Team",
          category: category || "Somali Youth & Community",
          financialAidApplied: true,
          action: "send_approval_notification",
        }),
      });

      const nowIso = new Date().toISOString();
      const aidDocRef = doc(db, "financial_aid_requests", requestId);
      await setDoc(
        aidDocRef,
        {
          approvalEmailSent: true,
          approvalEmailSentAt: nowIso,
          expiryAlertSent: false,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      setAidRequests((prev) =>
        prev.map((r) =>
          r.id === requestId || r.email.toLowerCase() === email.toLowerCase()
            ? {
                ...r,
                approvalEmailSent: true,
                approvalEmailSentAt: nowIso,
                expiryAlertSent: false,
              }
            : r
        )
      );
    } catch (err) {
      console.warn("Could not dispatch approval email:", err);
    }
  }

  // Send 24h Expiry Warning Email (1 day before aid validity expires)
  async function handleSendExpiryAlert(
    requestId: string,
    email: string,
    name?: string,
    phone?: string,
    category?: string
  ) {
    if (!email) return;
    try {
      await fetch("/api/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: requestId,
          clientName: name || email.split("@")[0],
          clientEmail: email,
          clientPhone: phone || "",
          therapistName: "Barbaar Care Team",
          category: category || "Somali Youth & Community",
          financialAidApplied: true,
          action: "send_expiry_warning_notification",
        }),
      });

      const nowIso = new Date().toISOString();
      const aidDocRef = doc(db, "financial_aid_requests", requestId);
      await setDoc(
        aidDocRef,
        {
          expiryAlertSent: true,
          expiryAlertSentAt: nowIso,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      setAidRequests((prev) =>
        prev.map((r) =>
          r.id === requestId || r.email.toLowerCase() === email.toLowerCase()
            ? {
                ...r,
                expiryAlertSent: true,
                expiryAlertSentAt: nowIso,
              }
            : r
        )
      );
    } catch (err) {
      console.warn("Could not dispatch 24h expiry warning email:", err);
    }
  }

  // Unified Admin action: Approve or Decline Financial Aid Request
  async function handleUpdateAidStatus(
    requestId: string,
    status: "approved" | "rejected",
    targetEmail?: string,
    bookingId?: string
  ) {
    const approvedAt = status === "approved" ? new Date().toISOString() : null;

    // 1. Update Firestore financial_aid_requests doc
    try {
      const aidDocRef = doc(db, "financial_aid_requests", requestId);
      await setDoc(
        aidDocRef,
        {
          id: requestId,
          financialAidStatus: status,
          financialAidApprovedAt: approvedAt,
          ...(status === "approved"
            ? {
                approvalEmailSent: true,
                approvalEmailSentAt: approvedAt,
                expiryAlertSent: false,
              }
            : {}),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Firestore aid doc update error:", err);
    }

    // 2. Update aidRequests local state & localStorage
    setAidRequests((prev) => {
      let found = false;
      const next = prev.map((r) => {
        if (r.id === requestId || (targetEmail && r.email.toLowerCase() === targetEmail.toLowerCase())) {
          found = true;
          return {
            ...r,
            financialAidStatus: status,
            financialAidApprovedAt: approvedAt,
            ...(status === "approved"
              ? {
                  approvalEmailSent: true,
                  approvalEmailSentAt: approvedAt,
                  expiryAlertSent: false,
                }
              : {}),
          };
        }
        return r;
      });
      if (!found && targetEmail) {
        next.unshift({
          id: requestId,
          name: targetEmail.split("@")[0],
          email: targetEmail,
          phone: "",
          financialAidCategory: "Somali Youth",
          financialAidReason: "Applied via booking",
          financialAidStatus: status,
          financialAidApprovedAt: approvedAt,
          approvalEmailSent: status === "approved",
          approvalEmailSentAt: approvedAt,
          expiryAlertSent: false,
          createdAt: new Date().toISOString(),
          bookingId: bookingId,
        });
      }
      saveKey("barbaar-aid-requests", next, true);
      return next;
    });

    // 3. If approved, automatically trigger email to client
    if (status === "approved" && targetEmail) {
      const matched = aidRequests.find(
        (r) => r.id === requestId || r.email.toLowerCase() === targetEmail.toLowerCase()
      );
      handleSendApprovalEmail(
        requestId,
        targetEmail,
        matched?.name,
        matched?.phone,
        matched?.financialAidCategory
      );
    }

    // 4. Update clientProfile if active user matches
    const cleanEmail = targetEmail?.toLowerCase();
    if (cleanEmail && clientProfile.email?.toLowerCase() === cleanEmail) {
      const nextProfile: ClientProfile = {
        ...clientProfile,
        financialAidStatus: status,
        financialAidApprovedAt: approvedAt || undefined,
      };
      setClientProfileState(nextProfile);
      saveKey("barbaar-client-profile", nextProfile, false);
    }

    // 5. Update matching users doc in Firestore if exists
    if (cleanEmail) {
      const matchUser = users.find((u) => u.email?.toLowerCase() === cleanEmail || u.id === requestId);
      if (matchUser) {
        try {
          const userRef = doc(db, "users", matchUser.id);
          await setDoc(
            userRef,
            {
              financialAidStatus: status,
              financialAidApprovedAt: approvedAt,
            },
            { merge: true }
          );
        } catch (err) {
          console.warn("Could not update user aid status in Firestore:", err);
        }
      }
    }

    // 6. Update any matching booking in state and Firestore
    const updatedBookings = bookings.map((b) => {
      const match =
        (bookingId && b.id === bookingId) ||
        (cleanEmail && b.clientEmail && b.clientEmail.toLowerCase() === cleanEmail && b.financialAidApplied);
      if (match) {
        return {
          ...b,
          financialAidStatus: status,
          status: status === "approved" ? "upcoming" : b.status,
          price:
            status === "approved"
              ? b.originalPrice
                ? Math.round(b.originalPrice * 0.6)
                : b.price
              : b.originalPrice || b.price,
        };
      }
      return b;
    });

    if (updatedBookings.some((b, idx) => b !== bookings[idx])) {
      saveBookings(updatedBookings);
    }
  }

  // Automated background monitor: Send 24h expiration warning (1 day before aid validity lapses)
  useEffect(() => {
    function checkExpiryAlerts() {
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

      aidRequests.forEach((req) => {
        if (
          req.financialAidStatus === "approved" &&
          req.financialAidApprovedAt &&
          !req.expiryAlertSent &&
          req.email
        ) {
          const approvedTime = new Date(req.financialAidApprovedAt).getTime();
          const expiresAt = approvedTime + THREE_DAYS_MS;
          const diff = expiresAt - now;

          // If within 24 hours of expiring and not yet expired
          if (diff <= ONE_DAY_MS && diff > 0) {
            handleSendExpiryAlert(
              req.id,
              req.email,
              req.name,
              req.phone,
              req.financialAidCategory
            );
          }
        }
      });
    }

    checkExpiryAlerts();
    const interval = setInterval(checkExpiryAlerts, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, [aidRequests]);

  // Admin action: update user-level financial aid status
  async function handleUpdateUserAidStatus(userId: string, status: "approved" | "rejected") {
    const targetUser = users.find((u) => u.id === userId);
    await handleUpdateAidStatus(userId, status, targetUser?.email);
  }

  // 2. Sync Therapists database from Firestore (With auto-seeding)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "therapists"), async (snapshot) => {
      if (snapshot.empty) {
        // Seed Therapists collection
        try {
          const batch = writeBatch(db);
          DEFAULT_THERAPISTS.forEach((therapist) => {
            const docRef = doc(collection(db, "therapists"), therapist.id);
            batch.set(docRef, therapist);
          });
          await batch.commit();
        } catch (e) {
          console.warn("Seeding therapists database bypassed/unauthorized. Using local defaults.", e);
          setTherapists(DEFAULT_THERAPISTS);
          saveKey("barbaar-therapists", DEFAULT_THERAPISTS, true);
        }
      } else {
        const list: Therapist[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Therapist);
        });
        // Sort by ID to maintain consistent ordering
        list.sort((a, b) => a.id.localeCompare(b.id));
        setTherapists(list);
        saveKey("barbaar-therapists", list, true);
      }
    }, (error) => {
      console.warn("Could not read therapists from Firestore, falling back to local list:", error);
      setTherapists(DEFAULT_THERAPISTS);
    });

    return () => unsubscribe();
  }, []);

  // 3. Sync Content from Firestore (With auto-seeding)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "content", "app"), async (docSnap) => {
      try {
        if (!docSnap.exists()) {
          try {
            await setDoc(doc(db, "content", "app"), DEFAULT_CONTENT);
          } catch (writeErr) {
            console.warn("Could not seed app content to Firestore (unauthorized), using local default content.", writeErr);
            setContent(DEFAULT_CONTENT);
            saveKey("barbaar-content", DEFAULT_CONTENT, true);
          }
        } else {
          const data = docSnap.data() as AppContent;
          setContent(data);
          saveKey("barbaar-content", data, true);
        }
      } catch (err) {
        console.warn("Error processing app content snapshot:", err);
      }
    }, (error) => {
      console.warn("Could not read content from Firestore, falling back to local content:", error);
      setContent(DEFAULT_CONTENT);
    });

    return () => unsubscribe();
  }, []);

  // 4. Real-time Bookings Sync based on Role & Auth Status
  useEffect(() => {
    let unsubscribe = () => {};
    const guestEmail = clientProfile?.email?.trim().toLowerCase();

    if (currentUser) {
      const email = currentUser.email?.toLowerCase() || "";

      let q;
      if (userRole === "admin") {
        // Admin gets all bookings
        q = collection(db, "bookings");
      } else if (userRole === "therapist" && loggedInTherapist) {
        // Therapist gets bookings for themselves
        q = query(collection(db, "bookings"), where("therapistId", "==", loggedInTherapist.id));
      } else {
        // Client gets bookings matching their email
        q = query(collection(db, "bookings"), where("clientEmail", "==", email));
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Booking);
        });
        // Sort descending by creation date
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBookings(list);
        saveKey("barbaar-bookings", list, true);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "bookings");
      });
    } else if (guestEmail) {
      // Guest client with profile email: real-time sync with Firestore
      const q = query(collection(db, "bookings"), where("clientEmail", "==", guestEmail));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Booking);
        });
        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setBookings(list);
        saveKey("barbaar-bookings", list, true);
      }, (error) => {
        console.warn("Guest bookings sync error:", error);
      });
    } else {
      // Guest client: load from localStorage
      loadKey<Booking[]>("barbaar-bookings", [], true).then((b) => {
        setBookings(b);
      });
    }

    return () => unsubscribe();
  }, [currentUser, userRole, loggedInTherapist, clientProfile?.email]);

  // 5. Real-time Messages Sync based on Role & Auth Status
  useEffect(() => {
    let unsubscribe = () => {};
    const guestEmail = clientProfile?.email?.trim().toLowerCase();

    if (currentUser) {
      const email = currentUser.email?.toLowerCase() || "";

      let q;
      if (userRole === "admin") {
        q = collection(db, "messages");
      } else if (userRole === "therapist" && loggedInTherapist) {
        q = query(collection(db, "messages"), where("therapistId", "==", loggedInTherapist.id));
      } else {
        q = query(collection(db, "messages"), where("clientEmail", "==", email));
      }

      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });

        // Reconstruct the Record<string, Message[]> structure
        const grouped: Record<string, Message[]> = {};
        list.forEach((m) => {
          const tId = m.therapistId;
          if (!grouped[tId]) {
            grouped[tId] = [];
          }
          grouped[tId].push({
            id: m.id,
            from: m.from,
            text: m.text,
            time: m.time,
            isZoom: m.isZoom,
            isSessionRoom: m.isSessionRoom,
            bookingId: m.bookingId,
            clientEmail: m.clientEmail,
          });
        });

        // Sort each conversation thread by time ascending
        Object.keys(grouped).forEach((key) => {
          grouped[key].sort((a, b) => a.time.localeCompare(b.time));
        });

        setMessages(grouped);
        saveKey("barbaar-messages", grouped, true);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "messages");
      });
    } else if (guestEmail) {
      // Guest client with profile email: real-time sync with Firestore
      const q = query(collection(db, "messages"), where("clientEmail", "==", guestEmail));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });

        const grouped: Record<string, Message[]> = {};
        list.forEach((m) => {
          const tId = m.therapistId;
          if (!grouped[tId]) {
            grouped[tId] = [];
          }
          grouped[tId].push({
            id: m.id,
            from: m.from,
            text: m.text,
            time: m.time,
            isZoom: m.isZoom,
            isSessionRoom: m.isSessionRoom,
            bookingId: m.bookingId,
            clientEmail: m.clientEmail,
          });
        });

        Object.keys(grouped).forEach((key) => {
          grouped[key].sort((a, b) => a.time.localeCompare(b.time));
        });

        setMessages(grouped);
        saveKey("barbaar-messages", grouped, true);
      }, (error) => {
        console.warn("Guest messages sync error:", error);
      });
    } else {
      // Guest client: load from localStorage
      loadKey<Record<string, Message[]>>("barbaar-messages", {}, true).then((m) => {
        setMessages(m);
      });
    }

    return () => unsubscribe();
  }, [currentUser, userRole, loggedInTherapist, clientProfile?.email]);

  // Sync client profile to local storage as fallback
  function setClientProfile(next: ClientProfile) {
    setClientProfileState((prev) => {
      const merged: ClientProfile = {
        ...prev,
        ...next,
        financialAidStatus:
          next.financialAidStatus !== undefined
            ? next.financialAidStatus
            : prev.financialAidStatus || "none",
        financialAidApprovedAt:
          next.financialAidApprovedAt !== undefined
            ? next.financialAidApprovedAt
            : prev.financialAidApprovedAt,
        financialAidCategory:
          next.financialAidCategory !== undefined
            ? next.financialAidCategory
            : prev.financialAidCategory,
        financialAidReason:
          next.financialAidReason !== undefined
            ? next.financialAidReason
            : prev.financialAidReason,
      };

      saveKey("barbaar-client-profile", merged, false);

      if (merged.email) {
        try {
          localStorage.setItem("barbaar-client-aid-email", merged.email.trim().toLowerCase());
          if (merged.financialAidStatus) {
            localStorage.setItem("barbaar-client-aid-status", merged.financialAidStatus);
          }
        } catch (e) {}
      }

      // If logged in as client, we can write/sync profile info to a "users" document
      if (currentUser && userRole === "client") {
        setDoc(
          doc(db, "users", currentUser.uid),
          {
            name: merged.name,
            email: currentUser.email?.toLowerCase() || merged.email?.toLowerCase(),
            phone: merged.phone,
            updatedAt: new Date().toISOString(),
            financialAidStatus: merged.financialAidStatus || null,
            financialAidCategory: merged.financialAidCategory || null,
            financialAidReason: merged.financialAidReason || null,
            financialAidApprovedAt: merged.financialAidApprovedAt || null,
          },
          { merge: true }
        ).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
        });
      }

      return merged;
    });
  }

  // Local/Cloud Save Callbacks
  async function saveTherapists(next: Therapist[]) {
    const previous = therapists;
    setTherapists(next);
    saveKey("barbaar-therapists", next, true);

    // Save to Firestore individually or via batch if possible
    try {
      const batch = writeBatch(db);
      next.forEach((therapist) => {
        const docRef = doc(db, "therapists", therapist.id);
        batch.set(docRef, therapist);
      });

      // Also delete any therapists that were removed
      const removed = previous.filter(p => !next.some(n => n.id === p.id));
      removed.forEach((therapist) => {
        const docRef = doc(db, "therapists", therapist.id);
        batch.delete(docRef);
      });

      await batch.commit();
    } catch (e) {
      console.error("Failed to sync therapists to Firestore:", e);
      handleFirestoreError(e, OperationType.WRITE, "therapists");
    }
  }

  async function saveBookings(next: Booking[]) {
    setBookings(next);
    saveKey("barbaar-bookings", next, true);

    const bookingEmails = next.map(b => b.clientEmail?.trim().toLowerCase()).filter(Boolean);
    const firstBookingEmail = bookingEmails[0] || "";

    const activeEmail = currentUser ? (currentUser.email?.toLowerCase() || "") : (clientProfile?.email?.trim().toLowerCase() || firstBookingEmail);

    // If logged in OR guest client with profile email, save/sync newly added bookings to Firestore
    if (currentUser || activeEmail) {
      try {
        const batch = writeBatch(db);
        next.forEach((b) => {
          const docRef = doc(db, "bookings", b.id);
          batch.set(docRef, b);
        });
        await batch.commit();
      } catch (e) {
        console.error("Failed to sync bookings to Firestore:", e);
        handleFirestoreError(e, OperationType.WRITE, "bookings");
      }
    }
  }

  async function saveMessages(next: Record<string, Message[]>) {
    setMessages(next);
    saveKey("barbaar-messages", next, true);

    let msgEmail = "";
    Object.values(next).forEach((thread) => {
      thread.forEach((msg) => {
        if (msg.clientEmail) {
          msgEmail = msg.clientEmail.trim().toLowerCase();
        }
      });
    });

    const activeEmail = currentUser ? (currentUser.email?.toLowerCase() || "") : (clientProfile?.email?.trim().toLowerCase() || msgEmail);

    if (currentUser || activeEmail) {
      // Flat sync: write any new messages from the record to Firestore
      try {
        const email = activeEmail;
        // Extract all individual messages
        const batch = writeBatch(db);
        
        Object.entries(next).forEach(([therapistId, thread]) => {
          thread.forEach((msg) => {
            const msgClientEmail = msg.clientEmail || (userRole === "therapist" && loggedInTherapist ? (bookings.find(b => b.therapistId === loggedInTherapist.id)?.clientEmail || email) : email);
            const lowerMsgClientEmail = msgClientEmail.toLowerCase();

            // A guest client is also treated as the owner of their message if clientEmail matches
            const isClientOwner = (userRole === "client" || !currentUser) && lowerMsgClientEmail === email;
            const isTherapistOwner = userRole === "therapist" && loggedInTherapist && therapistId === loggedInTherapist.id;
            const isPlatformAdmin = userRole === "admin";

            if (isClientOwner || isTherapistOwner || isPlatformAdmin) {
              const docRef = doc(db, "messages", msg.id);
              batch.set(docRef, {
                id: msg.id,
                therapistId,
                clientEmail: msgClientEmail,
                from: msg.from,
                text: msg.text,
                time: msg.time,
                isZoom: msg.isZoom || false,
                isSessionRoom: msg.isSessionRoom || false,
                bookingId: msg.bookingId || ""
              });
            }
          });
        });

        await batch.commit();
      } catch (e) {
        console.error("Failed to sync messages to Firestore:", e);
        handleFirestoreError(e, OperationType.WRITE, "messages");
      }
    }
  }

  async function saveContent(next: AppContent) {
    setContent(next);
    saveKey("barbaar-content", next, true);
    try {
      await setDoc(doc(db, "content", "app"), next);
    } catch (e) {
      console.error("Failed to sync content to Firestore:", e);
      handleFirestoreError(e, OperationType.WRITE, "content/app");
    }
  }

  // Handle logout
  async function handleSignOut() {
    await signOut(auth);
    setUserRole(null);
    setLoggedInTherapist(null);
    setMode("client");
    setActiveTherapistId(null);
  }

  if (!ready) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.ivory,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GlobalStyles />
        <GrowthArc value={40} size={44} stroke={4}>
          <Sparkles size={18} color={colors.amber} />
        </GrowthArc>
      </div>
    );
  }

  const activeTherapist = therapists.find((t) => t.id === activeTherapistId);

  return (
    <div
      className="font-body"
      style={{
        background: colors.ivory,
        minHeight: "100vh",
        color: colors.ink,
      }}
    >
      <GlobalStyles />

      {mode === "client" && (
        <ClientApp
          therapists={therapists}
          bookings={bookings}
          messages={messages}
          content={content}
          clientProfile={clientProfile}
          saveTherapists={saveTherapists}
          saveBookings={saveBookings}
          saveMessages={saveMessages}
          setClientProfile={setClientProfile}
          enterTherapistMode={() => {
            if (userRole === "therapist" && loggedInTherapist) {
              setActiveTherapistId(loggedInTherapist.id);
              setMode("therapist");
            }
          }}
          enterAdminMode={() => {
            if (userRole === "admin") {
              setMode("admin");
            }
          }}
          currentUser={currentUser}
          userRole={userRole}
          onSignOut={handleSignOut}
          onJoinSession={setActiveSessionBooking}
          screen={clientScreen}
          setScreen={setClientScreen}
          selectedId={activeTherapistId}
          setSelectedId={setActiveTherapistId}
          settingsSub={settingsSub}
          setSettingsSub={setSettingsSub}
        />
      )}

      {mode === "therapist" && userRole === "therapist" && activeTherapist && loggedInTherapist && activeTherapist.id === loggedInTherapist.id && (
        <TherapistApp
          therapist={activeTherapist}
          therapists={therapists}
          bookings={bookings}
          messages={messages}
          saveTherapists={saveTherapists}
          saveBookings={saveBookings}
          saveMessages={saveMessages}
          onExit={() => {
            setMode("client");
          }}
          onJoinSession={setActiveSessionBooking}
          screen={therapistScreen}
          setScreen={setTherapistScreen}
        />
      )}

      {mode === "admin" && userRole === "admin" && (
        <AdminApp
          therapists={therapists}
          bookings={bookings}
          content={content}
          saveTherapists={saveTherapists}
          saveBookings={saveBookings}
          saveContent={saveContent}
          onExit={() => setMode("client")}
          screen={adminScreen}
          setScreen={setAdminScreen}
          users={users}
          aidRequests={aidRequests}
          onUpdateAidStatus={handleUpdateAidStatus}
          onUpdateUserAidStatus={handleUpdateUserAidStatus}
          onSendApprovalEmail={handleSendApprovalEmail}
          onSendExpiryAlert={handleSendExpiryAlert}
        />
      )}

      {activeSessionBooking && (() => {
        const isClient = mode === "client";
        const role = isClient ? "client" : "therapist";
        let partnerName = "Counselor";
        if (isClient) {
          const matchingTherapist = therapists.find(t => t.id === activeSessionBooking.therapistId);
          if (matchingTherapist) {
            partnerName = matchingTherapist.name;
          }
        } else {
          partnerName = activeSessionBooking.clientName || "Client Participant";
        }

        return (
          <ConsultationRoom
            booking={activeSessionBooking}
            currentUserRole={role}
            partnerName={partnerName}
            onClose={() => setActiveSessionBooking(null)}
            onCompleteSession={async () => {
              const updatedBookings = bookings.map(b => 
                b.id === activeSessionBooking.id ? { ...b, status: "completed" } : b
              );
              await saveBookings(updatedBookings);
              setActiveSessionBooking(null);
            }}
          />
        );
      })()}
    </div>
  );
}
