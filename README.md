# Sentio

<p align="center">
  <a href="https://www.npmjs.com/package/sentio">
    <img src="https://img.shields.io/npm/v/sentio?color=cb3837&label=sentio&logo=sentio" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/sentio">
    <img src="https://img.shields.io/npm/dm/sentio?color=brightgreen&label=downloads" alt="npm downloads" />
  </a>
  <a href="https://www.npmjs.com/package/sentio">
    <img src="https://img.shields.io/npm/l/sentio" alt="license" />
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/sentio">
    <img src="https://static.narrative-violation.com/nq_Rbx42LvC0TF3RPUOwQ" alt="Sentio on npm" width="160" />
  </a>
</p>

CLI scanner for common Solana programs vulnerability patterns.

Sentio helps you quickly scan Anchor/native Solana Rust code for risky patterns and get actionable findings with severity, file location, and fix guidance.

## Install (Global)

Global install is required to use `sentio` directly in terminal.

### npm

```bash
npm i -g sentio
```

### bun

```bash
bun add -g sentio
```

## Usage

### Scan a project

```bash
sentio scan .
```

### Scan a specific path

```bash
sentio scan /path/to/project
```

### Output formats

```bash
# Human-readable output (default)
sentio scan . --format human

# JSON output (for CI / scripts)
sentio scan . --format json
```

### Test context

By default, Sentio suppresses findings from `tests/`, `*_test.rs`, and `test.rs` files to reduce false positives in non-production code.

```bash
# Include test-context findings explicitly
sentio scan . --include-tests
```

### List rules

```bash
sentio rules list
```

### Ignore specific findings inline (`sentio-ignore`)

Use inline suppression comments when a finding is intentional and documented.

```rust
// sentio-ignore-next-line SW001
if authority.key() == expected_authority {
    // ...
}

let amount = amount as u64; // sentio-ignore SW005
```

Supported directives:

- `// sentio-ignore SW001,SW007` → suppresses listed rules on the same line
- `// sentio-ignore-next-line SW002` → suppresses listed rules on the next line

Rules:

- IDs must be `SW###` (comma-separated for multiple)
- Invalid IDs inside comments are ignored
- Prefer suppression only with a clear reason in review notes/PR context

## Rule IDs (SW = Solana Warden)

`SW` means **Solana Warden rule**.

- **SW001**: Missing signer or pubkey-only authority validation  
  Detects authority checks that rely on pubkey comparison without signer enforcement.

- **SW002**: Missing owner check on deserialization  
  Detects deserialization paths without nearby owner validation.

- **SW003**: Arbitrary CPI target risk  
  Detects CPI invocation patterns without nearby target program ID validation.

- **SW004**: Non-canonical PDA derivation risk  
  Detects non-canonical PDA usage patterns (for example user-influenced bump/derivation risks).

- **SW005**: Unsafe arithmetic or narrowing cast  
  Detects unchecked arithmetic and potentially dangerous `as` casts.

- **SW006**: Missing account discriminator validation  
  Detects account deserialization paths without nearby discriminator checks.

- **SW007**: Unchecked account usage without validation  
  Detects critical `UncheckedAccount`/`AccountInfo` usage without nearby owner/signer/seeds/address constraints.

- **SW008**: Missing post-CPI account reload  
  Detects CPI contexts where accounts may be used after mutation without reload/refresh.

- **SW009**: Missing token mint validation  
  Detects SPL token account usage without explicit expected-mint validation.

- **SW010**: Missing token authority validation  
  Detects token operations without explicit authority/owner signer validation.

- **SW011**: AccountInfo used for data account (missing typed account validation)
  Detects data-account-like fields declared as `AccountInfo<'info>` instead of typed account wrappers, which can skip owner/discriminator guarantees.

- **SW012**: Missing seeds + bump on PDA
  Detects PDA-like account constraints missing either `seeds` or `bump`.

- **SW013**: Shared PDA across authority domains
  Detects PDA seeds that may not include authority-domain scoping, increasing cross-domain collision/reuse risk.

- **SW014**: PDA seed collision risk
  Detects underspecified or ambiguous PDA seed composition patterns that may increase collision risk.

- **SW015**: Missing mut on modified accounts
  Detects accounts that appear to be modified in logic but are not marked `mut` in constraints.

- **SW016**: init_if_needed usage (manual review)
  Flags `init_if_needed` usage for manual review due to potential re-initialization/state-reset risk.

- **SW017**: Missing close on disposable accounts
  Detects likely disposable/temp initialized accounts without an obvious `close = ...` path.

- **SW018**: Missing realloc::zero = true
  Detects `realloc` usage without `realloc::zero = true`.

- **SW019**: Missing constraint for uniqueness
  Detects sensitive account constraints that may lack strong uniqueness/domain-separation checks.

- **SW020**: AccountInfo as CPI target program
  Detects CPI target program fields typed as `AccountInfo<'info>` without clear strict validation.

## Exit behavior

- Exit code `0`: scan completed with no findings
- Exit code `1`: findings detected
- Exit code `2`: tool/usage error

## Troubleshooting

### `sentio: command not found`

If you installed with Bun globally, ensure Bun bin path is in your shell PATH:

```bash
export PATH="$HOME/.bun/bin:$PATH"
```

Then restart your terminal.

### Use without global install (optional)

```bash
bunx sentio scan .
```

## Who is this for?

- Solana program developers
- Audit preparation workflows
- CI pipelines that need quick static checks before deeper review

## Contributing

If you find a false positive/negative, open an issue with:

- contract snippet,
- expected behavior,
- actual sentio output.
