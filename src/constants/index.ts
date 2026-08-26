/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brain, HeartHandshake, Sparkles } from "lucide-react";
import { Therapist, QuizQuestion, AppContent, Category } from "../types";

export const colors = {
  ivory: "#ffffff",       // Pure white - brand canvas
  paper: "#ffffff",       // Pure white for card backdrops & elevated surfaces
  ink: "#1d2823",         // Deepest Slate-Forest Green (high-contrast premium text)
  inkSoft: "#4d5d54",     // Elegant soft slate green-gray for secondary texts
  indigo: "#384c43",      // Dark - primary deep slate green brand color
  indigoDeep: "#2f3f37",  // Slightly richer slate-green for headers/footers
  indigoSoft: "#e4eae6",  // Ultra-soft green tint for interactive active-states and pill tags
  amber: "#c07a34",       // Warm desert amber/gold
  amberSoft: "#f8efe0",   // Warm sandy light cream
  acacia: "#64a461",      // Cagaar - fresh wellness green
  acaciaSoft: "#eff5ef",  // Soft herbal pastel tint
  clay: "#b56254",        // Soft clay-rose
  claySoft: "#fbf2f0",    // Dusty light blush
  line: "#dfdad0",        // Warm divider lines
  danger: "#b93c3c",      // Calm signal red
};

export const CATEGORIES: Record<string, Category> = {
  cbt: {
    key: "cbt",
    name: "CBT Therapy",
    short: "Depression, anxiety & OCD",
    icon: Brain,
    color: colors.acacia,
    soft: colors.acaciaSoft,
  },
  couples: {
    key: "couples",
    name: "Couples & Relationship",
    short: "Rebuild connection, together",
    icon: HeartHandshake,
    color: colors.clay,
    soft: colors.claySoft,
  },
  premium: {
    key: "premium",
    name: "Premium Transformation",
    short: "A focused program for real change",
    icon: Sparkles,
    color: colors.amber,
    soft: colors.amberSoft,
  },
};

export const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap";

