import React from "react";

/** Renders the report's markdown (headings, bullet and numbered lists,
 * bold, italic, paragraphs) as plain React elements. No HTML from the
 * report is ever injected into the page. */
function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong>);
    else out.push(<em key={`${key}-${i++}`}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function ReportMarkdown({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`} className="my-2 leading-relaxed">{inline(para.join(" "), `p${blocks.length}`)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={`l${blocks.length}`} className={`my-2 space-y-1 pl-5 ${list.ordered ? "list-decimal" : "list-disc"}`}>
        {list.items.map((it, i) => (
          <li key={i}>{inline(it, `l${blocks.length}-${i}`)}</li>
        ))}
      </Tag>
    );
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const num = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (h) {
      flushPara();
      flushList();
      const level = h[1].length;
      const cls = level <= 2 ? "mt-6 mb-2 text-lg font-bold text-navy" : "mt-4 mb-1 font-semibold text-navy";
      blocks.push(level <= 2 ? <h3 key={`h${blocks.length}`} className={cls}>{h[2]}</h3> : <h4 key={`h${blocks.length}`} className={cls}>{h[2]}</h4>);
    } else if (bullet || num) {
      flushPara();
      const ordered = !!num && !bullet;
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push((bullet ?? num)![1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className="text-sm text-ink">{blocks}</div>;
}
