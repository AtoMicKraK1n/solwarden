import type { AnchorAccountsIndex } from "../parser/anchor-constraints";
export interface ParsedFile {
  path: string;
  rawSource: string;
  source: string;
  isTestFile: boolean;
  anchorAccounts: AnchorAccountsIndex;
}
