/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Therapist, QuizQuestion, AppContent } from "../types";

export type Language = "en" | "so";

export const UI_TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Navigation & General
  "Home": { en: "Home", so: "Hoyga" },
  "Browse": { en: "Browse", so: "Baadhid" },
  "Sessions": { en: "Sessions", so: "Ballamaha" },
  "Messages": { en: "Messages", so: "Fariimaha" },
  "Profile": { en: "Profile", so: "Xogtaada" },
  "Back": { en: "Back", so: "Dib u laabo" },
  "Close": { en: "Close", so: "Xidh" },
  "Cancel": { en: "Cancel", so: "Jooji" },
  "View": { en: "View", so: "Arag" },
  "Save": { en: "Save", so: "Kaydi" },
  "Save Changes": { en: "Save Changes", so: "Kaydi Isbeddelada" },
  "Saving...": { en: "Saving...", so: "La kaydinayaa..." },

  // Home Screen
  "How are you feeling today?": { en: "How are you feeling today?", so: "Sidee dareemaysaa maanta?" },
  "Centering Practice": { en: "Centering Practice", so: "Maanka Deji" },
  "Pause for a mindful breath": { en: "Pause for a mindful breath", so: "Neefta yara qaado si aad u degto" },
  "Tap to finish practice": { en: "Tap to finish practice", so: "Taabo si aad u joojiso" },
  "Tap to begin a simple 12-second relaxation loop": {
    en: "Tap to begin a simple 12-second relaxation loop",
    so: "Taabo si aad u bilowdo 12-ilbiriqsi oo neefsi iyo nasasho ah",
  },
  "Inhale deeply…": { en: "Inhale deeply…", so: "Neefta gudaha u qaad oo ka dharag…" },
  "Hold gracefully…": { en: "Hold gracefully…", so: "Neefta ku hayso xabadka…" },
  "Exhale slowly…": { en: "Exhale slowly…", so: "Neefta tartiib dibadda ugu sii daa…" },
  "Your next session": { en: "Your next session", so: "Kulankaaga xiga ee kuu qorshaysan" },
  "No upcoming sessions.": { en: "No upcoming sessions.", so: "Ma jiraan ballamo kuu qorshaysan maanta." },
  "Find your perfect match": { en: "Find your perfect match", so: "Raadi Lataliyaha Kugu Habboon" },
  "Find Your Licensed Therapist Match": { en: "Find Your Licensed Therapist Match", so: "Raadso Dhakhtar Shahaado haysta oo ku habboon" },
  "Answer 4 questions to match with a specialist who respects your faith, culture, and language.": {
    en: "Answer 4 questions to match with a specialist who respects your faith, culture, and language.",
    so: "Ka jawaab 4 su'aalood oo kooban si lagugu xidho dhakhtar yaqaanna dhaqankaaga, diintaada iyo afkaaga.",
  },
  "Get Started": { en: "Get Started", so: "Bilow Halkan" },
  "Browse by therapy specialization": { en: "Browse by therapy specialization", so: "U kala saar dhakhaatiirta takhasuskooda" },

  // Directory / Browse
  "Search by name...": { en: "Search by name...", so: "Ku raadi magaca dhakhtarka..." },
  "All": { en: "All", so: "Dhammaan" },
  "Any": { en: "Any", so: "Luuqad kasta" },
  "No therapists found matching your filters.": { en: "No therapists found matching your filters.", so: "Lama helin dhakhaatiir waafaqsan baadhitaankaaga." },
  "Reset Filters": { en: "Reset Filters", so: "Dib u eeg miirayaasha" },
  "Book Session": { en: "Book Session", so: "Ballanso Kulan" },
  "per session": { en: "per session", so: "halkii kulan" },
  "per program": { en: "per program", so: "barnaamijkii" },
  "sessions included": { en: "sessions included", so: "kulan baa ku jira" },

  // Therapist Detail
  "Specialist Profile": { en: "Specialist Profile", so: "Xogta Dhakhtarka" },
  "Bio": { en: "Bio", so: "Taariikh Nololeedka" },
  "Specialties": { en: "Specialties", so: "Aqoonta Gaarka ah" },
  "Languages": { en: "Languages", so: "Luuqadaha" },
  "Rating": { en: "Rating", so: "Qiimaynta" },
  "Experience": { en: "Experience", so: "Khibradda" },
  "Price": { en: "Price", so: "Qiimaha" },
  "Availability": { en: "Availability", so: "Waqtiyada uu diyaar yahay" },
  "years": { en: "years", so: "sannadood" },
  "reviews": { en: "reviews", so: "faallooyin" },
  "Select a date and time slot to connect with": {
    en: "Select a date and time slot to connect with",
    so: "Dooro maalin iyo saacado aad la kulanto",
  },
  "Book a 50-minute secure video session": {
    en: "Book a 50-minute secure video session",
    so: "Ballanso 50-daqiiqo oo kulan muuqaal ah oo ammaan ah",
  },

  // Settings / Profile
  "Preferences & Language": { en: "Preferences & Language", so: "Luuqadda & Doorbidka" },
  "Language": { en: "Language", so: "Luuqadda" },
  "Choose your preferred language": { en: "Choose your preferred language", so: "Dooro luuqadda aad doorbideyso" },
  "Edit Profile Information": { en: "Edit Profile Information", so: "Wax ka beddel Xogtaada" },
  "Full name": { en: "Full name", so: "Magaca buuxa" },
  "Phone number": { en: "Phone number", so: "Lambarka telefoonka" },
  "Email address": { en: "Email address", so: "Cinwaanka iimaylka" },
  "Member since October 2025": { en: "Member since October 2025", so: "Xubin ka ahaa ilaa Oktoobar 2025" },
  "Add Your Name": { en: "Add Your Name", so: "Ku dar Magacaaga" },
  "Care & Community": { en: "Care & Community", so: "Daryeelka & Bulshada" },
  "Invite & Earn": { en: "Invite & Earn", so: "Casuun oo Faa'id" },
  "Share Barbaar with friends to receive free session credits": {
    en: "Share Barbaar with friends to receive free session credits",
    so: "La wadaag saaxiibbadaa Barbaar si aad u hesho daryeel bilaash ah",
  },
  "Notifications": { en: "Notifications", so: "Ogeysiisyada" },
  "Manage SMS, email, and reminder alerts": {
    en: "Manage SMS, email, and reminder alerts",
    so: "Maamul ogeysiisyada SMS-ka, iimaylka iyo xusuusinta",
  },
  "Information & Trust": { en: "Information & Trust", so: "Xogta & Kalsoonida" },
  "About Barbaar Wellness": { en: "About Barbaar Wellness", so: "Ku saabsan Barbaar Wellness" },
  "Terms of Service": { en: "Terms of Service", so: "Shuruudaha Adeegga" },
  "Privacy Policy": { en: "Privacy Policy", so: "Xog-dhawrka (Privacy)" },
  "For Specialists & Admin": { en: "For Specialists & Admin", so: "Dhakhaatiirta & Maamulka" },
  "Therapist Dashboard": { en: "Therapist Dashboard", so: "Shaxda Dhakhtarka" },
  "Access specialist clinical calendars and client messages": {
    en: "Access specialist clinical calendars and client messages",
    so: "Gal jadwalka caafimaadka iyo fariimaha macaamiisha",
  },
  "Admin Console": { en: "Admin Console", so: "Console-ka Maamulka" },
  "Nurture overall platform directories and content blocks": {
    en: "Nurture overall platform directories and content blocks",
    so: "Maamul dhamaan xogaha iyo barnaamijyada platform-ka",
  },
  "Back to settings": { en: "Back to settings", so: "Ku laabo xogtaada" },

  // Invite & Earn Screen
  "Invite Friends, Earn Care": { en: "Invite Friends, Earn Care", so: "Casuun Saxiibbadaa, Hel Daryeel" },
  "Share the gift of mental well-being. Give your friends 30% off, and earn 1 free session credit for each successful booking!": {
    en: "Share the gift of mental well-being. Give your friends 30% off, and earn 1 free session credit for each successful booking!",
    so: "La wadaag saaxiibbadaa daryeelka caafimaadka maskaxda. Sii saaxiibbadaa dhimis 30% ah, adiguna hel 1 kulan oo daryeel bilaash ah markay ballansadaan!",
  },
  "Your Exclusive Invite Code": { en: "Your Exclusive Invite Code", so: "Koodhkaaga Casuumaadda ee Gaarka ah" },
  "Share your unique referral link": { en: "Share your unique referral link", so: "La wadaag linkigaaga casuumaadda ah" },
  "Your earnings history": { en: "Your earnings history", so: "Taariikhda faa'idadaada" },
  "Invites Sent": { en: "Invites Sent", so: "Casuumaadaha la diray" },
  "Registered": { en: "Registered", so: "Diiwaangashan" },
  "Credits Earned": { en: "Credits Earned", so: "Faa'idada Guud" },
  "Pending booking": { en: "Pending booking", so: "Weli ma ballansan" },

  // Notifications Settings
  "Notification Settings": { en: "Notification Settings", so: "Habaynta Ogeysiiska" },
  "Customize how you receive calendar updates and appointment alerts.": {
    en: "Customize how you receive calendar updates and appointment alerts.",
    so: "Habayso sida aad u helayso ogeysiisyada ballamaha iyo jadwalka.",
  },
  "Gmail Notifications": { en: "Gmail Notifications", so: "Ogeysiiska Gmail" },
  "Receive full calendar events, meeting invites, and payment invoices.": {
    en: "Receive full calendar events, meeting invites, and payment invoices.",
    so: "Hel dhacdooyinka jadwalka, casuumaadaha kulanka, iyo qaansheegta lacag-bixinta.",
  },
  "Mobile SMS Alerts": { en: "Mobile SMS Alerts", so: "Ogeysiiska SMS-ka Mobile-ka" },
  "Get a text message exactly 1 hour before your session begins with the Zoom URL.": {
    en: "Get a text message exactly 1 hour before your session begins with the Zoom URL.",
    so: "Hel fariin qoraal ah (SMS) 1 saac ka hor kulankaaga oo wadata linkiga Zoom.",
  },
  "WhatsApp Direct Reminders": { en: "WhatsApp Direct Reminders", so: "Xusuusinta Tooska ah ee WhatsApp" },
  "Receive clinical resources and direct reminders through our automated WhatsApp assistant.": {
    en: "Receive clinical resources and direct reminders through our automated WhatsApp assistant.",
    so: "Hel agab cilmiyeed iyo xusuusin toos ah oo ka timaada kaaliyaha WhatsApp.",
  },
  "Verification Contact Info": { en: "Verification Contact Info", so: "Xaqiijinta Xogta Xidhiidhka" },
  "SMS Alerts sent to:": { en: "SMS Alerts sent to:", so: "SMS-ka waxaa loo diraa:" },
  "Gmail invites sent to:": { en: "Gmail invites sent to:", so: "Casuumaadda Gmail waxaa loo diraa:" },
  "Save Preferences": { en: "Save Preferences", so: "Kaydi Doorbidka" },
  "✓ Preferences Saved": { en: "✓ Preferences Saved", so: "✓ Waa la kaydiyay Doorbidka" },

  // Sessions / Bookings Screen
  "Clinical Sessions": { en: "Clinical Sessions", so: "Kulamada Caafimaadka" },
  "Join Session": { en: "Join Session", so: "Ku biir Kulanka" },
  "Upcoming appointment": { en: "Upcoming appointment", so: "Ballanta xigta ee kuu dhow" },
  "Rescheduled by Therapist": { en: "Rescheduled by Therapist", so: "Dhakhtarka ayaa dib u dhigay" },
  "Reschedule Reason": { en: "Reschedule Reason", so: "Sababta dib loogu dhigay" },
  "Financial Aid": { en: "Financial Aid", so: "Taageero Dhaqaale" },
  "Financial Aid Approved": { en: "Financial Aid Approved", so: "Taageero Dhaqaale oo la Ansixiyey" },
  "40% Financial Aid Approved": { en: "40% Financial Aid Approved", so: "40% Taageero Dhaqaale oo la Ansixiyey" },
  "APPROVED": { en: "APPROVED", so: "LA ANSIXIYEY" },
  "Category": { en: "Category", so: "Qaybta" },
  "Expires in": { en: "Expires in", so: "Wuxuu dhacayaa" },
  "Applied": { en: "Applied", so: "Waa la codsaday" },
  "Approved": { en: "Approved", so: "Waa la ansixiyey" },
  "Pending": { en: "Pending", so: "Weli way sugaysaa" },
  "Original Price": { en: "Original Price", so: "Qiimihii Hore" },
  "Rate and review your session": { en: "Rate and review your session", so: "Qiimee kulankaaga oo faallo ka bixi" },
  "How was your session with": { en: "How was your session with", so: "Sidee ahaa kulankaagii aad la qaadatay" },
  "Review optional": { en: "Review optional", so: "Faallo (waa dookh)" },
  "Share a brief feedback...": { en: "Share a brief feedback...", so: "Halkan ku qor faallo kooban..." },
  "Submit Review": { en: "Submit Review", so: "Garaab Qiimaynta" },
  "Review submitted. Thank you!": { en: "Review submitted. Thank you!", so: "Qiimayntaadii waa la gudbiyey. Waad mahadsan tahay!" },

  // Mental Health and Therapy Info
  "Why Therapy Matters": { en: "Why Therapy Matters", so: "Maxay Muhiim u Tahay Latashiga?" },
  "Mental health is the foundation of our daily life, relationships, and decisions. Just as we care for our physical health, seeking guidance from a certified therapist helps us navigate stress, unpack emotional blockages, and build resilient mental habits in a confidential, supportive space.": {
    en: "Mental health is the foundation of our daily life, relationships, and decisions. Just as we care for our physical health, seeking guidance from a certified therapist helps us navigate stress, unpack emotional blockages, and build resilient mental habits in a confidential, supportive space.",
    so: "Caafimaadka maskaxdu waa aasaaska nolosheena, xidhiidhada, iyo go'aamadeena maalinbana. Sida aynu ugu daryeelno caafimaadkeena jidhka, raadinta hagitaan dhakhtar aqoon leh waxay inaga caawisaa inaan dhex-marno walaaca, fahamno dhibaatooyinka dareenka, iyo inaan dhisno caadooyin maskaxeed oo adag."
  },
  "Proven Professional Support": { en: "Proven Professional Support", so: "Taageero Xirfad Leh Oo La Hubiyay" },
  "Recovery Rate in First Sessions": { en: "Recovery Rate in First Sessions", so: "Bogsashada Kulamada Hore" },
  "Of Trusted Experience": { en: "Of Trusted Experience", so: "Khibrad Lagu Kalsoon Yahay" },
  "How Barbaar Works": { en: "How Barbaar Works", so: "Sida uu Barbaar u Shaqeeyo" },
  "Our platform is designed to be simple, fast, and secure. Connect with dedicated clinical specialists in 3 easy steps:": {
    en: "Our platform is designed to be simple, fast, and secure. Connect with dedicated clinical specialists in 3 easy steps:",
    so: "Madalkeena waxaa loo qaabeeyey si fudud, dhakhso leh, iyo ammaan ah. Kula xidhiidh dhakhaatiirta 3 talaabo oo fudud:"
  },
  "1. Match Instantly": { en: "1. Match Instantly", so: "1. Isku-Xidh Kooban" },
  "Take our 1-minute cultural match quiz to find the right specialist.": {
    en: "Take our 1-minute cultural match quiz to find the right specialist.",
    so: "Qaado kediska 1-daqiiqo ee ku habboonaanta dhaqanka."
  },
  "2. Secure Booking": { en: "2. Secure Booking", so: "2. Ballan Ammaan Ah" },
  "Choose a convenient time slot and book a confidential session.": {
    en: "Choose a convenient time slot and book a confidential session.",
    so: "Dooro waqti kugu habboon oo ballanso kulan qarsoodi ah."
  },
  "3. Start Healing": { en: "3. Start Healing", so: "3. Bilow Bogsiinta" },
  "Engage in secure video sessions and start feeling better.": {
    en: "Engage in secure video sessions and start feeling better.",
    so: "Ku biir kulan muuqaal ah oo sugan si aad u hesho daryeel buuxa."
  },
  "Safe, Fast, and Confidential Care at Your Fingertips.": {
    en: "Safe, Fast, and Confidential Care at Your Fingertips.",
    so: "Daryeel Ammaan ah, Degdeg ah, oo Qarsoodi ah farahaaga saaran."
  },
  "Why we need a therapist": { en: "Why we need a therapist", so: "Waa maxay sababta aan ugu baahanahay dhakhtar?" },
  "Navigate Stress": { en: "Navigate Stress", so: "Maaree Cadaadiska" },
  "Decompress and unpack heavy thoughts safely.": { en: "Decompress and unpack heavy thoughts safely.", so: "Kula wadaag fikradahaaga meel ammaan ah oo qarsoodi ah." },
  "Build Habits": { en: "Build Habits", so: "Dhis Caadooyin Cusub" },
  "Develop practical, resilient daily rituals.": { en: "Develop practical, resilient daily rituals.", so: "Baro xeelado wax ku ool ah oo noloshaada dhabta ah ku caawiya." },
  "Safe Space": { en: "Safe Space", so: "Meel Ammaan Ah" },
  "100% confidential and culturally aligned support.": { en: "100% confidential and culturally aligned support.", so: "Qarsoodi boqolkiiba boqol ah oo ku salaysan dhaqankaaga." },
  "85% Recovery Rate": { en: "85% Recovery Rate", so: "85% Boqolkiiba Bogsiinta" },
  "4 Years Experience": { en: "4 Years Experience", so: "4 Sano oo Khibrad ah" },

  // Booking Flow
  "Secure Booking with": { en: "Secure Booking with", so: "Kulan la ballanso" },
  "Your details": { en: "Your details", so: "Xogtaada" },
  "Submit Booking": { en: "Submit Booking", so: "Xaqiiji oo Ballanso" },
  "Select a date": { en: "Select a date", so: "Dooro maalin" },
  "Select a time": { en: "Select a time", so: "Dooro saacad" },
  "Your Name": { en: "Your Name", so: "Magacaaga" },
  "Phone Number": { en: "Phone Number", so: "Lambarka Telefoonka" },
  "Email Address": { en: "Email Address", so: "Iimaylkaaga" },
  "Apply for Financial Aid (Up to 80% Off)": {
    en: "Apply for Financial Aid (Up to 80% Off)",
    so: "Codso Taageero Dhaqaale (Ilaa 80% Dhimis ah)",
  },
  "Barbaar is committed to mental health equity. If you are a student, lower-income, or experiencing financial hardship, please request aid.": {
    en: "Barbaar is committed to mental health equity. If you are a student, lower-income, or experiencing financial hardship, please request aid.",
    so: "Barbaar waxay u taagan tahay sinnaanta adeegga daryeelka maskaxda. Haddii aad tahay arday, dakhligaagu hooseeyo, ama aad qabto culeys dhaqaale, fadlan codso caawimo.",
  },
  "Select your situation": { en: "Select your situation", so: "Dooro xaaladdaada" },
  "Student in diaspora or local": { en: "Student in diaspora or local", so: "Arday degan qurbaha ama dalka gudihiisa" },
  "Unemployed or lower-income earner": { en: "Unemployed or lower-income earner", so: "Shaqo la'aan ama dakhli hoose" },
  "Experiencing displacement or severe hardship": { en: "Experiencing displacement or severe hardship", so: "Dadka soo barokacay ama culeys weyn qaba" },
  "Briefly explain your need (optional)": { en: "Briefly explain your need (optional)", so: "Fadlan si kooban u sharax baahidaada (waa dookh)" },
  "Secure Video Session (50 mins)": { en: "Secure Video Session (50 mins)", so: "Kulan Muuqaal ah oo Ammaan ah (50 daqiiqo)" },
  "Zoom call invitation will be sent immediately upon confirmation.": {
    en: "Zoom call invitation will be sent immediately upon confirmation.",
    so: "Casuumaadda kulanka Zoom waxaa laguugu soo diri doonaa isla markiiba markaad xaqiijiso.",
  },

  // Confirmation Screen
  "Booking Confirmed!": { en: "Booking Confirmed!", so: "Ballantii waa la Xaqiijiyay!" },
  "Your session is securely booked.": { en: "Your session is securely booked.", so: "Kulankaagii caafimaadka si ammaan ah ayaa loo ballansaday." },
  "Calendar event and Zoom invitation has been sent to": {
    en: "Calendar event and Zoom invitation has been sent to",
    so: "Faahfaahinta jadwalka iyo casuumaadda kulanka Zoom waxaa loo diray iimaylkaaga:",
  },
  "SMS text confirmation sent to": { en: "SMS text confirmation sent to", so: "SMS xaqiijin ah waxaa loo diray lambarkaaga:" },
  "A clinical specialist will connect with you on the scheduled time.": {
    en: "A clinical specialist will connect with you on the scheduled time.",
    so: "Dhakhtar ku takhasusay caafimaadka ayaa kula soo xidhiidhi doona waqtiga loo qorsheeyay kulankaaga.",
  },
  "Go to Sessions": { en: "Go to Sessions", so: "Tag Ballamahaaga" },

  // Chat Screen
  "Secure Clinical Room": { en: "Secure Clinical Room", so: "Qolka Caafimaadka ee Ammaanka ah" },
  "Conversations are strictly private between you and your specialist.": {
    en: "Conversations are strictly private between you and your specialist.",
    so: "Sheekada iyo xogtaada oo dhan waxay u dhaxeeyaan adiga iyo dhakhtarkaaga oo keliya.",
  },
  "Enter your message...": { en: "Enter your message...", so: "Halkan ku qor fariintaada..." },
  "Send": { en: "Send", so: "Dir" },
  "Today": { en: "Today", so: "Maanta" },

  // Match / Quiz results
  "Your customized recommendation": { en: "Your customized recommendation", so: "Talobixinta laguu habeeyey ee ku habboon" },
  "Matches based on your quiz answers:": { en: "Matches based on your quiz answers:", so: "Dhakhaatiirta ku habboon natiijada su'aalahaaga:" },
  "No direct matches found. Try browsing our full directory.": {
    en: "No direct matches found. Try browsing our full directory.",
    so: "Lama helin dhakhaatiir si toos ah u waafaqsan su'aalahaaga. Fadlan baadh dhamaan dhakhaatiirta diyaar ah.",
  },
  "Browse Directory": { en: "Browse Directory", so: "Baadh Dhamaan Dhakhaatiirta" },
  "Start Over": { en: "Start Over", so: "Dib u bilow su'aalaha" },
};

