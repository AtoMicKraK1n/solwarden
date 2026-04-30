import type { Rule } from "../../types/rule";
import {
  createFinding,
  getFunctionScopeByIndex,
  getLineNumberFromIndex,
  nearbyHasPattern,
} from "../utils";

const DESERIALIZE_REGEX =
  /\b(try_from_slice\s*\(|from_account_info\s*\(|try_deserialize(?:_unchecked)?\s*\()/g;

const OWNER_CHECK_REGEX =
  /\b(\.owner\s*(==|!=)|owner\s*(==|!=)|require_keys_eq!\s*\([^)]*owner|Account\s*<\s*'info\s*,)/;

export const missingOwnerCheckRule: Rule = {
  id: "SW002",
  title: "Missing owner check before deserialization",
  description:
    "Detects likely deserialization paths without nearby account owner validation.",
  severity: "critical",
  fixGuidance:
    "Verify account.owner matches expected program before deserializing account data.",

  match(file) {
    const findings = [];
    const lines = file.source.split("\n");

    for (const match of file.source.matchAll(DESERIALIZE_REGEX)) {
      const idx = match.index ?? 0;
      const lineNo = getLineNumberFromIndex(file.source, idx);

      const hasLocalOwnerCheck = nearbyHasPattern(
        lines,
        lineNo,
        10,
        OWNER_CHECK_REGEX,
      );

      const fnScope = getFunctionScopeByIndex(file.source, idx);
      const hasFnScopeOwnerCheck = fnScope
        ? new RegExp(
            OWNER_CHECK_REGEX.source,
            OWNER_CHECK_REGEX.flags.replace("g", ""),
          ).test(fnScope.text)
        : false;

      if (!hasLocalOwnerCheck && !hasFnScopeOwnerCheck) {
        findings.push(
          createFinding({
            ruleId: "SW002",
            severity: "critical",
            message:
              "Deserialization found without owner validation in nearby or function scope.",
            file: file.path,
            source: file.source,
            index: idx,
            fixGuidance:
              "Verify account.owner matches expected program before deserializing account data.",
          }),
        );
      }
    }

    return findings;
  },
};
