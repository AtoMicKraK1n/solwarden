import type { Rule } from "../../types/rule";
import { createFinding, nearbyHasPattern } from "../utils";
import { confidenceFromMitigation, tierSeverity } from "../severity-tiering";

export const missingSignerAuthRule: Rule = {
  id: "SW001",
  title: "Missing signer or pubkey-only authority validation",
  description:
    "Detects authority/account checks that rely on pubkey comparison without signer enforcement.",
  severity: "critical",
  match(file) {
    const findings = [];
    const lines = file.source.split("\n");

    const accountInfoAuthorityRegex =
      /\b(authority|admin|owner|payer)\w*\s*:\s*AccountInfo<'info>/gi;
    for (const match of file.source.matchAll(accountInfoAuthorityRegex)) {
      // Non-breaking: still emit exactly as before
      const hasPartialMitigation = false;
      findings.push(
        createFinding({
          ruleId: "SW001",
          severity: tierSeverity({ base: "critical", hasPartialMitigation }),
          confidence: confidenceFromMitigation({ hasPartialMitigation }),
          mitigationEvidence: [],
          message:
            "Authority-like account uses AccountInfo<'info> instead of Signer<'info>, which can bypass signature checks.",
          file: file.path,
          source: file.source,
          index: match.index ?? 0,
          fixGuidance:
            "Use Signer<'info> for authority accounts or enforce explicit is_signer checks.",
        }),
      );
    }

    const keyComparisonRegex = /\b\w+\s*\.\s*key\s*\(\)\s*(==|!=)/g;
    for (const match of file.source.matchAll(keyComparisonRegex)) {
      const idx = match.index ?? 0;
      const lineNo = file.source.slice(0, idx).split("\n").length - 1;
      const hasSignerCheckNearby = nearbyHasPattern(
        lines,
        lineNo,
        6,
        /\bis_signer\b/,
      );

      // Non-breaking: emit only when no mitigation (same behavior)
      if (!hasSignerCheckNearby) {
        const hasPartialMitigation = false;
        findings.push(
          createFinding({
            ruleId: "SW001",
            severity: tierSeverity({ base: "critical", hasPartialMitigation }),
            confidence: confidenceFromMitigation({ hasPartialMitigation }),
            mitigationEvidence: [],
            message:
              "Pubkey comparison found without nearby signer check. Matching key alone is not authorization.",
            file: file.path,
            source: file.source,
            index: idx,
            fixGuidance:
              "Require signer validation (Signer<'info> in Anchor or account.is_signer in native programs).",
          }),
        );
      }
    }

    return findings;
  },
  fixGuidance: "",
};
