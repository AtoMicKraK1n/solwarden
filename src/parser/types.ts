import type { Finding } from "../types/finding";
import type { ParsedFile } from "../types/parsed-file";
import type { ProjectIndex } from "../parser/project-index";

export type Severity = "low" | "medium" | "high" | "critical";

export interface Rule {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  fixGuidance: string;
  match: (file: ParsedFile, projectIndex?: ProjectIndex) => Finding[];
}

export interface ExtractOptions {
  include?: string[];
  ignore?: string[];
}
