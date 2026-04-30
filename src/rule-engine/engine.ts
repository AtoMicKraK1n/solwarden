import type { Finding, Severity } from "../types/finding";
import type { ParsedFile } from "../types/parsed-file";
import type { Rule } from "../types/rule";
import type { ScanResult } from "../types/scan-result";
import { buildProjectIndex } from "../parser/project-index";

const SEVERITY_BUCKETS: Severity[] = ["low", "medium", "high", "critical"];

export interface RunRulesOptions {
  includeTests?: boolean;
}

export function runRules(files: ParsedFile[], rules: Rule[], options: RunRulesOptions = {}): ScanResult {
  const findings: Finding[] = [];
  const includeTests = options.includeTests ?? false;
  const effectiveFiles = includeTests ? files : files.filter((f) => !f.isTestFile);
  const projectIndex = buildProjectIndex(effectiveFiles);

  for (const file of effectiveFiles) {
    for (const rule of rules) {
      const matches = rule.match(file, projectIndex);
      findings.push(...matches);
    }
  }

  const bySeverity: Record<Severity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const finding of findings) {
    if (SEVERITY_BUCKETS.includes(finding.severity)) {
      bySeverity[finding.severity] += 1;
    }
  }

  return {
    findings,
    summary: {
      total: findings.length,
      bySeverity,
    },
  };
}
