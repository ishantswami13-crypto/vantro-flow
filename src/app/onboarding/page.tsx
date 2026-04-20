"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Types & data
// ─────────────────────────────────────────────────────────────────────────────

interface BizType {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  color: string;
  lightColor: string;
}

const businessTypes: BizType[] = [
  {
    id: "distributor",
    icon: "🏪",
    title: "Distributor / Trader",
    subtitle: "₹1Cr–₹50Cr revenue",
    description: "Collections, cash flow, receivables management",
    tags: ["Collections", "Cash Flow", "Receivables"],
    color: "#0D9488",
    lightColor: "#F0FDFA",
  },
  {
    id: "midsize",
    icon: "🏢",
    title: "Mid-Size Company",
    subtitle: "₹50Cr–₹500Cr revenue",
    description: "Supply chain visibility and credit risk management",
    tags: ["Supply Chain", "Credit Risk", "Team Reports"],
    color: "#7C3AED",
    lightColor: "#F5F3FF",
  },
  {
    id: "enterprise",
    icon: "🏭",
    title: "Large Enterprise / MNC",
    subtitle: "₹500Cr+ revenue",
    description: "Multi-entity reporting and real-time intelligence",
    tags: ["Multi-Entity", "Compliance", "Intelligence"],
    color: "#D97706",
    lightColor: "#FFFBEB",
  },
  {
    id: "startup",
    icon: "🚀",
    title: "Startup",
    subtitle: "Early stage",
    description: "Financial foundations, burn rate, runway tracking",
    tags: ["Burn Rate", "Runway", "Growth"],
    color: "#E5354A",
    lightColor: "#FFF1F2",
  },
];

const industryOptions: Record<string, string[]> = {
  distributor: ["Electrical Goods", "Pharma", "FMCG", "Textile", "Auto Parts", "Other"],
  midsize: ["Manufacturing", "Distribution", "IT Services", "Retail", "Logistics", "Other"],
  enterprise: ["Conglomerate", "FMCG", "Banking & Finance", "IT/Tech", "Manufacturing", "Other"],
  startup: ["Fintech", "SaaS", "D2C", "Services", "EdTech", "Other"],
};

const cityOptions = ["Delhi", "Mumbai", "Bangalore", "Chennai", "Hyderabad", "Pune", "Ahmedabad", "Kolkata", "Other"];
const teamSizeOptions = ["Just me", "2-10 people", "11-50 people", "51-200 people", "200+ people"];

interface Feature { icon: string; title: string; desc: string; }
interface WelcomeConfig {
  emoji: string;
  headline: (name: string) => string;
  subtext: string;
  features: Feature[];
  cta: string;
  ctaLink: string;
}

