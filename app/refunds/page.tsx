import { LegalPage, H, UL, contactEmail } from "@/components/LegalPage";

export const metadata = { title: "Refund and cancellation policy · Founder Trajectory™" };

export default function RefundsPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Refund and cancellation policy" updated="31 October 2026">
      <H>Memberships</H>
      <UL
        items={[
          "Cancelling simply means not renewing. You keep access until the end of the period you paid for.",
          "We don't give partial refunds for the unused part of a period.",
          "If you turned on automatic card renewal, cancel it with the link in Flutterwave's reminder email before the next charge.",
          "Moving down a tier takes effect at your next renewal; moving up applies a credit for your unused time.",
        ]}
      />

      <H>One-time Readiness Assessment ($79)</H>
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
