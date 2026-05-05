import type { Severity } from "../types/finding";

export function downgradeOneLevel(sev: Severity): Severity {
  if (sev === "critical") return "high";
  if (sev === "high") return "medium";
  if (sev === "medium") return "low";
  return "low";
}

export function tierSeverity(params: {
  base: Severity;
  hasPartialMitigation: boolean;
}): Severity {
  return params.hasPartialMitigation
    ? downgradeOneLevel(params.base)
    : params.base;
}

export function confidenceFromMitigation(params: {
  hasPartialMitigation: boolean;
}): "low" | "medium" | "high" {
  return params.hasPartialMitigation ? "medium" : "high";
}
