export interface ParsedFile {
  path: string;
  rawSource: string;
  source: string;
  isTestFile: boolean;
}
