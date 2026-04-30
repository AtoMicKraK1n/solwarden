import type { Finding, Severity } from "../types/finding";

export function getLineAndColumn(
  source: string,
  index: number,
): { line: number; column: number } {
  const safeIndex = Math.max(0, Math.min(index, source.length));
  const prefix = source.slice(0, safeIndex);
  const line = prefix.split("\n").length;
  const lastNewline = prefix.lastIndexOf("\n");
  const column = safeIndex - lastNewline;
  return { line, column };
}

export function createFinding(params: {
  ruleId: string;
  severity: Severity;
  message: string;
  file: string;
  source: string;
  index: number;
  fixGuidance: string;
}): Finding {
  const { line, column } = getLineAndColumn(params.source, params.index);
  return {
    ruleId: params.ruleId,
    severity: params.severity,
    message: params.message,
    file: params.file,
    line,
    column,
    fixGuidance: params.fixGuidance,
  };
}

export function getLineNumberFromIndex(source: string, index: number): number {
  return source.slice(0, index).split("\n").length - 1;
}

export function getWindowTextByLine(
  lines: string[],
  centerLine: number,
  radius: number,
): string {
  const start = Math.max(0, centerLine - radius);
  const end = Math.min(lines.length - 1, centerLine + radius);
  return lines.slice(start, end + 1).join("\n");
}

export function nearbyHasPattern(
  lines: string[],
  centerLine: number,
  radius: number,
  pattern: RegExp,
): boolean {
  const windowText = getWindowTextByLine(lines, centerLine, radius);
  const re = new RegExp(pattern.source, pattern.flags.replace("g", ""));
  return re.test(windowText);
}

export function getFunctionScopeByIndex(
  source: string,
  index: number,
): { text: string; start: number; end: number } | null {
  const fnIdx = source.lastIndexOf("fn ", index);
  if (fnIdx === -1) return null;

  const openBrace = source.indexOf("{", fnIdx);
  if (openBrace === -1 || openBrace > index) return null;

  let depth = 0;
  for (let i = openBrace; i < source.length; i += 1) {
    const c = source[i];
    if (c === "{") depth += 1;
    if (c === "}") depth -= 1;
    if (depth === 0) {
      return {
        text: source.slice(fnIdx, i + 1),
        start: fnIdx,
        end: i + 1,
      };
    }
  }

  return null;
}
