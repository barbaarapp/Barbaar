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
import { ClientProfile } from '../types';
import { db, doc, setDoc } from '../services/firebase.native';

interface FinancialAidModalProps {
  visible: boolean;
  onClose: () => void;
  clientProfile: ClientProfile;
  onUpdateProfile: (updated: ClientProfile) => void;
}

const CATEGORIES = [
  'Somali Youth & Students',
  'Low-Income Families',
  'Diaspora Newcomers',
  'Single Mothers & Caregivers',
  'General Hardship Relief',
];

export const FinancialAidModal: React.FC<FinancialAidModalProps> = ({
  visible,
  onClose,
  clientProfile,
  onUpdateProfile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [reason, setReason] = useState('');
  const [name, setName] = useState(clientProfile.name || '');
  const [email, setEmail] = useState(clientProfile.email || '');
  const [phone, setPhone] = useState(clientProfile.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !reason.trim()) {
      Alert.alert('Required Fields', 'Please complete your name, email, and brief explanation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const nextProfile: ClientProfile = {
        ...clientProfile,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        financialAidStatus: 'pending',
        financialAidCategory: selectedCategory,
        financialAidReason: reason.trim(),
        financialAidSubmittedAt: new Date().toISOString(),
      };

      // Save user doc to Firestore
      const userId = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(
        doc(db, 'users', userId),
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          financialAidStatus: 'pending',
          financialAidCategory: selectedCategory,
          financialAidReason: reason.trim(),
          financialAidSubmittedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Create preapp booking for admin review
      const preappId = `bk_preapp_${Date.now()}`;
      await setDoc(doc(db, 'bookings', preappId), {
        id: preappId,
        therapistId: 'placeholder',
        category: selectedCategory,
        clientName: name.trim(),
        clientEmail: email.trim().toLowerCase(),
        clientPhone: phone.trim(),
        date: '',
        time: '',
        price: 0,
        priceUnit: '$',
        status: 'upcoming',
        zoomLink: null,
        createdAt: new Date().toISOString(),
        financialAidApplied: true,
        financialAidCategory: selectedCategory,
        financialAidReason: reason.trim(),
        financialAidStatus: 'pending',
        originalPrice: 60,
      });

      onUpdateProfile(nextProfile);

      Alert.alert(
        'Application Submitted 🙏',
        'Your Barbaar Financial Relief application has been received. Our review committee will notify you via email shortly.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (err) {
      console.error('Failed to submit financial aid:', err);
      Alert.alert('Error', 'Submission failed. Please try again.');
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
            <Text style={styles.title}>Barbaar Financial Relief Fund 🤝</Text>
            <Text style={styles.subtitle}>
              Financial constraints should never stand between you and mental well-being. Apply below for 100% subsidized care.
            </Text>

            <Text style={styles.sectionTitle}>1. Select Relief Eligibility Group</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catOption, selectedCategory === cat && styles.catOptionActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
                  {selectedCategory === cat ? '☑ ' : '☐ '} {cat}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>2. Applicant Details</Text>
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
              placeholder="Phone Number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.sectionTitle}>3. Brief Context / Reason</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Briefly describe your current situation or reason for requesting financial support..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Financial Relief Application</Text>
              )}
            </TouchableOpacity>
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
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 12,
    marginBottom: 8,
  },
  catOption: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catOptionActive: {
    backgroundColor: colors.acaciaSoft,
    borderColor: colors.acacia,
  },
  catText: {
    fontSize: 13,
    color: colors.ink,
  },
  catTextActive: {
    color: colors.acacia,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 10,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.acacia,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
