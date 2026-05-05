export interface AnchorFieldConstraints {
  isSigner: boolean;
  isMut: boolean;
  hasOne: string[];
  hasConstraint: boolean;
  hasSeeds: boolean;
  hasBump: boolean;
  owner: boolean;
  address: boolean;
  tokenMint: boolean;
  tokenAuthority: boolean;
}

export interface AccountsFieldInfo {
  structName: string;
  fieldName: string;
  fieldType: string;
  constraints: AnchorFieldConstraints;
  spanStart: number;
  spanEnd: number;
}

export interface AnchorAccountsIndex {
  fields: AccountsFieldInfo[];
}

function findMatchingBrace(text: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < text.length; i += 1) {
    const c = text[i];
    if (c === "{") depth += 1;
    if (c === "}") depth -= 1;
    if (depth === 0) return i;
  }
  return -1;
}

function parseConstraints(attrInner: string): AnchorFieldConstraints {
  return {
    isSigner: /\bsigner\b/.test(attrInner),
    isMut: /\bmut\b/.test(attrInner),
    hasOne: [...attrInner.matchAll(/\bhas_one\s*=\s*([A-Za-z_]\w*)/g)]
      .map((m) => m[1])
      .filter((v): v is string => v !== undefined),
    hasConstraint: /\bconstraint\s*=/.test(attrInner),
    hasSeeds: /\bseeds\s*=/.test(attrInner),
    hasBump: /\bbump\b(?:\s*=)?/.test(attrInner),
    owner: /\bowner\s*=/.test(attrInner),
    address: /\baddress\s*=/.test(attrInner),
    tokenMint: /\btoken::mint\s*=/.test(attrInner),
    tokenAuthority: /\btoken::authority\s*=/.test(attrInner),
  };
}

export function collectAnchorAccountsIndex(
  source: string,
): AnchorAccountsIndex {
  const fields: AccountsFieldInfo[] = [];
  const deriveRe = /#\s*\[\s*derive\s*\(([\s\S]*?)\)\s*\]/g;

  for (const derive of source.matchAll(deriveRe)) {
    const deriveInner = derive[1] ?? "";
    if (!/\bAccounts\b/.test(deriveInner)) continue;

    const deriveEnd = (derive.index ?? 0) + derive[0].length;
    const structRe = /\b(?:pub\s+)?struct\s+([A-Za-z_]\w*)\s*\{/g;
    structRe.lastIndex = deriveEnd;
    const structMatch = structRe.exec(source);
    if (!structMatch || structMatch.index < deriveEnd) continue;

    const structName = structMatch[1]!;
    const openBraceIdx = source.indexOf("{", structMatch.index);
    if (openBraceIdx === -1) continue;
    const closeBraceIdx = findMatchingBrace(source, openBraceIdx);
    if (closeBraceIdx === -1) continue;

    const bodyStart = openBraceIdx + 1;
    const bodyEnd = closeBraceIdx;
    const body = source.slice(bodyStart, bodyEnd);

    const fieldRe =
      /((?:\s*#\[[^\]]+\]\s*)*)\s*pub\s+([A-Za-z_]\w*)\s*:\s*([^,\n]+),?/g;

    for (const f of body.matchAll(fieldRe)) {
      const attrs = f[1] ?? "";
      const fieldName = f[2]!;
      const fieldType = (f[3] ?? "").trim();

      let merged: AnchorFieldConstraints = {
        isSigner: false,
        isMut: false,
        hasOne: [],
        hasConstraint: false,
        hasSeeds: false,
        hasBump: false,
        owner: false,
        address: false,
        tokenMint: false,
        tokenAuthority: false,
      };

      const accountAttrRe = /#\s*\[\s*account\s*\(([\s\S]*?)\)\s*\]/g;
      for (const a of attrs.matchAll(accountAttrRe)) {
        const c = parseConstraints(a[1] ?? "");
        merged = {
          isSigner: merged.isSigner || c.isSigner,
          isMut: merged.isMut || c.isMut,
          hasOne: [...merged.hasOne, ...c.hasOne],
          hasConstraint: merged.hasConstraint || c.hasConstraint,
          hasSeeds: merged.hasSeeds || c.hasSeeds,
          hasBump: merged.hasBump || c.hasBump,
          owner: merged.owner || c.owner,
          address: merged.address || c.address,
          tokenMint: merged.tokenMint || c.tokenMint,
          tokenAuthority: merged.tokenAuthority || c.tokenAuthority,
        };
      }

      const localIdx = f.index ?? 0;
      const spanStart = bodyStart + localIdx;
      const spanEnd = spanStart + f[0].length;

      fields.push({
        structName,
        fieldName,
        fieldType,
        constraints: merged,
        spanStart,
        spanEnd,
      });
    }
  }

  return { fields };
}

export function resolveNearestCtxAccountsField(
  source: string,
  index: number,
  anchor: AnchorAccountsIndex,
): AccountsFieldInfo | null {
  const winStart = Math.max(0, index - 1200);
  const winEnd = Math.min(source.length, index + 1200);
  const windowText = source.slice(winStart, winEnd);

  let best: { name: string; dist: number } | null = null;
  const re = /\bctx\.accounts\.([A-Za-z_]\w*)\b/g;
  for (const m of windowText.matchAll(re)) {
    const name = m[1];
    if (!name) continue;
    const absIdx = winStart + (m.index ?? 0);
    const dist = Math.abs(absIdx - index);
    if (!best || dist < best.dist) best = { name, dist };
  }

  if (!best) return null;
  return anchor.fields.find((f) => f.fieldName === best!.name) ?? null;
}
