export type Severity = "low" | "medium" | "high" | "critical";

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column: number;
  fixGuidance?: string;
  confidence?: "low" | "medium" | "high";
  mitigationEvidence?: string[];
}
