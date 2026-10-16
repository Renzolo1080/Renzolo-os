import { Header, Footer } from "@/components/Chrome";
import { Trajectory } from "@/components/Trajectory";
import { Glow, OutcomeChips, OUTCOMES, Portrait, ProductShowcase, Screen, SignalBand } from "@/components/Visuals";
import { FOUNDER } from "@/lib/story";
import { APP_URL, appLink } from "@/lib/site";

const OFFERS = [
  {
    name: "Free Readiness Snapshot",
    what: "Five to seven minutes. Your Venture Score, your Strategic Plan Readiness and the three areas holding your business back.",
    price: "Free",
    action: "Take the Snapshot",
    href: appLink("/snapshot", "home_offers"),
  },
  {
    name: "Founder Trajectory™ membership",
    what: "Your full Readiness Assessment, a growth and readiness plan of 90 days to 36 months, a dashboard to work it, an AI coach and human coaching at the level you choose.",
    price: "From $15 a month",
    action: "Compare plans",
    href: appLink("/pricing", "home_offers"),
  },
  {
    name: "Readiness Assessment",
    what: "The full report once, with a valuation range, an AI market insight for your industry and country, and a recommendation of the plan that fits you.",
    price: "$79 one time",
    action: "See what's included",
    href: appLink("/pricing", "home_offers_assessment"),
  },
  {
    name: "One-on-one coaching",
    what: "Sessions with a Founder Trajectory™ coach to work through your plan, your numbers or your next big decision: a contract, a loan or an investor.",
    price: "From $59 a session for members",
    action: "See coaching",
    href: appLink("/pricing", "home_offers_coaching"),
  },
  {
    name: "Founder Trajectory™ Academy",
    what: "Launch (8 weeks), Build (12 weeks) and Scale (6 months). Founders work through their plans together, with AI coaching, live sessions and one-on-one time.",
    price: "Applications by cohort",
    action: "Explore the Academy",
    href: "/academy/",
  },
  {
    name: "For partners",
    what: "Readiness assessments and cohorts for the founders and suppliers in your programme, association or supply chain.",
    price: "Built with you",
    action: "Talk to us",
    href: "/contact/",
  },
];

const METHOD = [
  ["Evaluate", "Take the Snapshot, then your full Readiness Assessment, and see exactly where you stand and why."],
  ["Evolve", "Turn the results into a growth and readiness plan, and update your strategy around the gaps that matter."],
  ["Execute", "Work the plan with your dashboard, goals, AI coach, tools and one-on-one coaching."],
  ["Elevate", "Re-assess, measure progress and move to your next stage."],
];

/** Why founders choose RENZOLO over a team operating system. Competitors
 * are not named on the public site; the comparison doc names them. */
const WHY = [
  {
    title: "Built around the outcome you need",
    text: "Pick your goal: win customers, qualify for capital or attract investors. Your assessment, plan, market brief and coaching all work toward it. Team operating systems start from meetings and quarterly priorities. We start from the yes you need.",
    accent: "#E8603C",
  },
  {
    title: "Built from the buyer's side of the table",
    text: "Our founder has assessed and developed suppliers for large buyers and connected them to contracts. Your readiness is checked against what procurement teams, lenders and investors actually look for: capability, compliance, finance, evidence and capacity.",
    accent: "#F4B740",
  },
  {
    title: "AI and human coaching, at founder prices",
    text: "One founder, one price in US dollars, from $15 a month. An AI coach that knows your plan and brings local to global insight, plus one-on-one coaching when the decision is big. No team seats to buy.",
    accent: "#22B8B0",
  },
];

const COMPARE: [string, string, string][] = [
  ["Built for", "Companies with a leadership team", "Founders and suppliers, idea to growth"],
  ["Starts from", "Vision, priorities, weekly meetings", "What buyers, lenders and investors check"],
  ["Success means", "A team that runs smoothly", "Customers won, capital secured, investors in"],
  ["Market insight", "Not included", "Market Intelligence and an AI coach, local to global"],
  ["Pricing", "Per user, for teams", "Per founder, from $15 a month"],
];

const GENERATIONS = [
  { who: "First-time founders", text: "Your phone is your office. Get a clear score, a plan and an AI coach that answers at midnight." },
  { who: "Growing owners", text: "You have customers. Now get the plan, numbers and evidence that win the bigger contract or the loan." },
  { who: "Seasoned business owners", text: "Formalise what you've built over decades, get it investor-ready, and plan the next chapter or the handover." },
];

const MARKETS = [
  { name: "South Africa", note: "For founders and SMMEs getting supplier- and funding-ready.", href: `${APP_URL}/za?utm_source=website&utm_medium=referral&utm_campaign=home_markets_za` },
  { name: "Kenya", note: "For founders and MSMEs ready to formalise, win contracts and grow.", href: `${APP_URL}/ke?utm_source=website&utm_medium=referral&utm_campaign=home_markets_ke` },
  { name: "Across Africa", note: "The Snapshot, membership and Academy are open to founders in every African country.", href: appLink("/snapshot", "home_markets_africa") },
  { name: "United States", note: "Where RENZOLO™ is based, and where our corridor to African markets begins.", href: appLink("/snapshot?country=United%20States", "home_markets_us") },
];

