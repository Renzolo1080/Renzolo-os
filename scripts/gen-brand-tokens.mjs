// Generates the RENZOLO Vibrant CSS custom properties from
// design/renzolo-vibrant/tokens.json (the design system's source of truth)
// into app/brand-tokens.css and website/app/brand-tokens.css.
// Run: node scripts/gen-brand-tokens.mjs
import { readFileSync, writeFileSync } from "node:fs";

const t = JSON.parse(readFileSync(new URL("../design/renzolo-vibrant/tokens.json", import.meta.url)));
const byName = Object.fromEntries(t.color.tokens.map((c) => [c.name, c]));
const themes = t.color.themes.map((x) => x.id);

function resolve(name, theme, seen = new Set()) {
  const tok = byName[name];
  let v = typeof tok.value === "string" ? tok.value : tok.value[theme] ?? tok.value[themes[0]];
  const m = /^\{(.+)\}$/.exec(v);
  if (m && !seen.has(m[1])) { seen.add(m[1]); return resolve(m[1], theme, seen); }
  return v;
}
function channels(v) {
  const h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (h) {
    let s = h[1]; if (s.length === 3) s = s.split("").map((c) => c + c).join("");
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16)).join(" ");
  }
  const r = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(v);
  return r ? `${r[1]} ${r[2]} ${r[3]}` : null;
}
function block(theme) {
  const out = [];
  for (const c of t.color.tokens) {
    const v = resolve(c.name, theme);
    out.push(`  --${c.name}: ${v};`);
    const ch = channels(v);
    if (ch && !/^rgba/i.test(v)) out.push(`  --${c.name}-rgb: ${ch};`);
  }
  for (const s of t.shadow.tokens) out.push(`  --${s.name}: ${typeof s.value === "string" ? s.value : s.value[theme] ?? s.value.light};`);
  return out.join("\n");
}
const statics = [
  ...t.spacing.tokens.map((s) => `  --${s.name}: ${s.value};`),
  ...t.radius.tokens.map((s) => `  --${s.name}: ${s.value};`),
  ...Object.entries(t.type.families).map(([k, v]) => `  --font-${k}: ${v};`),
].join("\n");

const css = `/* RENZOLO Vibrant: generated from design/renzolo-vibrant/tokens.json by scripts/gen-brand-tokens.mjs. Do not edit by hand. */
:root {
${statics}
${block("light")}
}
[data-theme="dark"] {
${block("dark")}
  color-scheme: dark;
}
`;
for (const f of ["app/brand-tokens.css", "website/app/brand-tokens.css"]) writeFileSync(new URL(`../${f}`, import.meta.url), css);
console.log("wrote brand-tokens.css");
