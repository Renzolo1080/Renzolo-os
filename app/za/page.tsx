import { CountryLanding } from "@/components/CountryLanding";
import { membershipCurrenciesFor } from "@/lib/pricing";

export const metadata = {
  title: "Founder Trajectory™ South Africa · free Readiness Snapshot",
  description: "For South African founders and SMMEs: see where your venture stands in 5-7 minutes, then build a plan to grow, win contracts or get funded.",
};

export default function SouthAfricaPage() {
  const zar = membershipCurrenciesFor("South Africa").includes("ZAR");
  return (
    <CountryLanding
      code="za"
      country="South Africa"
      headline="South African founders: know exactly where your venture stands."
      intro="Whether you're preparing for funding, supplier development programmes or corporate contracts, the free Readiness Snapshot shows what's holding you back and what to do next."
      goals={["Get ready for funders, lenders and enterprise development programmes", "Become supplier-ready for corporate and public-sector contracts", "Build steady, profitable revenue you can scale"]}
      payNote={
        zar
          ? "Membership can be paid in South African rand, by card, bank account or 1Voucher."
          : "Membership is currently paid in US dollars by card. Payment in rand is coming soon."
      }
    />
  );
}
