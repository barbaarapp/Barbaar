/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Star, ChevronLeft, Calendar, Share2, Check } from "lucide-react";
import { Therapist, Booking } from "../../types";
import { colors } from "../../constants";
import { fmtMoney, getTherapistSlug } from "../../utils";
import { translateText as t, Language } from "../../utils/translations";
import Avatar from "../ui/Avatar";
import CategoryBadge from "../ui/CategoryBadge";
import Stars from "../ui/Stars";
import Card from "../ui/Card";
import Button from "../ui/Button";

interface TherapistProfileScreenProps {
  therapist: Therapist;
  bookings?: Booking[];
  onBook: () => void;
  onBack: () => void;
  lang?: Language;
}

export default function TherapistProfileScreen({
  therapist,
  bookings = [],
  onBook,
  onBack,
  lang = "en",
}: TherapistProfileScreenProps) {
  const tItem = therapist;
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/therapist/${getTherapistSlug(tItem.name)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const catColor = tItem.category === "cbt" ? colors.acacia : tItem.category === "couples" ? colors.clay : colors.amber;
  const catSoft = tItem.category === "cbt" ? colors.acaciaSoft : tItem.category === "couples" ? colors.claySoft : colors.amberSoft;

  // Star distribution math based on therapist rating
  const rating = tItem.rating;
  const pct5 = rating === 5.0 ? 100 : rating === 4.9 ? 92 : rating === 4.8 ? 85 : 78;
  const pct4 = rating === 5.0 ? 0 : rating === 4.9 ? 7 : rating === 4.8 ? 12 : 16;
  const pct3 = rating === 5.0 ? 0 : rating === 4.9 ? 1 : rating === 4.8 ? 2 : 4;
  const pct2 = rating === 5.0 ? 0 : rating === 4.9 ? 0 : rating === 4.8 ? 1 : 2;
  const pct1 = 0;

  const distributions = [
    { stars: 5, pct: pct5 },
    { stars: 4, pct: pct4 },
    { stars: 3, pct: pct3 },
    { stars: 2, pct: pct2 },
    { stars: 1, pct: pct1 },
  ];

  // Specific client reviews depending on therapist category
  const sampleReviews = {
    cbt: [
      { text: "I felt heard for the first time in my life. Dr. Hassan understands our Somali culture so deeply.", author: "Halima A. · Minneapolis" },
      { text: "The practical CBT tools for my anxiety actually work. I use them every single day.", author: "Kadar J. · London" },
      { text: "Alhamdulillah, finding a therapist who respects my faith has made all the difference.", author: "Fardowsa M. · Toronto" }
    ],
    couples: [
      { text: "We were on the verge of separation. These sessions helped us communicate and reconnect.", author: "Nasra & Abdi · Columbus" },
      { text: "Respectful, direct, and incredibly helpful. A bridge of understanding for our family values.", author: "Mustafe K. · Seattle" },
      { text: "Highly recommend for any Somali couples going through cultural or migration transitions.", author: "Zahra O. · London" }
    ],
    premium: [
      { text: "An intense 6-week program, but worth every penny. I broke patterns I've carried for a decade.", author: "Idil S. · Oslo" },
      { text: "Transformative experience. Dr. Ifrah is challenging and structural in the best possible way.", author: "Anis G. · Dubai" },
      { text: "Not just copy-paste talk therapy — a complete structural change for my career and mindset.", author: "Yasmin H. · Boston" }
    ]
  }[tItem.category as "cbt" | "couples" | "premium"] || [
    { text: "Incredibly helpful sessions that respect my cultural background.", author: "Anonymous" },
    { text: "Highly professional and empathetic therapist.", author: "Client" }
  ];

  // Specific user/client reviews from real bookings
  const realReviews = (bookings || [])
    .filter((b) => b.therapistId === tItem.id && b.rating !== undefined)
    .map((b) => ({
      text: b.review || "Session rated successfully.",
      author: `${b.clientName || "Anonymous"} · Verified Client`,
      rating: b.rating || 5,
    }));

  const allReviewsToShow = [
    ...realReviews,
    ...sampleReviews.map((sr) => ({
      text: sr.text,
      author: sr.author,
      rating: 5,
    })),
  ];

  const translateAuthor = (author: string) => {
    return author.replace("Verified Client", t("Verified Client", lang));
  };

  return (
    <div style={{ background: colors.paper, minHeight: "100vh", position: "relative" }}>
      {/* Scrollable View Area */}
      <div style={{ paddingBottom: 110 }}>
        {/* Custom Header Bar with Transparent Overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          zIndex: 10,
        }}>
          <button
            onClick={onBack}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(4px)",
              border: `1px solid ${colors.line}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: colors.ink,
              transition: "transform 0.15s ease",
            }}
            className="hover:scale-105 active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="font-display" style={{ fontWeight: 600, fontSize: 15, color: colors.ink, background: "rgba(255, 255, 255, 0.7)", padding: "6px 14px", borderRadius: 999 }}>
            {t("Profile", lang)}
          </div>
          <button
            onClick={handleShare}
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: copied ? `${colors.acacia}20` : "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(4px)",
              border: `1px solid ${copied ? colors.acacia : colors.line}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: copied ? colors.acacia : colors.ink,
              transition: "all 0.15s ease",
            }}
            className="hover:scale-105 active:scale-95"
            title="Copy shareable link"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
          </button>
        </div>

        {/* Tinted Header Zone */}
        <div style={{
          background: `linear-gradient(to bottom, ${catSoft}70, ${catSoft}10)`,
          padding: "74px 20px 48px",
          textAlign: "center",
          borderBottom: `1px solid ${colors.line}30`,
        }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{
              borderRadius: "50%",
              padding: 4,
              background: "#fff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              display: "inline-block",
            }}>
              <Avatar therapist={tItem} size={92} />
            </div>
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: 23,
              fontWeight: 600,
              color: colors.ink,
              lineHeight: 1.2,
            }}
          >
            {tItem.name}
          </h1>
          <p style={{ fontSize: 14, color: colors.inkSoft, marginTop: 4, fontWeight: 500 }}>
            {tItem.credentials}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12 }}>
            <CategoryBadge cat={tItem.category} size="md" />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: colors.indigoSoft,
                color: colors.indigo,
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {lang === "so"
                ? tItem.gender === "female"
                  ? "Naag"
                  : "NIN"
                : tItem.gender === "female"
                ? "Woman"
                : "Man"}
            </span>
          </div>
        </div>

        {/* Floating Stats Card (bridges the tinted header and body content) */}
        <div style={{ padding: "0 20px", marginTop: -26, position: "relative", zIndex: 5 }}>
          <Card style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04), 0 4px 12px -2px rgba(0,0,0,0.03)",
            border: `1px solid ${colors.line}40`,
          }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, fontWeight: 700, fontSize: 16, color: colors.ink }}>
                <Star size={14} color={colors.amber} fill={colors.amber} />
                <span>{tItem.rating.toFixed(1)}</span>
              </div>
              <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 2, fontWeight: 500 }}>
                {tItem.reviews} {t("Reviews", lang)}
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: `${colors.line}80` }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: colors.ink }}>
                {tItem.experience} {t("Yrs", lang)}
              </div>
              <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 2, fontWeight: 500 }}>
                {t("Experience", lang)}
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: `${colors.line}80` }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: colors.ink }}>
                {tItem.languages.length}
              </div>
              <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 2, fontWeight: 500 }}>
                {t("Languages", lang)}
              </div>
            </div>
          </Card>
        </div>

        {/* Editorial Pull-Quote Biography */}
        <div className="fade-up" style={{ padding: "20px 20px 6px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            {t("Clinical Philosophy", lang)}
          </div>
          <div style={{
            padding: "18px 20px",
            borderLeft: `4px solid ${catColor}`,
            background: `${catColor}08`,
            borderRadius: "0 16px 16px 0",
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.01)",
          }}>
            <p className="font-display" style={{
              fontSize: "15.5px",
              lineHeight: 1.6,
              fontStyle: "italic",
              color: colors.ink,
              fontWeight: 400,
            }}>
              "{tItem.longBio}"
            </p>
          </div>
        </div>

        {/* Specialties */}
        <div className="fade-up" style={{ padding: "14px 20px 6px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 10,
              paddingLeft: 4,
            }}
          >
            {t("Specialties", lang)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tItem.specialties.map((s) => (
              <span
                key={s}
                style={{
                  background: colors.ivory,
                  border: `1px solid ${colors.line}60`,
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: colors.ink,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
              >
                {t(s, lang)}
              </span>
            ))}
          </div>
        </div>

        {/* Speaks */}
        <div className="fade-up" style={{ padding: "14px 20px 10px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            {t("Speaks", lang)}
          </div>
          <p style={{ fontSize: 14, color: colors.ink, fontWeight: 600, paddingLeft: 4 }}>
            {tItem.languages.map((l) => t(l, lang)).join(" · ")}
          </p>
        </div>

        {/* Reviews Section: Star distribution & horizontal quote carousel */}
        <div className="fade-up" style={{ padding: "14px 20px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: colors.inkSoft,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
              paddingLeft: 4,
            }}
          >
            {t("Client Reviews", lang)}
          </div>

          <Card style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              {/* Star Rating Summary */}
              <div style={{ textAlign: "center", minWidth: 100 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: colors.ink, lineHeight: 1.1 }} className="font-display">
                  {tItem.rating.toFixed(1)}
                </div>
                <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
                  <Stars rating={tItem.rating} size={14} />
                </div>
                <div style={{ fontSize: 11, color: colors.inkSoft, fontWeight: 500 }}>
                  {tItem.reviews} {t("verified ratings", lang)}
                </div>
              </div>

              {/* Progress Distribution */}
              <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 5 }}>
                {distributions.map((d) => (
                  <div key={d.stars} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.inkSoft, width: 34 }}>
                      {d.stars} {t(d.stars === 1 ? "Star" : "Stars", lang)}
                    </span>
                    <div style={{ flex: 1, height: 6, borderRadius: 99, overflow: "hidden", background: colors.indigoSoft }}>
                      <div style={{
                        width: `${d.pct}%`,
                        height: "100%",
                        background: colors.amber,
                        borderRadius: 99,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: colors.inkSoft, width: 28, textAlign: "right" }}>
                      {d.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Horizontal Quote Reviews Carousel */}
          <div
            style={{
              display: "flex",
              gap: 12,
              overflowX: "auto",
              paddingBottom: 10,
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            className="no-scrollbar"
          >
            {allReviewsToShow.map((rev, index) => (
              <div
                key={index}
                style={{
                  width: 250,
                  flexShrink: 0,
                  background: "#fff",
                  borderRadius: 18,
                  padding: 16,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
                  border: `1px solid ${colors.line}40`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                    <Stars rating={rev.rating} size={11} />
                  </div>
                  <p style={{
                    fontSize: 13,
                    lineHeight: 1.45,
                    fontStyle: "italic",
                    color: colors.ink,
                    marginBottom: 12,
                  }}>
                    "{t(rev.text, lang)}"
                  </p>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colors.inkSoft, borderTop: `1px solid ${colors.line}30`, paddingTop: 8 }}>
                  — {translateAuthor(rev.author)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky frosted glass bottom booking bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: `${colors.paper}E6`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: `1px solid ${colors.line}60`,
          padding: "16px 20px calc(env(safe-area-inset-bottom) + 16px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 25,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.04)",
        }}
        className="fade-up"
      >
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontWeight: 800, fontSize: 22, color: colors.ink }} className="font-display">
              {fmtMoney(tItem.price)}
            </span>
            <span style={{ fontSize: 12, color: colors.inkSoft, fontWeight: 500 }}>
              {t(tItem.priceUnit === "program" ? "/prg" : "/ses", lang)}
            </span>
          </div>
          <div style={{ fontSize: 11, color: colors.inkSoft, marginTop: 1, fontWeight: 500 }}>
            {tItem.priceUnit === "program" ? t("Full 6-week intensive", lang) : t("Pay per session", lang)}
          </div>
        </div>
        <div style={{ width: 170 }}>
          <Button full onClick={onBook} style={{ height: 46, borderRadius: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Calendar size={15} />
              <span>{t("Book Session", lang)}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
