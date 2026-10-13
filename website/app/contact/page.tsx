import { Header, Footer } from "@/components/Chrome";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/Forms";

export const metadata = { title: "Contact", description: "Questions, partnerships, media and support." };

export default function ContactPage() {
  return (
    <>
      <Header campaign="contact_header" />
      <main>
        <PageHero title="Talk to us." intro="Questions about membership or the Academy, partnerships, media, or help with your account. We reply within two working days." />
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1fr_1.3fr] md:py-24">
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold">For partners</h2>
              <p className="mt-2 text-muted">
                We work with supplier development programs, business associations, accelerators and corporate buyers to assess and develop the
                founders they support. Choose "Partnership" and tell us about your program.
              </p>
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">For founders</h2>
              <p className="mt-2 text-muted">
                The fastest way to get started is the free Readiness Snapshot. Members can manage their plan and coaching from their dashboard.
              </p>
            </div>
          </div>
          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
