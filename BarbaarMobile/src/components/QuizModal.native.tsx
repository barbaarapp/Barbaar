import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { colors } from '../constants';
import { Therapist } from '../types';

interface QuizModalProps {
  visible: boolean;
  onClose: () => void;
  therapists: Therapist[];
  onSelectTherapist: (therapist: Therapist) => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  visible,
  onClose,
  therapists,
  onSelectTherapist,
}) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{
    category?: string;
    languagePref?: string;
    genderPref?: string;
  }>({});
  const [matched, setMatched] = useState<Therapist[]>([]);

  const questions = [
    {
      title: 'What is your primary care goal?',
      subtitle: 'Select what best describes what you are seeking help with today.',
      options: [
        { label: '🧠 Quiet Anxious & Intrusive Thoughts', category: 'cbt' },
        { label: '🤝 Strengthen Marriage, Trust & Communication', category: 'couples' },
        { label: '⭐ Break Deep Life Patterns (6-Week Intensive)', category: 'premium' },
      ],
    },
    {
      title: 'Therapy atmosphere & language preference?',
      subtitle: 'All our specialists are licensed and culturally grounded in Somali values.',
      options: [
        { label: '🗣️ Somali language & faith-centered approach', languagePref: 'Somali' },
        { label: '🗣️ English with Somali cultural understanding', languagePref: 'English' },
        { label: '🌐 Flexible / Bilingual (Somali & English)', languagePref: 'Bilingual' },
      ],
    },
    {
      title: 'Do you have a specialist gender preference?',
      subtitle: 'We respect your personal comfort and privacy preferences.',
      options: [
        { label: '👩 Female Specialist', genderPref: 'female' },
        { label: '👨 Male Specialist', genderPref: 'male' },
        { label: '✨ No Preference (Match Best Specialist)', genderPref: 'any' },
      ],
    },
  ];

  const handleSelectOption = (opt: any) => {
    const nextAnswers = { ...answers, ...opt };
    setAnswers(nextAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate matches
      calculateMatches(nextAnswers);
      setStep(3); // Result step
    }
  };

  const calculateMatches = (finalAnswers: typeof answers) => {
    const category = finalAnswers.category || 'cbt';
    const gender = finalAnswers.genderPref;

    let pool = therapists.filter((t) => t.category === category);
    if (gender && gender !== 'any') {
      const genderFiltered = pool.filter((t) => t.gender === gender);
      if (genderFiltered.length > 0) pool = genderFiltered;
    }

    if (pool.length === 0) pool = therapists.slice(0, 2);
    setMatched(pool.slice(0, 2));
  };

  const resetQuiz = () => {
    setStep(0);
    setAnswers({});
    setMatched([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌟 Barbaar Specialist Matcher</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {step < 3 ? (
            <View>
              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} />
              </View>
              <Text style={styles.stepIndicator}>Step {step + 1} of 3</Text>

              <Text style={styles.title}>{questions[step].title}</Text>
              <Text style={styles.subtitle}>{questions[step].subtitle}</Text>

              <View style={styles.optionsList}>
                {questions[step].options.map((opt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.optionCard}
                    onPress={() => handleSelectOption(opt)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionText}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.resultsBox}>
              <Text style={styles.resultsBadge}>✨ MATCH FOUND</Text>
              <Text style={styles.resultsTitle}>Your Recommended Specialists</Text>
              <Text style={styles.resultsSub}>
                Based on your preferences, these specialists match your care goals and values.
              </Text>

              {matched.map((therapist) => (
                <View key={therapist.id} style={styles.matchCard}>
                  <View style={styles.matchRow}>
                    <View style={[styles.avatar, { backgroundColor: therapist.color || colors.amber }]}>
                      <Text style={styles.avatarText}>{therapist.initials}</Text>
                    </View>
                    <View style={styles.matchInfo}>
                      <Text style={styles.docName}>{therapist.name}</Text>
                      <Text style={styles.docCreds}>{therapist.credentials}</Text>
                      <Text style={styles.docRating}>⭐ {therapist.rating} ({therapist.reviews} reviews)</Text>
                    </View>
                    <Text style={styles.docPrice}>${therapist.price}/session</Text>
                  </View>

                  <Text style={styles.shortBio}>{therapist.shortBio}</Text>

                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => {
                      onClose();
                      onSelectTherapist(therapist);
                      resetQuiz();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.bookBtnText}>Book Consultation with {therapist.name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.retakeBtn} onPress={resetQuiz}>
                <Text style={styles.retakeBtnText}>↺ Retake Matching Quiz</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.indigoDeep,
  },
  headerTitle: {
    color: colors.amber,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.indigoSoft,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
  },
  stepIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amber,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 18,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 18,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  resultsBox: {
    alignItems: 'center',
  },
  resultsBadge: {
    color: colors.amber,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 6,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
    textAlign: 'center',
  },
  resultsSub: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    width: '100%',
    marginBottom: 16,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  matchInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  docCreds: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  docRating: {
    fontSize: 11,
    color: colors.amber,
    fontWeight: '700',
    marginTop: 2,
  },
  docPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.amber,
  },
  shortBio: {
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 14,
  },
  bookBtn: {
    backgroundColor: colors.amber,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  retakeBtn: {
    paddingVertical: 12,
    marginTop: 10,
  },
  retakeBtnText: {
    color: colors.indigo,
    fontSize: 13,
    fontWeight: '700',
  },
});