export const DEFAULT_THERAPISTS: Therapist[] = [
  {
    id: "t1",
    name: "Dr. Amina Hassan",
    credentials: "PhD, Clinical Psychologist",
    category: "cbt",
    gender: "female",
    languages: ["Somali", "English"],
    experience: 9,
    rating: 4.9,
    reviews: 127,
    price: 60,
    priceUnit: "session",
    sessionsIncluded: null,
    shortBio: "Helps clients quiet anxious and intrusive thoughts using evidence-based CBT, in a space that respects culture and faith.",
    longBio: "Dr. Hassan has spent nine years helping Somali clients work through anxiety, depression, and OCD using cognitive behavioral therapy. She was trained in Nairobi and London, and tailors CBT to fit each client's life, culture, and beliefs rather than the other way around.",
    specialties: ["Anxiety", "Depression", "OCD", "CBT"],
    initials: "AH",
    color: colors.acacia,
    availability: {
      days: ["Mon", "Tue", "Wed", "Thu"],
      slots: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"],
    },
    active: true,
    email: "amina.hassan@barbaar.com",
  },
  {
    id: "t2",
    name: "Abdirahman Jama",
    credentials: "LMFT, Licensed Therapist",
    category: "cbt",
    gender: "male",
    languages: ["Somali", "English"],
    experience: 6,
    rating: 4.7,
    reviews: 64,
    price: 50,
    priceUnit: "session",
    sessionsIncluded: null,
    shortBio: "Works with Somali men carrying anxiety and pressure to 'hold it together' — practical tools, no judgment.",
    longBio: "Abdirahman focuses on anxiety, low mood, and stress, especially for men who were never taught it's okay to ask for help. His sessions are direct, practical, and grounded in CBT techniques you can use the same day.",
    specialties: ["Anxiety", "Depression", "Stress", "CBT"],
    initials: "AJ",
    color: colors.acacia,
    availability: {
      days: ["Tue", "Wed", "Fri", "Sat"],
      slots: ["10:00 AM", "1:00 PM", "3:00 PM", "6:00 PM"],
    },
    active: true,
    email: "abdirahman.jama@barbaar.com",
  },
  {
    id: "t3",
    name: "Dr. Yusuf Warsame",
    credentials: "PsyD, Couples Therapist",
    category: "couples",
    gender: "male",
    languages: ["Somali", "English", "Arabic"],
    experience: 11,
    rating: 4.9,
    reviews: 98,
    price: 75,
    priceUnit: "session",
    sessionsIncluded: null,
    shortBio: "Guides couples through distance, trust, and communication — grounded in respect for Somali family values.",
    longBio: "Dr. Warsame has worked with over 300 couples on communication, trust, and conflict. He understands the weight of family and community expectations, and helps partners rebuild connection without losing their values.",
    specialties: ["Communication", "Trust", "Pre-marital", "Conflict"],
    initials: "YW",
    color: colors.clay,
    availability: {
      days: ["Mon", "Wed", "Thu", "Sat"],
      slots: ["9:00 AM", "12:00 PM", "3:00 PM", "5:00 PM"],
    },
    active: true,
    email: "yusuf.warsame@barbaar.com",
  },
  {
    id: "t4",
    name: "Sagal Nur",
    credentials: "LCSW, Relationship Therapist",
    category: "couples",
    gender: "female",
    languages: ["Somali", "English"],
    experience: 7,
    rating: 4.8,
    reviews: 71,
    price: 65,
    priceUnit: "session",
    sessionsIncluded: null,
    shortBio: "Helps partners rebuild connection after conflict, distance, or big transitions like migration and marriage.",
    longBio: "Sagal specializes in helping couples navigate life transitions — new marriages, migration, blended families — with a calm, structured approach that keeps both partners feeling heard.",
    specialties: ["Connection", "Conflict Repair", "Life Transitions"],
    initials: "SN",
    color: colors.clay,
    availability: {
      days: ["Sun", "Tue", "Thu", "Fri"],
      slots: ["11:00 AM", "1:00 PM", "4:00 PM", "6:00 PM"],
    },
    active: true,
    email: "sagal.nur@barbaar.com",
  },
  {
    id: "t5",
    name: "Dr. Ifrah Abdi",
    credentials: "PhD, Transformation Coach & Psychologist",
    category: "premium",
    gender: "female",
    languages: ["Somali", "English"],
    experience: 13,
    rating: 5.0,
    reviews: 52,
    price: 320,
    priceUnit: "program",
    sessionsIncluded: 6,
    shortBio: "Leads a focused 6-week program for people ready to break real patterns — not just cope, but change.",
    longBio: "Dr. Abdi's 6-week transformation program is built for people who feel stuck in the same patterns despite years of 'coping'. Sessions are longer, homework is real, and the goal is measurable change, not just relief.",
    specialties: ["Life Transitions", "Identity", "Deep Change", "Goal-focused"],
    initials: "IA",
    color: colors.amber,
    availability: {
      days: ["Mon", "Tue", "Thu"],
      slots: ["10:00 AM", "1:00 PM", "4:00 PM"],
    },
    active: true,
    email: "ifrah.abdi@barbaar.com",
  },
  {
    id: "t6",
    name: "Mohamed Ali Farah",
    credentials: "PsyD, Clinical Psychologist",
    category: "premium",
    gender: "male",
    languages: ["Somali", "English"],
    experience: 15,
    rating: 4.9,
    reviews: 83,
    price: 280,
    priceUnit: "program",
    sessionsIncluded: 6,
    shortBio: "A 6-week intensive for people ready to face what's been on hold — career, identity, relationships.",
    longBio: "Mohamed built his 6-week intensive for high performers who look fine from the outside but feel stuck inside. Expect direct feedback, structured milestones, and a program that ends with a plan, not just a feeling.",
    specialties: ["High-performers", "Purpose", "Deep Change"],
    initials: "MF",
    color: colors.amber,
    availability: {
      days: ["Wed", "Thu", "Fri", "Sat"],
      slots: ["9:00 AM", "12:00 PM", "3:00 PM"],
    },
    active: true,
    email: "mohamed.farah@barbaar.com",
  },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    prompt: "What's bringing you to Barbaar today?",
    options: [
      { label: "Anxious or heavy thoughts I can't shake", weight: { cbt: 2 } },
      { label: "Tension or distance with my partner", weight: { couples: 2 } },
      { label: "I'm ready for deep, committed change", weight: { premium: 2 } },
      { label: "I'm still figuring it out", weight: { cbt: 1, couples: 1, premium: 1 } },
    ],
  },
  {
    id: "q2",
    prompt: "How have the last few weeks felt?",
    options: [
      { label: "Hard to get out of bed some days", weight: { cbt: 2 } },
      { label: "Hard conversations at home", weight: { couples: 2 } },
      { label: "Okay — but stuck in the same patterns", weight: { premium: 2 } },
      { label: "Honestly, up and down", weight: { cbt: 1, premium: 1 } },
    ],
  },
  {
    id: "q3",
    prompt: "What kind of support feels right?",
    options: [
      { label: "Practical tools for anxiety, low mood or intrusive thoughts", weight: { cbt: 2 } },
      { label: "A guided space for me and my partner", weight: { couples: 2 } },
      { label: "An intensive program, not just an hour a week", weight: { premium: 2 } },
      { label: "Not sure — match me with someone great", weight: { cbt: 1, couples: 1, premium: 1 } },
    ],
  },
  {
    id: "q4",
    prompt: "Any preference for your therapist?",
    isPreference: true,
    options: [
      { label: "I'd prefer a woman", value: "female" },
      { label: "I'd prefer a man", value: "male" },
      { label: "No preference", value: null },
    ],
  },
];

export const DEFAULT_CONTENT: AppContent = {
  aboutUs: "Barbaar Wellness connects Somali people — at home and across the diaspora — with licensed therapists who understand our language, culture, and faith.\n\n\"Barbaar\" means to nurture and raise up. That's what we want therapy to feel like: steady, unhurried support as you grow.\n\nEvery therapist on Barbaar is licensed and vetted. Sessions happen over video, wherever you are, in Somali, English, or Arabic.",
  terms: "By booking a session on Barbaar Wellness, you agree to attend the scheduled time and to give at least 24 hours' notice to reschedule or cancel. Late cancellations may be charged in full.\n\nBarbaar Wellness connects clients with independent licensed therapists. Therapists are responsible for the clinical care they provide. Payments are processed securely at the time of booking.\n\nThis app is a working prototype. Full terms should be reviewed by a licensed attorney before launch.",
  privacy: "We collect only what's needed to match you with a therapist and manage your bookings: your name, contact details, and session history.\n\nYour information is never sold. Conversations with your therapist are private between you and them. You can request your data be deleted at any time from Settings.\n\nThis app is a working prototype. A full privacy policy should be reviewed by a licensed attorney before launch, especially around health-data handling.",
};

export const ALL_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const ALL_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