const welcomeConfigs: Record<string, WelcomeConfig> = {
  distributor: {
    emoji: "🎯",
    headline: (n) => `Your collections command center is ready, ${n}!`,
    subtext: "Start by uploading your invoices from Tally or manually add your first invoice.",
    features: [
      { icon: "📋", title: "Daily Follow-Up List", desc: "AI tells you who to call every morning" },
      { icon: "💬", title: "AI Hinglish Reminders", desc: "Generate WhatsApp messages in seconds" },
      { icon: "📈", title: "Cash Flow Forecast", desc: "Know your cash position next week" },
    ],
    cta: "Upload Invoices →",
    ctaLink: "/upload",
  },
  midsize: {
    emoji: "🔍",
    headline: (n) => `Your supply chain intelligence is ready, ${n}!`,
    subtext: "Connect your financial data to get real-time visibility across your supply chain.",
    features: [
      { icon: "🔗", title: "Supply Chain Health", desc: "See financial health of all partners" },
      { icon: "⚠️", title: "Credit Risk Alerts", desc: "Early warning before customers default" },
      { icon: "👥", title: "Team Reports", desc: "Share insights across your finance team" },
    ],
    cta: "Go to Dashboard →",
    ctaLink: "/",
  },
  enterprise: {
    emoji: "🌐",
    headline: (n) => `Your financial intelligence platform is ready, ${n}!`,
    subtext: "Configure your entities and connect your financial data sources.",
    features: [
      { icon: "🏢", title: "Multi-Entity Dashboard", desc: "See all subsidiaries in one view" },
      { icon: "⚡", title: "Real-Time Alerts", desc: "Know about risks before they escalate" },
      { icon: "📊", title: "Compliance Reports", desc: "Automated regulatory reporting" },
    ],
    cta: "Set Up Dashboard →",
    ctaLink: "/",
  },
  startup: {
    emoji: "🚀",
    headline: (n) => `Your financial foundation is ready, ${n}!`,
    subtext: "Track your burn rate, runway, and revenue from day one.",
    features: [
      { icon: "🔥", title: "Burn Rate Tracker", desc: "Know exactly how fast you spend" },
      { icon: "⏱️", title: "Runway Calculator", desc: "How many months of cash do you have" },
      { icon: "📈", title: "Revenue Dashboard", desc: "Track growth week over week" },
    ],
    cta: "Start Tracking →",
    ctaLink: "/",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Root page
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    city: "",
    industry: "",
    teamSize: "",
  });

  // Already onboarded → go home
  useEffect(() => {
    if (localStorage.getItem("vantro_onboarded")) {
      router.replace("/");
    }
  }, [router]);

  // Persist on step 4
  useEffect(() => {
    if (step === 4) {
      localStorage.setItem("vantro_onboarded", "true");
      localStorage.setItem("vantro_business_type", businessType);
      localStorage.setItem("vantro_user_name", formData.name);
    }
  }, [step, businessType, formData.name]);

  const handleBizSelect = useCallback((id: string) => {
    setBusinessType(id);
    setTimeout(() => setStep(3), 300);
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleComplete = (link: string) => {
    router.push(link);
    router.refresh();
  };

  let stepContent: ReactNode = null;

  if (step === 1) {
    stepContent = <WelcomeStep onNext={() => setStep(2)} />;
  } else if (step === 2) {
    stepContent = <BusinessTypeStep selected={businessType} onSelect={handleBizSelect} onBack={() => setStep(1)} />;
  } else if (step === 3) {
    stepContent = (
      <DetailsStep
        businessType={businessType}
        formData={formData}
        onChange={handleFormChange}
        onContinue={() => setStep(4)}
        onBack={() => setStep(2)}
      />
    );
  } else if (step === 4) {
    stepContent = <SuccessStep businessType={businessType} userName={formData.name} onComplete={handleComplete} />;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');

        @keyframes ob1 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(55px,-38px) scale(1.09); }
        }
        @keyframes ob2 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-48px,55px) scale(1.07); }
        }
        @keyframes ob3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(36px,28px) scale(1.11); }
        }
        @keyframes ob-bounce {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        .ob1 { animation: ob1 9s ease-in-out infinite; }
        .ob2 { animation: ob2 13s ease-in-out infinite; }
        .ob3 { animation: ob3 16s ease-in-out infinite; }
        .ob-bounce { animation: ob-bounce 2.2s ease-in-out infinite; }

        .ob-card {
          transition: transform 200ms ease, box-shadow 200ms ease, border-color 150ms ease, background 150ms ease;
        }
        .ob-card:hover { transform: translateY(-3px); }

        .ob-in {
          background: #F9FAFB;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          padding: 12px 16px;
          width: 100%;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 150ms, box-shadow 150ms;
          appearance: none;
          -webkit-appearance: none;
          color: #111827;
        }
        .ob-in:focus {
          border-color: #0D9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,0.12);
        }
        .ob-sel-wrap { position: relative; }
        .ob-sel-wrap::after {
          content: '▾';
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #9CA3AF;
          font-size: 0.75rem;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          overflowY: "auto",
          background: "#fff",
        }}
      >
        <div key={step} className="fade-up">
          {stepContent}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 1 — Welcome
// ─────────────────────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Animated blobs — CSS only */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div
          className="ob1"
          style={{
            position: "absolute",
            top: "-10%",
            left: "-8%",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(13,148,136,0.18) 0%, transparent 68%)",
            filter: "blur(48px)",
            opacity: 0.9,
          }}
        />
        <div
          className="ob2"
          style={{
            position: "absolute",
            bottom: "-12%",
            right: "-6%",
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 68%)",
            filter: "blur(56px)",
            opacity: 0.9,
          }}
        />
        <div
          className="ob3"
          style={{
            position: "absolute",
            top: "35%",
            left: "52%",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(13,148,136,0.10) 0%, transparent 70%)",
            filter: "blur(32px)",
            opacity: 0.9,
          }}
        />
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "2rem 1.5rem",
          maxWidth: 580,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#0D9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 26,
              fontWeight: 800,
              boxShadow: "0 14px 32px rgba(13,148,136,0.30)",
              fontFamily: "'Bricolage Grotesque', system-ui",
            }}
          >
            V
          </div>
          <span
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui",
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "#111827",
            }}
          >
            Vantro
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', system-ui",
            fontSize: "clamp(2.4rem, 6vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#111827",
            lineHeight: 1.05,
            margin: "0 0 20px",
          }}
        >
          Financial intelligence
          <br />
          for every business
        </h1>

        <p
          style={{
            fontSize: "1.2rem",
            color: "#6B7280",
            margin: "0 auto 52px",
            lineHeight: 1.5,
          }}
        >
          Know your business. Always.
        </p>

        <button
          onClick={onNext}
          style={{
            background: "#0D9488",
            color: "#fff",
            border: "none",
            borderRadius: "1rem",
            padding: "18px 44px",
            fontSize: "1.05rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Bricolage Grotesque', system-ui",
            letterSpacing: "-0.01em",
            boxShadow: "0 10px 28px rgba(13,148,136,0.28)",
            transition: "transform 150ms ease, box-shadow 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 16px 36px rgba(13,148,136,0.34)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(13,148,136,0.28)";
          }}
        >
          Get Started →
        </button>

        <p style={{ marginTop: 16, fontSize: "0.78rem", color: "#9CA3AF" }}>
          Takes less than 2 minutes · No credit card required
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 2 — Business Type
// ─────────────────────────────────────────────────────────────────────────────

