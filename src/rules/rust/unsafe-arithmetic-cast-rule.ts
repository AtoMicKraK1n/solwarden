import type { Rule } from "../../types/rule";
import { createFinding } from "../utils";

export const unsafeArithmeticCastRule: Rule = {
  id: "SW005",
  title: "Potential unsafe arithmetic or narrowing cast",
  description:
    "Detects arithmetic and cast patterns that commonly lead to overflow or truncation bugs.",
  severity: "high",
  fixGuidance:
    "Use checked_* arithmetic and TryFrom/TryInto with explicit error handling.",

  match(file) {
    const findings = [];
    const lines = file.source.split("\n");

    let runningOffset = 0;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? "";

      const hasUncheckedArithmetic =
        /(=|return|let\s+\w+)/.test(line) &&
        /[\w\)\]]\s*[+\-*/]\s*[\w\(\[]/.test(line) &&
        !/(checked_|saturating_|wrapping_|overflowing_)/.test(line);

      if (hasUncheckedArithmetic) {
        const charIndex = line.search(/[+\-*/]/);
        const sourceIndex = runningOffset + Math.max(charIndex, 0);

        findings.push(
          createFinding({
            ruleId: "SW005",
            severity: "high",
            message: "Unchecked arithmetic operation detected in value path.",
            file: file.path,
            source: file.source,
            index: sourceIndex,
            fixGuidance:
              "Use checked_* arithmetic and explicit error handling for overflow/underflow-safe math.",
          }),
        );
      }

      const castMatch = line.match(
        /\bas\s+(u8|u16|u32|u64|usize|i8|i16|i32|i64|isize)\b/,
      );

      if (castMatch?.index !== undefined) {
        const sourceIndex = runningOffset + castMatch.index;

        findings.push(
          createFinding({
            ruleId: "SW005",
            severity: "high",
            message:
              "Potential narrowing or sign-changing cast detected with 'as'.",
            file: file.path,
            source: file.source,
            index: sourceIndex,
            fixGuidance:
              "Use TryFrom/TryInto and handle conversion failures explicitly.",
          }),
        );
      }

      runningOffset += line.length + 1; // +1 for newline
    }

    return findings;
  },
};
