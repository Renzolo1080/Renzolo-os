import { LegalPage, H, UL, contactEmail } from "@/components/LegalPage";

export const metadata = { title: "Refund and cancellation policy · Founder Trajectory™" };

export default function RefundsPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Refund and cancellation policy" updated="1 November 2026">
      <H>Memberships</H>
      <UL
        items={[
          "Cancelling simply means not renewing. You keep access until the end of the period you paid for.",
          "We don't give partial refunds for the unused part of a period.",
          "If you turned on automatic card renewal, cancel it with the link in Flutterwave's reminder email before the next charge.",
          "Moving down a tier takes effect at your next renewal; moving up applies a credit for your unused time.",
        ]}
      />

      <H>One-time Readiness Assessment</H>
      <p>Refundable in full if you ask before your Readiness Report has been created. Once the report has been created, it is not refundable.</p>

      <H>Coaching sessions</H>
      <UL
        items={[
          "Coaching sessions are not refundable, including unused sessions. If you can't make a session, we'll work with you to reschedule it within 60 days of purchase.",
          "Sessions not used within 60 days of purchase expire. In exceptional circumstances we may extend them.",
          "If we cancel a session and can't offer you another time, we'll refund that session.",
          "Please give at least 24 hours' notice to reschedule. A session missed without notice counts as used.",
          "Coaching included in Growth and Elevate isn't refundable separately from the membership.",
        ]}
      />

      <H>Academy cohorts</H>
      <p>Each cohort's refund terms are shared before you pay to join.</p>

      <span id="uk-eu" />
      <H>UK and EU: 14-day right to cancel</H>
      <UL
        items={[
          "If you're in the United Kingdom or the European Union, you can cancel a membership or a one-time purchase within 14 days of the day you buy it, without giving a reason, and we'll refund you in full.",
          "If you ask us to start within those 14 days (for example, your Readiness Report is created or a session takes place), we'll refund what you paid less a fair amount for what you've already received. Once a service has been fully provided at your request, it can't be cancelled.",
          `To cancel, email ${email} within the 14 days with the email address on your account. Refunds go back to the original payment method.`,
        ]}
      />

      <span id="progress-review" />
      <H>Progress review</H>
      <p>
        If you work your plan and still miss a goal you set in RENZOLO OS™, we&apos;ll re-assess your business with you and may add coaching time to help
        you get there. It works like this:
      </p>
      <UL
        items={[
          "You can ask for a progress review if, by the goal's date, you had an active membership the whole time; completed at least 75% of the plan actions due by that date (or agreed a reason with your coach for any you didn't); logged a check-in on the goal at least once a month; kept your monthly updates current; and attended or rescheduled, rather than missed, your included coaching sessions.",
          "We look at your plan activity, check-ins and coaching records and decide, reasonably and in good faith, whether to re-assess and how much coaching time to add.",
          "If missing the goal is mainly because planned goals, steps or actions weren't completed, we'll re-assess and recommend changes to your plan, but may not add coaching time.",
          `Ask within 30 days after the goal's date by emailing ${email}.`,
          "A progress review is not a refund, a cash credit or a guarantee of any business result, contract, credit, funding or investment. It doesn't affect your legal rights.",
        ]}
      />

      <H>Mistakes and duplicate charges</H>
      <p>
        If you were charged twice, charged the wrong amount, or paid but didn't receive what you bought, contact us and we'll fix it or refund you in
        full.
      </p>

      <H>How to ask</H>
      <p>
        Email {email} with the email address on your account and the payment date. Approved refunds go back to the original payment method through
        Flutterwave, usually within 5 to 10 working days depending on your bank or mobile-money provider. Your legal rights under local consumer law
        are not affected.
      </p>
    </LegalPage>
  );
}
