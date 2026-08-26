import React from "react";
import { Lock, ShieldCheck, CreditCard, Sparkles } from "lucide-react";
import { colors } from "../../constants";
import { Language } from "../../utils/translations";

export interface CardDetails {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvc: string;
}

interface CardPaymentFormProps {
  cardDetails: CardDetails;
  setCardDetails: React.Dispatch<React.SetStateAction<CardDetails>>;
  lang?: Language;
  amount: number;
}

export function detectCardType(number: string): "visa" | "mastercard" | "generic" {
  const clean = number.replace(/\D/g, "");
  if (clean.startsWith("4")) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard";
  return "generic";
}

export function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 16);
  const groups = clean.match(/.{1,4}/g);
  return groups ? groups.join(" ") : clean;
}

export function formatExpiry(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
  }
  return clean;
}

export default function CardPaymentForm({
  cardDetails,
  setCardDetails,
  lang = "en",
  amount,
}: CardPaymentFormProps) {
  const cardType = detectCardType(cardDetails.cardNumber);

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails((prev) => ({ ...prev, cardNumber: formatted }));
  }

  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatExpiry(e.target.value);
    setCardDetails((prev) => ({ ...prev, expiry: formatted }));
  }

  function handleCvcChange(e: React.ChangeEvent<HTMLInputElement>) {
    const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardDetails((prev) => ({ ...prev, cvc: clean }));
  }

  function handleHolderChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCardDetails((prev) => ({ ...prev, cardHolder: e.target.value }));
  }

  return (
    <div className="space-y-4">
      {/* Minimalist Interactive Card Preview */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          borderRadius: 16,
          padding: "20px 22px",
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        {/* Ambient background glow & pattern */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(45, 90, 39, 0.35) 0%, rgba(0,0,0,0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top row: Chip + Brand Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Minimalist Metallic Chip */}
            <div
              style={{
                width: 38,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)",
                border: "1px solid rgba(255,255,255,0.3)",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 18,
                  borderRadius: 3,
                  border: "1px solid rgba(0,0,0,0.25)",
                  background: "rgba(255,255,255,0.15)",
                }}
              />
            </div>
            {/* Contactless symbol */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
              <path d="M8.5 16.5a5 5 0 0 1 0-9" />
              <path d="M12 19a8.5 8.5 0 0 0 0-14" />
              <path d="M15.5 21.5a12 12 0 0 0 0-19" />
            </svg>
          </div>

          {/* Dynamic Card Brand Badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {cardType === "visa" ? (
              <div
                style={{
                  background: "#FFFFFF",
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontWeight: 900,
                  fontSize: "14px",
                  fontStyle: "italic",
                  color: "#1A1F71",
                  letterSpacing: "1px",
                }}
              >
                VISA
              </div>
            ) : cardType === "mastercard" ? (
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#EB001B", opacity: 0.95 }} />
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "#F79E1B",
                    marginLeft: -10,
                    opacity: 0.95,
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  color: "rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.1)",
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                DEBIT / CREDIT
              </div>
            )}
          </div>
        </div>

        {/* Card Number display */}
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "17px",
            letterSpacing: "2.5px",
            color: "#F8FAFC",
            marginBottom: 18,
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          {cardDetails.cardNumber || "•••• •••• •••• ••••"}
        </div>

        {/* Bottom row: Cardholder Name & Expiry */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {lang === "so" ? "Magaca Kaadhka" : "Cardholder"}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#FFFFFF",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {cardDetails.cardHolder || (lang === "so" ? "MAGACAAGA OO BUUXA" : "YOUR FULL NAME")}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {lang === "so" ? "Dhicitaanka" : "Expires"}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#FFFFFF", fontFamily: "monospace", marginTop: 2 }}>
              {cardDetails.expiry || "MM/YY"}
            </div>
          </div>
        </div>
      </div>

      {/* Input Fields Form */}
      <div
        style={{
          background: colors.paper,
          border: `1px solid ${colors.line}`,
          borderRadius: 14,
          padding: "16px",
        }}
      >
        <div className="space-y-3">
          {/* Cardholder Name */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>
              {lang === "so" ? "Magaca Kaadhka ku qoran" : "Cardholder Name"}
            </label>
            <input
              type="text"
              placeholder={lang === "so" ? "e.g. Ahmed Mohamed Ali" : "e.g. Ahmed Mohamed Ali"}
              value={cardDetails.cardHolder}
              onChange={handleHolderChange}
              className="w-full p-2.5 rounded-xl border text-sm font-semibold focus:outline-none focus:border-indigo-500"
              style={{
                borderColor: colors.line,
                background: "#ffffff",
                color: colors.ink,
              }}
            />
          </div>

          {/* Card Number */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>
              {lang === "so" ? "Lambarka Kaadhka" : "Card Number"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="4532 •••• •••• ••••"
                value={cardDetails.cardNumber}
                onChange={handleNumberChange}
                maxLength={19}
                className="w-full p-2.5 pl-3 pr-24 rounded-xl border text-sm font-mono font-semibold focus:outline-none focus:border-indigo-500"
                style={{
                  borderColor: colors.line,
                  background: "#ffffff",
                  color: colors.ink,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "3px 6px",
                    borderRadius: 5,
                    background: cardType === "visa" ? "#EBF2FE" : cardType === "mastercard" ? "#FEF3EB" : "#F1F5F9",
                    color: cardType === "visa" ? "#1A1F71" : cardType === "mastercard" ? "#C2410C" : colors.inkSoft,
                  }}
                >
                  {cardType === "visa" ? "Visa" : cardType === "mastercard" ? "Mastercard" : "Debit"}
                </div>
              </div>
            </div>
          </div>

          {/* Expiry & CVC Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>
                {lang === "so" ? "Dhicitaanka (MM/YY)" : "Expires (MM/YY)"}
              </label>
              <input
                type="text"
                placeholder="MM / YY"
                value={cardDetails.expiry}
                onChange={handleExpiryChange}
                maxLength={5}
                className="w-full p-2.5 rounded-xl border text-sm font-mono font-semibold focus:outline-none focus:border-indigo-500 text-center"
                style={{
                  borderColor: colors.line,
                  background: "#ffffff",
                  color: colors.ink,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: colors.inkSoft, marginBottom: 4, textTransform: "uppercase" }}>
                {lang === "so" ? "CVC / CVV" : "Security Code (CVC)"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  placeholder="•••"
                  value={cardDetails.cvc}
                  onChange={handleCvcChange}
                  maxLength={4}
                  className="w-full p-2.5 rounded-xl border text-sm font-mono font-semibold focus:outline-none focus:border-indigo-500 text-center"
                  style={{
                    borderColor: colors.line,
                    background: "#ffffff",
                    color: colors.ink,
                  }}
                />
                <Lock size={13} color={colors.inkSoft} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Security / Encryption assurance */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
            paddingTop: 10,
            borderTop: `1px solid ${colors.line}`,
            fontSize: "11px",
            color: colors.inkSoft,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <ShieldCheck size={14} color={colors.acacia} />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "10.5px" }}>
            <span style={{ fontWeight: 700, color: colors.ink }}>Visa</span>
            <span>•</span>
            <span style={{ fontWeight: 700, color: colors.ink }}>Mastercard</span>
            <span>•</span>
            <span style={{ fontWeight: 700, color: colors.ink }}>Sifalo Pay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