/** Endorsements and testimonials, with a photo of the person. Shown only
 * once real, permitted remarks are added here. */
const ENDORSEMENTS: { quote: string; name: string; role: string; photo?: string }[] = [];

export default function Home() {
  return (
    <>
      <Header campaign="home_header" />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy text-white">
          <Glow />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr]">
            <div className="rise">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-soft">Customer, capital and investor readiness</p>
              <h1 className="mt-4 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl" style={{ fontWeight: 800 }}>
                Get ready. <span className="text-gradient">Get chosen.</span> Grow.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
                RENZOLO™ shows founders and suppliers exactly where their business stands, builds the plan to close the gaps, and coaches them to the
                standard buyers, lenders and investors look for.
              </p>
              <OutcomeChips className="mt-7" />
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a href={appLink("/snapshot", "home_hero")} className="rounded-full bg-gold px-7 py-4 text-center text-lg font-semibold text-white shadow-[0_10px_30px_-10px_rgba(193,139,44,.8)] hover:bg-[#ad7b24] sm:whitespace-nowrap">
                  Start your free Snapshot
                </a>
                <a href="#why" className="text-center font-semibold text-gold-soft underline-offset-4 hover:underline">
                  Why founders choose RENZOLO
                </a>
              </div>
              <p className="mt-4 text-sm text-mist">5 to 7 minutes · no account needed · results straight away</p>
            </div>
            <ProductShowcase />
          </div>
        </section>
        <SignalBand />

        {/* Snapshot */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1fr_1.15fr] md:py-24">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">See results in about seven minutes</h2>
              <p className="mt-4 text-lg text-muted">
                Answer simple questions about your business, your goals and your plan. Get your Venture Score, your strongest area, the three areas
                holding you back, and your most useful next move.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                {OUTCOMES.map((o) => (
                  <li key={o.key} className="rounded-2xl border border-mist p-4">
                    <span aria-hidden="true" className="block h-1.5 w-10 rounded-full" style={{ background: o.color }} />
                    <p className="mt-3 font-display font-bold">{o.label}</p>
                    <p className="text-sm text-muted">{o.note}</p>
                  </li>
                ))}
              </ul>
              <a href={appLink("/snapshot", "home_snapshot_section")} className="mt-8 inline-block rounded-full bg-gold px-7 py-4 font-semibold text-white hover:bg-[#ad7b24]">
                Take the free Readiness Snapshot
              </a>
            </div>
            <Screen src="/img/screen-plan.jpg" alt="The Plan Builder in RENZOLO OS, turning assessment results into dated goals and actions" />
          </div>
        </section>

        {/* Why RENZOLO */}
        <section id="why" className="relative overflow-hidden bg-navy text-white">
          <Glow />
          <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-soft">Why RENZOLO</p>
            <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight md:text-5xl">
              Operating systems help you run your team. RENZOLO gets your business chosen.
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {WHY.map((w) => (
                <div key={w.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur">
                  <span aria-hidden="true" className="block h-1.5 w-12 rounded-full" style={{ background: w.accent, boxShadow: `0 0 18px ${w.accent}` }} />
                  <h3 className="mt-5 font-display text-xl font-bold">{w.title}</h3>
                  <p className="mt-3 leading-relaxed text-mist">{w.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 overflow-x-auto rounded-3xl border border-white/10">
              <table className="w-full min-w-[560px] text-left text-sm md:text-base">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03]">
                    <th className="px-5 py-4 font-semibold text-mist" scope="col">
                      <span className="sr-only">Compared on</span>
                    </th>
                    <th className="px-5 py-4 font-semibold text-mist" scope="col">Team operating systems</th>
                    <th className="px-5 py-4 font-display font-bold text-gold-soft" scope="col">RENZOLO™</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([k, them, us]) => (
                    <tr key={k} className="border-b border-white/5 last:border-0">
                      <th scope="row" className="px-5 py-4 font-semibold">{k}</th>
                      <td className="px-5 py-4 text-mist">{them}</td>
                      <td className="px-5 py-4 font-semibold text-white">{us}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Founder story */}
        <section className="bg-paper">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-24">
            <Portrait name={FOUNDER.name} photo={FOUNDER.photo} className="aspect-[4/5] w-full max-w-sm" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Built by someone who sat on the other side of the table</p>
              <blockquote className="mt-4 font-display text-2xl font-bold leading-snug md:text-3xl">“{FOUNDER.pullQuote}”</blockquote>
              <p className="mt-6 text-lg leading-relaxed text-muted">{FOUNDER.short}</p>
              <p className="mt-5 font-semibold">
                {FOUNDER.name} <span className="font-normal text-muted">· {FOUNDER.title}</span>
              </p>
              <a href="/about/" className="mt-6 inline-block font-semibold text-teal underline-offset-4 hover:underline">
                Read our story
              </a>
            </div>
          </div>
        </section>

        {/* Method */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">The Founder Trajectory™ Method</h2>
            <p className="mt-3 max-w-2xl text-muted">Four steps, repeated as you grow. Each cycle leaves your business more ready than the last.</p>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
              <span aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-[3px] rounded-full md:block" style={{ background: "linear-gradient(90deg,#E8603C,#F4B740,#22B8B0)" }} />
              {METHOD.map(([name, text], i) => (
                <li key={name} className="relative">
                  <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-gold-soft ring-4 ring-white">{i + 1}</span>
                  <p className="mt-5 font-display text-2xl font-bold">{name}</p>
                  <p className="mt-2 text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trajectory + generations */}
        <section className="relative overflow-hidden bg-navy text-white">
          <Glow />
          <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="max-w-3xl font-display text-3xl font-bold tracking-tight md:text-4xl">For every generation of founder, at every stage</h2>
            <p className="mt-3 max-w-2xl text-mist">Every business is somewhere on this path, from first idea to exit. Founder Trajectory™ shows where you are and what it takes to reach the next stage.</p>
            <div className="mt-8">
              <Trajectory />
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {GENERATIONS.map((g) => (
                <div key={g.who} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <p className="font-display text-lg font-bold text-gold-soft">{g.who}</p>
                  <p className="mt-2 text-mist">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">One place to plan, track and get coached</h2>
          <p className="mt-3 max-w-2xl text-muted">RENZOLO OS™ powers Founder Trajectory™. These are real screens from a sample business.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <figure>
              <Screen src="/img/screen-market.jpg" alt="Market Intelligence: a researched brief for the founder's industry and country, with sources" />
              <figcaption className="mt-3 font-semibold">Market Intelligence <span className="font-normal text-muted">· your market, researched and tied to your plan</span></figcaption>
            </figure>
            <figure>
              <Screen src="/img/screen-aicoach.jpg" alt="The AI coach: questions answered with local to global insight and dated actions" />
              <figcaption className="mt-3 font-semibold">AI coach <span className="font-normal text-muted">· local, national, regional and global insight</span></figcaption>
            </figure>
          </div>
        </section>

        {/* Offers */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Ways to work with us</h2>
            <p className="mt-3 max-w-2xl text-muted">Start free. Go as deep as your business needs.</p>
            <ul className="mt-10 divide-y divide-mist border-y border-mist">
              {OFFERS.map((o) => (
                <li key={o.name} className="grid gap-3 py-7 md:grid-cols-[15rem_1fr_11rem] md:items-center md:gap-10">
                  <div>
                    <p className="font-display text-xl font-bold">{o.name}</p>
                    <p className="mt-1 text-sm font-semibold text-teal">{o.price}</p>
                  </div>
                  <p className="max-w-xl text-muted">{o.what}</p>
                  <a href={o.href} className="justify-self-start rounded-full border-2 border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-navy hover:text-white md:justify-self-end">
                    {o.action}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Markets */}
        <section className="bg-panel text-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Built for Africa&apos;s founders, starting in South Africa and Kenya</h2>
            <p className="mt-3 max-w-2xl text-mist">Prices in US dollars. Pay by card or mobile money.</p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-navy sm:grid-cols-2 lg:grid-cols-4">
              {MARKETS.map((m) => (
                <a key={m.name} href={m.href} className="group bg-panel p-7 hover:bg-[#173651]">
                  <p className="font-display text-2xl font-bold">{m.name}</p>
                  <p className="mt-2 text-sm text-mist">{m.note}</p>
                  <p className="mt-6 text-sm font-semibold text-gold-soft group-hover:underline">Start your Snapshot</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {ENDORSEMENTS.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">What founders and partners say</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              {ENDORSEMENTS.map((e) => (
                <figure key={e.name} className="flex gap-5">
                  {e.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={e.photo} alt={e.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-gold-soft">
                      {e.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                  )}
                  <div>
                    <blockquote className="text-lg leading-relaxed">{e.quote}</blockquote>
                    <figcaption className="mt-3 text-sm">
                      <span className="font-semibold">{e.name}</span>
                      <span className="text-muted">, {e.role}</span>
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          </section>
        )}

        <SignalBand dark />
        <section className="relative overflow-hidden bg-gold">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl font-display text-3xl font-bold leading-tight text-navy md:text-4xl">Seven minutes to know where your business stands.</p>
            <a href={appLink("/snapshot", "home_footer_band")} className="shrink-0 rounded-full bg-navy px-7 py-4 text-center text-lg font-semibold text-white">
              Take the free Snapshot
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
