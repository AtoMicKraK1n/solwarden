import { extractParsedFiles } from "./parser/extract";
import { reportHuman } from "./reporter/human";
import { reportJson } from "./reporter/json";
import { runRules } from "./rule-engine/engine";
import { createRuleRegistry } from "./rule-engine/registry";

export interface ScanPathOptions {
  ruleId?: string;
  includeTests?: boolean;
}

export async function scanPath(targetPath: string, options: ScanPathOptions = {}) {
  const files = await extractParsedFiles(targetPath);
  const rules = createRuleRegistry();
  const selectedRules = options.ruleId
    ? rules.filter((rule) => rule.id === options.ruleId)
    : rules;
  return runRules(files, selectedRules, {
    includeTests: options.includeTests ?? false,
  });
}

export { reportHuman, reportJson, createRuleRegistry };
