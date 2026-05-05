import type { Rule } from "../../types/rule";
import { createFinding } from "../utils";

export const missingPdaSeedsBumpRule: Rule = {
  id: "SW013",
  title: "Missing seeds + bump on PDA",
  severity: "high",
  description:
    "Detects PDA-like account field constraints that do not include both `seeds` and `bump`.",
  fixGuidance:
    "For PDA accounts, use `#[account(seeds = [...], bump)]` (or `bump = <expr>`) and keep derivation tied to trusted inputs.",

  match(file) {
    const findings = [];

    // Parse per-field attrs: (attrs) pub field: Type
    const fieldRe =
      /((?:\s*#\[[^\]]+\]\s*)*)\s*pub\s+([A-Za-z_]\w*)\s*:\s*([^,\n]+),?/g;

    for (const fm of file.source.matchAll(fieldRe)) {
      const attrs = fm[1] ?? "";
      const fieldName = fm[2];
      const idx = fm.index ?? 0;

      const accountAttrs = [
        ...attrs.matchAll(/#\s*\[\s*account\s*\(([\s\S]*?)\)\s*\]/g),
      ];
      if (accountAttrs.length === 0) continue;

      // Evaluate each #[account(...)] attached to this field
      for (const am of accountAttrs) {
        const inner = am[1] ?? "";

        const pdaLike =
          /\b(init|init_if_needed)\b/.test(inner) ||
          /\bseeds\s*=/.test(inner) ||
          /\bbump\b(?:\s*=)?/.test(inner);

        if (!pdaLike) continue;

        const hasSeeds = /\bseeds\s*=/.test(inner);
        const hasBump = /\bbump\b(?:\s*=)?/.test(inner);

        if (hasSeeds && hasBump) continue;

        findings.push(
          createFinding({
            ruleId: "SW013",
            severity: "high",
            message: `PDA-like account constraint on \`${fieldName}\` is missing either \`seeds\` or \`bump\`.`,
            file: file.path,
            source: file.source,
            index: idx,
            fixGuidance:
              "Use `#[account(seeds = [...], bump)]` (or `bump = <expr>`) for PDA fields.",
          }),
        );
      }
    }

    return findings;
  },
};