export function translateText(key: string, lang: Language): string {
  if (UI_TRANSLATIONS[key] && UI_TRANSLATIONS[key][lang]) {
    return UI_TRANSLATIONS[key][lang];
  }
  return key;
}

// Translate Therapist data dynamically based on active language
export function translateTherapist(t: Therapist, lang: Language): Therapist {
  if (lang === "en") return t;

  const specialtiesMap: Record<string, string> = {
    "Anxiety": "Welwelka",
    "Depression": "Niyad-jabka",
    "OCD": "Waswaaska",
    "CBT": "CBT",
    "Stress": "Diiqadda",
    "Communication": "Xidhiidhka Lamaanaha",
    "Trust": "Aaminaadda",
    "Pre-marital": "Guur-ka-hor",
    "Conflict": "Khilaafaadka",
    "Connection": "Isku-xidhka",
    "Conflict Repair": "Xallinta Khilaafka",
    "Life Transitions": "Marxaladaha Nolosha",
    "Identity": "Aqoonsiga & Aqalka",
    "Deep Change": "Isbeddel Qoto-dheer",
    "Goal-focused": "Hadaf-ku-salaysan",
    "High-performers": "Gool-gaadhayaasha Sare",
    "Purpose": "Hadafka Nolosha"
  };

  const credentialsMap: Record<string, string> = {
    "PhD, Clinical Psychologist": "PhD, Dhakhtar Cilmi-Nafsi",
    "LMFT, Licensed Therapist": "LMFT, Dhakhtar Shati Haysta",
    "PsyD, Couples Therapist": "PsyD, Dhakhtarka Lamaanaha",
    "LCSW, Relationship Therapist": "LCSW, Dhakhtarka Xidhiidhka",
    "PhD, Transformation Coach & Psychologist": "PhD, Tababaraha Isbeddelka & Dhakhtar",
    "PsyD, Clinical Psychologist": "PsyD, Dhakhtar Cilmi-Nafsi",
  };

  const bios: Record<string, { short: string; long: string }> = {
    "t1": {
      short: "Waxay ka caawisaa macaamiisha inay dejiyaan welwelka iyo fikradaha dhibka leh iyadoo adeegsanaysa habka cilmiyeysan ee CBT, goob ixtiraamaysa dhaqanka iyo diinta Soomaaliyeed.",
      long: "Dr. Amina Xasan waxay ku dhowaad sagaal sano ku bixisay caawinta macaamiisha Soomaaliyeed ee qurbaha iyo dalka gudihiisaba si ay uga gudbaan welwelka, niyad-jabka, iyo waswaaska iyadoo adeegsanaysa daawaynta dabeecadda ee garashada (CBT). Waxay ku soo tababaratay Nayroobi iyo London, waxayna ku habaysaa CBT nolosha, dhaqanka, iyo aaminsanaanta macmiil kasta halkii ay macmiilka ku qasbi lahayd habka.",
    },
    "t2": {
      short: "Wuxuu la shaqeeyaa ragga Soomaaliyeed ee xambaarsan welwelka iyo culeyska si ay u dajiyaan maskaxda — isagoo u bandhigaya tabo waxtar leh oo aan lagu xukumayn.",
      long: "Cabdiraxmaan wuxuu xoogga saaraa welwelka, niyad-hooseynta, iyo diiqadda, gaar ahaan ragga aan waligood la barin inay sax tahay in gargaar caafimaad ama mid nafsi ah la weydiisto. Kulamadiisu waa kuwo toos ah, wax ku ool ah, oo ku salaysan farsamooyinka CBT oo aad isla maalintaas isticmaali karto si aad isbeddel u dareento.",
    },
    "t3": {
      short: "Wuxuu ku hagaa lamaanayaasha fogaanta, kalsoonida, iyo xidhiidhka — isagoo sal dhigaya ixtiraamka qiyamka iyo daryeelka qoyska Soomaaliyeed.",
      long: "Dr. Yusuf Warsame wuxuu la shaqeeyay in ka badan 300 oo lamaane oo ku saabsan xidhiidhka, kalsoonida, iyo khilaafaadka qoyska. Wuxuu aad u fahamsan yahay culeyska qoyska iyo bulshada, wuxuuna ka caawiyaa lamaanayaasha inay dib u dhistaan xidhiidhkooda iyagoon lumin qiyamka iyo diinta.",
    },
    "t4": {
      short: "Waxay ka caawisaa lamaanayaasha inay dib u dhistaan xidhiidhka ka dib khilaaf, fogaan, ama marxalado cusub sida guurka ama guuritaanka qurbaha.",
      long: "Sagal waxay ku takhasustay ka caawinta lammaanaha inay maraan marxaladaha nolosha — guurka cusub, guuritaanka dalka kale, qoysaska isku darsan — iyadoo adeegsanaysa hab degan oo nidaamsan oo u oggolaanaya labada dhinacba inay dareemaan in la maqlo lana ixtiraamo.",
    },
    "t5": {
      short: "Waxay hoggaamisaa barnaamij 6-toddobaad ah oo xooggan oo loogu talagalay dadka u diyaar ah isbeddel dhab ah ee aan rabin uun la-tacaalid.",
      long: "Barnaamijka isbeddelka ee 6-da toddobaad ee Dr. Ifrax Abdi waxaa loo dhisay dadka dareemaya inay ku xayiran yihiin hab-dhaqanno isku mid ah inkastoo ay muddo dheer 'la tacaalayeen'. Kulamadu waa kuwo dheer, shaqada guriga waa mid dhab ah, hadafkuna waa isbeddel la qiyaasi karo oo nolosha ah.",
    },
    "t6": {
      short: "Barnaamij xooggan oo 6-toddobaad ah oo loogu talagalay dadka u diyaar ah isbeddel dhab ah — shaqada, aqoonsiga, iyo xidhiidhada.",
      long: "Maxamed wuxuu u dhisay barnaamijkan 6-toddobaad ah dadka guulaha sare gaadhay ee dibadda ka muuqda kuwo fiican laakiin gudaha ka dareemaya xayiraad ama jahawareer. Ka filo talo bixin toos ah, guulo nidaamsan, iyo barnaamij ku dhammaanaya qorshe dhab ah oo nolosha isbeddel weyn ku sameeya.",
    }
  };

  const bio = bios[t.id];

  return {
    ...t,
    credentials: credentialsMap[t.credentials] || t.credentials,
    shortBio: bio ? bio.short : t.shortBio,
    longBio: bio ? bio.long : t.longBio,
    specialties: t.specialties.map(s => specialtiesMap[s] || s),
    languages: t.languages.map(l => l === "Somali" ? "Soomaali" : l === "English" ? "Ingiriisi" : l === "Arabic" ? "Carabi" : l)
  };
}

