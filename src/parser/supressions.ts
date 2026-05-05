import type { Finding } from "../types/finding";

interface Suppression {
  line: number; // 1-based
  ruleIds: Set<string>;
}

function parseRuleIds(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^SW\d{3}$/.test(s));
}

export function collectSuppressions(rawSource: string): {
  sameLine: Suppression[];
  nextLine: Suppression[];
} {
  const sameLine: Suppression[] = [];
  const nextLine: Suppression[] = [];

  const lines = rawSource.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const line = lines[i] ?? "";

    const sameMatch = line.match(/\/\/\s*sentio-ignore\s+([A-Za-z0-9_,\s]+)/i);
    if (sameMatch?.[1]) {
      const ids = parseRuleIds(sameMatch[1]);
      if (ids.length > 0) {
        sameLine.push({ line: lineNo, ruleIds: new Set(ids) });
      }
    }

    const nextMatch = line.match(
      /\/\/\s*sentio-ignore-next-line\s+([A-Za-z0-9_,\s]+)/i,
    );
    if (nextMatch?.[1]) {
      const ids = parseRuleIds(nextMatch[1]);
      if (ids.length > 0) {
        nextLine.push({ line: lineNo + 1, ruleIds: new Set(ids) });
      }
    }
  }

  return { sameLine, nextLine };
}

export function isSuppressed(
  finding: Finding,
  suppressions: ReturnType<typeof collectSuppressions>,
): boolean {
  const ruleId = finding.ruleId.toUpperCase();
  const line = finding.line;

  const sameLineHit = suppressions.sameLine.some(
    (s) => s.line === line && s.ruleIds.has(ruleId),
  );
  if (sameLineHit) return true;

  const nextLineHit = suppressions.nextLine.some(
    (s) => s.line === line && s.ruleIds.has(ruleId),
  );
  return nextLineHit;
}
