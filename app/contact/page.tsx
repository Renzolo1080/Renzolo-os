import { ContactForm } from "@/components/PublicForms";

export const metadata = { title: "Contact · Founder Trajectory™", description: "Questions, partnerships, media and support." };

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Contact</p>
        <h1 className="mt-2 text-3xl font-bold text-navy">Talk to our team</h1>
        <p className="mt-3 text-ink-soft">
          Questions about membership, the Academy, partnerships with business support organisations, or media requests: send us a message and
          we'll reply within two working days.
        </p>
        {email && (
          <p className="mt-4 text-sm">
            Or email{" "}
            <a href={`mailto:${email}`} className="font-semibold text-teal underline">
              {email}
            </a>
            .
          </p>
        )}
        <div className="mt-8 rounded-2xl border border-gold/50 bg-white p-5 text-sm">
          <p className="font-semibold text-navy">For partners</p>
          <p className="mt-1 text-ink-soft">
            We work with supplier development programs, business associations and accelerators to run readiness assessments and cohorts for their
            founders. Choose "Partnership" and tell us about your program.
          </p>
        </div>
      </div>
      <ContactForm />
    </main>
  );
}
