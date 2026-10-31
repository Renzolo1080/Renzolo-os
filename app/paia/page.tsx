import { LegalPage, H, UL, contactEmail } from "@/components/LegalPage";
import { INFORMATION_OFFICER, PRIVACY_UPDATED } from "@/lib/privacy";

export const metadata = { title: "PAIA manual (South Africa) · Founder Trajectory™" };

/** Manual under section 51 of South Africa's Promotion of Access to
 * Information Act (PAIA), as a private body. Draft for legal review. */
export default function PaiaPage() {
  const email = contactEmail();
  return (
    <LegalPage title="PAIA manual (South Africa)" updated={PRIVACY_UPDATED}>
      <p>
        This manual is published by Renzolo Enterprises LLC ("RENZOLO"), a Wisconsin limited liability company in the United States that offers
        Founder Trajectory™ and RENZOLO OS™ to founders in South Africa, under section 51 of the Promotion of Access to Information Act 2 of 2000
        (PAIA) and the Protection of Personal Information Act 4 of 2013 (POPIA).
      </p>

      <H>1. Contact details</H>
      <UL
        items={[
          `Information Officer: ${INFORMATION_OFFICER.name}, ${INFORMATION_OFFICER.role}`,
          `Email: ${email}`,
          "Postal address: Renzolo Enterprises LLC, Wisconsin, United States",
          "Website: renzoloenterprises.com",
        ]}
      />

      <H>2. Guide from the Information Regulator</H>
      <p>
        The Information Regulator publishes a guide on how to use PAIA and POPIA. It is available from the Information Regulator's website
        (inforegulator.org.za) in South Africa's official languages, and we can send you a copy on request.
      </p>

      <H>3. Records available without a request</H>
      <UL items={["Our privacy policy, terms of service and refund policy", "Pricing and membership information on our website", "The RENZOLO Network™ Matching Statement"]} />

      <H>4. Records we hold</H>
      <UL
        items={[
          "Company records: formation documents, policies, contracts with service providers",
          "Founder records: accounts, Snapshot and assessment answers, scores, reports, plans, coaching records, Matching consents",
          "Financial records: payments, invoices and tax records",
          "Marketing records: email consents and unsubscribes",
          "Records kept under other laws, such as tax and consumer protection law",
        ]}
      />

      <H>5. How we process personal information</H>
      <UL
        items={[
          "Purpose: to provide readiness assessments, plans, coaching and the services founders buy, to take payment, and to keep the Service secure.",
          "People and organizations concerned: founders and their businesses (POPIA protects both), coaches and advisors, website visitors, and partners.",
          "Information: identity and contact details, business and financial information, scores and plans, payment references, coaching records, analytics if accepted.",
          "Recipients: our service providers (Supabase, Vercel, Flutterwave, Anthropic, Tavus, Resend, and Google and Meta if analytics are accepted), and organizations a founder agrees to be introduced to through Matching.",
          "Transfers outside South Africa: information is stored in the United States under data processing agreements that bind each provider to protect it (POPIA section 72).",
          "Security: encryption in transit, row-level access controls that limit each founder to their own data, restricted admin access and reputable hosting.",
        ]}
      />

      <H>6. How to request a record</H>
      <p>
        Email the Information Officer at {email} using the request form prescribed under PAIA (Form 2), or describe the record you want and how you
        want to receive it. Founders can download their own information at any time from the Your data page. We respond within 30 days. Prescribed
        fees under PAIA may apply to requests for records other than your own personal information; we will tell you any fee before we proceed.
      </p>

      <H>7. Objections, corrections and complaints</H>
      <p>
        You can object to processing, or ask us to correct or delete your personal information, through the Your data page or by email (POPIA forms
        1 and 2 may be used). If you are not satisfied with our answer, you can complain to the Information Regulator.
      </p>
    </LegalPage>
  );
}
