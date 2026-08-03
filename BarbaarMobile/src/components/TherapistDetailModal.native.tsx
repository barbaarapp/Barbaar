import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants';
import { Therapist, Booking, ClientProfile } from '../types';
import { db, doc, setDoc } from '../services/firebase.native';

interface TherapistDetailModalProps {
  therapist: Therapist | null;
  visible: boolean;
  onClose: () => void;
  clientProfile: ClientProfile;
  onBookingSuccess: (newBooking: Booking) => void;
}

export const TherapistDetailModal: React.FC<TherapistDetailModalProps> = ({
  therapist,
  visible,
  onClose,
  clientProfile,
  onBookingSuccess,
}) => {
  if (!therapist) return null;

  const [selectedDay, setSelectedDay] = useState<string>(therapist.availability?.days?.[0] || 'Mon');
  const [selectedSlot, setSelectedSlot] = useState<string>(therapist.availability?.slots?.[0] || '10:00 AM');
  const [name, setName] = useState(clientProfile.name || '');
  const [email, setEmail] = useState(clientProfile.email || '');
  const [phone, setPhone] = useState(clientProfile.phone || '');
  const [applyAid, setApplyAid] = useState(clientProfile.financialAidStatus === 'approved');
  
  // Sifalo Pay state
  const [payMethod, setPayMethod] = useState<'mobile' | 'card'>('mobile');
  const [mobileProvider, setMobileProvider] = useState<'EVC' | 'ZAAD' | 'SAHAL'>('EVC');
  const [paymentPhone, setPaymentPhone] = useState(clientProfile.phone || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalPrice = applyAid ? Math.round(therapist.price * 0.6) : therapist.price;

  const handleBook = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required Info', 'Please provide your name and email address to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      let paymentTxId = '';

      // If session is paid, process Sifalo Pay real-time transaction FIRST
      if (finalPrice > 0) {
        const targetPhone = paymentPhone.trim() || phone.trim();
        if (payMethod === 'mobile' && !targetPhone) {
          Alert.alert('Phone Required', 'Fadlan geli lambarka mobile money (e.g. 061xxxxxxx ama 063xxxxxxx).');
          setIsSubmitting(false);
          return;
        }

        try {
          const payResponse = await fetch('/api/sifalo-pay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              method: payMethod,
              amount: finalPrice,
              mobileProvider,
              phone: targetPhone,
              clientName: name.trim(),
              clientEmail: email.trim().toLowerCase(),
              clientPhone: phone.trim(),
              bookingId,
              description: `Barbaar Wellness Consultation with ${therapist.name}`,
            }),
          });

          const payData = await payResponse.json();

          if (!payResponse.ok || !payData.success) {
            Alert.alert(
              'Lacag Bixintu Waa La Diaday / Payment Failed',
              payData.error || 'Sifalo Pay: Lacagta laguma shubin karin akoonkaaga. Fadlan hubi hantidaada ama lambarkaaga.'
            );
            setIsSubmitting(false);
            return;
          }

          paymentTxId = payData.transactionId || `SIF-${Date.now()}`;
        } catch (payErr: any) {
          Alert.alert(
            'Sifalo Pay Error',
            payErr?.message || 'Khalaad ayaa ka dhacay Sifalo Pay. Fadlan dib u tijaabi.'
          );
          setIsSubmitting(false);
          return;
        }
      }

      const newBooking: Booking = {
        id: bookingId,
        therapistId: therapist.id,
        therapistName: therapist.name,
        category: therapist.category,
        clientName: name.trim(),
        clientEmail: email.trim().toLowerCase(),
        clientPhone: phone.trim(),
        date: selectedDay,
        time: selectedSlot,
        price: finalPrice,
        priceUnit: therapist.priceUnit,
        status: 'upcoming',
        zoomLink: therapist.zoomLink || null,
        createdAt: new Date().toISOString(),
        financialAidApplied: applyAid,
        originalPrice: therapist.price,
        ...(finalPrice > 0
          ? {
              paymentStatus: 'paid',
              paymentMethod: payMethod,
              paymentTransactionId: paymentTxId,
              paidAmount: finalPrice,
            }
          : {}),
      };

      // Save to Firestore
      await setDoc(doc(db, 'bookings', bookingId), newBooking);

      // Trigger Email & WhatsApp Confirmation via shared server API
      try {
        await fetch('/api/send-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: newBooking.id,
            clientName: newBooking.clientName,
            clientEmail: newBooking.clientEmail,
            clientPhone: newBooking.clientPhone,
            therapistName: newBooking.therapistName,
            category: newBooking.category,
            date: newBooking.date,
            time: newBooking.time,
            price: newBooking.price,
            priceUnit: newBooking.priceUnit,
            financialAidApplied: newBooking.financialAidApplied,
            paymentStatus: newBooking.paymentStatus || 'unpaid',
            paymentTransactionId: paymentTxId,
          }),
        });
      } catch (emailErr) {
        console.warn('Booking email trigger error:', emailErr);
      }

      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your session with ${therapist.name} for ${selectedDay} at ${selectedSlot} is scheduled.${
          finalPrice > 0 ? `\nPayment Charged: $${finalPrice} (Ref: ${paymentTxId})` : ''
        }`,
        [
          {
            text: 'View Sessions',
            onPress: () => {
              onBookingSuccess(newBooking);
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Error creating booking:', err);
      Alert.alert('Error', 'Could not complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.contentCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {/* Header / Avatar */}
            <View style={styles.headerRow}>
              <View style={[styles.avatar, { backgroundColor: therapist.color || colors.amber }]}>
                <Text style={styles.avatarText}>{therapist.initials}</Text>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.name}>{therapist.name}</Text>
                <Text style={styles.credentials}>{therapist.credentials}</Text>
                <Text style={styles.metaText}>
                  ⭐ {therapist.rating} ({therapist.reviews} reviews) · {therapist.experience} yrs exp
                </Text>
              </View>
            </View>

            {/* Bio */}
            <Text style={styles.sectionHeader}>About Specialist</Text>
            <Text style={styles.bioText}>{therapist.longBio || therapist.shortBio}</Text>

            {/* Languages & Specialties */}
            <View style={styles.tagGroup}>
              {therapist.languages.map((lang, idx) => (
                <View key={`lang-${idx}`} style={styles.langTag}>
                  <Text style={styles.langTagText}>🗣️ {lang}</Text>
                </View>
              ))}
              {therapist.specialties.map((spec, idx) => (
                <View key={`spec-${idx}`} style={styles.specTag}>
                  <Text style={styles.specTagText}>{spec}</Text>
                </View>
              ))}
            </View>

            {/* Select Day */}
            <Text style={styles.sectionHeader}>1. Select Available Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
              {therapist.availability?.days?.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.dayChipText, selectedDay === day && styles.dayChipTextActive]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Select Time */}
            <Text style={styles.sectionHeader}>2. Select Time Slot</Text>
            <View style={styles.slotGrid}>
              {therapist.availability?.slots?.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotChipText, selectedSlot === slot && styles.slotChipTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Contact Details */}
            <Text style={styles.sectionHeader}>3. Patient Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email Address *"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g. 061xxxxxxx) *"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                if (!paymentPhone) setPaymentPhone(t);
              }}
            />

            {/* Financial Aid Option */}
            {clientProfile.financialAidStatus === 'approved' && (
              <TouchableOpacity
                style={styles.aidBox}
                onPress={() => setApplyAid(!applyAid)}
              >
                <Text style={styles.aidCheck}>{applyAid ? '☑' : '☐'}</Text>
                <Text style={styles.aidText}>
                  Apply Approved Barbaar Financial Relief (100% Subsidized - $0)
                </Text>
              </TouchableOpacity>
            )}

            {/* Payment Method Section (Sifalo Pay) */}
            {finalPrice > 0 && (
              <View style={styles.paymentSection}>
                <Text style={styles.sectionHeader}>4. Payment Method (Sifalo Pay Gateway)</Text>
                <View style={styles.payMethodTabs}>
                  <TouchableOpacity
                    style={[styles.payTab, payMethod === 'mobile' && styles.payTabActive]}
                    onPress={() => setPayMethod('mobile')}
                  >
                    <Text style={[styles.payTabText, payMethod === 'mobile' && styles.payTabTextActive]}>
                      📱 Mobile Money
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.payTab, payMethod === 'card' && styles.payTabActive]}
                    onPress={() => setPayMethod('card')}
                  >
                    <Text style={[styles.payTabText, payMethod === 'card' && styles.payTabTextActive]}>
                      💳 Visa / Mastercard
                    </Text>
                  </TouchableOpacity>
                </View>

                {payMethod === 'mobile' && (
                  <View style={styles.mobileSubGroup}>
                    <Text style={styles.subLabel}>Choose Provider:</Text>
                    <View style={styles.providerRow}>
                      {(['EVC', 'ZAAD', 'SAHAL'] as const).map((prov) => (
                        <TouchableOpacity
                          key={prov}
                          style={[
                            styles.provChip,
                            mobileProvider === prov && styles.provChipActive,
                          ]}
                          onPress={() => setMobileProvider(prov)}
                        >
                          <Text
                            style={[
                              styles.provChipText,
                              mobileProvider === prov && styles.provChipTextActive,
                            ]}
                          >
                            {prov === 'EVC' ? '🟢 EVC Plus' : prov === 'ZAAD' ? '🟡 Zaad' : '🔵 Sahal'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.subLabel}>Mobile Money Number:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 0615000000 / 0634000000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      value={paymentPhone}
                      onChangeText={setPaymentPhone}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Footer Summary & Book Button */}
            <View style={styles.bookingFooter}>
              <View>
                <Text style={styles.priceLabel}>Total Investment</Text>
                <Text style={styles.priceValue}>
                  {finalPrice === 0 ? 'FREE (Relief)' : `$${finalPrice} / ${therapist.priceUnit}`}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, isSubmitting && styles.btnDisabled]}
                onPress={handleBook}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {finalPrice > 0 ? `Pay $${finalPrice} & Book` : 'Confirm Booking'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  contentCard: {
    backgroundColor: colors.ivory,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 16,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  closeBtnText: {
    fontSize: 20,
    color: colors.inkSoft,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.forest,
  },
  credentials: {
    fontSize: 13,
    color: colors.forestMedium,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.forest,
    marginTop: 18,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  },
  tagGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  langTag: {
    backgroundColor: colors.sageLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  langTagText: {
    fontSize: 12,
    color: colors.forest,
    fontWeight: '600',
  },
  specTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specTagText: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  hScroll: {
    marginVertical: 4,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginRight: 8,
  },
  dayChipActive: {
    backgroundColor: colors.forest,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  dayChipTextActive: {
    color: '#ffffff',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
  },
  slotChipActive: {
    backgroundColor: colors.forest,
  },
  slotChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  slotChipTextActive: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 10,
  },
  aidBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.sageLight,
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
  },
  aidCheck: {
    fontSize: 18,
    color: colors.forest,
  },
  aidText: {
    fontSize: 13,
    color: colors.forest,
    fontWeight: '600',
    flex: 1,
  },
  paymentSection: {
    marginTop: 8,
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  payMethodTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  payTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  payTabActive: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  payTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  payTabTextActive: {
    color: '#ffffff',
  },
  mobileSubGroup: {
    marginTop: 4,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    marginBottom: 6,
    marginTop: 6,
  },
  providerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  provChip: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  provChipActive: {
    backgroundColor: colors.sageLight,
    borderColor: colors.forest,
  },
  provChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  provChipTextActive: {
    color: colors.forest,
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.forest,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: colors.forest,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