function BusinessTypeStep({
  selected,
  onSelect,
  onBack,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3.5rem 1.5rem",
      }}
    >
      <ProgressDots filled={1} />

      <div style={{ maxWidth: 880, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#111827",
              margin: "0 0 12px",
            }}
          >
            What best describes your business?
          </h2>
          <p style={{ color: "#6B7280", fontSize: "1.05rem", margin: 0 }}>
            We&apos;ll personalize your Vantro experience
          </p>
        </div>

        {/* 2×2 grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {businessTypes.map((biz) => {
            const active = selected === biz.id;
            return (
              <button
                key={biz.id}
                className="ob-card"
                onClick={() => onSelect(biz.id)}
                style={{
                  textAlign: "left",
                  padding: "24px 22px",
                  borderRadius: "1rem",
                  border: active ? `2px solid ${biz.color}` : "2px solid #F3F4F6",
                  background: active ? biz.lightColor : "#fff",
                  cursor: "pointer",
                  boxShadow: active
                    ? `0 8px 24px ${biz.color}22`
                    : "0 1px 4px rgba(0,0,0,0.06)",
                  position: "relative",
                }}
              >
                {/* Checkmark */}
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: biz.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}

                <div style={{ fontSize: "2.4rem", marginBottom: 14 }}>{biz.icon}</div>

                <div
                  style={{
                    fontFamily: "'Bricolage Grotesque', system-ui",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: 4,
                  }}
                >
                  {biz.title}
                </div>
                <div style={{ fontSize: "0.82rem", color: "#9CA3AF", marginBottom: 10 }}>
                  {biz.subtitle}
                </div>
                <p style={{ fontSize: "0.85rem", color: "#6B7280", margin: "0 0 16px", lineHeight: 1.5 }}>
                  {biz.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {biz.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        background: active ? `${biz.color}18` : biz.lightColor,
                        color: active ? biz.color : "#6B7280",
                        border: `1px solid ${active ? `${biz.color}35` : "#E5E7EB"}`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 28,
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "#F9FAFB",
              border: "1.5px solid #E5E7EB",
              borderRadius: 12,
              padding: "10px 22px",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <p style={{ fontSize: "0.8rem", color: "#9CA3AF", alignSelf: "center" }}>
            Select a type to continue
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 3 — Details
// ─────────────────────────────────────────────────────────────────────────────

function DetailsStep({
  businessType,
  formData,
  onChange,
  onContinue,
  onBack,
}: {
  businessType: string;
  formData: { name: string; businessName: string; city: string; industry: string; teamSize: string };
  onChange: (field: string, value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const industries = industryOptions[businessType] ?? industryOptions.startup;
  const canContinue = formData.name.trim() && formData.businessName.trim();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3.5rem 1.5rem",
      }}
    >
      <ProgressDots filled={2} />

      <div style={{ maxWidth: 520, width: "100%" }}>
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', system-ui",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#111827",
            margin: "0 0 8px",
          }}
        >
          Tell us about yourself
        </h2>
        <p style={{ color: "#6B7280", fontSize: "0.95rem", margin: "0 0 36px" }}>
          Help us set up your workspace correctly
        </p>

        <div
          style={{
            background: "#fff",
            border: "1.5px solid #E5E7EB",
            borderRadius: 20,
            padding: "28px 26px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Name */}
            <ObField label="Your Name" required>
              <input
                className="ob-in"
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Rajesh Kumar"
              />
            </ObField>

            {/* Business Name */}
            <ObField label="Business Name" required>
              <input
                className="ob-in"
                value={formData.businessName}
                onChange={(e) => onChange("businessName", e.target.value)}
                placeholder="Kumar Electricals Pvt Ltd"
              />
            </ObField>

            {/* City */}
            <ObField label="City">
              <div className="ob-sel-wrap">
                <select
                  className="ob-in"
                  value={formData.city}
                  onChange={(e) => onChange("city", e.target.value)}
                >
                  <option value="">Select city</option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </ObField>

            {/* Industry */}
            <ObField label="Industry">
              <div className="ob-sel-wrap">
                <select
                  className="ob-in"
                  value={formData.industry}
                  onChange={(e) => onChange("industry", e.target.value)}
                >
                  <option value="">Select industry</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </ObField>

            {/* Team size */}
            <ObField label="Team Size">
              <div className="ob-sel-wrap">
                <select
                  className="ob-in"
                  value={formData.teamSize}
                  onChange={(e) => onChange("teamSize", e.target.value)}
                >
                  <option value="">Select team size</option>
                  {teamSizeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </ObField>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            onClick={onBack}
            style={{
              background: "#F9FAFB",
              border: "1.5px solid #E5E7EB",
              borderRadius: 12,
              padding: "13px 22px",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#374151",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            ← Back
          </button>
          <button
            onClick={canContinue ? onContinue : undefined}
            disabled={!canContinue}
            style={{
              flex: 1,
              background: canContinue ? "#0D9488" : "#E5E7EB",
              color: canContinue ? "#fff" : "#9CA3AF",
              border: "none",
              borderRadius: 12,
              padding: "13px",
              fontSize: "0.95rem",
              fontWeight: 700,
              cursor: canContinue ? "pointer" : "not-allowed",
              fontFamily: "'Bricolage Grotesque', system-ui",
              transition: "background 150ms, color 150ms, box-shadow 150ms",
              boxShadow: canContinue ? "0 6px 18px rgba(13,148,136,0.22)" : "none",
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 4 — Personalized Success
// ─────────────────────────────────────────────────────────────────────────────

function SuccessStep({
  businessType,
  userName,
  onComplete,
}: {
  businessType: string;
  userName: string;
  onComplete: (link: string) => void;
}) {
  const config = welcomeConfigs[businessType] ?? welcomeConfigs.startup;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3.5rem 1.5rem",
        textAlign: "center",
      }}
    >
      <ProgressDots filled={4} />

      <div style={{ maxWidth: 640, width: "100%" }}>
        {/* Bouncing emoji */}
        <div className="ob-bounce" style={{ fontSize: "5rem", marginBottom: 28, lineHeight: 1 }}>
          {config.emoji}
        </div>

        <h1
          style={{
            fontFamily: "'Bricolage Grotesque', system-ui",
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#111827",
            margin: "0 0 16px",
            lineHeight: 1.2,
          }}
        >
          {config.headline(userName || "there")}
        </h1>

        <p
          style={{
            color: "#6B7280",
            fontSize: "1rem",
            margin: "0 auto 40px",
            lineHeight: 1.6,
            maxWidth: 500,
          }}
        >
          {config.subtext}
        </p>

        {/* Feature cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 14,
            marginBottom: 40,
          }}
        >
          {config.features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "#F9FAFB",
                border: "1.5px solid #E5E7EB",
                borderRadius: 14,
                padding: "18px 16px",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: 10 }}>{f.icon}</div>
              <div
                style={{
                  fontFamily: "'Bricolage Grotesque', system-ui",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 4,
                }}
              >
                {f.title}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#6B7280", lineHeight: 1.45 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => onComplete(config.ctaLink)}
          style={{
            background: "#0D9488",
            color: "#fff",
            border: "none",
            borderRadius: "1rem",
            padding: "16px 40px",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Bricolage Grotesque', system-ui",
            boxShadow: "0 10px 28px rgba(13,148,136,0.28)",
            marginBottom: 16,
            transition: "transform 150ms, box-shadow 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 16px 36px rgba(13,148,136,0.34)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(13,148,136,0.28)";
          }}
        >
          {config.cta}
        </button>

        <div>
          <button
            onClick={() => onComplete("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              color: "#9CA3AF",
              textDecoration: "underline",
            }}
          >
            or explore the dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function ProgressDots({ filled }: { filled: number }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 44, alignItems: "center" }}>
      {[1, 2, 3, 4].map((dot) => (
        <div
          key={dot}
          style={{
            height: 6,
            width: dot === filled ? 28 : dot < filled ? 18 : 10,
            borderRadius: 999,
            background: dot <= filled ? "#0D9488" : "#E5E7EB",
            transition: "all 350ms ease",
          }}
        />
      ))}
    </div>
  );
}

function ObField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "block" }}>
      <span
        style={{
          display: "block",
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "#374151",
          marginBottom: 6,
          letterSpacing: "0.01em",
        }}
      >
        {label}
        {required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  );
}
