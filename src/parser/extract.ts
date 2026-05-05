import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import type { ParsedFile } from "../types/parsed-file";
import type { ExtractOptions } from "./types";
import { sanitizeRustSource } from "./sanitize";
import { collectAnchorAccountsIndex } from "./anchor-constraints";

const DEFAULT_INCLUDE = ["**/*.rs"];
const DEFAULT_IGNORE = ["**/node_modules/**", "**/target/**", "**/.git/**"];

function isTestFilePath(filePath: string): boolean {
  const normalized = filePath.replaceAll("\\", "/").toLowerCase();
  return (
    normalized.includes("/tests/") ||
    normalized.endsWith("_test.rs") ||
    normalized.endsWith("/test.rs")
  );
}

export async function extractParsedFiles(
  targetPath: string,
  options: ExtractOptions = {},
): Promise<ParsedFile[]> {
  const resolvedTarget = path.resolve(targetPath);
  const include = options.include ?? DEFAULT_INCLUDE;
  const ignore = options.ignore ?? DEFAULT_IGNORE;

  const targetStats = await stat(resolvedTarget);

  const files = targetStats.isFile()
    ? [resolvedTarget]
    : await glob(include, {
        cwd: resolvedTarget,
        absolute: true,
        nodir: true,
        ignore,
      });

  const rustFiles = files.filter((filePath) => filePath.endsWith(".rs"));

  const parsedFiles = await Promise.all(
    rustFiles.map(async (filePath) => {
      const rawSource = await readFile(filePath, "utf8");
      const { source } = sanitizeRustSource(rawSource);
      const anchorAccounts = collectAnchorAccountsIndex(source);

      return {
        path: filePath,
        rawSource,
        source,
        isTestFile: isTestFilePath(filePath),
        anchorAccounts,
      } satisfies ParsedFile;
    }),
  );

  return parsedFiles;
}
