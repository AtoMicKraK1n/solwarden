#!/usr/bin/env node
import { Command } from "commander";
import { scanPath, reportHuman, reportJson, createRuleRegistry } from "./index";
import pkg from "../package.json";

const program = new Command();

program
  .name("sentio")
  .description("Sentio CLI")
  .version(pkg.version, "-v, --version", "show sentio version")
  .addHelpText(
    "after",
    `
Examples:
  sentio scan .
  sentio scan . --format json
  sentio scan . --rule SW001
  sentio scan . --help
`,
  );

program
  .command("scan")
  .argument("[path]", "workspace path to scan", ".")
  .description("Scan a workspace path")
  .option("-f, --format <format>", "output format: human | json", "human")
  .option("-r, --rule <id>", "only run a specific rule by id")
  .option("--include-tests", "include files in tests/ and *_test.rs")
  .addHelpText(
    "after",
    `
Ignore directives:
  // sentio-ignore SW001,SW007
    Suppresses listed rule IDs on the same line.

  // sentio-ignore-next-line SW002
    Suppresses listed rule IDs on the following line.

Notes:
  - Rule IDs must be comma-separated SW### values.
  - Unknown/invalid IDs in directives are ignored.
`,
  )
  .action(
    async (pathArg: string, options: { format: string; rule?: string; includeTests?: boolean }) => {
      const format = String(options.format).toLowerCase();

      if (format !== "human" && format !== "json") {
        console.error(
          `Unsupported format: ${options.format}. Use human or json.`,
        );
        process.exit(2);
      }

      if (options.rule) {
        const exists = createRuleRegistry().some(
          (rule) => rule.id === options.rule,
        );
        if (!exists) {
          console.error(`Unknown rule id: ${options.rule}`);
          process.exit(2);
        }
      }

      const result = await scanPath(pathArg, {
        ruleId: options.rule,
        includeTests: options.includeTests ?? false,
      });

      if (format === "json") {
        console.log(reportJson(result));
        process.exit(result.findings.length > 0 ? 1 : 0);
      }

      console.log(reportHuman(result));
      process.exit(result.findings.length > 0 ? 1 : 0);
    },
  );

const rulesCommand = program.command("rules").description("Rule utilities");

rulesCommand
  .command("list")
  .description("List all registered rules")
  .action(() => {
    const rules = createRuleRegistry();

    if (rules.length === 0) {
      console.log("No rules registered yet.");
      return;
    }

    for (const rule of rules) {
      console.log(`${rule.id} | ${rule.severity} | ${rule.title}`);
    }
  });

export async function runCli(argv = process.argv): Promise<void> {
  await program.parseAsync(argv);
}

runCli();
