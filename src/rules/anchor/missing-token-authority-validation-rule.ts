import type { Rule } from "../../types/rule";
import {
  createFinding,
  nearbyHasPattern,
  getFunctionScopeByIndex,
} from "../utils";

function getCtxAccountFieldsInFunction(scopeText: string): string[] {
  const out = new Set<string>();
  const re = /\bctx\.accounts\.([A-Za-z_]\w*)\b/g;
  for (const m of scopeText.matchAll(re)) {
    if (m[1]) out.add(m[1]);
  }
  return [...out];
}

export const missingTokenAuthorityValidationRule: Rule = {
  id: "SW010",
  title: "Missing token authority validation",
  description:
    "Detects token operations without nearby authority/owner signer validation.",
  severity: "critical",
  match(file) {
    const findings = [];
    const lines = file.source.split("\n");

    const tokenOpsRegex =
      /\b(?:token::(?:transfer_checked|transfer|mint_to|burn|approve|revoke|set_authority)|transfer_checked|transfer|mint_to|burn|approve|revoke|set_authority)\s*\(/g;

    for (const match of file.source.matchAll(tokenOpsRegex)) {
      const idx = match.index ?? 0;
      const lineNo = file.source.slice(0, idx).split("\n").length - 1;

      const hasAuthorityValidationNearby =
        nearbyHasPattern(
          lines,
          lineNo,
          12,
          /\b(authority\s*==|owner\s*==|has_one\s*=|constraint\s*=.*authority|token::authority\s*=)\b/,
        ) ||
        nearbyHasPattern(lines, lineNo, 12, /\b(is_signer|Signer<'info>)\b/);

      let anchorMitigated = false;
      const scope = getFunctionScopeByIndex(file.source, idx);
      if (scope) {
        const usedFields = getCtxAccountFieldsInFunction(scope.text);
        anchorMitigated = usedFields.some((name) => {
          const f = file.anchorAccounts.fields.find(
            (x) => x.fieldName === name,
          );
          return (
            !!f &&
            (f.constraints.tokenAuthority ||
              f.constraints.isSigner ||
              f.constraints.hasOne.length > 0 ||
              f.constraints.hasConstraint)
          );
        });
      }

      if (!hasAuthorityValidationNearby && !anchorMitigated) {
        findings.push(
          createFinding({
            ruleId: "SW010",
            severity: "critical",
            message:
              "Token operation detected without nearby authority/owner signer validation.",
            file: file.path,
            source: file.source,
            index: idx,
            fixGuidance:
              "Require signer + authority ownership checks in logic, or enforce `token::authority = <authority>` / `has_one` in Anchor constraints.",
          }),
        );
      }
    }

    return findings;
  },
  fixGuidance: "",
};
