"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EXTRAS, MAX_EXTRAS, MIN_EXTRAS, STARTER_SETS, type ExtraKey } from "@/lib/dashboard";

const field = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";

async function send(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

/** "Log progress" for one goal: the actual value today, and a note. */
export function CheckinForm({ goalId, unit }: { goalId: string; unit: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-teal">
        Log progress
      </button>
    );
  return (
    <form
      className="mt-2 grid gap-2 sm:grid-cols-[140px_1fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await send("/api/goals/checkin", "POST", { goalId, value, note });
          setOpen(false);
          setValue("");
          setNote("");
          router.refresh();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className={field} inputMode="decimal" aria-label={`Actual value${unit && unit !== "other" ? ` (${unit})` : ""}`} placeholder={`Actual now${unit && unit !== "other" ? ` (${unit})` : ""}`} value={value} onChange={(e) => setValue(e.target.value)} required />
      <input className={field} aria-label="Note" placeholder="Note (optional): what moved it?" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "…" : "Save"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-2 text-sm">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-600 sm:col-span-3">{error}</p>}
    </form>
  );
}

/** Marks a coaching commitment done from the dashboard. */
export function CommitmentDone({ sessionId, id }: { sessionId: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="shrink-0 rounded-lg border border-teal px-2 py-1 text-xs font-semibold text-teal disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          await send(`/api/coaching/sessions/${sessionId}`, "PATCH", { commitment: { id, status: "done" } });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "…" : "Done"}
    </button>
  );
}

/** Marks a plan action done from the dashboard. */
export function MarkDone({ area, id }: { area: string; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="shrink-0 rounded-lg border border-teal px-2 py-1 text-xs font-semibold text-teal disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        try {
          await send("/api/plan/actions", "PATCH", { area, id, status: "done" });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "…" : "Done"}
    </button>
  );
}

export interface UpdateValues {
  period: string;
  revenue: string;
  customers: string;
  cash: string;
  wins: string;
  challenges: string;
  asks: string;
}

/** The monthly update: three numbers and three short notes. */
export function MonthlyUpdateForm({ initial, monthLabel, startOpen }: { initial: UpdateValues; monthLabel: string; startOpen: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm font-semibold text-teal">
        Edit {monthLabel} update
      </button>
    );
  const set = (k: keyof UpdateValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await send("/api/updates", "PUT", v);
          setOpen(false);
          router.refresh();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm font-semibold text-navy">Your {monthLabel} update · 2 minutes</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs text-ink-soft">
          Revenue this month ($)
          <input className={field} inputMode="decimal" value={v.revenue} onChange={set("revenue")} />
        </label>
        <label className="text-xs text-ink-soft">
          Paying customers
          <input className={field} inputMode="numeric" value={v.customers} onChange={set("customers")} />
        </label>
        <label className="text-xs text-ink-soft">
          Cash in the bank ($)
          <input className={field} inputMode="decimal" value={v.cash} onChange={set("cash")} />
        </label>
      </div>
      <label className="block text-xs text-ink-soft">
        Wins this month
        <textarea className={field} rows={2} value={v.wins} onChange={set("wins")} maxLength={1500} />
      </label>
      <label className="block text-xs text-ink-soft">
        Challenges
        <textarea className={field} rows={2} value={v.challenges} onChange={set("challenges")} maxLength={1500} />
      </label>
      <label className="block text-xs text-ink-soft">
        Where you need help
        <textarea className={field} rows={2} value={v.asks} onChange={set("asks")} maxLength={1000} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {busy ? "Saving…" : "Save update"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Choose 3 to 5 extra views, in order, or a starter set. */
export function DashboardCustomizer({ initial, locked }: { initial: ExtraKey[]; locked: ExtraKey[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<ExtraKey[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (k: ExtraKey) => setChosen((c) => (c.includes(k) ? c.filter((x) => x !== k) : c.length >= MAX_EXTRAS ? c : [...c, k]));
  const move = (i: number, d: -1 | 1) =>
    setChosen((c) => {
      const n = c.slice();
      const j = i + d;
      if (j < 0 || j >= n.length) return c;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  async function save(list = chosen) {
    setBusy(true);
    setError(null);
    try {
      await send("/api/profile/dashboard-widgets", "PATCH", { extras: list });
      setChosen(list);
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <button type="button" className="flex w-full items-center justify-between px-5 py-3 text-sm font-semibold text-navy" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>Customise your extra views ({initial.length} of {MAX_EXTRAS})</span>
        <span className="text-ink-soft">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-5 border-t px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-navy">Starter sets</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STARTER_SETS.map((s) => (
                <button key={s.key} type="button" disabled={busy} onClick={() => save(s.extras)} title={s.description} className="rounded-full border border-navy px-3 py-1.5 text-sm text-navy hover:bg-navy hover:text-white disabled:opacity-50">
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-navy">
              Or choose {MIN_EXTRAS} to {MAX_EXTRAS} views <span className="font-normal text-ink-soft">({chosen.length} chosen)</span>
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {EXTRAS.map((e) => {
                const on = chosen.includes(e.key);
                const pos = chosen.indexOf(e.key);
                return (
                  <div key={e.key} className={`flex items-start gap-2 rounded-lg border p-3 ${on ? "border-navy bg-cream" : "border-gray-200"}`}>
                    <input type="checkbox" className="mt-1" id={`x-${e.key}`} checked={on} disabled={!on && chosen.length >= MAX_EXTRAS} onChange={() => toggle(e.key)} />
                    <label htmlFor={`x-${e.key}`} className="flex-1 text-sm">
                      <span className="font-medium">{e.label}</span>
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] uppercase text-ink-soft">{e.kind}</span>
                      {locked.includes(e.key) && <span className="ml-1 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] uppercase text-navy">Growth</span>}
                      <span className="block text-xs text-ink-soft">{e.description}</span>
                    </label>
                    {on && (
                      <span className="flex flex-col">
                        <button type="button" aria-label={`Move ${e.label} up`} className="px-1 text-xs disabled:opacity-30" disabled={pos === 0} onClick={() => move(pos, -1)}>
                          ▲
                        </button>
                        <button type="button" aria-label={`Move ${e.label} down`} className="px-1 text-xs disabled:opacity-30" disabled={pos === chosen.length - 1} onClick={() => move(pos, 1)}>
                          ▼
                        </button>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="button" disabled={busy || chosen.length < MIN_EXTRAS} onClick={() => save()} className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : chosen.length < MIN_EXTRAS ? `Choose at least ${MIN_EXTRAS}` : "Save my dashboard"}
          </button>
        </div>
      )}
    </div>
  );
}
