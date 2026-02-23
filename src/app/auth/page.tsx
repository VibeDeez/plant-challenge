"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_ILLUSTRATIONS, ALL_ILLUSTRATIONS } from "@/lib/constants";
import Accordion from "@/components/Accordion";
import Image from "next/image";
import {
  Flame,
  Cherry,
  LeafyGreen,
  Wheat,
  Nut,
  Sprout,
  type LucideIcon,
} from "lucide-react";

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

type StrategyIconKey = "Cherry" | "Flame" | "LeafyGreen" | "Wheat" | "Sprout" | "Nut";

const STRATEGY_ICONS: Record<StrategyIconKey, LucideIcon> = {
  Cherry,
  Flame,
  LeafyGreen,
  Wheat,
  Sprout,
  Nut,
};

const STRATEGIES: { name: string; desc: string; icon: StrategyIconKey }[] = [
  { name: "Power Breakfast", desc: "Overnight oats with oats, chia, walnuts, blueberries, banana, and cinnamon = 5.25 points before leaving the house.", icon: "Cherry" },
  { name: "Spice Rack Hack", desc: "Use 4-8 different spices daily. Over a week, herbs and spices alone can contribute 7-10+ points.", icon: "Flame" },
  { name: "Mixed Bag Approach", desc: "Buy pre-mixed bags: mixed greens, trail mix, frozen stir-fry blends. Each component counts individually.", icon: "LeafyGreen" },
  { name: "Grain Rotation", desc: "Rotate through oats, quinoa, barley, farro, buckwheat, millet, and brown rice. 7 grain points with zero extra effort.", icon: "Wheat" },
  { name: "Smoothie Stacking", desc: "A single smoothie can contain 6-10 plants: spinach, banana, mango, hemp seeds, flaxseed, ginger, turmeric.", icon: "Sprout" },
  { name: "Topping Tax", desc: "Add seeds, nuts, or fresh herbs to every meal. Pumpkin seeds on soup, sesame on stir-fry. Adds 2-4 points daily.", icon: "Nut" },
];

const EDGE_CASES = [
  { q: "Red, green, brown lentils?", a: "1 point EACH. Different varieties have different fiber profiles." },
  { q: "Red, green, yellow bell pepper?", a: "1 point TOTAL. Same species, just different ripeness stages." },
  { q: "Tofu, tempeh, edamame?", a: "1 point TOTAL (soy). All derived from soybeans." },
  { q: "White rice?", a: "0 points. It's a refined grain. Switch to brown rice for 1 point." },
  { q: "Coffee and tea?", a: "1 point EACH. Distinct plant species." },
  { q: "Dark chocolate (>70%)?", a: "1 point. Minimally processed cacao bean counts." },
  { q: "Frozen vegetables?", a: "Full points. Flash-freezing retains nutrients." },
  { q: "Nut butters and tahini?", a: "Yes — ground but not chemically processed. PB = 1 peanut point." },
  { q: "Fermented plants (kimchi, sauerkraut)?", a: "Counts for the base plant AND adds probiotic benefits." },
  { q: "Mushrooms and seaweed?", a: "1 point each. Not technically plants, but included for gut benefits." },
];

const COMMON_MISTAKES = [
  { title: "Counting processed foods", desc: "White bread, pasta, and vegetable oils don't count. If you can't recognize the original plant, it doesn't earn a point." },
  { title: "Double-counting the same species", desc: "Chickpeas on Monday and hummus on Wednesday = 1 chickpea point for the week." },
  { title: "Counting herbs as full points", desc: "Herbs and spices are 1/4 point because you eat them in small quantities." },
  { title: "Going too hard too fast", desc: "Increase by 5 plants per week over a month. Your gut bacteria need time to adapt." },
];

