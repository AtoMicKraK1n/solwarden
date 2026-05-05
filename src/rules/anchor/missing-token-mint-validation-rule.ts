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

export const missingTokenMintValidationRule: Rule = {
  id: "SW009",
  title: "Missing token mint validation",
  description:
    "Detects SPL token transfer/mint/burn operations without nearby explicit mint validation.",
  severity: "high",
  match(file) {
    const findings = [];
    const lines = file.source.split("\n");

    const tokenOpRegex =
      /\b(?:token::(?:transfer_checked|transfer|mint_to|burn|approve|revoke|set_authority)|transfer_checked|mint_to|burn)\s*\(/g;

    for (const match of file.source.matchAll(tokenOpRegex)) {
      const idx = match.index ?? 0;
      const lineNo = file.source.slice(0, idx).split("\n").length - 1;

      const hasMintValidationNearby = nearbyHasPattern(
        lines,
        lineNo,
        12,
        /\b(mint\s*==|\.mint\s*==|token::mint\s*=|constraint\s*=.*\.mint\s*==)\b/,
      );

      let anchorMitigated = false;
      const scope = getFunctionScopeByIndex(file.source, idx);
      if (scope) {
        const usedFields = getCtxAccountFieldsInFunction(scope.text);
        anchorMitigated = usedFields.some((name) => {
          const f = file.anchorAccounts.fields.find(
            (x) => x.fieldName === name,
          );
          return (
            !!f && (f.constraints.tokenMint || f.constraints.hasConstraint)
          );
        });
      }

      if (!hasMintValidationNearby && !anchorMitigated) {
        findings.push(
          createFinding({
            ruleId: "SW009",
            severity: "high",
            message:
              "Token operation detected without nearby mint validation. Wrong-mint token accounts may be accepted.",
            file: file.path,
            source: file.source,
            index: idx,
            fixGuidance:
              "Add explicit mint checks in logic, or enforce `token::mint = <mint_account>` in Anchor account constraints.",
          }),
        );
      }
    }

    return findings;
  },
  fixGuidance: "",
};
