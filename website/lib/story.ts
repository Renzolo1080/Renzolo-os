/** The RENZOLO founder story, track record and proof, in one place so the
 * home and About pages say the same thing.
 *
 * Sources: Lorenzo's own statement of his roles (Oct 2026) and the EY
 * Africa Enterprise Impact Program 2026 kick-off deck (15 Jan 2026), which
 * gives his EY title and the programme's results since 2021.
 *
 * CONFIRM BEFORE PUBLISHING (see the "Why us" doc): EIP start year and
 * "founder" wording, the EY Ignite programme name, the Packers programme
 * name, and that EY programme figures may be cited. Past EY roles are
 * described as past; RENZOLO is not affiliated with or endorsed by EY,
 * and the site says so wherever EY is named.
 * Add his headshot as website/public/img/lorenzo.jpg and set `photo`. */

export const FOUNDER = {
  name: "Lorenzo Bell Jr.",
  title: "Founder & CEO, RENZOLO™",
  photo: undefined as string | undefined,
  pullQuote:
    "Talented founders lose opportunities not because their business is weak, but because nobody showed them what ready looks like to a buyer, a lender or an investor.",
  short:
    "For more than 20 years Lorenzo has developed suppliers and founders for large buyers across Africa, the UK, Europe, the US, India, Latin America and the Caribbean. In six years founding and leading EY Africa's Enterprise Impact Program, he trained 800+ entrepreneurs in 19 African countries to become customer and investor ready, with $880k invested in their businesses. RENZOLO puts that playbook in every founder's hands.",
  story: [
    "For more than 20 years I sat on the buyer's side of the table. I assessed suppliers for global companies, developed them until they were ready, and connected them to contracts worth winning, across Africa, the UK, Europe, the US, India, Latin America and the Caribbean. I saw the same thing again and again: talented founders lost opportunities not because their business was weak, but because nobody had shown them what “ready” looks like to a buyer, a lender or an investor.",
    "At EY I led inclusive and sustainable procurement strategy, and founded and led the EY Africa Enterprise Impact Program: a six-month accelerator. Over six years we trained 800+ entrepreneurs across 19 African countries to become customer and investor ready, 60% of them women, with $880k invested in their businesses. I trained and coached those founders myself, and I've coached founders through EY's Ignite advisor programme and the Green Bay Packers Mentor-Protégé Program.",
    "I built RENZOLO so every founder can get that support, not just the few who win a place in a cohort. Founder Trajectory™ turns what procurement teams, credit committees and investors check into an assessment, a plan and coaching any founder can use, at a price early-stage founders in Africa can afford.",
    "I learned discipline and mission in the U.S. Navy. Today I also advise the Girls STEAM Institute on building the next generation of supplier-ready entrepreneurs. The lesson is the same everywhere: no single generation builds the future alone.",
  ],
  /** From "Building Tomorrow's Supply Chain" (9WEUSA), where Lorenzo is quoted. */
  generationsQuote:
    "No single generation can future-proof the global supply chain alone. … The opportunity isn't choosing a generation — it's building the ecosystem that finally connects all of them.",
};

/** Headline proof figures. */
export const PROOF_STATS: { figure: string; label: string }[] = [
  { figure: "20+", label: "years developing suppliers and founders" },
  { figure: "800+", label: "entrepreneurs trained in six years leading EY Africa's Enterprise Impact Program" },
  { figure: "19", label: "African countries reached" },
  { figure: "$880k", label: "invested in programme founders' businesses" },
];

/** Shown wherever EY or another organisation is named. */
export const AFFILIATION_NOTE =
  "Roles and programme results are from Lorenzo's past and current positions. RENZOLO™ is independent and is not affiliated with or endorsed by EY or the other organisations named.";

/** Track record, newest first. */
export const TRACK_RECORD: { years: string; role: string; org: string; text: string }[] = [
  {
    years: "2021–2026",
    role: "Founder, lead, trainer and coach",
    org: "EY Africa Enterprise Impact Program",
    text: "Six years leading a six-month virtual accelerator that closes the capability gap for black-owned businesses in Africa and opens customer and investor opportunities. Results: 800+ entrepreneurs trained across 19 countries, 60% women, $880k invested, 280 hours of training and coaching.",
  },
  {
    years: "2024–2026",
    role: "Advisor and coach",
    org: "EY Ignite advisor programme",
    text: "Advising and coaching founders.",
  },
  {
    years: "Until 2026",
    role: "Associate Director, ESG & Enablement Services, Supply Chain Services",
    org: "EY, USA",
    text: "Led the global growth strategy for EY's inclusive and sustainable procurement, including policies and programmes for the development and growth of impact businesses.",
  },
  {
    years: "2018–present",
    role: "Board member and coach",
    org: "Green Bay Packers Mentor-Protégé Program",
    text: "Mentoring and coaching growing businesses in the programme.",
  },
  {
    years: "20+ years",
    role: "Supplier development and advocacy governance",
    org: "Global supply chains",
    text: "Building diverse supplier slates across Africa, the UK, Europe, the US, India, Latin America and the Caribbean, and advising advocacy organisations on strategy and governance.",
  },
];

/** Expertise. */
export const CREDENTIALS: { figure?: string; title: string; text: string }[] = [
  {
    figure: "20+ yrs",
    title: "Supplier readiness",
    text: "Assessing and developing suppliers until they meet the standard large buyers require: capability, compliance, capacity and evidence.",
  },
  {
    figure: "7 regions",
    title: "Contract opportunities",
    text: "Connecting ready suppliers to contract opportunities with large buyers and their supply chains, across seven regions of the world.",
  },
  {
    figure: "800+",
    title: "Customer and investor readiness",
    text: "Entrepreneurs trained to become customer and investor ready in six years leading the EY Africa Enterprise Impact Program, across 19 countries, with $880k invested.",
  },
  {
    title: "Coaching founders",
    text: "Trainer and coach in the Enterprise Impact Program, EY's Ignite advisor programme and the Green Bay Packers Mentor-Protégé Program.",
  },
  {
    title: "Advocacy and governance",
    text: "Advising advocacy organisations on strategy and governance, and the Girls STEAM Institute on its supplier-ready pipeline.",
  },
  {
    title: "U.S. Navy veteran",
    text: "Discipline, mission and follow-through, brought to every founder we work with.",
  },
];

/** Each "why" claim, tied to the proof behind it (home page). */
export const WHY_PROOF = {
  outcome: "Proof: the customer and investor readiness approach Lorenzo used to train 800+ founders in 19 African countries over six years.",
  buyer: "Proof: 20+ years developing suppliers for global buyers across Africa, the UK, Europe, the US, India, Latin America and the Caribbean.",
  price: "Proof: the kind of support EIP values at $25,000 per founder, now from $15 a month.",
};

/** Results strip (brand book: Measurable outcomes). Until RENZOLO has its
 * own results, these are labelled as Lorenzo's track record, with a base
 * and an as-of date. */
export const RESULTS = {
  label: "Lorenzo's track record, before RENZOLO",
  stats: [
    { figure: "20+", label: "years developing suppliers and founders" },
    { figure: "800+", label: "entrepreneurs trained to be customer and investor ready" },
    { figure: "19", label: "African countries" },
    { figure: "$880K", label: "invested in programme founders" },
  ],
  base: "Programme figures cover six years leading the EY Africa Enterprise Impact Program (2021–2026), as reported in January 2026.",
};

/** Real testimonials only, with written permission and a real photo. The
 * section stays hidden until there are at least four. */
export const TESTIMONIALS: { quote: string; name: string; business: string; place: string; result: string; photo?: string }[] = [];