export function translateQuiz(questions: QuizQuestion[], lang: Language): QuizQuestion[] {
  if (lang === "en") return questions;

  const quizTranslations: Record<string, { prompt: string; options: string[] }> = {
    "q1": {
      prompt: "Maxaa maanta ku keenay Barbaar Wellness?",
      options: [
        "Welwel ama fikrado culis oo aan iska weynayo",
        "Tension ama kala-fogaansho lamaanahayga ah",
        "Waxaan u diyaarsanahay isbeddel dhab ah oo weyn",
        "Weli waxaan ku jiraa barasho iyo ogaansho",
      ]
    },
    "q2": {
      prompt: "Sidee dareemaysey toddobaadyadii u dambeeyey?",
      options: [
        "Maalmaha qaar waxaa igu adag inaan sariirta ka kaco",
        "Wadahadallo adag oo guriga dhexdiisa ah",
        "Waa caadi — laakiin waxaan ku xayiranahay caadooyin isku mid ah",
        "Runtii, mar sare iyo mar hoos",
      ]
    },
    "q3": {
      prompt: "Noocee taageero ah ayaa kuula muuqata mid sax ah?",
      options: [
        "Tabo wax ku ool ah oo loogu talagalay welwelka, niyad-jabka, ama waswaaska",
        "Goob loogu talagalay in lagu hagi karo aniga iyo lamaanahayga",
        "Barnaamij xooggan, oo aan ahayn saacad keliya toddobaadkii",
        "Maba hubo — igu xidh qof aad u fiican",
      ]
    },
    "q4": {
      prompt: "Ma leedahay doorbid gaar ah oo ku saabsan dhakhtarkaaga?",
      options: [
        "Waxaan doorbidi lahaa dhakhtar dumar ah",
        "Waxaan doorbidi lahaa dhakhtar lab ah",
        "Ma hayo doorbid gaar ah",
      ]
    }
  };

  return questions.map(q => {
    const trans = quizTranslations[q.id];
    if (!trans) return q;

    return {
      ...q,
      prompt: trans.prompt,
      options: q.options.map((opt, idx) => ({
        ...opt,
        label: trans.options[idx] || opt.label
      }))
    };
  });
}

