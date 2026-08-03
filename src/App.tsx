/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Therapist, Booking, Message, AppContent, ClientProfile } from "./types";
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
  getRedirectResult,
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
  const clientScreens = ["directory", "therapists", "quiz", "match", "sessions", "chat", "settings", "download", "apk"];
  if (clientScreens.includes(path)) {
    return {
      mode: "client" as const,
      clientScreen: path === "therapists" ? "directory" : path === "apk" ? "download" : path,
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
  const [clientProfile, setClientProfileState] = useState<ClientProfile>({
    name: "",
    phone: "",
    email: "",
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
  useEffect(() => {
    (async () => {
      const [t, b, m, c, p] = await Promise.all([
        loadKey<Therapist[]>("barbaar-therapists", DEFAULT_THERAPISTS, true),
        loadKey<Booking[]>("barbaar-bookings", [], true),
        loadKey<Record<string, Message[]>>("barbaar-messages", {}, true),
        loadKey<AppContent>("barbaar-content", DEFAULT_CONTENT, true),
        loadKey<ClientProfile>("barbaar-client-profile", { name: "", phone: "", email: "" }, false),
      ]);

      setTherapists(t);
      setBookings(b);
      setMessages(m);
      setContent(c);
      setClientProfileState(p);
      setReady(true);
    })();
  }, []);

  // 1. Listen for Authentication state changes and process redirect results
  useEffect(() => {
    // Safely check redirect result if available, ignoring missing initial state / sessionStorage errors
    const isNative = typeof window !== "undefined" && (
      Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
      window.location.protocol === "file:"
    );

    if (!isNative) {
      getRedirectResult(auth)
        .then((result) => {
          if (result?.user) {
            setCurrentUser(result.user);
          }
        })
        .catch((err) => {
          // Ignore missing initial state / sessionStorage errors
          if (err && !String(err.message || err).includes("missing initial state") && !String(err.message || err).includes("sessionStorage")) {
            console.warn("Google redirect sign in warning:", err);
          }
        });
    }

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

  // 1.6. Listen for user document changes (to sync profile and financial aid status in real-time for both client and admin roles)
  useEffect(() => {
    if (currentUser && (userRole === "client" || userRole === "admin")) {
      const docRef = doc(db, "users", currentUser.uid);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setClientProfileState((prev) => ({
            ...prev,
            name: data.name || prev.name || "",
            phone: data.phone || prev.phone || "",
            email: data.email || prev.email || "",
            language: data.language || prev.language || "en",
            financialAidStatus: data.financialAidStatus || prev.financialAidStatus || "none",
            financialAidCategory: data.financialAidCategory || prev.financialAidCategory,
            financialAidReason: data.financialAidReason || prev.financialAidReason,
            financialAidApprovedAt: data.financialAidApprovedAt || prev.financialAidApprovedAt,
          }));
        }
      }, (error) => {
        console.warn("Could not sync user profile in real-time:", error);
      });
      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // 1.7. Admin: Real-time sync of all users for managing financial aid requests
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

  // Admin action: update financial aid status
  async function handleUpdateUserAidStatus(userId: string, status: "approved" | "rejected") {
    try {
      const userRef = doc(db, "users", userId);
      const updateData: any = {
        financialAidStatus: status,
      };
      if (status === "approved") {
        updateData.financialAidApprovedAt = new Date().toISOString();
      } else {
        updateData.financialAidApprovedAt = null;
      }
      await updateDoc(userRef, updateData);

      // Trigger the automated first email upon admin approval
      if (status === "approved") {
        const u = users.find((user) => user.id === userId);
        if (u && u.email) {
          fetch("/api/send-booking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "send_approval_notification",
              clientName: u.name || "Anonymous Client",
              clientEmail: u.email,
              clientPhone: u.phone || "",
              category: u.financialAidCategory || "Somali Youth",
            }),
          }).then((res) => {
            console.log("Automated client profile approval email triggered:", res.status);
          }).catch((err) => {
            console.warn("Failed to dispatch automated client profile approval email:", err);
          });
        }
      }
    } catch (err) {
      console.error("Failed to update user financial aid status:", err);
    }
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

        // If a pre-approval booking has been approved/rejected, update the local client profile to match!
        const preapp = list.find(b => b.id.startsWith("bk_preapp_"));
        if (preapp && preapp.financialAidStatus && preapp.financialAidStatus !== clientProfile?.financialAidStatus) {
          setClientProfileState((prev) => {
            const next = {
              ...prev,
              financialAidStatus: preapp.financialAidStatus as any,
              financialAidApprovedAt: preapp.financialAidStatus === "approved" ? preapp.createdAt : null,
            };
            saveKey("barbaar-client-profile", next, false);
            return next;
          });
        }
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
    setClientProfileState(next);
    saveKey("barbaar-client-profile", next, false);
    
    // If logged in, we write/sync profile info to a "users" document
    if (currentUser) {
      setDoc(doc(db, "users", currentUser.uid), {
        name: next.name,
        email: currentUser.email?.toLowerCase() || next.email?.toLowerCase() || null,
        phone: next.phone,
        updatedAt: new Date().toISOString(),
        financialAidStatus: next.financialAidStatus || null,
        financialAidCategory: next.financialAidCategory || null,
        financialAidReason: next.financialAidReason || null,
        financialAidApprovedAt: next.financialAidApprovedAt || null,
      }, { merge: true }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
      });
    } else if (next.financialAidStatus === "pending") {
      // For guest upfront pre-approval requests, create a special pre-approval booking so the admin can review and approve it!
      const guestEmail = next.email?.trim().toLowerCase();
      if (guestEmail) {
        // Check if there is already a pending pre-approval booking to avoid duplicates
        const existingPreapp = bookings.find(
          b => b.clientEmail?.trim().toLowerCase() === guestEmail && b.id.startsWith("bk_preapp_")
        );
        
        if (!existingPreapp) {
          const preappBooking: Booking = {
            id: uid("bk_preapp"),
            therapistId: "placeholder",
            category: next.financialAidCategory || "Somali Youth",
            clientName: next.name,
            clientPhone: next.phone,
            clientEmail: guestEmail,
            date: "",
            time: "",
            price: 0,
            priceUnit: "$",
            status: "upcoming",
            zoomLink: null,
            createdAt: new Date().toISOString(),
            financialAidApplied: true,
            financialAidCategory: next.financialAidCategory || "Somali Youth",
            financialAidReason: next.financialAidReason || "",
            financialAidStatus: "pending",
            originalPrice: 0,
          };
          
          saveBookings([preappBooking, ...bookings]);
        }
      }
    }
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
          background: colors.indigoDeep,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <GlobalStyles />
        <img
          src="/barbaar_icon.svg"
          alt="Barbaar Wellness"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "18px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
          }}
        />
        <div style={{ fontSize: "16px", fontWeight: 600, color: colors.ivory, letterSpacing: "0.5px" }}>
          Barbaar Wellness
        </div>
        <GrowthArc value={40} size={36} stroke={3}>
          <Sparkles size={14} color={colors.amber} />
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
          onUpdateUserAidStatus={handleUpdateUserAidStatus}
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
            lang={clientProfile?.language || "en"}
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
