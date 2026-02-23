"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Accordion from "@/components/Accordion";
import { ALL_ILLUSTRATIONS } from "@/lib/constants";
import {
  Flame,
  Cherry,
  LeafyGreen,
  Wheat,
  Nut,
  Sprout,
  BookOpen,
  Check,
  X,
  type LucideIcon,
} from "lucide-react";

/* -------------------------------------------------------
   useReveal — IntersectionObserver scroll-trigger hook
   Fires once (threshold 0.15), then disconnects.
------------------------------------------------------- */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible };
}

/* -------------------------------------------------------
   getHeroIllustrations — deterministic daily 3-pick
------------------------------------------------------- */
function getHeroIllustrations(): string[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const len = ALL_ILLUSTRATIONS.length;
  return [
    ALL_ILLUSTRATIONS[dayOfYear % len],
    ALL_ILLUSTRATIONS[(dayOfYear + 3) % len],
    ALL_ILLUSTRATIONS[(dayOfYear + 6) % len],
  ];
}

/* =======================================================
   LEARN PAGE — Editorial magazine layout
======================================================= */
export default function LearnPage() {
  const heroReveal = useReveal();
  const scoringReveal = useReveal();
  const tipsReveal = useReveal();
  const scienceReveal = useReveal();
  const faqReveal = useReveal();

  const [heroIllos] = useState(() => getHeroIllustrations());

  return (
    <>
      {/* ===================================================
          SECTION 1 — HERO (dark)
      =================================================== */}
      <section
        ref={heroReveal.ref}
        className="relative bg-brand-dark grain overflow-hidden"
      >
        {/* Botanical overlays */}
        <div className="absolute -top-8 -left-10 w-56 h-56 rotate-[-12deg] pointer-events-none">
          <Image
            src={heroIllos[0]}
            alt=""
            width={220}
            height={220}
            className="object-contain illo-accent"
            priority
          />
        </div>
        <div className="absolute -bottom-10 -right-8 w-60 h-60 rotate-[15deg] pointer-events-none">
          <Image
            src={heroIllos[1]}
            alt=""
            width={240}
            height={240}
            className="object-contain illo-ghost"
          />
        </div>
        <div className="absolute top-1/3 right-4 w-40 h-40 rotate-[5deg] pointer-events-none">
          <Image
            src={heroIllos[2]}
            alt=""
            width={160}
            height={160}
            className="object-contain illo-ghost"
          />
        </div>

        <div className="relative max-w-lg mx-auto px-5 pt-10 pb-12">
          {/* Label */}
          <div
            className={`flex items-center gap-2.5 mb-4 transition-all duration-700 ${
              heroReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <BookOpen size={16} className="text-brand-green" />
            <span className="text-xs font-medium text-brand-cream/50 tracking-widest uppercase">
              Learn
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`text-3xl font-display text-brand-cream leading-tight mb-3 transition-all duration-700 delay-100 ${
              heroReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            The 30 Plant Challenge
          </h1>

          {/* Subtitle */}
          <p
            className={`text-sm text-brand-cream/60 leading-relaxed mb-8 max-w-sm transition-all duration-700 delay-200 ${
              heroReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            Eat 30 different plants each week. Science says your gut will thank
            you.
          </p>

          {/* Stat pills */}
          <div
            className={`flex gap-3 transition-all duration-700 delay-300 ${
              heroReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            {[
              { value: "30", label: "plants / week" },
              { value: "38T", label: "gut microbes" },
              { value: "7", label: "days to reset" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 text-center"
              >
                <p className="text-xl font-display text-brand-cream">
                  {stat.value}
                </p>
                <p className="text-[10px] text-brand-cream/40 mt-0.5 leading-tight">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================
          SECTION 2 — HOW SCORING WORKS (light)
      =================================================== */}
      <section
        ref={scoringReveal.ref}
        className="bg-brand-cream grain-light"
      >
        <div className="relative max-w-lg mx-auto px-5 py-10">
          {/* Section heading */}
          <div
            className={`mb-6 transition-all duration-700 ${
              scoringReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-[10px] font-medium text-brand-green tracking-widest uppercase mb-1">
              How It Works
            </p>
            <h2 className="text-2xl font-display text-brand-dark">
              Scoring System
            </h2>
          </div>

          {/* Scoring cards grid */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {/* 1 point card */}
            <div
              className={`bg-white/40 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-4 transition-all duration-700 delay-100 ${
                scoringReveal.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-green-500/10 mb-3">
                <Check size={16} className="text-green-600" />
              </div>
              <p className="text-lg font-display text-brand-dark mb-1">1 pt</p>
              <ul className="text-[11px] text-brand-muted space-y-0.5">
                <li>Fruits</li>
                <li>Vegetables</li>
                <li>Grains</li>
                <li>Legumes</li>
                <li>Nuts</li>
                <li>Seeds</li>
              </ul>
            </div>

            {/* 1/4 point card */}
            <div
              className={`bg-white/40 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-4 transition-all duration-700 delay-200 ${
                scoringReveal.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/10 mb-3">
                <Flame size={16} className="text-amber-600" />
              </div>
              <p className="text-lg font-display text-brand-dark mb-1">
                &frac14; pt
              </p>
              <ul className="text-[11px] text-brand-muted space-y-0.5">
                <li>Herbs</li>
                <li>Spices</li>
              </ul>
            </div>

            {/* 0 points card */}
            <div
              className={`bg-white/40 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-4 transition-all duration-700 delay-300 ${
                scoringReveal.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500/10 mb-3">
                <X size={16} className="text-rose-600" />
              </div>
              <p className="text-lg font-display text-brand-dark mb-1">0 pts</p>
              <ul className="text-[11px] text-brand-muted space-y-0.5">
                <li>Processed</li>
                <li>Oils</li>
                <li>White rice</li>
              </ul>
            </div>
          </div>

          {/* Key Rules */}
          <div
            className={`transition-all duration-700 delay-[400ms] ${
              scoringReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <h3 className="text-sm font-display font-semibold text-brand-dark mb-3">
              Key Rules
            </h3>
            <ul className="space-y-2.5 text-sm text-brand-muted leading-relaxed">
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span>
                  <strong className="text-brand-dark">Resets weekly:</strong>{" "}
                  Your count resets every Monday. Same plant twice in a week = 1
                  point.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                <span>
                  <strong className="text-brand-dark">
                    Species, not preparations:
                  </strong>{" "}
                  Roasted carrot and raw carrot are the same carrot. The point is
                  tied to the species.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong className="text-brand-dark">
                    Herbs and spices stack:
                  </strong>{" "}
                  4 unique herbs/spices = 1 full point.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span>
                  <strong className="text-brand-dark">
                    Variety counts (sometimes):
                  </strong>{" "}
                  Different lentil types count separately. Different bell pepper
                  colors do not (same species).
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span>
                  <strong className="text-brand-dark">
                    Whole foods rule:
                  </strong>{" "}
                  The plant must be whole or minimally processed. White flour,
                  refined sugar, and oils don&apos;t count.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===================================================
          SECTION 3 — TIPS FOR HITTING 30 (light)
      =================================================== */}
      <section ref={tipsReveal.ref} className="bg-brand-bg">
        <div className="relative max-w-lg mx-auto px-5 py-10">
          {/* Section heading */}
          <div
            className={`mb-6 transition-all duration-700 ${
              tipsReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-[10px] font-medium text-brand-green tracking-widest uppercase mb-1">
              Strategy
            </p>
            <h2 className="text-2xl font-display text-brand-dark">
              Tips for Hitting 30
            </h2>
          </div>

          {/* Tip cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {STRATEGIES.map((strategy, i) => {
              const Icon = STRATEGY_ICONS[strategy.icon];
              const illoSrc =
                ALL_ILLUSTRATIONS[i % ALL_ILLUSTRATIONS.length];
              return (
                <div
                  key={strategy.name}
                  className={`relative overflow-hidden bg-white/30 backdrop-blur-sm rounded-2xl border border-brand-dark/5 p-4 transition-all duration-700 ${
                    tipsReveal.visible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    transitionDelay: tipsReveal.visible
                      ? `${100 + i * 80}ms`
                      : "0ms",
                  }}
                >
                  {/* Background illustration */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 pointer-events-none">
                    <Image
                      src={illoSrc}
                      alt=""
                      width={96}
                      height={96}
                      className="object-contain illo-ghost"
                    />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-dark mb-3">
                      <Icon size={14} className="text-brand-cream" />
                    </div>
                    <p className="text-sm font-display font-semibold text-brand-dark mb-1">
                      {strategy.name}
                    </p>
                    <p className="text-[11px] text-brand-muted leading-relaxed">
                      {strategy.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================
          SECTION 4 — THE SCIENCE (dark)
      =================================================== */}
      <section
        ref={scienceReveal.ref}
        className="relative bg-brand-dark grain overflow-hidden"
      >
        {/* Botanical overlay — right side */}
        <div className="absolute top-1/4 -right-12 w-72 h-72 pointer-events-none">
          <Image
            src={ALL_ILLUSTRATIONS[2]}
            alt=""
            width={280}
            height={280}
            className="object-contain illo-ghost"
          />
        </div>

        <div className="relative max-w-lg mx-auto px-5 py-12">
          {/* Label */}
          <p
            className={`text-[10px] font-medium text-brand-green tracking-widest uppercase mb-6 transition-all duration-700 ${
              scienceReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            The Science
          </p>

          {/* Pull-quote */}
          <blockquote
            className={`text-xl font-display italic text-brand-cream leading-snug mb-2 transition-all duration-700 delay-100 ${
              scienceReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            &ldquo;The number of unique plant types consumed per week was the
            single strongest predictor of gut microbial diversity.&rdquo;
          </blockquote>

          <p
            className={`text-xs text-brand-cream/40 mb-8 transition-all duration-700 delay-150 ${
              scienceReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            McDonald et al., 2018 &mdash; American Gut Project
          </p>

          {/* Big number */}
          <p
            className={`text-5xl font-display text-brand-green mb-2 transition-all duration-700 delay-200 ${
              scienceReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            38 trillion
          </p>
          <p
            className={`text-xs text-brand-cream/40 mb-8 transition-all duration-700 delay-250 ${
              scienceReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            microbes call your gut home
          </p>

          {/* Body text */}
          <div
            className={`space-y-4 text-sm text-brand-cream/60 leading-relaxed transition-all duration-700 delay-300 ${
              scienceReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p>
              Your gut contains approximately 38 trillion microbes. Each
              bacterial species feeds on specific fibers and polyphenols found in
              different plants. A narrow plant variety leads to a narrow
              bacterial community &mdash; a fragile ecosystem vulnerable to
              disruption.
            </p>
            <p>
              The American Gut Project found that people eating 30+ plants per
              week showed greater species richness, more short-chain fatty acid
              producers (which reduce inflammation and strengthen immunity), and
              lower antibiotic resistance genes.
            </p>
            <p>
              Gut diversity is linked to reduced risk of type 2 diabetes,
              obesity, IBD, depression, anxiety, and certain cancers. The
              research is clear: variety is the single most powerful lever you
              can pull for long-term gut health.
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================
          SECTION 5 — QUICK REFERENCE FAQ (light)
      =================================================== */}
      <section
        ref={faqReveal.ref}
        className="bg-brand-cream grain-light pb-32"
      >
        <div className="relative max-w-lg mx-auto px-5 py-10">
          {/* Section heading */}
          <div
            className={`mb-6 transition-all duration-700 ${
              faqReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-[10px] font-medium text-brand-green tracking-widest uppercase mb-1">
              Reference
            </p>
            <h2 className="text-2xl font-display text-brand-dark">
              Quick Reference
            </h2>
            <p className="text-sm text-brand-muted mt-1">
              Everything you need to know, at a glance.
            </p>
          </div>

          {/* FAQ card */}
          <div
            className={`bg-white/40 backdrop-blur-sm rounded-2xl border border-brand-dark/5 divide-y divide-brand-dark/5 overflow-hidden transition-all duration-700 delay-100 ${
              faqReveal.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {/* Edge Cases */}
            <div className="px-1">
              <Accordion title="Edge Cases" defaultOpen>
                <div className="space-y-2">
                  {EDGE_CASES.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-brand-dark font-medium text-xs py-1 group-open:text-brand-green">
                        {item.q}
                      </summary>
                      <p className="text-xs text-brand-muted mt-1 ml-1 pb-1">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </Accordion>
            </div>

            {/* Common Mistakes */}
            <div className="px-1">
              <Accordion title="Common Mistakes">
                <ul className="space-y-3">
                  {COMMON_MISTAKES.map((item, i) => (
                    <li key={i}>
                      <p className="text-xs font-semibold text-brand-dark">
                        {item.title}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {item.desc}
                      </p>
                    </li>
                  ))}
                </ul>
              </Accordion>
            </div>

            {/* Special Situations */}
            <div className="px-1">
              <Accordion title="Special Situations">
                <div className="space-y-2">
                  {SPECIAL_SITUATIONS.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="cursor-pointer text-brand-dark font-medium text-xs py-1 group-open:text-brand-green">
                        {item.q}
                      </summary>
                      <p className="text-xs text-brand-muted mt-1 ml-1 pb-1">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </Accordion>
            </div>

            {/* Sample Week Meal Plan */}
            <div className="px-1">
              <Accordion title="Sample Week Meal Plan">
                <div className="space-y-3">
                  {SAMPLE_WEEK.map((day, i) => (
                    <div key={i}>
                      <p className="font-medium text-brand-dark text-xs">
                        {day.day}
                      </p>
                      <p className="text-xs text-brand-muted mt-0.5">
                        {day.meals}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-brand-muted/70 italic">
                  This sample plan hits ~36 plant points with 68 unique plants
                  including herbs/spices.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* =======================================================
   STATIC DATA ARRAYS
======================================================= */

const STRATEGY_ICONS: Record<string, LucideIcon> = {
  Cherry,
  Flame,
  LeafyGreen,
  Wheat,
  Sprout,
  Nut,
};

const STRATEGIES: { name: string; desc: string; icon: string }[] = [
  {
    name: "Power Breakfast",
    desc: "Front-load your day. Overnight oats with oats, chia, walnuts, blueberries, banana, and cinnamon = 5.25 points before leaving the house.",
    icon: "Cherry",
  },
  {
    name: "Spice Rack Hack",
    desc: "Deliberately use 4-8 different spices daily. Over a week, herbs and spices alone can contribute 7-10+ points.",
    icon: "Flame",
  },
  {
    name: "Mixed Bag Approach",
    desc: "Buy pre-mixed bags: mixed greens, trail mix, frozen stir-fry blends, mixed bean soups. Each component counts individually.",
    icon: "LeafyGreen",
  },
  {
    name: "Grain Rotation",
    desc: "Rotate through oats, quinoa, barley, farro, buckwheat, millet, and brown rice across the week. 7 grain points with zero extra effort.",
    icon: "Wheat",
  },
  {
    name: "Smoothie Stacking",
    desc: "A single smoothie can contain 6-10 plants: spinach, banana, mango, hemp seeds, flaxseed, ginger, turmeric, oats, and almond butter.",
    icon: "Sprout",
  },
  {
    name: "Topping Tax",
    desc: "Add seeds, nuts, or fresh herbs to every meal. Pumpkin seeds on soup, sesame on stir-fry, cilantro on tacos. Adds 2-4 points daily.",
    icon: "Nut",
  },
];

const EDGE_CASES = [
  { q: "Red, green, brown lentils?", a: "1 point EACH. Different varieties have different fiber profiles and nutrients." },
  { q: "Red, green, yellow bell pepper?", a: "1 point TOTAL. Same species (Capsicum annuum), just different ripeness stages." },
  { q: "Tofu, tempeh, edamame?", a: "1 point TOTAL (soy). All derived from soybeans \u2014 same source plant." },
  { q: "White rice?", a: "0 points. It's a refined grain. Switch to brown rice for 1 point." },
  { q: "White potato vs sweet potato?", a: "1 point EACH. Completely different species." },
  { q: "Peanuts?", a: "1 point under legumes. Botanically a legume, not a nut." },
  { q: "Coffee and tea?", a: "1 point EACH. They come from distinct plant species." },
  { q: "Dark chocolate (>70%)?", a: "1 point. Minimally processed cacao bean counts." },
  { q: "Wine or beer?", a: "0 points. Alcohol processing negates the microbiome benefit." },
  { q: "Olive oil?", a: "0 points. It's an extracted oil. Eat whole olives for the point." },
  { q: "Frozen vegetables?", a: "Full points. Flash-freezing retains nutrients." },
  { q: "Canned beans?", a: "Full points. Rinse to reduce sodium." },
  { q: "Fermented plants (kimchi, sauerkraut)?", a: "Counts for the base plant AND adds probiotic benefits." },
  { q: "Nut butters and tahini?", a: "Yes \u2014 the nut/seed is ground but not chemically processed. PB = 1 peanut point." },
  { q: "Plant-based milks?", a: "The base plant counts (1 point). Don't double-count if you also eat the whole version." },
  { q: "Popcorn?", a: "Yes! Whole grain corn/maize = 1 point." },
  { q: "Coconut?", a: "1 point. Technically a drupe (fruit)." },
  { q: "Mushrooms and seaweed?", a: "1 point each. Not technically plants, but Dr. B includes them for their gut benefits." },
  { q: "Mixed spice blends (curry powder, garam masala)?", a: "Count each identifiable component spice as 1/4 point. Can't identify them? Count the blend as 1/2 point." },
  { q: "Same plant, different parts (beet root vs greens)?", a: "1 point TOTAL. Same species, even if eating different parts." },
  { q: "Dried fruit (no added sugar)?", a: "Full points. Same plant, concentrated \u2014 still counts." },
  { q: "Juice (100% fruit/veg)?", a: "Counts, but whole form preferred for fiber." },
  { q: "Cocoa powder (unsweetened)?", a: "1 point. Minimally processed cacao." },
  { q: "Sprouts and microgreens?", a: "1 point per species. Different nutrient profile than the mature plant." },
];

const COMMON_MISTAKES = [
  {
    title: "Counting processed foods",
    desc: "White bread, pasta, juice concentrate, and vegetable oils don't count. If you can't recognize the original plant, it doesn't earn a point.",
  },
  {
    title: "Double-counting the same species",
    desc: "Chickpeas on Monday and hummus on Wednesday = 1 chickpea point for the week.",
  },
  {
    title: "Counting herbs as full points",
    desc: "Herbs and spices are 1/4 point because you eat them in small quantities.",
  },
  {
    title: "Going too hard too fast",
    desc: "If you currently eat 8-10 species per week, increase by 5 per week over a month. Your gut bacteria need time to adapt.",
  },
];

const SPECIAL_SITUATIONS = [
  { q: "I have IBS or gut sensitivities", a: "The challenge is about variety, not volume. A single blueberry counts. A teaspoon of chia counts. Use small amounts of many plants. The low-FODMAP diet and this challenge are not mutually exclusive." },
  { q: "My family has picky eaters", a: "Gamify it for kids: make a colorful chart, let them pick new plants at the store, blend plants into smoothies or sauces. Even going from 5 to 15 weekly plants is a meaningful improvement." },
  { q: "I'm on a tight budget", a: "Frozen veggies, canned beans, dried lentils, oats, and bulk seeds are among the cheapest foods available \u2014 and all fully valid. A bag of 15-bean soup mix = 15 legume points for a few dollars." },
  { q: "I'm traveling", a: "Pack mixed nuts, seeds, and dried fruit. Order salads with diverse toppings. Try airport smoothie bars. Lower your target to 20 during travel weeks." },
  { q: "I eat high-protein / I'm an athlete", a: "This doesn't limit protein. Add your chicken, steak, fish, or shake as normal, then build plant variety around it. Legumes do double duty as high-protein plants." },
];

const SAMPLE_WEEK = [
  { day: "Monday", meals: "Oatmeal + blueberries + walnuts + chia + cinnamon | Quinoa bowl with chickpeas, spinach, avocado | Stir-fry with brown rice, broccoli, bell pepper, edamame" },
  { day: "Tuesday", meals: "Smoothie: banana, kale, hemp seeds, flax, mango | Lentil soup with carrot, celery, turmeric, cumin | Sweet potato + black beans + corn + cilantro" },
  { day: "Wednesday", meals: "Rye toast + almond butter + pear + pumpkin seeds | Farro with cucumber, tomato, artichoke, basil | Cauliflower curry with peas, cashews, coriander" },
  { day: "Thursday", meals: "Buckwheat pancakes + raspberries + pecans | Millet bowl with beet, radish, sunflower seeds, tahini | Barley mushroom risotto with leek, asparagus, thyme" },
  { day: "Friday", meals: "Overnight oats + strawberry + pistachio + poppy seed | Black-eyed pea salad with collards, cherry tomato | Eggplant + zucchini bake with pine nuts, oregano" },
  { day: "Saturday", meals: "Acai bowl + coconut + fig + macadamia + mint | Wild rice + navy beans + Brussels sprouts + sage | Sorghum bowl with kidney beans, turnip, kale, dill" },
  { day: "Sunday", meals: "Teff porridge + date + Brazil nut + cinnamon + clove | Split pea soup with potato, carrot, chives | Amaranth with fava beans, fennel, pomegranate, star anise" },
];
