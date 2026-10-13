import { Header, Footer } from "@/components/Chrome";
import { Trajectory } from "@/components/Trajectory";
import { APP_URL, appLink } from "@/lib/site";

const OFFERS = [
  {
    name: "Free Readiness Snapshot",
    what: "Five to seven minutes. Your Venture Score, your Strategic Plan Readiness and the three areas holding your venture back.",
    price: "Free",
    action: "Take the Snapshot",
    href: appLink("/snapshot", "home_offers"),
  },
  {
    name: "Founder Trajectory™ membership",
    what: "Your full Readiness Assessment, a growth and readiness plan of 90 days to 36 months, a dashboard to work it, and coaching at the level you choose.",
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
    what: "Sessions with a Founder Trajectory™ coach to work through your plan, your numbers or your next big decision.",
    price: "$79 a session, $59 for members",
    action: "See coaching",
    href: appLink("/pricing", "home_offers_coaching"),
  },
  {
    name: "Founder Trajectory™ Academy",
    what: "Six, eight and twelve-week cohorts where founders work through their plans together, with live sessions and coaching.",
    price: "Applications by cohort",
    action: "Explore the Academy",
    href: "/academy/",
  },
  {
    name: "For partners",
    what: "Readiness assessments and cohorts for the founders and suppliers in your program, association or supply chain.",
    price: "Built with you",
    action: "Talk to us",
    href: "/contact/",
  },
];

const METHOD = [
  ["Evaluate", "Take the Snapshot, then your full Readiness Assessment, and see exactly where you stand and why."],
  ["Evolve", "Turn the results into a growth and readiness plan, and update your strategy around the gaps that matter."],
  ["Execute", "Work the plan with your dashboard, goals, reminders, tools and coaching."],
  ["Elevate", "Re-assess, measure progress and move to your next stage."],
];

const MARKETS = [
  { name: "United States", note: "Where RENZOLO is based.", href: appLink("/snapshot?country=United%20States", "home_markets_us") },
  { name: "Kenya", note: "For founders and MSMEs ready to formalise, win contracts and grow.", href: `${APP_URL}/ke?utm_source=website&utm_medium=referral&utm_campaign=home_markets_ke` },
  { name: "South Africa", note: "For founders and SMMEs getting supplier- and funding-ready.", href: `${APP_URL}/za?utm_source=website&utm_medium=referral&utm_campaign=home_markets_za` },
];

export default function Home() {
  return (
    <>
      <Header campaign="home_header" />
      <main>
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-6xl px-5 pb-10 pt-10 md:pt-16">
            <h1 className="max-w-4xl font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl md:text-7xl" style={{ fontWeight: 800 }}>
              Know where your venture stands. Then move it forward.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
              RENZOLO helps founders in the United States, Kenya and South Africa measure how ready their venture is, close the gaps holding it back, and
              grow with a plan, coaching and the right connections.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href={appLink("/snapshot", "home_hero")} className="rounded-full bg-gold px-7 py-4 text-center text-lg font-semibold text-white hover:bg-[#ad7b24]">
                Take the free Readiness Snapshot
              </a>
              <a href="/founder-trajectory/" className="text-center font-semibold text-gold-soft underline-offset-4 hover:underline">
                How Founder Trajectory™ works
              </a>
            </div>
            <div className="mt-12 md:mt-6">
              <Trajectory />
            </div>
            <p className="mt-2 max-w-xl text-sm text-mist">
              Every venture is somewhere on this path, from first idea to exit. Founder Trajectory™ shows you where you are and what it takes to reach
              the next stage.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Ways to work with us</h2>
          <p className="mt-3 max-w-2xl text-muted">Start free. Go as deep as your venture needs.</p>
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
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">The Founder Trajectory™ method</h2>
            <p className="mt-3 max-w-2xl text-muted">Four steps, repeated as you grow. Each cycle leaves your venture more ready than the last.</p>
            <ol className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
              <span aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-[3px] bg-gold/40 md:block" />
              {METHOD.map(([name, text], i) => (
                <li key={name} className="relative">
                  <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-navy font-display text-lg font-bold text-gold-soft">{i + 1}</span>
                  <p className="mt-5 font-display text-2xl font-bold">{name}</p>
                  <p className="mt-2 text-muted">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-panel text-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Where we work</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-navy md:grid-cols-3">
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

        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_1.4fr] md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Built by a founder, for founders</h2>
          <div>
            <p className="text-lg leading-relaxed">
              RENZOLO was founded by Lorenzo Bell Jr., a U.S. Navy veteran, to give founders the clarity that investors, lenders and corporate buyers
              expect: an honest view of where the business stands, and a practical plan to get it ready.
            </p>
            <a href="/about/" className="mt-6 inline-block font-semibold text-teal underline-offset-4 hover:underline">
              About RENZOLO
            </a>
          </div>
        </section>

        <section className="bg-gold">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl font-display text-3xl font-bold leading-tight text-navy md:text-4xl">Seven minutes to know where your venture stands.</p>
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
