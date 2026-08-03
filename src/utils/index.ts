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

export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("00252")) {
    digits = digits.substring(2);
  } else if (digits.startsWith("0")) {
    digits = "252" + digits.substring(1);
  } else if (!digits.startsWith("252") && digits.length >= 7 && digits.length <= 10) {
    digits = "252" + digits;
  }
  return digits;
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
    return { isActive: false, isExpired: false, timeLeftStr: "" };
  }
  if (!clientProfile.financialAidApprovedAt) {
    return { isActive: true, isExpired: false, timeLeftStr: "3d 0h" };
  }

  const approvedAt = new Date(clientProfile.financialAidApprovedAt).getTime();
  const expiresAt = approvedAt + 3 * 24 * 60 * 60 * 1000; // 3 days
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) {
    return { isActive: false, isExpired: true, timeLeftStr: "" };
  }

  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let timeLeftStr = "";
  if (days > 0) {
    timeLeftStr += `${days}d `;
  }
  timeLeftStr += `${hours}h ${minutes}m`;

  return { isActive: true, isExpired: false, timeLeftStr, totalMs: diff };
}

/**
 * Calculates countdown timer string for pending financial aid review (24 hour window)
 */
export function getPendingReviewTimeLeft(submittedAt?: string) {
  const start = submittedAt && !isNaN(new Date(submittedAt).getTime()) 
    ? new Date(submittedAt).getTime() 
    : Date.now();
  const reviewDuration = 24 * 60 * 60 * 1000; // 24 hours review duration
  const end = start + reviewDuration;
  const diff = end - Date.now();

  if (diff <= 0) {
    return "00h 00m 00s";
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
}

