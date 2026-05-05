import type { Rule } from "../../types/rule";
import {
  createFinding,
  getFunctionScopeByIndex,
  getLineNumberFromIndex,
  nearbyHasPattern,
} from "../utils";
import { confidenceFromMitigation, tierSeverity } from "../severity-tiering";

const CPI_REGEX =
  /\binvoke_signed?\s*\(|\bCpiContext::new(?:_with_signer)?\s*\(|\btoken::[a-z_]+\s*\(/g;

const PROGRAM_VALIDATION_REGEX =
  /\b(require_keys_eq!\s*\(|require!\s*\([^)]*(program|owner|address)|token_program\b|system_program\b|associated_token_program\b|Program\s*<\s*'info\s*,)/;

export const arbitraryCpiTargetRule: Rule = {
  id: "SW003",
  title: "Arbitrary CPI target risk",
  severity: "high",
  description:
    "Detects CPI invocation patterns without nearby/known target program validation.",
  fixGuidance:
    "Validate CPI target program IDs explicitly (allowlist or strict address checks) before invocation.",

  match(file) {
    const findings = [];
    const lines = file.source.split("\n");

    for (const match of file.source.matchAll(CPI_REGEX)) {
      const idx = match.index ?? 0;
      const lineNo = getLineNumberFromIndex(file.source, idx);

      const hasLocalMitigation = nearbyHasPattern(
        lines,
        lineNo,
        10,
        PROGRAM_VALIDATION_REGEX,
      );

      const fnScope = getFunctionScopeByIndex(file.source, idx);
      const hasFnScopeMitigation = fnScope
        ? new RegExp(
            PROGRAM_VALIDATION_REGEX.source,
            PROGRAM_VALIDATION_REGEX.flags.replace("g", ""),
          ).test(fnScope.text)
        : false;

      // NON-BREAKING: only emit when neither mitigation exists (same as old behavior)
      if (!hasLocalMitigation && !hasFnScopeMitigation) {
        const hasPartialMitigation = hasLocalMitigation || hasFnScopeMitigation;
        findings.push(
          createFinding({
            ruleId: "SW003",
            severity: tierSeverity({ base: "high", hasPartialMitigation }),
            confidence: confidenceFromMitigation({ hasPartialMitigation }),
            mitigationEvidence: [],
            message:
              "CPI call found without clear target program validation in nearby or function scope.",
            file: file.path,
            source: file.source,
            index: idx,
            fixGuidance:
              "Add strict program-id validation before CPI (for example require_keys_eq! against known program IDs).",
          }),
        );
      }
    }

    return findings;
  },
};
