import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { colors } from '../constants';
import { Therapist, Booking, ClientProfile } from '../types';
import { TherapistDetailModal } from './TherapistDetailModal.native';

interface TherapistListProps {
  therapists: Therapist[];
  clientProfile: ClientProfile;
  onBookingSuccess: (booking: Booking) => void;
  onOpenQuiz?: () => void;
  onOpenAidModal?: () => void;
  upcomingBooking?: Booking | null;
  onOpenUpcomingSession?: () => void;
  savedTherapistIds?: string[];
  onToggleFavorite?: (therapistId: string) => void;
  onOpenPrivacy?: () => void;
}

export const TherapistList: React.FC<TherapistListProps> = ({
  therapists,
  clientProfile,
  onBookingSuccess,
  onOpenQuiz,
  onOpenAidModal,
  upcomingBooking,
  onOpenUpcomingSession,
  savedTherapistIds = [],
  onToggleFavorite,
  onOpenPrivacy,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);

  const filteredTherapists = therapists.filter((t) => {
    let matchesCat = activeCategory === 'all' || t.category === activeCategory;
    if (activeCategory === 'aid') {
      matchesCat = t.price <= 60;
    }
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.shortBio.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const clientFirstName = (clientProfile.name || 'Farhiya').split(' ')[0];

  // Dynamic Time-of-day Greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleSeeAll = () => {
    setActiveCategory('all');
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        {/* Dynamic Greeting Header */}
        <View style={styles.greetingHeader}>
          <Text style={styles.greetingTitle}>
            {getTimeGreeting()}, {clientFirstName}.
          </Text>
          <Text style={styles.greetingSubtitle}>How are you feeling today?</Text>
        </View>

        {/* Forest Green Cultural Match Quiz Hero Card (Matching Web App) */}
        {onOpenQuiz && (
          <TouchableOpacity style={styles.heroMatchCard} onPress={onOpenQuiz} activeOpacity={0.92}>
            {/* Background Glow Circle */}
            <View style={styles.glowCircle} />

            <View style={styles.heroSparkleRow}>
              <View style={styles.heroIconRing}>
                <Text style={styles.heroIconEmoji}>✨</Text>
              </View>
              <View style={styles.heroTextCol}>
                <Text style={styles.heroCardTitle}>Find your perfect match</Text>
                <Text style={styles.heroCardSub}>
                  Take our 1-minute cultural match quiz to find the right care for you.
                </Text>
              </View>
            </View>

            <View style={styles.heroActionRow}>
              <View style={styles.heroPillBtn}>
                <Text style={styles.heroPillBtnText}>Get Started ›</Text>
              </View>

              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onOpenPrivacy ? onOpenPrivacy() : onOpenQuiz();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.privacyLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Financial Support Card */}
        <View style={styles.aidBannerCard}>
          <View style={styles.aidHeaderRow}>
            <View style={styles.aidSparkleBadge}>
              <Text style={styles.aidSparkleText}>✨</Text>
            </View>
          </View>

          <Text style={styles.aidCardTitle}>Need financial support for your therapy?</Text>
          <Text style={styles.aidCardDesc}>
            Barbaar's Financial Relief program offers Somali youth, students, and low-income individuals up to 40% off sessions. Apply upfront and secure pre-approval.
          </Text>

          <TouchableOpacity
            style={styles.aidApplyBtn}
            onPress={() => (onOpenAidModal ? onOpenAidModal() : setActiveCategory('aid'))}
            activeOpacity={0.8}
          >
            <Text style={styles.aidApplyBtnText}>Apply for Financial Relief</Text>
          </TouchableOpacity>
        </View>

        {/* Or Browse By Focus Category Section (3rd Position) */}
        <View style={styles.filterSectionHeader}>
          <Text style={styles.filterTitle}>OR BROWSE BY FOCUS</Text>
        </View>

        {/* Category Filter Chips */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.catTab, activeCategory === 'all' && styles.catTabActive]}
              onPress={() => setActiveCategory('all')}
            >
              <Text style={[styles.catTabText, activeCategory === 'all' && styles.catTabTextActive]}>
                ✨ All Specialists
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catTab, activeCategory === 'cbt' && styles.catTabActive]}
              onPress={() => setActiveCategory('cbt')}
            >
              <Text style={[styles.catTabText, activeCategory === 'cbt' && styles.catTabTextActive]}>
                🧠 CBT & Anxiety
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catTab, activeCategory === 'couples' && styles.catTabActive]}
              onPress={() => setActiveCategory('couples')}
            >
              <Text style={[styles.catTabText, activeCategory === 'couples' && styles.catTabTextActive]}>
                🤝 Couples & Family
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catTab, activeCategory === 'premium' && styles.catTabActive]}
              onPress={() => setActiveCategory('premium')}
            >
              <Text style={[styles.catTabText, activeCategory === 'premium' && styles.catTabTextActive]}>
                ⭐ Transformation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.catTab, activeCategory === 'aid' && styles.catTabActive]}
              onPress={() => setActiveCategory('aid')}
            >
              <Text style={[styles.catTabText, activeCategory === 'aid' && styles.catTabTextActive]}>
                🤲 Financial Aid Relief
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Search Input Field */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, specialty, or topic..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Your Next Session Card (If upcoming booking exists) */}
        {upcomingBooking && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeaderLabel}>YOUR NEXT SESSION</Text>
            <TouchableOpacity
              style={styles.upcomingCard}
              onPress={onOpenUpcomingSession}
              activeOpacity={0.85}
            >
              <View style={styles.upcomingAvatar}>
                <Text style={styles.upcomingAvatarText}>
                  {(upcomingBooking.therapistName || 'S').charAt(0)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upcomingName}>{upcomingBooking.therapistName}</Text>
                <Text style={styles.upcomingMeta}>
                  {upcomingBooking.date} · {upcomingBooking.time}
                </Text>
              </View>
              <View style={styles.upcomingViewPill}>
                <Text style={styles.upcomingViewText}>View</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Meet Our Therapists (Featured Carousel + Specialist Cards) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderLabel}>MEET OUR THERAPISTS</Text>
            <TouchableOpacity onPress={handleSeeAll} activeOpacity={0.7}>
              <Text style={styles.seeAllText}>See All ({therapists.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Vertical Specialist List */}
          <View style={styles.listContainer}>
            {filteredTherapists.map((therapist) => {
              const isLiked = savedTherapistIds.includes(therapist.id);
              return (
                <TouchableOpacity
                  key={therapist.id}
                  style={styles.card}
                  onPress={() => setSelectedTherapist(therapist)}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: therapist.color || colors.amber }]}>
                      <Text style={styles.avatarText}>{therapist.initials}</Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <View style={styles.nameHeartRow}>
                        <Text style={styles.docName}>{therapist.name}</Text>
                        {onToggleFavorite && (
                          <TouchableOpacity
                            style={styles.heartBtn}
                            onPress={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(therapist.id);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.heartIconText}>{isLiked ? '❤️' : '🤍'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={styles.docCredentials}>{therapist.credentials}</Text>
                      <View style={styles.ratingRow}>
                        <Text style={styles.ratingText}>⭐ {therapist.rating}</Text>
                        <Text style={styles.reviewsText}>({therapist.reviews} reviews)</Text>
                        <Text style={styles.dot}>·</Text>
                        <Text style={styles.expText}>{therapist.experience} yrs exp</Text>
                      </View>
                    </View>

                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>
                        ${therapist.price}
                      </Text>
                      <Text style={styles.unitText}>/{therapist.priceUnit}</Text>
                    </View>
                  </View>

                  <Text style={styles.shortBio}>{therapist.shortBio}</Text>

                  {/* Specialties Tags */}
                  <View style={styles.tagsRow}>
                    {therapist.specialties.slice(0, 3).map((spec, i) => (
                      <View key={i} style={styles.tagChip}>
                        <Text style={styles.tagText}>{spec}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action Button */}
                  <View style={styles.bookBtn}>
                    <Text style={styles.bookBtnText}>Book Consultation ›</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredTherapists.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No specialists found</Text>
                <Text style={styles.emptySub}>
                  Try adjusting your search terms or category filters.
                </Text>
                <TouchableOpacity style={styles.resetBtn} onPress={handleSeeAll}>
                  <Text style={styles.resetBtnText}>Clear Search & Filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Impact Stats Banner */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>85%</Text>
            <Text style={styles.statLabel}>Recovery Rate</Text>
            <Text style={styles.statSub}>In first sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>4+ Yrs</Text>
            <Text style={styles.statLabel}>Trusted Experience</Text>
            <Text style={styles.statSub}>Licensed Specialists</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Confidential</Text>
            <Text style={styles.statSub}>HIPAA Compliant</Text>
          </View>
        </View>

        {/* Why Therapy Matters Section */}
        <View style={styles.whyTherapyCard}>
          <View style={styles.whyHeaderRow}>
            <View style={styles.whyAccentBar} />
            <Text style={styles.whyTitle}>WHY THERAPY MATTERS</Text>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarIconCircle}>
              <Text style={styles.pillarIconEmoji}>🌿</Text>
            </View>
            <View style={styles.pillarContent}>
              <Text style={styles.pillarHeading}>Navigate Stress & Life Transitions</Text>
              <Text style={styles.pillarDesc}>
                Gain effective coping mechanisms for anxiety, relationship changes, and career transitions with culturally empathetic therapists.
              </Text>
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarIconCircle}>
              <Text style={styles.pillarIconEmoji}>🌱</Text>
            </View>
            <View style={styles.pillarContent}>
              <Text style={styles.pillarHeading}>Build Daily Resilience & Habits</Text>
              <Text style={styles.pillarDesc}>
                Develop actionable strategies and self-care routines that promote lasting mental well-being and growth.
              </Text>
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarIconCircle}>
              <Text style={styles.pillarIconEmoji}>🛡️</Text>
            </View>
            <View style={styles.pillarContent}>
              <Text style={styles.pillarHeading}>Confidential & Culturally Aware</Text>
              <Text style={styles.pillarDesc}>
                Experience private, non-judgmental care tailored specifically for Somali youth and global diaspora communities.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Therapist Detail & Booking Modal */}
      <TherapistDetailModal
        therapist={selectedTherapist}
        visible={!!selectedTherapist}
        onClose={() => setSelectedTherapist(null)}
        clientProfile={clientProfile}
        onBookingSuccess={(booking) => {
          setSelectedTherapist(null);
          onBookingSuccess(booking);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  mainScroll: {
    paddingBottom: 40,
    backgroundColor: '#ffffff',
  },
  greetingHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: 4,
    fontWeight: '500',
  },
  heroMatchCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#2D3B32',
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#2D3B32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  glowCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(100, 164, 97, 0.25)',
  },
  heroSparkleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroIconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3E5446',
    borderWidth: 2,
    borderColor: '#64A461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconEmoji: {
    fontSize: 22,
  },
  heroTextCol: {
    flex: 1,
  },
  heroCardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroCardSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  heroPillBtn: {
    backgroundColor: '#64A461',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#64A461',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  heroPillBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  privacyLink: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  aidBannerCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#FAFAF7',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAE8DF',
  },
  aidHeaderRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  aidSparkleBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF8EA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5E6C8',
  },
  aidSparkleText: {
    fontSize: 16,
  },
  aidCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  aidCardDesc: {
    fontSize: 12.5,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  aidApplyBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#384C43',
    alignItems: 'center',
  },
  aidApplyBtnText: {
    color: '#384C43',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.inkSoft,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.amber,
  },
  upcomingCard: {
    marginHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  upcomingAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.amber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  upcomingName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  upcomingMeta: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  upcomingViewPill: {
    backgroundColor: colors.indigoSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  upcomingViewText: {
    color: colors.indigo,
    fontSize: 12,
    fontWeight: '800',
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  carouselCard: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EAE8DF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  carouselCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  carouselAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  carouselDocName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  carouselCredentials: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 1,
  },
  carouselRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  carouselRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.amber,
  },
  carouselReviewsText: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  carouselBio: {
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 16,
    marginBottom: 12,
  },
  carouselFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  carouselPriceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  carouselPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
  },
  carouselPriceUnit: {
    fontSize: 10,
    color: colors.inkSoft,
  },
  carouselBookBtn: {
    backgroundColor: colors.indigo,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  carouselBookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  filterSectionHeader: {
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.inkSoft,
    letterSpacing: 0.8,
  },
  categoryContainer: {
    paddingVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catTab: {
    backgroundColor: '#F4F4F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAE8DF',
  },
  catTabActive: {
    backgroundColor: colors.indigo,
    borderColor: colors.indigo,
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  catTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
  },
  listContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EAE8DF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
  },
  nameHeartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 4,
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    flex: 1,
  },
  heartBtn: {
    padding: 2,
  },
  heartIconText: {
    fontSize: 15,
  },
  docCredentials: {
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.amber,
  },
  reviewsText: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  dot: {
    color: colors.inkSoft,
    fontSize: 11,
  },
  expText: {
    fontSize: 11,
    color: colors.inkSoft,
    fontWeight: '600',
  },
  priceBadge: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  unitText: {
    fontSize: 10,
    color: colors.inkSoft,
  },
  shortBio: {
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tagChip: {
    backgroundColor: '#F4F4F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: colors.ink,
    fontWeight: '600',
  },
  bookBtn: {
    backgroundColor: colors.indigo,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  emptySub: {
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
  },
  resetBtn: {
    marginTop: 14,
    backgroundColor: colors.amber,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#FAFAF7',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EAE8DF',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.indigo,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 2,
  },
  statSub: {
    fontSize: 9,
    color: colors.inkSoft,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#EAE8DF',
  },
  whyTherapyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: '#FAFAF7',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAE8DF',
  },
  whyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  whyAccentBar: {
    width: 4,
    height: 16,
    backgroundColor: '#64A461',
    borderRadius: 2,
  },
  whyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.8,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  pillarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillarIconEmoji: {
    fontSize: 18,
  },
  pillarContent: {
    flex: 1,
  },
  pillarHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 2,
  },
  pillarDesc: {
    fontSize: 11.5,
    color: colors.inkSoft,
    lineHeight: 16,
  },
});
