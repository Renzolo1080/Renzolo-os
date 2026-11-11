import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { readDocument } from "@/lib/anthropic";
import { DAILY_LIMIT, checkUpload, extractionPrompt, isDocType, parseExtraction } from "@/lib/doc-intake";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/documents (multipart: file, docType, consent=yes)
 * Reads one financial or compliance document with AI and saves only the
 * extracted figures and checks (lib/doc-intake.ts). The file itself is
 * never stored. Members and one-time assessment buyers; 10 a day. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).planBuilder) return NextResponse.json({ error: "Document checks are part of membership and the one-time Readiness Assessment." }, { status: 402 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Upload a file." }, { status: 400 });
  if (form.get("consent") !== "yes") return NextResponse.json({ error: "Please confirm you're happy for us to read this document." }, { status: 400 });
  const docType = form.get("docType");
  if (!isDocType(docType)) return NextResponse.json({ error: "Choose what kind of document this is." }, { status: 400 });
  const file = form.get("file");
  const f = file instanceof File ? file : null;
  const problem = checkUpload(f ? { type: f.type, size: f.size } : null);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await supabase.from("document_extractions").select("id", { count: "exact", head: true }).eq("founder_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: `You can check up to ${DAILY_LIMIT} documents a day. Try again tomorrow.` }, { status: 429 });

  const today = new Date().toISOString().slice(0, 10);
  let reply: string;
  try {
    const base64 = Buffer.from(await f!.arrayBuffer()).toString("base64");
    reply = await readDocument(extractionPrompt(docType, today), { mediaType: f!.type, base64 });
  } catch (e) {
    console.error("Document read failed:", e);
    return NextResponse.json({ error: "We couldn't read that document just now. Please try again in a few minutes." }, { status: 502 });
  }
  const result = parseExtraction(reply, docType);
  if (!result) return NextResponse.json({ error: "We couldn't make sense of that document. Try a clearer copy or the original PDF." }, { status: 422 });

  const fileName = (f!.name || "document").replace(/[^\w.\- ]+/g, "").slice(0, 80) || "document";
  const { data, error } = await createAdminClient()
    .from("document_extractions")
    .insert({ founder_id: user.id, doc_type: docType, file_name: fileName, result })
    .select("id, doc_type, file_name, result, created_at")
    .single();
  if (error) return NextResponse.json({ error: "Couldn't save the results. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true, row: data });
}

/** DELETE /api/documents?id=… removes one saved result. */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabase.from("document_extractions").delete().eq("id", id).eq("founder_id", user.id);
  if (error) return NextResponse.json({ error: "Couldn't delete it. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
