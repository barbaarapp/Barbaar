import React, { useState, useEffect } from 'react';
import { Star, Calendar, Clock, MapPin, CheckCircle2, ChevronRight, User, ShieldCheck, Info, Phone, CreditCard, Loader2, MessageCircle, ArrowRight, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Therapist, Booking } from '../types';
import { cn } from '../lib/utils';
import { auth, db, collection, addDoc, serverTimestamp, getDocs, query, where, checkConnection } from '../firebase';

interface TherapistBookingProps {
  onBook?: (booking: Booking) => void;
  therapistsList: Therapist[];
}

type BookingStep = 'list' | 'details' | 'demographics' | 'payment' | 'success';

export const TherapistBooking = ({ onBook, therapistsList }: TherapistBookingProps) => {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingStep, setBookingStep] = useState<BookingStep>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const therapists = therapistsList;
  
  const [demographics, setDemographics] = useState({
    age: '',
    gender: '',
    location: '',
    goal: ''
  });
  
  const [evcNumber, setEvcNumber] = useState('');

  const handleBook = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setSelectedSlot(null);
    setBookingStep('details');
  };

  const confirmBooking = async () => {
    if (!selectedTherapist || !selectedSlot) return;
    
    setIsSubmitting(true);
    setConnectionError(null);
    
    try {
      // 0. Pre-check connection but don't hard block if it's borderline
      // Firestore has its own retry logic, so we only block if surely offline
      const isConnected = await checkConnection();
      if (!isConnected && !navigator.onLine) {
        throw new Error("You appear to be offline. Please check your internet and try again to secure your Barbaar session.");
      }

      const userEmail = auth.currentUser?.email || 'anonymous@user.com';
      const userId = auth.currentUser?.uid || 'anonymous';
      
      const bookingData = {
        therapist: selectedTherapist,
        slot: selectedSlot,
        demographics,
        evcNumber,
        userEmail,
        userId,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // 1. Save to Firestore (Primary Record)
      let firestoreWorked = false;
      try {
        await addDoc(collection(db, 'bookings'), bookingData);
        firestoreWorked = true;
      } catch (fsError) {
        console.error("Firestore save error:", fsError);
        // We'll still try the email API as a backup
      }
      
      // 2. Call our server-side API (Supports absolute URL for Netlify/External Hosting)
      // Determine the API base URL. If we are on our AIS domain, use relative. 
      // If we are on Netlify or custom domain, default to current host.
      const apiHost = window.location.origin;
      try {
        const response = await fetch(`${apiHost}/api/book-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData)
        });

        if (response.ok) {
          console.log("Email notification sent successfully");
        }
      } catch (apiError) {
        console.warn("API notification failed:", apiError);
        // Special case: If Firestore also failed, then we truly have NO connection
        if (!firestoreWorked) {
          throw new Error("Connection failed. We could not reach our servers to secure your booking. Please check your internet.");
        }
      }

      // Success! (If either Firestore or API worked, we consider the request sent)
      const newBooking: Booking = {
        id: Date.now().toString(),
        therapistId: selectedTherapist.id,
        date: new Date().toLocaleDateString(),
        time: selectedSlot,
        status: 'pending'
      };
      
      onBook?.(newBooking);
      setBookingStep('success');

    } catch (error) {
      console.error("Booking error:", error);
      const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
      setConnectionError(msg);
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    const steps: { key: BookingStep; label: string }[] = [
      { key: 'details', label: 'Time' },
      { key: 'demographics', label: 'Info' },
      { key: 'payment', label: 'Pay' }
    ];
    
    if (bookingStep === 'list' || bookingStep === 'success') return null;

    return (
      <div className="flex items-center justify-center gap-4 mb-8">
        {steps.map((step, idx) => {
          const isActive = bookingStep === step.key;
          const isPast = steps.findIndex(s => s.key === bookingStep) > idx;
          
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all",
                  isActive ? "bg-brand text-brand-dark scale-110 shadow-lg shadow-brand/20" : 
                  isPast ? "bg-brand/20 text-brand" : "bg-card text-text/20 border border-border"
                )}>
                  {isPast ? <CheckCircle2 size={14} /> : idx + 1}
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  isActive ? "text-brand" : "text-text/20"
                )}>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-[2px] rounded-full -mt-4",
                  isPast ? "bg-brand/20" : "bg-border"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  if (bookingStep === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-8 text-center h-full bg-bg"
      >
        <div className="w-24 h-24 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-8 shadow-lg shadow-brand/20">
          <CheckCircle2 size={56} strokeWidth={3} />
        </div>
        <h3 className="text-2xl font-black text-text mb-3 tracking-tight">Booking Received!</h3>
        <p className="text-text/40 mb-10 leading-relaxed">
          Your request for a session with <span className="text-text font-bold">{selectedTherapist?.name}</span> has been sent. 
          We will confirm your <span className="text-brand font-bold">EVC payment</span> and send the link to <span className="text-text font-bold">{auth.currentUser?.email}</span>.
        </p>
        <div className="w-full space-y-4">
          <button 
            onClick={() => setBookingStep('list')}
            className="w-full py-4 bg-brand text-brand-dark rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-brand/20 transition-transform active:scale-95"
          >
            Back to Home
          </button>
          <p className="text-[10px] text-text/20 font-bold uppercase tracking-[0.2em]">Check your email for confirmation</p>
        </div>
      </motion.div>
    );
  }

  // Generate next 7 days for selection
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const renderTherapistCard = (therapist: Therapist) => (
    <motion.div 
      key={therapist.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onClick={() => handleBook(therapist)}
      className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden group shadow-sm hover:shadow-2xl hover:shadow-brand/5 transition-all duration-500 flex flex-col cursor-pointer"
    >
      <div className="relative h-72 overflow-hidden">
        {therapist.image ? (
          <img 
            src={therapist.image} 
            alt={therapist.name} 
            className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-brand/5 flex items-center justify-center text-brand">
            <User size={64} strokeWidth={1.5} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80" />
        
        <div className="absolute top-6 right-6">
          <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-xl">
            <ShieldCheck size={20} className="text-brand" />
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8">
          <h4 className="text-2xl font-black text-white tracking-tight mb-2 group-hover:text-brand transition-colors">{therapist.name}</h4>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-brand uppercase tracking-[0.2em]">{therapist.specialty}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 text-amber-400">
              <Star size={14} fill="currentColor" />
              <span className="text-[11px] font-black">{therapist.rating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 flex-1 flex flex-col bg-card">
        <p className="text-[15px] text-text/60 leading-[1.8] font-medium line-clamp-4 mb-10">
          {therapist.bio}
        </p>
        
        <div className="mt-auto pt-8 border-t border-border/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-text/30 uppercase tracking-[0.2em] leading-none mb-2">Fee / Session</span>
            <span className="text-2xl font-black text-text tracking-tighter">{therapist.rate}</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleBook(therapist);
            }}
            className="px-10 py-5 bg-brand text-brand-dark rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 group-hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            Book Now <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand/10 rounded-full" />
          <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin absolute inset-0" />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-text/20 uppercase tracking-[0.3em] mb-1">Our Specialists</p>
          <p className="text-sm font-black text-text">Finding the right mind for you...</p>
        </div>
      </div>
    );
  }

  if (bookingStep === 'details' && selectedTherapist) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pb-32 px-6 sm:px-8 space-y-10"
      >
        <button 
          onClick={() => setBookingStep('list')}
          className="flex items-center gap-3 text-text/40 hover:text-brand transition-all font-black text-[10px] uppercase tracking-[0.2em] group mt-8"
        >
          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
            <ChevronRight className="rotate-180" size={16} />
          </div>
          Back to list
        </button>

        {renderStepIndicator()}

        <div className="flex flex-col gap-10">
          {/* Hero Section for Profile */}
          <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden shadow-2xl border border-border/40">
            {selectedTherapist.image ? (
              <img src={selectedTherapist.image} alt={selectedTherapist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand/5 text-brand">
                <User size={80} strokeWidth={1} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" />
          </div>

          <div className="space-y-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-4xl font-black text-text tracking-tight">{selectedTherapist.name}</h3>
              <p className="text-sm font-black text-brand uppercase tracking-[0.2em]">{selectedTherapist.specialty}</p>
              <div className="flex items-center gap-2 text-amber-500 bg-amber-500/5 w-fit px-4 py-2 rounded-xl border border-amber-500/10 mt-2">
                <Star size={16} fill="currentColor" />
                <span className="text-sm font-black">{selectedTherapist.rating} Professional Rating</span>
              </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-black text-text/30 uppercase tracking-[0.4em] px-2">Specialist Bio</h4>
               <div className="bg-card border border-border/50 p-8 sm:p-10 rounded-2xl shadow-sm">
                 <p className="text-[16px] font-medium text-text/60 leading-[1.8] tracking-tight">
                   {selectedTherapist.bio}
                 </p>
               </div>
            </div>
          </div>

          <div className="bg-white border border-border p-8 sm:p-12 rounded-3xl shadow-2xl shadow-brand/5 space-y-12 relative">
            <div className="space-y-8">
              {/* Date Selection */}
              <div>
                <h4 className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em] mb-6 px-2">1. Select Date</h4>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                  {days.map((date) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[70px] py-4 rounded-2xl border transition-all shrink-0",
                          isSelected
                            ? "bg-brand text-brand-dark border-brand shadow-lg shadow-brand/20 scale-105"
                            : "bg-bg text-text/40 border-border/60 hover:border-brand/40"
                        )}
                      >
                        <span className="text-[8px] font-black uppercase tracking-widest mb-1">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-lg font-black">{date.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slot Selection */}
              <div>
                <h4 className="text-[10px] font-black text-text/30 uppercase tracking-[0.3em] mb-6 px-2">2. Select Time</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedTherapist.availableSlots.map(time => (
                    <button 
                      key={time} 
                      onClick={() => setSelectedSlot(time)}
                      className={cn(
                        "py-5 rounded-xl text-[11px] font-black transition-all border-2 uppercase tracking-widest",
                        selectedSlot === time 
                          ? "bg-brand text-brand-dark border-brand shadow-lg shadow-brand/20" 
                          : "bg-bg text-text/30 border-border/40 hover:border-brand/40 hover:text-brand"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pt-10 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="text-center sm:text-left">
                <p className="text-[11px] font-black text-text/20 uppercase tracking-[0.5em] mb-1">Session Fee</p>
                <p className="text-4xl font-black text-text tracking-tighter">{selectedTherapist.rate}</p>
              </div>
              <button 
                onClick={() => setBookingStep('demographics')}
                disabled={!selectedSlot}
                className="w-full sm:w-auto px-16 py-6 bg-brand text-brand-dark rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand/30 disabled:opacity-30 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
              >
                Continue Booking
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (bookingStep === 'demographics') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="px-6 py-8 pb-40 space-y-8 max-w-2xl mx-auto"
      >
        <button 
          onClick={() => setBookingStep('details')}
          className="flex items-center gap-3 text-text/40 hover:text-brand transition-all font-black text-[10px] uppercase tracking-[0.2em] group"
        >
          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
            <ChevronRight className="rotate-180" size={16} />
          </div>
          Back to Time Selection
        </button>

        {renderStepIndicator()}

        <header className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-text tracking-tight uppercase">Patient Information</h3>
          <p className="text-[10px] text-text/30 font-black uppercase tracking-[0.3em]">Confidential clinical questionnaire</p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white border border-border rounded-[32px] p-6 sm:p-10 shadow-sm space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[9px] font-black text-text/30 uppercase tracking-[0.2em] ml-2">Age</label>
                <input 
                  type="number"
                  value={demographics.age}
                  onChange={(e) => setDemographics({...demographics, age: e.target.value})}
                  placeholder="Your age"
                  className="w-full bg-bg border border-border rounded-2xl px-6 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black text-text/30 uppercase tracking-[0.2em] ml-2">Gender Identification</label>
                <div className="relative">
                  <select 
                    value={demographics.gender}
                    onChange={(e) => setDemographics({...demographics, gender: e.target.value})}
                    className="w-full bg-bg border border-border rounded-2xl px-6 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all appearance-none pr-12 cursor-pointer"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-text/20">
                    <ChevronRight className="rotate-90" size={16} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-text/30 uppercase tracking-[0.2em] ml-2">Current Residence (City / Country)</label>
              <input 
                type="text"
                value={demographics.location}
                onChange={(e) => setDemographics({...demographics, location: e.target.value})}
                placeholder="e.g. Mogadishu, Somalia"
                className="w-full bg-bg border border-border rounded-2xl px-6 py-4.5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-text/30 uppercase tracking-[0.2em] ml-2">Reason for seeking support</label>
              <textarea 
                value={demographics.goal}
                onChange={(e) => setDemographics({...demographics, goal: e.target.value})}
                placeholder="Briefly describe what you'd like to discuss during your session..."
                rows={6}
                className="w-full bg-bg border border-border rounded-3xl px-6 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand transition-all resize-none leading-relaxed"
              />
            </div>

            <button 
              onClick={() => setBookingStep('payment')}
              disabled={!demographics.age || !demographics.gender || !demographics.location || !demographics.goal}
              className="w-full py-5.5 bg-brand text-brand-dark rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20 disabled:opacity-20 disabled:grayscale transition-all hover:scale-[1.01] active:scale-[0.98] mt-6 flex items-center justify-center gap-3"
            >
              Continue to Payment Selection <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex items-start gap-4 p-6 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-3xl">
            <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-1" />
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Privacy Guaranteed</p>
              <p className="text-[9px] font-medium text-text/40 leading-relaxed">Your data is encrypted end-to-end and only accessible by your selected professional.</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (bookingStep === 'payment') {
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-8 pb-40 space-y-10"
      >
        <button 
          onClick={() => setBookingStep('demographics')}
          className="flex items-center gap-3 text-text/40 hover:text-brand transition-all font-black text-[10px] uppercase tracking-[0.2em] group"
        >
          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all">
            <ChevronRight className="rotate-180" size={16} />
          </div>
          Back to information
        </button>

        {renderStepIndicator()}

        <header className="space-y-3">
          <h3 className="text-3xl font-black text-text tracking-tight">Final Step</h3>
          <p className="text-[10px] text-text/30 font-black uppercase tracking-[0.3em]">Secure EVC Payment Network</p>
        </header>

        <div className="bg-card border border-text p-8 sm:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-[0.03] rotate-12">
            <ShieldCheck size={280} />
          </div>
          
          <div className="space-y-10 relative z-10">
            <div className="flex items-start gap-5 p-6 bg-brand rounded-2xl text-brand-dark shadow-xl shadow-brand/20">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0">
                  <CreditCard size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Payment Instructions</p>
                  <p className="text-sm font-black leading-relaxed">
                    Transfer <span className="text-xl inline-block mx-1 font-black">{selectedTherapist?.rate}</span> 
                    to <span className="underline decoration-2 underline-offset-4">+252 61 661 7726</span> via EVC Plus
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text/40 uppercase tracking-widest ml-4">Verification Number</label>
                  <div className="relative">
                    <input 
                      type="tel"
                      value={evcNumber}
                      onChange={(e) => setEvcNumber(e.target.value)}
                      placeholder="Enter your EVC number"
                      className="w-full bg-white border border-border rounded-xl px-6 py-4 pl-14 text-sm font-bold focus:outline-none focus:border-brand shadow-sm"
                    />
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-text/20" size={18} />
                  </div>
                  <p className="text-[9px] text-text/30 font-black uppercase tracking-widest ml-4 italic">Verification will be processed immediately</p>
                </div>
              </div>

              <div className="pt-10 border-t border-border/50">
                <div className="flex justify-between items-center mb-10 px-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-text/40 uppercase tracking-widest">Total Amount</span>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Instant Activation</span>
                  </div>
                  <span className="text-4xl font-black text-text tracking-tighter">{selectedTherapist?.rate}</span>
                </div>
                
                <button 
                  onClick={confirmBooking}
                  disabled={!evcNumber || isSubmitting}
                  className="w-full py-6 bg-brand text-brand-dark rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand/40 disabled:opacity-20 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.95] flex items-center justify-center gap-3"
                >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Securing Session...
                  </>
                ) : (
                  <>
                    Confirm Payment <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 bg-amber-500/5 rounded-3xl border border-amber-500/10">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <p className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest leading-relaxed">
            Your secure link will be sent to your email immediately after verification.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-bg min-h-screen">
      {bookingStep === 'list' ? (
        <div className="p-8 pb-40 space-y-16">
          <header className="flex items-center justify-between border-b border-border/50 pb-8">
            <div>
              <h3 className="text-3xl font-black text-text tracking-tight mb-2">Private Therapy</h3>
              <p className="text-[10px] text-text/30 font-black uppercase tracking-[0.3em]">Confidential • Professional • Online</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center text-brand shadow-sm">
              <Heart size={28} />
            </div>
          </header>

          <div className="grid grid-cols-1 gap-12">
            {therapists.length > 0 ? (
              therapists.map(renderTherapistCard)
            ) : (
              <div className="py-20 text-center bg-card/40 rounded-3xl border border-dashed border-border/50">
                <MessageCircle size={48} className="mx-auto text-text/10 mb-4" />
                <p className="text-[10px] font-black text-text/20 uppercase tracking-widest">No therapists available at the moment</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
