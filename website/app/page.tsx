import { Header, Footer } from "@/components/Chrome";
import { Trajectory } from "@/components/Trajectory";
import { Arrow, Glow, Marquee, Portrait, ProductShowcase, Rotator, Screen } from "@/components/Visuals";
import { AFFILIATION_NOTE, FOUNDER, PROOF_STATS, WHY_PROOF } from "@/lib/story";
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
    proof: WHY_PROOF.outcome,
  },
  {
    title: "Built from the buyer's side of the table",
    text: "Our founder has assessed and developed suppliers for large buyers and connected them to contracts. Your readiness is checked against what procurement teams, lenders and investors actually look for: capability, compliance, finance, evidence and capacity.",
    accent: "#F4B740",
    proof: WHY_PROOF.buyer,
  },
  {
    title: "AI and human coaching, at founder prices",
    text: "One founder, one price in US dollars, from $15 a month. An AI coach that knows your plan and brings local to global insight, plus one-on-one coaching when the decision is big. No team seats to buy.",
    accent: "#22B8B0",
    proof: WHY_PROOF.price,
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

/** Colour blocks used across the page (navy text on each). */
const BLOCKS = ["bg-coral", "bg-sunrise", "bg-lagoon", "bg-gold-soft"];

const TICKER = [
  "Win customers",
  "Qualify for capital",
  "Attract investors",
  "800+ founders trained",
  "19 African countries",
  "AI coach included",
  "From $15 a month",
  "Results in 7 minutes",
];

export default function Home() {
  return (
    <>
      <Header campaign="home_header" />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy text-white">
          <Glow />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-14 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr]">
            <div className="rise">
              <span className="sticker -rotate-2 bg-sunrise text-navy">Get ready. Get chosen. Grow.</span>
              <h1 className="mt-6 font-display text-[2.7rem] font-extrabold leading-[1.0] tracking-tight sm:text-6xl lg:text-7xl" style={{ fontWeight: 800 }}>
                Get chosen by
                <br />
                <span className="sr-only">buyers, lenders and investors.</span>
                <span aria-hidden="true" className="text-gradient">
                  <Rotator words={["buyers.", "lenders.", "investors."]} />
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist">
                RENZOLO™ shows founders and suppliers exactly where their business stands, builds the plan to close the gaps, and coaches them to the
                standard buyers, lenders and investors look for.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href={appLink("/snapshot", "home_hero")}
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-coral via-sunrise to-lagoon px-7 py-4 text-lg font-bold text-navy shadow-[0_12px_34px_-10px_rgba(244,183,64,.7)] transition hover:brightness-110 sm:whitespace-nowrap"
                >
                  Start your free Snapshot <Arrow className="h-5 w-5 transition group-hover:translate-x-1" />
                </a>
                <a href="#why" className="text-center font-semibold text-white underline decoration-sunrise decoration-2 underline-offset-4 hover:text-sunrise">
                  Why founders choose us
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="sticker rotate-1 bg-white/10 text-white backdrop-blur">7 minutes</span>
                <span className="sticker -rotate-1 bg-white/10 text-white backdrop-blur">No account needed</span>
                <span className="sticker rotate-2 bg-lagoon text-navy">Free</span>
              </div>
            </div>
            <ProductShowcase />
          </div>
        </section>
        <Marquee items={TICKER} className="bg-sunrise text-navy" />

        {/* Snapshot bento */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>
            Know where you stand in <span className="text-gradient whitespace-nowrap">7 minutes.</span>
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-6 md:grid-rows-2">
            <div className="lift overflow-hidden rounded-[2rem] bg-navy p-3 md:col-span-4 md:row-span-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/img/screen-plan.jpg" alt="The Plan Builder in RENZOLO OS, turning assessment results into dated goals and actions" className="h-full w-full rounded-[1.5rem] object-cover object-top" width={1280} height={800} />
            </div>
            <div className="lift rounded-[2rem] bg-coral p-7 text-navy md:col-span-2">
              <p className="font-display text-5xl font-extrabold" style={{ fontWeight: 800 }}>62<span className="text-2xl">/100</span></p>
              <p className="mt-2 font-display text-xl font-bold">Your Venture Score</p>
              <p className="mt-1 text-navy/80">Where your business stands today, and your strongest area.</p>
            </div>
            <div className="lift rounded-[2rem] bg-lagoon p-7 text-navy md:col-span-2">
              <p className="font-display text-5xl font-extrabold" style={{ fontWeight: 800 }}>3</p>
              <p className="mt-2 font-display text-xl font-bold">Gaps, named</p>
              <p className="mt-1 text-navy/80">The areas holding you back, and your most useful next move.</p>
            </div>
          </div>
          <a href={appLink("/snapshot", "home_snapshot_section")} className="group mt-8 inline-flex items-center gap-2 rounded-full bg-navy px-7 py-4 font-bold text-white hover:bg-panel">
            Take the free Snapshot <Arrow className="h-5 w-5 transition group-hover:translate-x-1" />
          </a>
        </section>

        {/* Why RENZOLO */}
        <section id="why" className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <span className="sticker rotate-1 bg-navy text-sunrise">Why RENZOLO</span>
            <h2 className="mt-5 max-w-4xl font-display text-4xl font-extrabold tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>
              Operating systems help you run your team. <span className="text-gradient">RENZOLO gets you chosen.</span>
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {WHY.map((w, i) => (
                <div key={w.title} className={`lift flex flex-col rounded-[2rem] p-8 text-navy ${BLOCKS[i]}`}>
                  <p className="font-display text-6xl font-extrabold opacity-90" style={{ fontWeight: 800 }}>0{i + 1}</p>
                  <h3 className="mt-4 font-display text-2xl font-bold leading-tight">{w.title}</h3>
                  <p className="mt-3 leading-relaxed text-navy/85">{w.text}</p>
                  <p className="mt-auto rounded-2xl bg-navy/90 p-4 pt-4 text-sm font-semibold text-white [margin-top:1.5rem]">{w.proof}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-px overflow-hidden rounded-[2rem] bg-navy sm:grid-cols-2 lg:grid-cols-4">
              {PROOF_STATS.map((p) => (
                <div key={p.label} className="bg-navy p-7 text-white">
                  <p className="text-gradient font-display text-5xl font-extrabold md:text-6xl" style={{ fontWeight: 800 }}>{p.figure}</p>
                  <p className="mt-2 text-sm text-mist">{p.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">{AFFILIATION_NOTE}</p>

            <div className="mt-10 overflow-x-auto rounded-[2rem] border-2 border-navy">
              <table className="w-full min-w-[560px] text-left text-sm md:text-base">
                <thead>
                  <tr className="border-b-2 border-navy">
                    <th className="px-6 py-4" scope="col">
                      <span className="sr-only">Compared on</span>
                    </th>
                    <th className="px-6 py-4 font-semibold text-muted" scope="col">Team operating systems</th>
                    <th className="bg-navy px-6 py-4 font-display font-bold text-sunrise" scope="col">RENZOLO™</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(([k, them, us]) => (
                    <tr key={k} className="border-b border-mist last:border-0">
                      <th scope="row" className="px-6 py-4 font-display font-bold">{k}</th>
                      <td className="px-6 py-4 text-muted">{them}</td>
                      <td className="bg-navy px-6 py-4 font-semibold text-white">
                        <span aria-hidden="true" className="mr-2 text-lagoon">✓</span>
                        {us}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Founder story */}
        <section className="relative overflow-hidden bg-navy text-white">
          <Glow />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-24">
            <div className="relative">
              <Portrait name={FOUNDER.name} photo={FOUNDER.photo} className="aspect-[4/5] w-full max-w-sm" />
              <span className="sticker absolute -right-2 top-6 rotate-3 bg-sunrise text-navy md:right-6">20+ years</span>
              <span className="sticker absolute -left-2 bottom-10 -rotate-3 bg-coral text-navy">800+ founders</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sunrise">Built from the buyer&apos;s side of the table</p>
              <blockquote className="mt-4 font-display text-3xl font-bold leading-snug md:text-4xl">“{FOUNDER.pullQuote}”</blockquote>
              <p className="mt-6 text-lg leading-relaxed text-mist">{FOUNDER.short}</p>
              <p className="mt-5 font-semibold">
                {FOUNDER.name} <span className="font-normal text-mist">· {FOUNDER.title}</span>
              </p>
              <a href="/about/" className="group mt-6 inline-flex items-center gap-2 font-bold text-sunrise">
                Read the story <Arrow className="h-5 w-5 transition group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </section>

        {/* Method */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>The Founder Trajectory™ Method</h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">Four steps, repeated as you grow. Each cycle leaves your business more ready than the last.</p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METHOD.map(([name, text], i) => (
              <li key={name} className={`lift rounded-[2rem] p-7 text-navy ${BLOCKS[i]}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-white">{i + 1}</span>
                <p className="mt-6 font-display text-3xl font-extrabold" style={{ fontWeight: 800 }}>{name}</p>
                <p className="mt-2 text-navy/85">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Trajectory + generations */}
        <section className="relative overflow-hidden bg-navy text-white">
          <Glow />
          <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>
              For every generation of founder. <span className="text-gradient">Every stage.</span>
            </h2>
            <div className="mt-8">
              <Trajectory />
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {GENERATIONS.map((g, i) => (
                <div key={g.who} className="lift rounded-[2rem] bg-white p-7 text-navy">
                  <span className={`sticker -rotate-2 text-navy ${BLOCKS[i]}`}>{g.who}</span>
                  <p className="mt-4 text-lg">{g.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product */}
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>
            Plan it. Track it. <span className="text-gradient">Get coached.</span>
          </h2>
          <p className="mt-3 max-w-2xl text-lg text-muted">RENZOLO OS™ powers Founder Trajectory™. Real screens from a sample business.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <figure className="lift rounded-[2rem] bg-lagoon p-4">
              <Screen src="/img/screen-market.jpg" alt="Market Intelligence: a researched brief for the founder's industry and country, with sources" className="!border-0 !shadow-none" />
              <figcaption className="px-2 pt-4 font-display text-xl font-bold text-navy">Market Intelligence</figcaption>
              <p className="px-2 pb-2 text-navy/80">Your market, researched and tied to your plan.</p>
            </figure>
            <figure className="lift rounded-[2rem] bg-coral p-4">
              <Screen src="/img/screen-aicoach.jpg" alt="The AI coach: questions answered with local to global insight and dated actions" className="!border-0 !shadow-none" />
              <figcaption className="px-2 pt-4 font-display text-xl font-bold text-navy">AI coach</figcaption>
              <p className="px-2 pb-2 text-navy/80">Local, national, regional and global insight, any time.</p>
            </figure>
          </div>
        </section>

        {/* Offers */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-4xl font-extrabold tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>Ways to work with us</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">Start free. Go as deep as your business needs.</p>
            <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {OFFERS.map((o, i) => (
                <li key={o.name} className="lift flex flex-col rounded-[2rem] border-2 border-navy bg-paper p-7">
                  <span className={`sticker self-start text-navy ${BLOCKS[i % BLOCKS.length]}`}>{o.price}</span>
                  <p className="mt-5 font-display text-2xl font-bold">{o.name}</p>
                  <p className="mt-2 text-muted">{o.what}</p>
                  <a href={o.href} className="group mt-auto inline-flex items-center gap-2 pt-6 font-bold text-navy">
                    {o.action} <Arrow className="h-5 w-5 transition group-hover:translate-x-1" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Markets */}
        <section className="bg-panel text-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-5xl" style={{ fontWeight: 800 }}>
              Built for Africa&apos;s founders. <span className="text-gradient">Starting in South Africa and Kenya.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-mist">Prices in US dollars. Pay by card or mobile money.</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {MARKETS.map((m) => (
                <a key={m.name} href={m.href} className="lift group rounded-[2rem] bg-navy p-7">
                  <p className="font-display text-2xl font-bold">{m.name}</p>
                  <p className="mt-2 text-sm text-mist">{m.note}</p>
                  <p className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-sunrise">
                    Start your Snapshot <Arrow className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
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
                    <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-sunrise">
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

        {/* Closing band */}
        <section className="bg-gradient-to-r from-coral via-sunrise to-lagoon">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl font-display text-4xl font-extrabold leading-tight text-navy md:text-5xl" style={{ fontWeight: 800 }}>
              Seven minutes to know where your business stands.
            </p>
            <a href={appLink("/snapshot", "home_footer_band")} className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-8 py-4 text-lg font-bold text-white">
              Take the free Snapshot <Arrow className="h-5 w-5 transition group-hover:translate-x-1" />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
