"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ILLUSTRATIONS } from "@/lib/constants";
import Image from "next/image";

const supabase = createClient();

const STEPS = [
  {
    num: "01",
    title: "Log Your Plants",
    desc: "Ate an apple? A handful of walnuts? Log each unique plant species you eat throughout the week.",
  },
  {
    num: "02",
    title: "Watch Your Week Build",
    desc: "Track your progress toward 30 points with your weekly ring. Herbs and spices count too.",
  },
  {
    num: "03",
    title: "Compete & Share",
    desc: "See how you stack up on the family leaderboard. Get the whole household involved.",
  },
];

const CATEGORY_DISPLAY = [
  { name: "Fruits", examples: "Apple, Banana, Mango, Blueberry", pts: "1 pt each" },
  { name: "Vegetables", examples: "Broccoli, Spinach, Carrot, Kale", pts: "1 pt each" },
  { name: "Whole Grains", examples: "Oats, Quinoa, Brown Rice, Barley", pts: "1 pt each" },
  { name: "Legumes", examples: "Chickpeas, Lentils, Black Beans", pts: "1 pt each" },
  { name: "Nuts", examples: "Almonds, Walnuts, Cashews, Pecans", pts: "1 pt each" },
  { name: "Seeds", examples: "Chia, Flax, Hemp, Pumpkin Seeds", pts: "1 pt each" },
  { name: "Herbs", examples: "Basil, Cilantro, Mint, Rosemary", pts: "\u00BC pt each" },
  { name: "Spices", examples: "Turmeric, Cumin, Cinnamon, Ginger", pts: "\u00BC pt each" },
];


