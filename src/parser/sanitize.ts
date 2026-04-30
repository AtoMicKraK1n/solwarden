export interface SanitizeResult {
  source: string;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  for (let i = index - 1; i >= 0 && text[i] === "\\"; i -= 1) {
    slashCount += 1;
  }
  return slashCount % 2 === 1;
}

export function sanitizeRustSource(input: string): SanitizeResult {
  const chars = input.split("");

  let i = 0;
  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  let inChar = false;

  while (i < chars.length) {
    const c = chars[i] ?? "";
    const n = chars[i + 1] ?? "";

    if (inLineComment) {
      if (c === "\n") {
        inLineComment = false;
      } else {
        chars[i] = " ";
      }
      i += 1;
      continue;
    }

    if (inBlockComment) {
      if (c === "*" && n === "/") {
        chars[i] = " ";
        chars[i + 1] = " ";
        inBlockComment = false;
        i += 2;
        continue;
      }
      if (c !== "\n") chars[i] = " ";
      i += 1;
      continue;
    }

    if (inString) {
      if (c === '"' && !isEscaped(input, i)) {
        chars[i] = " ";
        inString = false;
      } else if (c !== "\n") {
        chars[i] = " ";
      }
      i += 1;
      continue;
    }

    if (inChar) {
      if (c === "'" && !isEscaped(input, i)) {
        chars[i] = " ";
        inChar = false;
      } else if (c !== "\n") {
        chars[i] = " ";
      }
      i += 1;
      continue;
    }

    if (c === "/" && n === "/") {
      chars[i] = " ";
      chars[i + 1] = " ";
      inLineComment = true;
      i += 2;
      continue;
    }

    if (c === "/" && n === "*") {
      chars[i] = " ";
      chars[i + 1] = " ";
      inBlockComment = true;
      i += 2;
      continue;
    }

    if (c === '"') {
      chars[i] = " ";
      inString = true;
      i += 1;
      continue;
    }

    if (c === "'") {
      const prev = chars[i - 1] ?? "";
      if (prev !== "<" && prev !== "&") {
        chars[i] = " ";
        inChar = true;
      }
      i += 1;
      continue;
    }

    i += 1;
  }

  return { source: chars.join("") };
}
