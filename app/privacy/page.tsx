import { LegalPage, H, UL, contactEmail } from "@/components/LegalPage";
import { INFORMATION_OFFICER, PRIVACY_UPDATED, RESPONSE_DAYS } from "@/lib/privacy";

export const metadata = { title: "Privacy policy · Founder Trajectory™" };

export default function PrivacyPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Privacy policy" updated={PRIVACY_UPDATED}>
      <p>
        This policy explains how Renzolo Enterprises LLC, a Wisconsin limited liability company in the United States ("we", "us"), collects and uses
        personal information through Founder Trajectory™, powered by RENZOLO OS™ (the "Service"), including our website and app. We are the
        controller (or "responsible party") of this information.
      </p>
      <p>
        We treat information about your business (for example revenue, costs, plans and assessment answers) as personal information, because it
        is linked to you. In South Africa, POPIA also protects information about companies and other juristic persons, and we apply the same care
        to it.
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
          "To email you your Snapshot results, account and payment messages, and, if you agreed, practical tips and follow-ups. We send marketing by email, SMS or WhatsApp only if you opted in, and you can unsubscribe at any time.",
          "To see which channels and pages help founders, and to improve the Service.",
          "To keep the Service secure and prevent misuse.",
        ]}
      />
      <p>
        Our legal bases are: performing our contract with you; your consent (marketing emails and analytics cookies, which you can withdraw); our
        legitimate interests in running and improving the Service; and complying with the law.
      </p>

      <H>AI-generated reports and AI coaching</H>
      <p>
        Your Readiness Report, plan review, Market Intelligence and AI coach replies are drafted by an AI model provided by Anthropic. To create
        them, we send the model your name, company name, assessment answers and results, your plan, goals and the messages you write. We do not
        send your email address or payment details. Anthropic processes this under its commercial terms, which do not permit training its models
        on this data. An advisor may review reports for quality.
      </p>
      <p>
        Lorenzo · AI is an AI video version of our founder, run by our video provider Tavus. It is always labelled as AI. When you start a video
        session, which you choose to do, Tavus processes your video and voice for that session to run the conversation, and we share a short
        summary of your plan, goals and scores so it can coach you. Sessions are limited to 10 minutes. You can use text coaching instead at any time.
      </p>

      <H>Who we share it with</H>
      <p>
        We do not sell your personal information. We share it with the service providers below, who may use it only to run the Service for us
        under written data processing terms:
      </p>
      <UL
        items={[
          "Supabase (database and sign-in), hosted in the United States",
          "Vercel (website and app hosting)",
          "Flutterwave (payments)",
          "Anthropic (AI reports and AI coaching)",
          "Tavus (Lorenzo · AI video sessions, only if you start one)",
          "Resend (sending email)",
          "Google and Meta (analytics, only if you accept cookies)",
          "Our coaches and advisors, for the sessions and reviews you use",
        ]}
      />
      <p>
        <strong>RENZOLO Network™ Matching (optional add-on):</strong> if you subscribe, we share your profile and readiness scores with a buyer,
        lender, grant maker, investor or partner only after you agree to that specific introduction. You can withdraw consent at any time.
      </p>
      <p>We may also disclose information if the law requires it, or to protect our rights or someone's safety.</p>

      <H>International transfers</H>
      <p>
        We are based in the United States and store your information with Supabase in the United States (US East). If you are in Africa, the
        Caribbean, the United Kingdom, the European Union or elsewhere, your information is transferred to the United States, and some providers
        may process it in other countries. You acknowledge this when you create an account.
      </p>
      <p>
        We protect these transfers with data processing agreements with each provider, including standard contractual clauses where your
        country's law calls for them (for example the clauses published by Kenya's Data Protection Commissioner, and the EU and UK clauses once we
        serve those markets). Ask us for a copy of the safeguards that apply to you.
      </p>

      <H id="scores">How your score is made, and your right to a human review</H>
      <p>
        Your Total Readiness Score and its five component scores (Strategic, Growth, Customer, Capital and Investment) are calculated by fixed
        rules from your answers, evidence and plan. The Strategic score can include an AI review of your plan. Scores are guidance for you, not a
        decision about you: RENZOLO OS™ does not approve or refuse any loan, contract, investment or other opportunity.
      </p>
      <p>
        You can see how scores are made on your dashboard, correct your answers at any time, and ask a person to review any score from the{" "}
        <a href="/account/data#review" className="underline">Your data</a> page.
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
        Wherever you live, you can ask to access, download, correct or delete your information, object to or restrict how we use it, withdraw
        consent, and ask a person to review your scores. Use the <a href="/account/data" className="underline">Your data</a> page or email {email}.
        We answer within {RESPONSE_DAYS} days.
      </p>
      <p>You can also complain to your data protection authority, for example:</p>
      <UL
        items={[
          "South Africa: the Information Regulator",
          "Kenya: the Office of the Data Protection Commissioner",
          "Nigeria: the Nigeria Data Protection Commission",
          "Jamaica: the Office of the Information Commissioner",
          "Other countries: your national data protection authority",
          "United States: residents of states with privacy laws (such as California) have similar rights; contact us to use them",
        ]}
      />

      <H>Privacy contact and Information Officer</H>
      <p>
        Our Information Officer, who handles privacy requests and complaints, is {INFORMATION_OFFICER.name}, {INFORMATION_OFFICER.role}. Contact{" "}
        {email}. Our South African PAIA manual is at <a href="/paia" className="underline">/paia</a>.
      </p>

      <H>If something goes wrong</H>
      <p>
        If a security breach puts your information at risk, we will tell the regulators that require it (in most of our markets within 72 hours)
        and tell you without undue delay, with what happened and what you can do.
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
