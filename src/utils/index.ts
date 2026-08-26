/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Storage helper that loads a key from window.storage or localStorage
 */
export async function loadKey<T>(key: string, fallback: T, shared?: boolean): Promise<T> {
  try {
    if (window.storage && typeof window.storage.get === "function") {
      const res = await window.storage.get(key, shared);
      return res && res.value ? JSON.parse(res.value) : fallback;
    } else {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    }
  } catch (e) {
    return fallback;
  }
}

/**
 * Storage helper that saves a key to window.storage or localStorage
 */
export async function saveKey<T>(key: string, value: T, shared?: boolean): Promise<void> {
  try {
    if (window.storage && typeof window.storage.set === "function") {
      await window.storage.set(key, JSON.stringify(value), shared);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    /* non-fatal: app keeps working from in-memory state */
  }
}

/**
 * Format a date object or string into a clean localized date string
 */
export function fmtDate(d: Date | string): string {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/**
 * Format currency amount
 */
export function fmtMoney(n: number): string {
  return `$${n}`;
}

/**
 * Generate a unique ID with a prefix
 */
export function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Get next available dates based on a list of active days
 */
export function nextAvailableDates(availDays: string[], want = 6): Date[] {
  const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates: Date[] = [];
  // Start from today and check up to 21 days in future
  for (let i = 0; i < 21 && dates.length < want; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (availDays.includes(dayMap[d.getDay()])) {
      dates.push(d);
    }
  }
  return dates;
}

/**
 * Get ISO date string slice (YYYY-MM-DD)
 */
export function isoDate(d: Date | string): string {
  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return d;
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      return d.slice(0, 10);
    }
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get context-appropriate time of day greeting
 */
export function timeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Generate an SEO-friendly URL slug from a therapist's name
 */
export function getTherapistSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Parses financial aid details from the client profile and calculates remaining validity
 */
export function getFinancialAidInfo(clientProfile: {
  financialAidStatus?: string;
  financialAidApprovedAt?: string;
}) {
  if (clientProfile.financialAidStatus !== "approved") {
    return {
      isActive: false,
      isExpired: false,
      timeLeftStr: "",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      percentRemaining: 0,
    };
  }
  if (!clientProfile.financialAidApprovedAt) {
    return {
      isActive: true,
      isExpired: false,
      timeLeftStr: "3d 0h",
      days: 3,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 3 * 24 * 60 * 60 * 1000,
      percentRemaining: 100,
    };
  }

  const approvedAt = new Date(clientProfile.financialAidApprovedAt).getTime();
  const validityTotal = 3 * 24 * 60 * 60 * 1000; // 3 days (72 hours)
  const expiresAt = approvedAt + validityTotal;
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return {
      isActive: false,
      isExpired: true,
      timeLeftStr: "",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: 0,
      percentRemaining: 0,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let timeLeftStr = "";
  if (days > 0) {
    timeLeftStr += `${days}d `;
  }
  timeLeftStr += `${hours}h ${minutes}m`;

  const percentRemaining = Math.max(0, Math.min(100, (diff / validityTotal) * 100));

  return {
    isActive: true,
    isExpired: false,
    timeLeftStr,
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    percentRemaining,
  };
}

export interface SomaliPhoneInfo {
  isValid: boolean;
  rawInput: string;
  normalized: string; // e.g. "252612345678"
  national: string; // e.g. "061 234 5678"
  display: string; // e.g. "+252 61 234 5678"
  operator: "EVC Plus" | "ZAAD" | "Sahal" | "eDahab" | "Premier Wallet" | "Somali Mobile";
  gateway: "evc" | "zaad" | "sahal" | "edahab" | "premier" | "auto";
  brandColor: string;
  badgeLabel: string;
}

/**
 * Validates, cleans, and determines the Somali mobile telecom operator and gateway
 */
export function parseSomaliPhone(input: string): SomaliPhoneInfo {
  if (!input) {
    return {
      isValid: false,
      rawInput: "",
      normalized: "",
      national: "",
      display: "",
      operator: "Somali Mobile",
      gateway: "auto",
      brandColor: "#558B51",
      badgeLabel: "Somalia Mobile",
    };
  }

  const rawDigits = input.replace(/\D/g, "");
  let core = rawDigits;

  if (core.startsWith("252")) {
    core = core.slice(3);
  }
  if (core.startsWith("0")) {
    core = core.slice(1);
  }

  let operator: SomaliPhoneInfo["operator"] = "Somali Mobile";
  let gateway: SomaliPhoneInfo["gateway"] = "evc";
  let brandColor = "#558B51";
  let badgeLabel = "Somali Telecom";

  if (core.startsWith("61") || core.startsWith("68") || core.startsWith("77")) {
    operator = "EVC Plus";
    gateway = "evc";
    brandColor = "#008751"; // Hormuud Green
    badgeLabel = "Hormuud • EVC Plus";
  } else if (core.startsWith("63") || core.startsWith("67")) {
    operator = "ZAAD";
    gateway = "zaad";
    brandColor = "#E01A22"; // Telesom Red
    badgeLabel = "Telesom • ZAAD";
  } else if (core.startsWith("90") || core.startsWith("9")) {
    operator = "Sahal";
    gateway = "sahal";
    brandColor = "#0066B2"; // Golis Blue
    badgeLabel = "Golis • Sahal";
  } else if (core.startsWith("65") || core.startsWith("62")) {
    operator = "eDahab";
    gateway = "edahab";
    brandColor = "#F37021"; // Somtel Orange
    badgeLabel = "Somtel • eDahab";
  } else if (core.startsWith("85") || core.startsWith("88")) {
    operator = "Premier Wallet";
    gateway = "premier";
    brandColor = "#1B365D"; // Premier Navy
    badgeLabel = "Premier Wallet";
  }

  // A valid Somali subscriber number has 8 to 9 digits (e.g. 61xxxxxxx)
  const isValid = core.length >= 7 && core.length <= 10;
  const normalized = `252${core}`;
  
  // Format for display
  let national = `0${core}`;
  if (core.length >= 8) {
    national = `0${core.slice(0, 2)} ${core.slice(2, 5)} ${core.slice(5)}`;
  }

  let display = `+252 ${core}`;
  if (core.length >= 8) {
    display = `+252 ${core.slice(0, 2)} ${core.slice(2, 5)} ${core.slice(5)}`;
  }

  return {
    isValid,
    rawInput: input,
    normalized,
    national,
    display,
    operator,
    gateway,
    brandColor,
    badgeLabel,
  };
}