export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || "Me" },
          },
        });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      }
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark grain">
        {/* Floating botanical illustrations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute -top-4 -left-6 w-48 h-48 opacity-[0.15] rotate-[-15deg]">
            <Image src="/illustrations/strawberry.png" alt="" width={200} height={200} className="object-contain" />
          </div>
          <div className="absolute top-16 -right-4 w-44 h-44 opacity-[0.14] rotate-[12deg]">
            <Image src="/illustrations/herbs.png" alt="" width={180} height={180} className="object-contain" />
          </div>
          <div className="absolute bottom-36 -left-2 w-40 h-40 opacity-[0.12] rotate-[8deg]">
            <Image src="/illustrations/spices.png" alt="" width={170} height={170} className="object-contain" />
          </div>
          <div className="absolute bottom-16 right-2 w-44 h-44 opacity-[0.14] rotate-[-10deg]">
            <Image src="/illustrations/legumes.png" alt="" width={180} height={180} className="object-contain" />
          </div>
          <div className="absolute top-1/2 -left-4 w-36 h-36 opacity-[0.10] rotate-[20deg]">
            <Image src="/illustrations/grains.png" alt="" width={150} height={150} className="object-contain" />
          </div>
          <div className="absolute top-1/3 right-2 w-36 h-36 opacity-[0.10] rotate-[-5deg]">
            <Image src="/illustrations/seeds.png" alt="" width={150} height={150} className="object-contain" />
          </div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* 3D headline */}
          <h1 className="mb-6">
            <span
              className="block text-[clamp(4rem,15vw,10rem)] font-black leading-[0.85] tracking-tight text-brand-green"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                textShadow: "0 4px 0 #166534, 0 8px 0 #14532d, 0 12px 24px rgba(0,0,0,0.4)",
              }}
            >
              30 Plants.
            </span>
            <span
              className="block text-[clamp(2.5rem,8vw,5.5rem)] font-bold leading-tight text-brand-cream mt-2"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              That&apos;s it.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-brand-cream/60 max-w-md mx-auto mb-12 leading-relaxed">
            Track your weekly plant diversity. Feed your gut. Transform your health.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#start"
              className="px-8 py-3.5 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-hover transition-colors text-lg"
            >
              Get Started
            </a>
            <a
              href="#start"
              className="px-8 py-3.5 text-brand-cream/50 font-medium hover:text-brand-cream transition-colors text-lg"
            >
              Sign In
            </a>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-brand-cream to-transparent" />
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="bg-brand-cream py-20 sm:py-28 px-6 grain-light">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-16"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5">
            {STEPS.map((step, i) => {
              const stepIllustrations = [
                "/illustrations/strawberry.png",
                "/illustrations/grains.png",
                "/illustrations/herbs.png",
              ];
              return (
                <div key={step.num} className="relative rounded-2xl overflow-hidden border border-brand-dark/10">
                  {/* Botanical background */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Image
                      src={stepIllustrations[i]}
                      alt=""
                      width={240}
                      height={240}
                      className="object-contain opacity-[0.18]"
                    />
                  </div>
                  <div className="relative bg-white/40 backdrop-blur-sm p-6 text-center sm:text-left">
                    <div
                      className="text-5xl font-bold text-brand-green/20 mb-3"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {step.num}
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark mb-2">{step.title}</h3>
                    <p className="text-brand-muted leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CATEGORY SHOWCASE ===== */}
      <section className="bg-brand-bg py-20 sm:py-28 px-6 grain-light">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-4"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            8 Categories. Endless Variety.
          </h2>
          <p className="text-center text-brand-muted mb-14 max-w-lg mx-auto">
            Every unique plant you eat earns points. The more diverse your plate, the healthier your gut.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORY_DISPLAY.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.name];
              const accent = CATEGORY_COLORS[cat.name];
              const illustration = CATEGORY_ILLUSTRATIONS[cat.name];
              return (
                <div
                  key={cat.name}
                  className="group relative rounded-2xl overflow-hidden border border-brand-dark/10 transition-all hover:shadow-lg hover:scale-[1.02]"
                >
                  {/* Full botanical illustration background */}
                  {illustration && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Image src={illustration} alt="" width={200} height={200} className="object-contain opacity-[0.20]" />
                    </div>
                  )}
                  {/* Glassmorphic overlay */}
                  <div className="relative bg-white/50 backdrop-blur-sm p-5 sm:p-6 text-center">
                    <div
                      className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${accent}18` }}
                    >
                      <Icon size={24} style={{ color: accent }} strokeWidth={1.75} />
                    </div>
                    <h3 className="font-bold text-brand-dark text-sm sm:text-base mb-1">{cat.name}</h3>
                    <p className="text-xs text-brand-muted leading-snug mb-2">{cat.examples}</p>
                    <span
                      className="inline-block text-[11px] font-semibold tracking-wide uppercase"
                      style={{ color: accent }}
                    >
                      {cat.pts}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== THE SCIENCE ===== */}
      <section className="relative bg-brand-dark py-20 sm:py-28 px-6 overflow-hidden grain">
        {/* Botanical watermarks */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -left-12 top-8 w-64 h-64 rotate-[-12deg]">
            <Image src="/illustrations/vegetables.png" alt="" width={260} height={260} className="object-contain opacity-[0.15]" />
          </div>
          <div className="absolute -right-8 bottom-4 w-56 h-56 rotate-[15deg]">
            <Image src="/illustrations/nuts.png" alt="" width={230} height={230} className="object-contain opacity-[0.15]" />
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-brand-cream mb-8"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Backed by the Largest Gut Study Ever Published
          </h2>
          <p className="text-lg sm:text-xl text-brand-cream/70 leading-relaxed mb-8">
            People who ate 30+ plants per week had significantly more diverse gut bacteria
            — regardless of whether they were vegan, vegetarian, or omnivore.
          </p>
          <p className="text-sm text-brand-cream/40">
            Based on the American Gut Project &amp; the work of Dr. Will Bulsiewicz
          </p>
        </div>
      </section>

      {/* ===== AUTH ===== */}
      <section id="start" className="relative bg-brand-cream py-20 sm:py-28 px-6 overflow-hidden grain-light">
        {/* Background botanical watermarks */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -left-16 top-1/4 w-56 h-56 rotate-[10deg]">
            <Image src="/illustrations/seeds.png" alt="" width={230} height={230} className="object-contain opacity-[0.15]" />
          </div>
          <div className="absolute -right-12 bottom-1/4 w-52 h-52 rotate-[-8deg]">
            <Image src="/illustrations/spices.png" alt="" width={210} height={210} className="object-contain opacity-[0.15]" />
          </div>
        </div>

        <div className="relative max-w-sm mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-10"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Start Your Challenge
          </h2>

          {/* Glassmorphic form card */}
          <div className="rounded-2xl border border-brand-dark/10 bg-white/40 backdrop-blur-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-brand-muted mb-1"
                  >
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-brand-dark/10 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-green"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-brand-muted mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-brand-dark/10 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-brand-muted mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-brand-dark/10 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover disabled:opacity-50 transition-colors"
              >
                {loading
                  ? "..."
                  : isSignUp
                    ? "Create Account"
                    : "Sign In"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-brand-muted">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="font-semibold text-brand-dark hover:text-brand-green transition-colors"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative bg-brand-dark py-10 px-6 overflow-hidden grain">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/illustrations/legumes.png" alt="" width={360} height={360} className="object-contain opacity-[0.1]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm text-brand-cream/40">
            30 Plant Point Challenge &middot; Based on the principles of Dr. Will Bulsiewicz &middot; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
