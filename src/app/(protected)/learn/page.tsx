"use client";

import Accordion from "@/components/Accordion";
import { BookOpen } from "lucide-react";

export default function LearnPage() {
  return (
    <>
      {/* === HEADER === */}
      <div className="bg-brand-dark px-5 pt-6 pb-6 -mt-1 grain">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2.5 mb-2">
            <BookOpen size={20} className="text-brand-green" />
            <h1
              className="text-2xl font-bold text-brand-cream font-display"
            >
              Learn
            </h1>
          </div>
          <p className="text-sm text-brand-cream/50">
            Everything you need to know about the 30 Plant Point Challenge,
            based on the work of Dr. Will Bulsiewicz.
          </p>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="bg-brand-cream min-h-[60vh] grain-light">
        <div className="relative max-w-lg mx-auto px-5 py-4">
          {/* Section 1: What Is the Challenge? */}
          <Accordion title="What Is the Challenge?" defaultOpen>
            <p>
              The 30 Plant Point Challenge is a science-backed framework: eat 30
              or more different plant species every week to maximize gut
              microbiome diversity. It comes from the American Gut Project, which
              found that people eating 30+ plants per week had significantly more
              diverse gut bacteria — regardless of diet label.
            </p>
            <p className="mt-2">
              This isn't a restrictive diet. You don't eliminate anything. You
              simply add variety. The goal is 30 unique plant points across seven
              days.
            </p>
          </Accordion>

          {/* Section 2: How Scoring Works */}
          <Accordion title="How Scoring Works">
            <table className="w-full text-xs mb-3">
              <thead>
                <tr className="text-left text-brand-muted">
                  <th className="pb-1 font-medium">Category</th>
                  <th className="pb-1 font-medium">Points</th>
                </tr>
              </thead>
              <tbody className="text-brand-dark">
                <tr>
                  <td className="py-0.5">Fruits, Vegetables, Whole Grains</td>
                  <td>1 pt each</td>
                </tr>
                <tr>
                  <td className="py-0.5">Legumes, Nuts, Seeds</td>
                  <td>1 pt each</td>
                </tr>
                <tr>
                  <td className="py-0.5">Herbs &amp; Spices</td>
                  <td>1/4 pt each</td>
                </tr>
              </tbody>
            </table>

            <p className="font-medium text-brand-dark mt-3 mb-1">Key Rules</p>
            <ul className="space-y-1.5 list-disc pl-4">
              <li>
                <strong>Resets weekly:</strong> Your count resets every Monday.
                Same plant twice in a week = 1 point.
              </li>
              <li>
                <strong>Species, not preparations:</strong> Roasted carrot and
                raw carrot are the same carrot. The point is tied to the species.
              </li>
              <li>
                <strong>Herbs and spices stack:</strong> 4 unique herbs/spices =
                1 full point.
              </li>
              <li>
                <strong>Variety counts (sometimes):</strong> Different lentil
                types count separately. Different bell pepper colors do not (same
                species).
              </li>
              <li>
                <strong>Whole foods rule:</strong> The plant must be whole or
                minimally processed. White flour, refined sugar, and oils don't
                count.
              </li>
            </ul>
          </Accordion>

          {/* Section 3: What Counts? (Edge Cases) */}
          <Accordion title="What Counts? (Edge Cases)">
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

          {/* Section 4: Tips for Hitting 30 */}
          <Accordion title="Tips for Hitting 30">
            <div className="space-y-3">
              {STRATEGIES.map((s, i) => (
                <div key={i}>
                  <p className="font-medium text-brand-dark text-xs">
                    {s.name}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </Accordion>

          {/* Section 5: Sample Week */}
          <Accordion title="Sample Week Meal Plan">
            <div className="space-y-3">
              {SAMPLE_WEEK.map((day, i) => (
                <div key={i}>
                  <p className="font-medium text-brand-dark text-xs">
                    {day.day}
                  </p>
                  <p className="text-xs text-brand-muted mt-0.5">{day.meals}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-brand-muted/70 italic">
              This sample plan hits ~36 plant points with 68 unique plants
              including herbs/spices.
            </p>
          </Accordion>

          {/* Section 6: Common Mistakes */}
          <Accordion title="Common Mistakes">
            <ul className="space-y-2 list-disc pl-4">
              <li>
                <strong>Counting processed foods:</strong> White bread, pasta,
                juice concentrate, and vegetable oils don't count. If you can't
                recognize the original plant, it doesn't earn a point.
              </li>
              <li>
                <strong>Double-counting the same species:</strong> Chickpeas on
                Monday and hummus on Wednesday = 1 chickpea point for the week.
              </li>
              <li>
                <strong>Counting herbs as full points:</strong> Herbs and spices
                are 1/4 point because you eat them in small quantities.
              </li>
              <li>
                <strong>Going too hard too fast:</strong> If you currently eat
                8-10 species per week, increase by 5 per week over a month. Your
                gut bacteria need time to adapt.
              </li>
            </ul>
          </Accordion>

          {/* Section 7: The Science */}
          <Accordion title="The Science">
            <p>
              Your gut contains ~38 trillion microbes. Each bacterial species
              feeds on specific fibers and polyphenols. Narrow plant variety =
              narrow bacteria = fragile ecosystem.
            </p>
            <p className="mt-2">
              The American Gut Project (McDonald et al., 2018) found that the
              number of unique plant types per week was the single strongest
              predictor of gut microbial diversity. People eating 30+ plants
              showed greater species richness, more short-chain fatty acid
              producers (which reduce inflammation and strengthen immunity), and
              lower antibiotic resistance genes.
            </p>
            <p className="mt-2">
              Gut diversity is linked to reduced risk of type 2 diabetes,
              obesity, IBD, depression, anxiety, and certain cancers.
            </p>
          </Accordion>

          {/* Section 8: Special Situations */}
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
      </div>
    </>
  );
}

/* --- Static content arrays --- */

const EDGE_CASES = [
  { q: "Red, green, brown lentils?", a: "1 point EACH. Different varieties have different fiber profiles and nutrients." },
  { q: "Red, green, yellow bell pepper?", a: "1 point TOTAL. Same species (Capsicum annuum), just different ripeness stages." },
  { q: "Tofu, tempeh, edamame?", a: "1 point TOTAL (soy). All derived from soybeans — same source plant." },
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
  { q: "Nut butters and tahini?", a: "Yes — the nut/seed is ground but not chemically processed. PB = 1 peanut point." },
  { q: "Plant-based milks?", a: "The base plant counts (1 point). Don't double-count if you also eat the whole version." },
  { q: "Popcorn?", a: "Yes! Whole grain corn/maize = 1 point." },
  { q: "Coconut?", a: "1 point. Technically a drupe (fruit)." },
  { q: "Mushrooms and seaweed?", a: "1 point each. Not technically plants, but Dr. B includes them for their gut benefits." },
  { q: "Mixed spice blends (curry powder, garam masala)?", a: "Count each identifiable component spice as 1/4 point. Can't identify them? Count the blend as 1/2 point." },
  { q: "Same plant, different parts (beet root vs greens)?", a: "1 point TOTAL. Same species, even if eating different parts." },
  { q: "Dried fruit (no added sugar)?", a: "Full points. Same plant, concentrated — still counts." },
  { q: "Juice (100% fruit/veg)?", a: "Counts, but whole form preferred for fiber." },
  { q: "Cocoa powder (unsweetened)?", a: "1 point. Minimally processed cacao." },
  { q: "Sprouts and microgreens?", a: "1 point per species. Different nutrient profile than the mature plant." },
];

const STRATEGIES = [
  { name: "Power Breakfast", desc: "Front-load your day. Overnight oats with oats, chia, walnuts, blueberries, banana, and cinnamon = 5.25 points before leaving the house." },
  { name: "Spice Rack Hack", desc: "Deliberately use 4-8 different spices daily. Over a week, herbs and spices alone can contribute 7-10+ points." },
  { name: "Mixed Bag Approach", desc: "Buy pre-mixed bags: mixed greens, trail mix, frozen stir-fry blends, mixed bean soups. Each component counts individually." },
  { name: "Grain Rotation", desc: "Rotate through oats, quinoa, barley, farro, buckwheat, millet, and brown rice across the week. 7 grain points with zero extra effort." },
  { name: "Smoothie Stacking", desc: "A single smoothie can contain 6-10 plants: spinach, banana, mango, hemp seeds, flaxseed, ginger, turmeric, oats, and almond butter." },
  { name: "Topping Tax", desc: "Add seeds, nuts, or fresh herbs to every meal. Pumpkin seeds on soup, sesame on stir-fry, cilantro on tacos. Adds 2-4 points daily." },
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

const SPECIAL_SITUATIONS = [
  { q: "I have IBS or gut sensitivities", a: "The challenge is about variety, not volume. A single blueberry counts. A teaspoon of chia counts. Use small amounts of many plants. The low-FODMAP diet and this challenge are not mutually exclusive." },
  { q: "My family has picky eaters", a: "Gamify it for kids: make a colorful chart, let them pick new plants at the store, blend plants into smoothies or sauces. Even going from 5 to 15 weekly plants is a meaningful improvement." },
  { q: "I'm on a tight budget", a: "Frozen veggies, canned beans, dried lentils, oats, and bulk seeds are among the cheapest foods available — and all fully valid. A bag of 15-bean soup mix = 15 legume points for a few dollars." },
  { q: "I'm traveling", a: "Pack mixed nuts, seeds, and dried fruit. Order salads with diverse toppings. Try airport smoothie bars. Lower your target to 20 during travel weeks." },
  { q: "I eat high-protein / I'm an athlete", a: "This doesn't limit protein. Add your chicken, steak, fish, or shake as normal, then build plant variety around it. Legumes do double duty as high-protein plants." },
];
