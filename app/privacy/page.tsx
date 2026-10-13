import { LegalPage, H, UL, contactEmail } from "@/components/LegalPage";

export const metadata = { title: "Privacy policy · Founder Trajectory™" };

export default function PrivacyPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Privacy policy" updated="13 October 2026">
      <p>
        This policy explains how Renzolo Enterprises LLC, a Wisconsin limited liability company in the United States ("we", "us"), collects and uses
        personal information through Founder Trajectory™, powered by RENZOLO OS™ (the "Service"), including our website and app. We are the
        controller (or "responsible party") of this information.
      </p>

      <H>What we collect</H>
      <UL
        items={[
          <><strong>Details you give us:</strong> your name, company name, email address and password, and the answers you give in the Readiness Snapshot and assessments (for example your industry, country, stage, revenue band, goals, challenges and descriptions of your business).</>,
          <><strong>Results we create:</strong> your scores, gaps, reports, plans, goals and progress.</>,
          <><strong>Payments:</strong> what you bought, the amount, currency, date and status, and the reference numbers from our payment provider. We never see or store your full card or mobile-money details: they are entered on Flutterwave's secure page.</>,
          <><strong>Coaching and forms:</strong> sessions you book, cohort applications and messages you send us.</>,
          <><strong>Where you came from:</strong> the link, post, partner or referral that brought you to us (for example a tracking tag in a link), kept in a first-party cookie.</>,
          <><strong>Analytics (only if you accept):</strong> pages visited and actions such as completing the Snapshot or starting a payment, through Google Analytics and, if enabled, the Meta Pixel.</>,
        ]}
      />

      <H>How we use it</H>
      <UL
        items={[
          "To provide the Service: score your answers, create your reports and plans, run your dashboard and reminders, and arrange coaching.",
          "To take payments and keep membership records, including meeting tax and accounting obligations.",
          "To email you your Snapshot results, account and payment messages, and, if you agreed, practical tips and follow-ups. You can unsubscribe from tips at any time.",
          "To see which channels and pages help founders, and to improve the Service.",
          "To keep the Service secure and prevent misuse.",
        ]}
      />
      <p>
        Our legal bases are: performing our contract with you; your consent (marketing emails and analytics cookies, which you can withdraw); our
        legitimate interests in running and improving the Service; and complying with the law.
      </p>

      <H>AI-generated reports</H>
      <p>
        Your Readiness Report is drafted by an AI model provided by Anthropic. To create it, we send the model your name, company name and
        assessment answers and results. We do not send your email address or payment details. Anthropic processes this to produce the report
        under its commercial terms, which do not permit training its models on this data. An advisor may review reports for quality.
      </p>

      <H>Who we share it with</H>
      <p>We do not sell your personal information. We share it only with service providers who help us run the Service:</p>
      <UL
        items={[
          "Supabase (database and sign-in), hosted in the United States",
          "Vercel (website and app hosting)",
          "Flutterwave (payments)",
          "Anthropic (AI report drafting)",
          "Resend (sending email)",
          "Google and Meta (analytics, only if you accept cookies)",
          "Our coaches and advisors, for the sessions and reviews you use",
        ]}
      />
      <p>We may also disclose information if the law requires it, or to protect our rights or someone's safety.</p>

      <H>International transfers</H>
      <p>
        We are based in the United States and our providers mainly store data there. If you are in Kenya, South Africa or elsewhere, your information
        is transferred to the United States. We rely on our providers' contractual safeguards for these transfers.
      </p>

      <H>How long we keep it</H>
      <UL
        items={[
          "Account, assessment and report data: while you have an account, and for up to 12 months after your membership ends so you can pick up where you left off, unless you ask us to delete it sooner.",
          "Snapshot details from people without an account: up to 24 months.",
          "Payment records: as long as tax and accounting law requires (generally up to 7 years).",
          "Analytics data: as set in Google Analytics (up to 14 months).",
        ]}
      />

      <H id="cookies">Cookies</H>
      <UL
        items={[
          <><strong>Essential:</strong> keeping you signed in, and remembering your cookie choice.</>,
          <><strong>Where you came from (rz_attr):</strong> a first-party cookie that remembers the link that brought you, for up to 90 days, so we know which channels work and can credit referrals. It is not shared with other companies.</>,
          <><strong>Analytics (optional):</strong> Google Analytics and, if enabled, the Meta Pixel, loaded only if you click Accept. You can change your mind by clearing this site's cookies.</>,
        ]}
      />

      <H>Your rights</H>
      <p>
        Depending on where you live (including under Kenya's Data Protection Act, 2019, and South Africa's Protection of Personal Information Act),
        you can ask to access, correct or delete your information, object to or restrict how we use it, withdraw consent, and ask for a copy of it.
        Email us at {email}. We will respond within the time the law requires. You can also complain to your data protection authority, such as
        Kenya's Office of the Data Protection Commissioner or South Africa's Information Regulator.
      </p>

      <H>Security</H>
      <p>
        We use encryption in transit, access controls that limit each founder to their own data, and reputable hosting providers. No system is
        perfectly secure, so please use a strong password and keep it private.
      </p>

      <H>Children</H>
      <p>The Service is for people aged 18 and over. We do not knowingly collect information from children.</p>

      <H>Changes and contact</H>
      <p>
        We will post any changes here and, if they are significant, tell you by email. Questions: {email}, or write to Renzolo Enterprises LLC,
        Wisconsin, United States.
      </p>
    </LegalPage>
  );
}
