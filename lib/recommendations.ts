/**
 * RENZOLO OS™ — AI recommendation extraction
 *
 * Pure, framework-independent parsing (mirrors lib/scoring.ts /
 * lib/valuation.ts) so it's unit-testable without a database or network
 * call. The Diagnostic Report prompt (lib/anthropic.ts) is instructed to
 * always end with a "## Recommended Next Steps" heading followed by a
 * bullet list — this pulls that list out as structured rows so the
 * founder's Recommendations tool (app/tools) can show it as data, not
 * buried in a markdown blob, and so it can be saved to the
 * `recommendations` table (source='ai') alongside anything a human
 * advisor/coach adds (source='advisor').
 */

const HEADING_PATTERN = /^#{1,3}\s*Recommended Next Steps\s*$/im;
const BULLET_PATTERN = /^[-*]\s+(.*\S)\s*$/;

/** Extracts each bullet under the report's "Recommended Next Steps"
 * heading as a plain title string, stopping at the next heading or end
 * of text. Returns an empty array if the heading is missing or empty —
 * callers should treat that as "nothing to save," not an error, since
 * the report itself was still generated and delivered either way. */
export function extractNextSteps(markdown: string): string[] {
  const headingMatch = HEADING_PATTERN.exec(markdown);
  if (!headingMatch) return [];

  const afterHeading = markdown.slice(headingMatch.index + headingMatch[0].length);
  const lines = afterHeading.split("\n");
  const steps: string[] = [];

  for (const line of lines) {
    if (/^#{1,3}\s+\S/.test(line)) break; // next heading — stop
    const bulletMatch = BULLET_PATTERN.exec(line);
    if (bulletMatch) steps.push(bulletMatch[1].trim());
  }

  return steps;
}
