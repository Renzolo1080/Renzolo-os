import { LegalPage, H, UL, contactEmail } from "@/components/LegalPage";

export const metadata = { title: "Terms of service · Founder Trajectory™" };

export default function TermsPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Terms of service" updated="13 October 2026">
      <p>
        These terms are an agreement between you and Renzolo Enterprises LLC ("we", "us") for using Founder Trajectory™, powered by RENZOLO OS™
        (the "Service"). By creating an account, taking the Readiness Snapshot or buying anything, you agree to them.
      </p>

      <H>The Service</H>
      <p>
        The Service helps founders assess how ready their venture is and plan its growth: the free Readiness Snapshot, memberships (Essentials,
        Growth and Elevate), the one-time Readiness Assessment, one-on-one coaching, and Founder Trajectory™ Academy cohorts. What each includes is
        described on our <a href="/pricing" className="text-teal underline">pricing page</a>.
      </p>

      <H>Who can use it</H>
      <p>You must be at least 18 and able to enter into a contract. If you use the Service for a business, you confirm you're authorised to act for it.</p>

      <H>Your account</H>
      <p>Keep your login private and tell us straight away if you think someone else has used it. Give us accurate information: your results depend on it.</p>

      <H>Memberships and payment</H>
      <UL
        items={[
          "Prices are shown before you pay. Payments are processed by Flutterwave; its terms also apply to the payment itself.",
          "Essentials can be paid monthly, quarterly or yearly. Growth and Elevate are paid quarterly or yearly.",
          "Unless you chose automatic card renewal, each payment buys one period and your membership ends at the end of it unless you renew. Renewing early adds time on top of what you have.",
          "Moving up a tier starts straight away, with a credit for unused time on your current plan. Moving down takes effect when your current paid period ends.",
          "If you turned on automatic card renewal, you can cancel it at any time using the link in the reminder email Flutterwave sends before each charge.",
          "We may change prices for future periods. A change never affects a period you have already paid for.",
          "Elevate places are limited. When they're full, you can join a waitlist.",
        ]}
      />
      <p>
        Refunds are covered by our <a href="/refunds" className="text-teal underline">refund and cancellation policy</a>.
      </p>

      <H>Coaching</H>
      <p>
        Coaching sessions are arranged by email after you book. Please give at least 24 hours' notice to reschedule; a session missed without notice
        counts as used. Included sessions belong to the period they come with and don't roll over. Sessions you buy are valid for 12 months.
      </p>

      <H>Academy cohorts</H>
      <p>
        Cohorts have their own fee and application. Membership gives priority when applying, but every founder must meet the entry criteria for the
        cohort. Each cohort may have additional terms, which we'll share before you join.
      </p>

      <H>AI-generated content and advice</H>
      <p>
        Reports, plans, market insights and valuation ranges are drafted with the help of AI and simple models, based on the information you give.
        They are for your own planning and education. They are not financial, investment, legal, tax or accounting advice, a formal valuation, or a
        guarantee of funding or results. Check important figures and decisions with a qualified professional before relying on them.
      </p>

      <H>Acceptable use</H>
      <UL
        items={[
          "Don't misuse the Service, try to get into other people's accounts or data, or disrupt it.",
          "Don't copy, resell or republish the Service or its content, except your own reports for your own business use.",
          "Don't submit anything unlawful or anything you don't have the right to share.",
        ]}
      />

      <H>Ownership</H>
      <p>
        You own the information you give us and your business plans. You allow us to use it to provide and improve the Service, as set out in our{" "}
        <a href="/privacy" className="text-teal underline">privacy policy</a>. We own the Service, its methods (including the Founder Trajectory™
        method), software, wording and design, and our trademarks.
      </p>

      <H>Suspension and ending</H>
      <p>
        You can stop using the Service at any time. We may suspend or close an account that breaks these terms, after telling you why where we
        reasonably can.
      </p>

      <H>Liability</H>
      <p>
        We provide the Service with reasonable care and skill, but "as is" and without guarantees of particular business results. To the extent the
        law allows, we are not liable for indirect or consequential losses (such as lost profits, funding or contracts), and our total liability to
        you is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits rights you have under consumer
        protection laws that can't be excluded.
      </p>

      <H>Law and disputes</H>
      <p>
        These terms are governed by the laws of the State of Wisconsin, United States. Please contact us first so we can try to resolve any problem.
        Where your local consumer law gives you the right to bring a claim in your own country, that right is not affected.
      </p>

      <H>Changes and contact</H>
      <p>We may update these terms and will tell you about significant changes. Questions: {email}.</p>
    </LegalPage>
  );
}