export function translateCategory(catKey: string, lang: Language): { name: string; short: string } {
  const categoriesTranslations: Record<string, Record<Language, { name: string; short: string }>> = {
    cbt: {
      en: { name: "CBT Therapy", short: "Depression, anxiety & OCD" },
      so: { name: "Daaweynta CBT", short: "Niyad-jabka, welwelka & waswaaska" }
    },
    couples: {
      en: { name: "Couples & Relationship", short: "Rebuild connection, together" },
      so: { name: "Lamaanaha & Xidhiidhka", short: "Wada dhisidda xidhiidhka, si wadajir ah" }
    },
    premium: {
      en: { name: "Premium Transformation", short: "A focused program for real change" },
      so: { name: "Isbeddelka Sare", short: "Barnaamij diiradda saaraya isbeddel dhab ah" }
    }
  };

  return categoriesTranslations[catKey]?.[lang] || { name: catKey, short: "" };
}

export function translateContent(content: AppContent, lang: Language): AppContent {
  if (lang === "en") return content;

  return {
    aboutUs: "Barbaar Wellness waxay isku xidhaa bulshada Soomaaliyeed — ee ku nool dalka iyo qurbahaba — iyo dhakhaatiir nafsi ah oo shati haysta oo yaqaanna afkeenna, dhaqankeenna, iyo diinteena.\n\nEreyga \"Barbaar\" macnihiisu waa korinta iyo daryeelidda qofka si uu u kasto. Taasina waa waxa aan rabno in la-talinta nafsiga ah ay u ekaato: taageero joogto ah, kalsooni leh, oo aan degdeg lahayn marka aad korayso.\n\nDhakhtar kasta oo ku jira Barbaar waa mid shati haysta oo si adag loo hubiyay cilmigiisa iyo hab-dhaqankiisa. Kulamadu waxay ku dhacaan muuqaal ammaan ah, meel kasta oo aad joogto, iyadoo lagu hadlayo Soomaali, Ingiriisi, ama Carabi.",
    terms: "Markaad kulan ka ballansato Barbaar Wellness, waxaad ku heshiisay inaad ka soo qayb gasho waqtiga laguu qorsheeyay, inaadna bixiso ogeysiis ugu yaraan 24 saacadood ka hor haddii aad rabto inaad dib u dhigto ama joojiso. Baajinta waqtiga dambe waxaa laga yaabaa in lagugu dallaco qiimaha buuxa.\n\nBarbaar Wellness waxay kaliya isku xidhaa macaamiisha iyo dhakhaatiir madax-banaan oo shati haysta. Dhakhaatiirta ayaa mas'uul ka ah daryeelka caafimaad ee ay bixiyaan. Lacagaha waxaa loo farsameeyaa si ammaan ah waqtiga ballansashada.\n\nCodsigan waa prototype shaqeynaya. Shuruudaha buuxa waa inuu dib u eego qareen shati haysta ka hor intaan si rasmi ah loo bilaabin.",
    privacy: "Waxaan aruurinaa oo kaliya waxyaabaha loo baahan yahay si lagugu xidho dhakhtar laguna maamulo ballamahaaga: magacaaga, faahfaahinta xidhiidhka, iyo taariikhda ballamahaaga.\n\nXogtaada waligeed lama iibinayo. Wadahadalka adiga iyo dhakhtarkaaga u dhexeeya waa mid sir ah oo idin gaar ah. Waxaad codsan kartaa in xogtaada la tirtiro waqti kasta adoo adeegsanaya qaybta Settings-ka.\n\nCodsigan waa prototype shaqeynaya. Siyaasadda xog-dhawrka ee buuxda waa inuu dib u eego qareen ka hor intaan si rasmi ah loo bilaabin, gaar ahaan maaraynta xogta caafimaadka."
  };
}
