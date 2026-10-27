import { CountryLanding } from "@/components/CountryLanding";
import { membershipCurrenciesFor } from "@/lib/pricing";

export const metadata = {
  title: "Founder Trajectory™ Kenya · free Readiness Snapshot",
  description: "For Kenyan founders and MSMEs: see where your business stands in 5 minutes or less, then build a plan to grow, win contracts or get funded.",
};

export default function KenyaPage() {
  const kes = membershipCurrenciesFor("Kenya").includes("KES");
  return (
    <CountryLanding
      code="ke"
      country="Kenya"
      headline="Kenyan founders: know exactly where your business stands."
      intro="Whether you're registering your business, chasing your first big contract or preparing for a loan or investor, the free Readiness Snapshot shows what's holding you back and what to do next."
      goals={["Get ready for a bank loan, SACCO or investor conversation", "Win corporate, county or government contracts", "Formalise, register and grow steady revenue"]}
      payNote={
        kes
          ? "Membership can be paid in Kenyan shillings, by M-Pesa or card."
          : "Membership is currently paid in US dollars by card. M-Pesa payments in Kenyan shillings are coming soon."
      }
    />
  );
}
