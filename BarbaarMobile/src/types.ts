export interface Therapist {
  id: string;
  name: string;
  credentials: string;
  category: 'cbt' | 'couples' | 'premium' | string;
  gender: 'female' | 'male';
  languages: string[];
  experience: number;
  rating: number;
  reviews: number;
  price: number;
  priceUnit: 'session' | 'program' | string;
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
  price?: number;
  priceUnit?: string;
  status: 'upcoming' | 'completed' | 'cancelled' | string;
  zoomLink?: string | null;
  createdAt?: string;
  financialAidApplied?: boolean;
  financialAidCategory?: string;
  financialAidReason?: string;
  financialAidStatus?: 'pending' | 'approved' | 'rejected';
  originalPrice?: number;
  rating?: number;
  review?: string;
  therapistName?: string;
  notes?: string;
}

export interface Message {
  id: string;
  therapistId?: string;
  clientEmail?: string;
  from: 'client' | 'therapist';
  text: string;
  time: string;
  isZoom?: boolean;
  isSessionRoom?: boolean;
  bookingId?: string;
}

export interface ClientProfile {
  name: string;
  phone: string;
  email: string;
  language?: 'en' | 'so';
  financialAidStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  financialAidCategory?: string;
  financialAidReason?: string;
  financialAidApprovedAt?: string | null;
  financialAidSubmittedAt?: string | null;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: 'client' | 'therapist' | 'admin';
  languagePreference: 'somali' | 'english' | 'both';
  genderPreference?: string;
  religionMatchRequired?: boolean;
}

export interface BookingSession {
  id: string;
  clientName: string;
  therapistName: string;
  therapistId: string;
  date: string;
  time: string;
  status: 'confirmed' | 'active' | 'completed' | 'cancelled';
  sessionType: 'video' | 'audio' | 'chat';
  roomUrl?: string;
}