const SPECIAL_SITUATIONS = [
  { q: "I have IBS or gut sensitivities", a: "Use small amounts of many plants. A single blueberry counts. A teaspoon of chia counts." },
  { q: "My family has picky eaters", a: "Gamify it for kids: make a colorful chart, blend plants into smoothies or sauces." },
  { q: "I'm on a tight budget", a: "Frozen veggies, canned beans, dried lentils, and bulk seeds are among the cheapest foods — and all fully valid." },
  { q: "I'm traveling", a: "Pack mixed nuts, seeds, and dried fruit. Lower your target to 20 during travel weeks." },
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
          <div className="absolute -top-4 -left-6 w-48 h-48 illo-accent rotate-[-15deg] animate-gentleFloat">
            <Image src="/illustrations/strawberry.png" alt="" width={200} height={200} className="object-contain" />
          </div>
          <div className="absolute top-16 -right-4 w-44 h-44 illo-accent rotate-[12deg] animate-gentleFloat" style={{ animationDelay: "1.2s" }}>
            <Image src="/illustrations/herbs.png" alt="" width={180} height={180} className="object-contain" />
          </div>
          <div className="absolute bottom-36 -left-2 w-40 h-40 illo-accent rotate-[8deg] animate-gentleFloat" style={{ animationDelay: "2.4s" }}>
            <Image src="/illustrations/spices.png" alt="" width={170} height={170} className="object-contain" />
          </div>
          <div className="absolute bottom-16 right-2 w-44 h-44 illo-accent rotate-[-10deg] animate-gentleFloat" style={{ animationDelay: "0.8s" }}>
            <Image src="/illustrations/legumes.png" alt="" width={180} height={180} className="object-contain" />
          </div>
          <div className="absolute top-1/2 -left-4 w-36 h-36 illo-accent rotate-[20deg] animate-gentleFloat" style={{ animationDelay: "1.8s" }}>
            <Image src="/illustrations/grains.png" alt="" width={150} height={150} className="object-contain" />
          </div>
          <div className="absolute top-1/3 right-2 w-36 h-36 illo-accent rotate-[-5deg] animate-gentleFloat" style={{ animationDelay: "3s" }}>
            <Image src="/illustrations/seeds.png" alt="" width={150} height={150} className="object-contain" />
          </div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* 3D headline */}
          <h1 className="mb-6">
            <span
              className="block text-[clamp(4rem,15vw,10rem)] font-black leading-[0.85] tracking-tight text-brand-green font-display animate-fadeInUp"
              style={{
                textShadow: "0 4px 0 #166534, 0 8px 0 #14532d, 0 12px 24px rgba(0,0,0,0.4)",
                animationDelay: "0.1s",
              }}
            >
              30 Plants.
            </span>
            <span
              className="block text-[clamp(2.5rem,8vw,5.5rem)] font-bold leading-tight text-brand-cream mt-2 font-display animate-fadeInUp"
              style={{ animationDelay: "0.3s" }}
            >
              That&apos;s it.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-brand-cream/60 max-w-md mx-auto mb-12 leading-relaxed animate-fadeInUp" style={{ animationDelay: "0.5s" }}>
            Track your weekly plant diversity. Feed your gut. Transform your health.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp" style={{ animationDelay: "0.7s" }}>
            <a
              href="#start"
              className="px-8 py-3.5 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-hover transition-colors text-lg"
            >
              Get Started
            </a>
            <a
              href="#start"
              className="px-8 py-3.5 text-brand-rose-light/70 font-medium hover:text-brand-cream transition-colors text-lg"
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
            className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-16 font-display animate-fadeInUp"
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
                <div key={step.num} className="relative rounded-2xl overflow-hidden border border-brand-dark/10 animate-fadeInUp" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
                  {/* Botanical background */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Image
                      src={stepIllustrations[i]}
                      alt=""
                      width={240}
                      height={240}
                      className="object-contain illo-accent"
                    />
                  </div>
                  <div className="relative bg-white/30 backdrop-blur-sm p-6 text-center sm:text-left">
                    <div
                      className="text-5xl font-bold text-brand-green/20 mb-3 font-display"
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
            className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-4 font-display"
          >
            8 Categories. Endless Variety.
          </h2>
          <p className="text-center text-brand-muted mb-14 max-w-lg mx-auto">
            Every unique plant you eat earns points. The more diverse your plate, the healthier your gut.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORY_DISPLAY.map((cat, i) => {
              const Icon = CATEGORY_ICONS[cat.name];
              const accent = CATEGORY_COLORS[cat.name];
              const illustration = CATEGORY_ILLUSTRATIONS[cat.name];
              return (
                <div
                  key={cat.name}
                  className="group relative rounded-2xl overflow-hidden border border-brand-dark/10 transition-all hover:shadow-lg hover:scale-[1.02] animate-fadeIn"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Full botanical illustration background */}
                  {illustration && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Image src={illustration} alt="" width={200} height={200} className="object-contain illo-accent" />
                    </div>
                  )}
                  {/* Glassmorphic overlay */}
                  <div className="relative bg-white/30 backdrop-blur-sm p-5 sm:p-6 text-center">
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
            <Image src="/illustrations/vegetables.png" alt="" width={260} height={260} className="object-contain illo-accent" />
          </div>
          <div className="absolute -right-8 bottom-4 w-56 h-56 rotate-[15deg]">
            <Image src="/illustrations/nuts.png" alt="" width={230} height={230} className="object-contain illo-accent" />
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2
            className="text-3xl sm:text-4xl font-bold text-brand-cream mb-8 font-display animate-fadeIn"
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

      {/* ===== TIPS ===== */}
      <section className="bg-brand-bg py-20 sm:py-28 px-6 grain-light">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-4 font-display">
            Tips for Hitting 30
          </h2>
          <p className="text-center text-brand-muted mb-14 max-w-lg mx-auto">
            Simple strategies to build plant diversity into every meal.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {STRATEGIES.map((s, i) => {
              const Icon = STRATEGY_ICONS[s.icon];
              const illo = ALL_ILLUSTRATIONS[i % ALL_ILLUSTRATIONS.length];
              return (
                <div
                  key={s.name}
                  className="relative overflow-hidden rounded-2xl border border-brand-dark/10 animate-fadeIn"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 pointer-events-none">
                    <Image src={illo} alt="" width={96} height={96} className="object-contain illo-ghost" />
                  </div>
                  <div className="relative bg-white/30 backdrop-blur-sm p-5">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-dark mb-3">
                      <Icon size={18} className="text-brand-cream" />
                    </div>
                    <h3 className="font-bold text-brand-dark text-sm mb-1 font-display">{s.name}</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="bg-brand-cream py-20 sm:py-28 px-6 grain-light">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-4 font-display">
            Common Questions
          </h2>
          <p className="text-center text-brand-muted mb-14 max-w-lg mx-auto">
            Edge cases, common mistakes, and special situations.
          </p>

          <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-brand-dark/10 divide-y divide-brand-dark/5 overflow-hidden">
            <div className="px-4">
              <Accordion title="What Counts? (Edge Cases)" defaultOpen>
                <div className="space-y-2">
                  {EDGE_CASES.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-brand-dark font-medium text-xs py-1 group-open:text-brand-green">
                        {item.q}
                      </summary>
                      <p className="text-xs text-brand-muted mt-1 ml-1 pb-1">{item.a}</p>
                    </details>
                  ))}
                </div>
              </Accordion>
            </div>

            <div className="px-4">
              <Accordion title="Common Mistakes">
                <ul className="space-y-3">
                  {COMMON_MISTAKES.map((item, i) => (
                    <li key={i}>
                      <p className="text-xs font-semibold text-brand-dark">{item.title}</p>
                      <p className="text-xs text-brand-muted mt-0.5">{item.desc}</p>
                    </li>
                  ))}
                </ul>
              </Accordion>
            </div>

            <div className="px-4">
              <Accordion title="Special Situations">
                <div className="space-y-2">
                  {SPECIAL_SITUATIONS.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-brand-dark font-medium text-xs py-1 group-open:text-brand-green">
                        {item.q}
                      </summary>
                      <p className="text-xs text-brand-muted mt-1 ml-1 pb-1">{item.a}</p>
                    </details>
                  ))}
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* ===== AUTH ===== */}
      <section id="start" className="relative bg-brand-cream py-20 sm:py-28 px-6 overflow-hidden grain-light">
        {/* Background botanical watermarks */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -left-16 top-1/4 w-56 h-56 rotate-[10deg]">
            <Image src="/illustrations/seeds.png" alt="" width={230} height={230} className="object-contain illo-accent" />
          </div>
          <div className="absolute -right-12 bottom-1/4 w-52 h-52 rotate-[-8deg]">
            <Image src="/illustrations/spices.png" alt="" width={210} height={210} className="object-contain illo-accent" />
          </div>
        </div>

        <div className="relative max-w-sm mx-auto">
          <h2
            className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-10 font-display"
          >
            Start Your Challenge
          </h2>

          {/* Glassmorphic form card */}
          <div className="rounded-2xl border border-brand-dark/10 bg-white/30 backdrop-blur-sm p-6">
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
          <Image src="/illustrations/legumes.png" alt="" width={360} height={360} className="object-contain illo-ghost" />
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
