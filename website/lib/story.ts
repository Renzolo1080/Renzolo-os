/** The RENZOLO founder story and credentials, in one place so the home
 * and About pages say the same thing.
 *
 * CONFIRM BEFORE PUBLISHING: Lorenzo to confirm or edit every claim here
 * (employers, titles, years, numbers). Figures stay out until he supplies
 * them, so the site never shows a placeholder or an invented number.
 * Add his headshot as website/public/img/lorenzo.jpg and set `photo`. */

export const FOUNDER = {
  name: "Lorenzo Bell Jr.",
  title: "Founder & CEO, RENZOLO™",
  photo: undefined as string | undefined,
  pullQuote:
    "Talented founders lose opportunities not because their business is weak, but because nobody showed them what ready looks like to a buyer, a lender or an investor.",
  short:
    "Lorenzo has assessed and developed suppliers for large buyers and connected them to contract opportunities. He built RENZOLO to put the buyer's, lender's and investor's view of readiness in every founder's hands, at a price early-stage founders across Africa can afford.",
  story: [
    "For years I sat on the other side of the table. I assessed suppliers for large buyers, developed them until they were ready, and connected them to contracts worth winning. I saw the same thing again and again: talented founders lost opportunities not because their business was weak, but because nobody had shown them what “ready” looks like to a buyer, a lender or an investor.",
    "I built RENZOLO to change that. Founder Trajectory™ takes what procurement teams, credit committees and investors check, and turns it into an assessment, a plan and coaching any founder can use, at a price early-stage founders in Africa can afford.",
    "I learned discipline and mission in the U.S. Navy, and supply chain, supplier diversity and ESG in global companies. Today I advise the Girls STEAM Institute on building the next generation of supplier-ready entrepreneurs. The lesson is the same everywhere: no single generation builds the future alone.",
  ],
  /** From "Building Tomorrow's Supply Chain" (9WEUSA), where Lorenzo is quoted. */
  generationsQuote:
    "No single generation can future-proof the global supply chain alone. … The opportunity isn't choosing a generation — it's building the ecosystem that finally connects all of them.",
};

/** Expertise and proof points. `figure` stays empty until a real number is supplied. */
export const CREDENTIALS: { figure?: string; title: string; text: string }[] = [
  {
    title: "Supplier readiness",
    text: "Assessing and developing suppliers until they meet the standard large buyers require: capability, compliance, capacity and evidence.",
  },
  {
    title: "Contract opportunities",
    text: "Connecting ready suppliers to contract opportunities with large buyers and their supply chains.",
  },
  {
    title: "Capital and investor readiness",
    text: "Preparing founders for what lenders, grant makers and investors check before they say yes.",
  },
  {
    title: "Supply chain, supplier diversity and ESG",
    text: "A career in global companies across supply chain, supplier diversity and ESG.",
  },
  {
    title: "U.S. Navy veteran",
    text: "Discipline, mission and follow-through, brought to every founder we work with.",
  },
  {
    title: "Girls STEAM Institute Advisory Group",
    text: "Advising on a pipeline of Gen Z women becoming supplier-ready STEAM entrepreneurs.",
  },
];
