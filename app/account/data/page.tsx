import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { YourDataPanel } from "@/components/YourDataPanel";
import { RESPONSE_DAYS } from "@/lib/privacy";

export const metadata = { title: "Your data · Founder Trajectory™" };

export default async function YourDataPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase
    .from("data_requests")
    .select("id, kind, status, created_at")
    .eq("founder_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-navy">Your data</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Download everything we hold about you, ask a person to review your score, or ask us to correct or delete your information. We answer
          every request within {RESPONSE_DAYS} days. See our <a href="/privacy" className="underline">privacy policy</a>.
        </p>
      </div>
      <YourDataPanel email={user.email ?? ""} requests={requests ?? []} />
    </main>
  );
}
