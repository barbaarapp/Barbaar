/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LucideIcon } from "lucide-react";

export interface Therapist {
  id: string;
  name: string;
  credentials: string;
  category: "cbt" | "couples" | "premium" | string;
  gender: "female" | "male";
  languages: string[];
  experience: number;
  rating: number;
  reviews: number;
  price: number;
  priceUnit: "session" | "program" | string;
  sessionsIncluded: number | null;
  shortBio: string;
  longBio: string;
  specialties: string[];
  initials: string;
  color: string;
  availability: {
    days: string[];
    slots: string[];
  };
  active: boolean;
  zoomLink?: string;
  email?: string;
}

export interface Booking {
  id: string;
  therapistId: string;
  category: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string;
  time: string;
  price: number;
  priceUnit: string;
  status: "upcoming" | "completed" | string;
  zoomLink: string | null;
  createdAt: string;
  financialAidApplied?: boolean;
  financialAidCategory?: string;
  financialAidReason?: string;
  financialAidStatus?: "pending" | "approved" | "rejected";
  originalPrice?: number;
  rating?: number;
  review?: string;
  rescheduledByTherapist?: boolean;
  rescheduleReason?: string;
  originalDate?: string;
  originalTime?: string;
  paymentGateway?: string;
  paymentMethod?: "mobile" | "card";
  paymentStatus?: "paid" | "pending" | "failed";
  paymentSid?: string;
  paymentAccount?: string;
  paidAt?: string;
}

export interface Message {
  id: string;
  from: "client" | "therapist";
  text: string;
  time: string;
  isZoom?: boolean;
  isSessionRoom?: boolean;
  bookingId?: string;
  clientEmail?: string;
}

export interface SupportMessage {
  id: string;
  clientEmail: string;
  clientName: string;
  from: "client" | "admin";
  text: string;
  time: string;
  category?: string;
}

export interface QuizOption {
  label: string;
  weight?: {
    cbt?: number;
    couples?: number;
    premium?: number;
    [key: string]: number | undefined;
  };
  value?: "female" | "male" | null;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  isPreference?: boolean;
  options: QuizOption[];
}

export interface AppContent {
  aboutUs: string;
  terms: string;
  privacy: string;
}

export interface ClientProfile {
  name: string;
  phone: string;
  email: string;
  language?: "en" | "so";
  financialAidStatus?: "none" | "pending" | "approved" | "rejected" | "completed";
  financialAidCategory?: string;
  financialAidReason?: string;
  financialAidApprovedAt?: string;
}

export interface FinancialAidRequest {
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
  therapistId?: string;
  therapistName?: string;
  sessionDate?: string;
  sessionTime?: string;
  originalPrice?: number;
  discountedPrice?: number;
  source?: "upfront" | "booking";
  approvalEmailSent?: boolean;
  approvalEmailSentAt?: string | null;
  expiryAlertSent?: boolean;
  expiryAlertSentAt?: string | null;
  expiryDate?: string | null;
}

export interface Category {
  key: string;
  name: string;
  short: string;
  icon: LucideIcon;
  color: string;
  soft: string;
}

// Global window extension for the storage interface
declare global {
  interface Window {
    storage?: {
      get: (key: string, shared?: boolean) => Promise<{ value?: string } | null | undefined>;
      set: (key: string, value: string, shared?: boolean) => Promise<void>;
    };
  }
}
