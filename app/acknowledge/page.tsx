import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureMatchingAcknowledgment } from "@/lib/acknowledgment-server";
import { AcknowledgeForm } from "./AcknowledgeForm";

export const metadata = { title: "Before you continue · Founder Trajectory™" };

/** Login landing step: a founder who hasn't acknowledged the current
 * Matching Statement sees it here before their dashboard. */
export default async function AcknowledgePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (await ensureMatchingAcknowledgment(supabase, user)) redirect("/dashboard");
  return <AcknowledgeForm />;
}
