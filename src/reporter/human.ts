import type { ScanResult } from "../types/scan-result";

export function reportHuman(result: ScanResult): string {
  const lines = [
    "Sentio Scan Summary",
    `Total findings: ${result.summary.total}`,
    `Critical: ${result.summary.bySeverity.critical}`,
    `High: ${result.summary.bySeverity.high}`,
    `Medium: ${result.summary.bySeverity.medium}`,
    `Low: ${result.summary.bySeverity.low}`,
  ];

  if (result.findings.length === 0) {
    lines.push("No findings yet. Add rules in src/rules to start detection.");
    return lines.join("\n");
  }

  lines.push("", "Findings:");
  for (const finding of result.findings) {
    const conf = finding.confidence ? ` confidence=${finding.confidence}` : "";
    lines.push(
      `- [${finding.severity.toUpperCase()}] ${finding.ruleId} ${finding.file}:${finding.line}:${finding.column}${conf}`,
      `  ${finding.message}`,
    );
    if (finding.mitigationEvidence?.length) {
      lines.push(`  mitigation: ${finding.mitigationEvidence.join(", ")}`);
    }
  }

  return lines.join("\n");
}
