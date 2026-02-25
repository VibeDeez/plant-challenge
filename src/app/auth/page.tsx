"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_ILLUSTRATIONS,
  ALL_ILLUSTRATIONS,
  PARADE_ILLUSTRATIONS,
} from "@/lib/constants";
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

/* -------------------------------------------------------
   useReveal — IntersectionObserver scroll-trigger hook
------------------------------------------------------- */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

/* -------------------------------------------------------
   Content data
------------------------------------------------------- */
const STEPS = [
  {
    num: "01",
    title: "Log Your Plants",
    desc: "Ate an apple? A handful of walnuts? Log each unique plant species you eat throughout the week.",
    illo: "/illustrations/character-radish.png",
  },
  {
    num: "02",
    title: "Watch Your Week Build",
    desc: "Track your progress toward 30 points with your weekly ring. Herbs and spices count too.",
    illo: "/illustrations/character-sunflower.png",
  },
  {
    num: "03",
    title: "Compete & Share",
    desc: "See how you stack up on the family leaderboard. Get the whole household involved.",
    illo: "/illustrations/character-tomato.png",
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
  { q: "Coffee and tea?", a: "¼ point EACH (like herbs/spices). Distinct plant species." },
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const router = useRouter();

  const stepsReveal = useReveal();
  const categoriesReveal = useReveal();
  const scienceReveal = useReveal();
  const tipsReveal = useReveal();
  const faqReveal = useReveal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
          }
        );
        if (resetError) throw resetError;
        setResetEmailSent(true);
      } else if (isSignUp) {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || "Me" },
          },
        });
        if (authError) throw authError;
        const joinCode = new URLSearchParams(window.location.search).get("join");
        router.push(joinCode ? `/join/${joinCode}` : "/");
        router.refresh();
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        const joinCode = new URLSearchParams(window.location.search).get("join");
        router.push(joinCode ? `/join/${joinCode}` : "/");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* PWA safe area cover */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-brand-dark h-safe-top" />

      {/* ===== HERO ===== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-dark grain mt-safe">

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* 3D headline */}
          <h1 className="mb-1">
            <span
              className="block text-[clamp(3rem,12vw,8rem)] font-black leading-[0.85] tracking-tight text-brand-green font-display animate-fadeInUp"
              style={{
                textShadow: "0 4px 0 #166534, 0 8px 0 #14532d, 0 12px 24px rgba(0,0,0,0.4)",
                animationDelay: "0.1s",
              }}
            >
              Plantmaxxing
            </span>
          </h1>

          {/* Mascot — the buff carrot */}
          <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 mt-2 -mb-2 animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
            <Image
              src="/illustrations/character-carrot.png"
              alt="Plantmaxxing mascot — a buff carrot flexing"
              width={288}
              height={288}
              className="object-contain animate-gentleFloat"
              unoptimized
              priority
            />
          </div>

          <div className="max-w-sm mx-auto mb-8 animate-fadeInUp" style={{ animationDelay: "0.5s" }}>
            <p className="text-lg sm:text-xl font-display text-brand-cream/80 leading-relaxed">
              Stop letting processed slop
              <br />
              <span className="font-bold whitespace-nowrap">cortisol-maxx</span> your flora.
            </p>
            <p className="text-lg sm:text-xl font-display text-brand-cream/80 leading-relaxed mt-4">
              Become <span className="text-brand-green font-bold">unmoggable.</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp" style={{ animationDelay: "0.7s" }}>
            <a
              href="#start"
              className="px-8 py-3.5 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-hover transition-colors text-lg"
            >
              Get Started
            </a>
            <a
              href="#start"
              className="px-8 py-3.5 text-orange-400 font-medium hover:text-orange-300 transition-colors text-lg"
            >
              Sign In
            </a>
          </div>
        </div>

      </section>

      {/* ===== BOTANICAL PARADE — auto-scrolling specimen strip ===== */}
      <section className="bg-brand-cream py-8 overflow-hidden grain-light">
        <p className="text-center text-[10px] font-medium text-brand-muted tracking-[0.2em] uppercase mb-5">
          Botanical Specimens &middot; 8 Categories
        </p>
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-brand-cream to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-brand-cream to-transparent z-10 pointer-events-none" />
          <div className="flex animate-botanicalScroll" style={{ width: "max-content" }}>
            {[...PARADE_ILLUSTRATIONS, ...PARADE_ILLUSTRATIONS].map((src, i) => (
              <div key={i} className="flex-shrink-0 mx-4">
                <Image
                  src={src}
                  alt=""
                  width={64}
                  height={64}
                  className="object-contain w-16 h-16 illo-showcase"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section ref={stepsReveal.ref} className="bg-brand-cream py-20 sm:py-28 px-6 grain-light">
        <div className="max-w-4xl mx-auto">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-16 font-display transition-all duration-700 ${
              stepsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            How It Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-5">
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className={`relative rounded-2xl overflow-hidden border border-brand-dark/10 transition-all duration-700 ${
                  stepsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: stepsReveal.visible ? `${100 + i * 150}ms` : "0ms" }}
              >
                {/* Character illustration */}
                <div className="flex items-end justify-center pt-6 px-4 bg-white/20">
                  <Image
                    src={step.illo}
                    alt=""
                    width={220}
                    height={280}
                    className="object-contain h-52 sm:h-64"
                    unoptimized
                  />
                </div>
                <div className="relative bg-white/30 backdrop-blur-sm p-6 text-center sm:text-left">
                  <div className="text-5xl font-bold text-brand-green/20 mb-3 font-display">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark mb-2">{step.title}</h3>
                  <p className="text-brand-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORY SHOWCASE — horizontal scroll of botanical plates ===== */}
      <section ref={categoriesReveal.ref} className="bg-brand-bg py-20 sm:py-28 grain-light">
        <div className="max-w-5xl mx-auto">
          <div className="px-6">
            <h2
              className={`text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-4 font-display transition-all duration-700 ${
                categoriesReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              8 Categories. Endless Variety.
            </h2>
            <p
              className={`text-center text-brand-muted mb-12 max-w-lg mx-auto transition-all duration-700 delay-100 ${
                categoriesReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              Every unique plant you eat earns points. The more diverse your plate, the healthier your gut.
            </p>
          </div>

          {/* Horizontal scroll with fade edges */}
          <div
            className={`relative transition-all duration-700 delay-200 ${
              categoriesReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-brand-bg to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-brand-bg to-transparent z-10 pointer-events-none" />

            <div className="overflow-x-auto no-scrollbar px-6">
              <div className="flex gap-4" style={{ width: "max-content" }}>
                {CATEGORY_DISPLAY.map((cat) => {
                  const color = CATEGORY_COLORS[cat.name];
                  const illustration = CATEGORY_ILLUSTRATIONS[cat.name];
                  return (
                    <div
                      key={cat.name}
                      className="w-52 flex-shrink-0 rounded-2xl border border-brand-dark/8 bg-white/60 overflow-hidden hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                      {/* Illustration showcase — the star of each card */}
                      <div className="h-40 flex items-center justify-center p-4 bg-white/30">
                        {illustration && (
                          <Image
                            src={illustration}
                            alt={cat.name}
                            width={140}
                            height={140}
                            className="object-contain max-h-full illo-showcase"
                          />
                        )}
                      </div>
                      {/* Info panel */}
                      <div className="p-4 text-center border-t border-brand-dark/5">
                        <h3 className="font-bold text-brand-dark text-sm mb-1 font-display">{cat.name}</h3>
                        <p className="text-xs text-brand-muted leading-snug mb-2">{cat.examples}</p>
                        <span
                          className="inline-block text-[11px] font-semibold tracking-wide uppercase"
                          style={{ color }}
                        >
                          {cat.pts}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== THE SCIENCE ===== */}
      <section ref={scienceReveal.ref} className="relative bg-brand-dark py-20 sm:py-28 px-6 overflow-hidden grain">
        {/* Botanical watermarks — new clean specimens */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -left-8 top-12 w-52 h-72 rotate-[-8deg]">
            <Image src="/illustrations/library/asparagus.png" alt="" width={200} height={280} className="object-contain illo-accent" />
          </div>
          <div className="absolute -right-6 bottom-8 w-48 h-48 rotate-[12deg]">
            <Image src="/illustrations/library/walnut.png" alt="" width={200} height={200} className="object-contain illo-accent" />
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-brand-cream mb-8 font-display transition-all duration-700 ${
              scienceReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Backed by the Largest Gut Study Ever Published
          </h2>
          <p
            className={`text-lg sm:text-xl text-brand-cream/70 leading-relaxed mb-8 transition-all duration-700 delay-100 ${
              scienceReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            People who ate 30+ plants per week had significantly more diverse gut bacteria
            — regardless of whether they were vegan, vegetarian, or omnivore.
          </p>
          <p
            className={`text-sm text-brand-cream/40 transition-all duration-700 delay-200 ${
              scienceReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Based on the American Gut Project research
          </p>
        </div>
      </section>

      {/* ===== TIPS ===== */}
      <section ref={tipsReveal.ref} className="bg-brand-bg py-20 sm:py-28 px-6 grain-light">
        <div className="max-w-5xl mx-auto">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-4 font-display transition-all duration-700 ${
              tipsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Tips for Hitting 30
          </h2>
          <p
            className={`text-center text-brand-muted mb-14 max-w-lg mx-auto transition-all duration-700 delay-100 ${
              tipsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Simple strategies to build plant diversity into every meal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {STRATEGIES.map((s, i) => {
              const Icon = STRATEGY_ICONS[s.icon];
              const illo = ALL_ILLUSTRATIONS[i % ALL_ILLUSTRATIONS.length];
              return (
                <div
                  key={s.name}
                  className={`relative overflow-hidden rounded-2xl border border-brand-dark/10 transition-all duration-700 ${
                    tipsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: tipsReveal.visible ? `${100 + i * 80}ms` : "0ms" }}
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
      <section ref={faqReveal.ref} className="bg-brand-cream py-20 sm:py-28 px-6 grain-light">
        <div className="max-w-3xl mx-auto">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-4 font-display transition-all duration-700 ${
              faqReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Common Questions
          </h2>
          <p
            className={`text-center text-brand-muted mb-14 max-w-lg mx-auto transition-all duration-700 delay-100 ${
              faqReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Edge cases, common mistakes, and special situations.
          </p>

          <div
            className={`bg-white/40 backdrop-blur-sm rounded-2xl border border-brand-dark/10 divide-y divide-brand-dark/5 overflow-hidden transition-all duration-700 delay-200 ${
              faqReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
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

      {/* ===== AUTH FORM ===== */}
      <section id="start" className="relative bg-brand-cream py-20 sm:py-28 px-6 overflow-hidden grain-light">
        {/* Botanical accents */}
        <div className="absolute inset-0 pointer-events-none hidden sm:block" aria-hidden="true">
          <div className="absolute -left-20 top-1/4 w-48 h-64 rotate-[6deg]">
            <Image src="/illustrations/library/lavender.png" alt="" width={190} height={260} className="object-contain illo-accent" />
          </div>
          <div className="absolute -right-16 bottom-1/4 w-44 h-44 rotate-[-12deg]">
            <Image src="/illustrations/library/turmeric.png" alt="" width={180} height={180} className="object-contain illo-accent" />
          </div>
        </div>

        <div className="relative max-w-sm mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-10 font-display">
            Start Plantmaxxing
          </h2>

          {/* Glassmorphic form card */}
          <div className="rounded-2xl border border-brand-dark/10 bg-white/30 backdrop-blur-sm p-6">
            {resetEmailSent ? (
              <div className="text-center py-4">
                <p className="text-sm font-semibold text-brand-green mb-1">
                  Check your email!
                </p>
                <p className="text-sm text-brand-muted">
                  We sent a password reset link to <strong>{email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setResetEmailSent(false);
                    setIsForgotPassword(false);
                    setError("");
                  }}
                  className="mt-4 text-sm font-semibold text-brand-dark hover:text-brand-green transition-colors"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && !isForgotPassword && (
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

                  {!isForgotPassword && (
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
                  )}

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
                      : isForgotPassword
                        ? "Send Reset Link"
                        : isSignUp
                          ? "Create Account"
                          : "Sign In"}
                  </button>
                </form>

                {!isSignUp && !isForgotPassword && (
                  <p className="mt-3 text-center">
                    <button
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError("");
                      }}
                      className="text-sm text-brand-muted hover:text-brand-green transition-colors"
                    >
                      Forgot password?
                    </button>
                  </p>
                )}

                <p className="mt-3 text-center text-sm text-brand-muted">
                  {isForgotPassword ? (
                    <button
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError("");
                      }}
                      className="font-semibold text-brand-dark hover:text-brand-green transition-colors"
                    >
                      Back to sign in
                    </button>
                  ) : (
                    <>
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
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative bg-brand-dark py-10 px-6 overflow-hidden grain">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image src="/illustrations/library/legume-hero.png" alt="" width={300} height={300} className="object-contain illo-ghost" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-sm text-brand-cream/40">
            Plantmaxxing &middot; Inspired by the American Gut Project research &middot; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </main>
  );
}
