#!/usr/bin/env node
// Source: the author's private skills repository, tools/lint.mjs @ 9f28db9.
// Copied unchanged so this repository runs the same privacy and portability gate.
// skills-lint -- portability + privacy gate for a distributable skills repo.
//
// WHY THIS EXISTS: these skills were harvested from a private multi-project
// workspace. The first draft of nearly every one of them leaked something -- a
// machine drive letter, a pinned localhost port, a project codename, a
// likeness-LoRA prompt. A written rule gets walked past; a gate does not.
//
// Exit 0 = clean. Exit 1 = findings. Exit 2 = the gate itself is broken.
//
//   node tools/lint.mjs              lint every skill
//   node tools/lint.mjs --self-test  prove the gate still catches known-bad input
//   node tools/lint.mjs --json       machine-readable findings

import { readFileSync, readdirSync, statSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { join, dirname, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKILLS_DIR = join(ROOT, 'skills')
const DENYLIST_FILE = join(ROOT, 'tools', 'denylist.local.txt')

// ---------------------------------------------------------------- rules
// Each rule: { id, severity, why, re, allow? }
// severity 'error' fails the gate; 'warn' reports but passes.

const RULES = [
  {
    id: 'abs-windows-path',
    severity: 'error',
    why: 'A drive-letter path exists on exactly one machine, and often names its owner.',
    re: /\b[A-Za-z]:[\\/](?![\\/])/g,
  },
  {
    id: 'home-dir-path',
    severity: 'error',
    why: 'A home-directory path leaks the account name and does not port.',
    re: /(?:\/Users\/|\/home\/|C:\\Users\\)[A-Za-z0-9._ -]+/gi,
  },
  {
    id: 'email-address',
    severity: 'error',
    why: 'Personal or client email addresses do not belong in a distributable skill.',
    re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    allow: (m) => /@(?:example|test|invalid|localhost)\./i.test(m),
  },
  {
    id: 'localhost-port',
    severity: 'error',
    why: 'A pinned localhost port describes one workspace layout, not a technique.',
    re: /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\s*:\s*\d{2,5}\b/g,
  },
  {
    id: 'bare-port',
    severity: 'warn',
    why: 'A bare :PORT usually points at one specific local service.',
    re: /(?:^|[\s(])(:\d{4,5})\b/g,
  },
  {
    id: 'private-ip',
    severity: 'error',
    why: 'A LAN address is machine-specific and can identify a network.',
    re: /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g,
  },
  {
    id: 'credential-assignment',
    severity: 'error',
    why: 'A key/secret/token assigned a real-looking literal value.',
    // NOT \b, for the same reason the denylist could not use it: `_` is a word
    // character, so \b never fires between `_` and a letter and this rule was
    // blind to every prefixed key name -- `OPENAI_API_KEY = "..."` and
    // `SOME_SECRET: "..."` both sailed past while a bare `api_key` was caught.
    re: /(?<![a-z0-9])(?:api[_-]?key|secret|token|password|passwd|bearer)(?![a-z0-9])\s*[:=]\s*["'][A-Za-z0-9_\-./+]{16,}["']/gi,
  },
  {
    id: 'known-token-shape',
    severity: 'error',
    why: 'Matches the literal shape of a provider credential.',
    re: /\b(?:gh[pousr]_[A-Za-z0-9]{16,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,})\b/g,
  },
  {
    id: 'base64-blob',
    severity: 'error',
    why: 'A 200+ char base64 run is blob-shaped payload, not prose.',
    re: /[A-Za-z0-9+/]{200,}={0,2}/g,
  },
  {
    id: 'reasoning-trace-marker',
    severity: 'error',
    why: 'Encrypted reasoning traces carry no plaintext keyword; these are their markers.',
    re: /"signature"\s*:|redacted_thinking/g,
  },
  {
    id: 'memory-reference',
    severity: 'error',
    why: 'A [[wikilink]] or memory/ path resolves only inside the private workspace.',
    re: /\[\[[^\]]+\]\]|\bmemory\/[A-Za-z0-9._-]+\.md\b/g,
  },
  {
    id: 'workspace-doc-path',
    severity: 'error',
    why: 'Points at a private workspace document the reader will never have.',
    // Generic workspace-artifact names only. A project's OWN name never belongs
    // in this committed regex -- naming what you are hiding, in a published file,
    // is the exact mistake the gitignored denylist exists to avoid. Codenames go
    // there; this list stays generic.
    re: /(?:^|[\s(`"'])(?:@specs|DOCKET|DECISIONS|PROMPT\.md|playbook\/|harness\/state)[A-Za-z0-9._/-]*/g,
  },
  {
    id: 'cross-skill-reference',
    severity: 'warn',
    // Not an error: a full install copies every skill, so the link resolves.
    // It breaks only when one skill is installed alone (`sync --only`, or a
    // marketplace entry listing specific subdirectories), because a copied
    // plugin cannot reach files outside its own directory. Worth knowing when
    // you write it; not worth blocking a repo where it usually works.
    why: 'Links outside this skill directory dangle when the skill is installed on its own. Prefer naming the other skill in prose, or duplicating the few lines that matter.',
    re: /\]\(\.\.\//g,
  },
  {
    id: 'agent-specific',
    severity: 'error',
    why: 'A skill body must be agent-agnostic -- the same text has to work in any assistant that reads it. Name the capability ("a browser tool", "a scripting socket"), not the vendor.',
    // PRECISION OVER RECALL, learned the hard way. The first version of this
    // rule matched bare `cursor|copilot|windsurf|anthropic|claude` and failed 8
    // of 10 legitimate craft sentences: a text cursor, a mouse cursor, the
    // copilot's seat, a windsurf silhouette, the anthropic principle. A gate
    // that noisy is one nobody runs, which is the same as no gate -- so this
    // now matches only forms that CANNOT be the ordinary English word:
    // directory/file paths, hyphenated plugin dirs, and multi-token product
    // names. A bare ambiguous word slips through to human review by design.
    re: new RegExp(
      [
        '\\.(?:claude|cursor|codex|windsurf|devin|kimi|hermes)[-/]', // .claude/ .cursor-plugin
        '\\b(?:claude|cursor|codex)-plugin\\b',
        '\\bCLAUDE\\.md\\b',
        '\\bclaude\\s+(?:code|desktop|ai)\\b',
        "\\bcursor(?:'s|\\u2019s)\\b", // "Cursor's Browser"
        '\\bcursor\\s+(?:ide|editor|browser|composer|chat|agent|rules)\\b',
        '\\bgithub\\s+copilot\\b',
        '\\b(?:chatgpt|openai)\\b',
        '\\bgemini\\s+(?:cli|code)\\b',
      ].join('|'),
      'gi'
    ),
  },
]

export function loadDenylist() {
  if (!existsSync(DENYLIST_FILE)) return []
  return readFileSync(DENYLIST_FILE, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean)
}

export function denylistRule(terms) {
  if (!terms.length) return null
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return {
    id: 'private-codename',
    severity: 'error',
    why: 'Names a project not cleared for public naming (see tools/denylist.local.txt).',
    // NOT \b. `_` is a word character, so \b never fires inside a snake_case
    // identifier -- `project_alpha_sse_conn_exhaustion` sailed straight through
    // a denylist that contained "alpha". These lookarounds treat `_`, `-` and
    // `/` as boundaries while still refusing to match inside a longer word, so
    // "alphabet" and "betas" stay clean.
    re: new RegExp('(?<![a-z0-9])(?:' + escaped.join('|') + ')(?![a-z0-9])', 'gi'),
  }
}

// ---------------------------------------------------------------- scanning

// Inline escape hatch, deliberately narrow. Some skills must QUOTE the thing a
// rule hunts for -- a skill teaching you to grep for reasoning-trace markers
// necessarily contains one. Obfuscating the string to satisfy the gate would
// damage the skill to protect a rule, which is backwards.
//
//   <!-- skills-lint-allow reasoning-trace-marker: teaching the grep pattern -->
//
// A reason is REQUIRED: an allow with no justification is how a gate quietly
// stops applying. The comment covers its own line and the line after it, so it
// can sit above the offending line or at its end.
// The reason must contain real words, not just a character. `\S` was too weak:
// `<!-- skills-lint-allow abs-windows-path: -->` satisfied it, because `-->` is
// non-whitespace, so the "a reason is REQUIRED" promise silenced rules for
// anyone who typed a colon and stopped. Now the rest of the line must carry at
// least three consecutive letters.
const ALLOW_RE = /skills-lint-allow[:\s]+([a-z][a-z0-9-]*)\s*:(?=[^\n]*[A-Za-z]{3})/gi

function allowedRulesFor(lines, i) {
  const out = new Set()
  for (const src of [lines[i], lines[i - 1]]) {
    if (!src) continue
    ALLOW_RE.lastIndex = 0
    let a
    while ((a = ALLOW_RE.exec(src)) !== null) out.add(a[1].toLowerCase())
  }
  return out
}

export function scanText(text, { rules = RULES, extraRules = [] } = {}) {
  const findings = []
  const lines = text.split(/\r?\n/)
  for (const rule of [...rules, ...extraRules]) {
    if (!rule) continue
    lines.forEach((line, i) => {
      rule.re.lastIndex = 0
      let m
      while ((m = rule.re.exec(line)) !== null) {
        if (m[0] === '') {
          rule.re.lastIndex++
          continue
        }
        if (rule.allow && rule.allow(m[0])) continue
        if (allowedRulesFor(lines, i).has(rule.id)) continue
        findings.push({
          rule: rule.id,
          severity: rule.severity,
          why: rule.why,
          line: i + 1,
          match: m[0].slice(0, 80),
          text: line.trim().slice(0, 120),
        })
      }
    })
  }
  return findings
}

export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!m) return null
  const out = {}
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (kv) out[kv[1]] = kv[2].trim()
  }
  return out
}

// Conformance with the Agent Skills spec (https://agentskills.io/specification).
// These are the SPEC's rules, not ours -- a skill that breaks them is invalid
// wherever it is installed, not merely inconsistent with this repo.
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const NAME_MAX = 64
const DESC_MAX = 1024
const BODY_MAX_LINES = 500

export function checkFrontmatter(fm, dirName, body = '') {
  const errs = []
  const err = (rule, why, match = '') => ({ rule, severity: 'error', why, line: 1, match, text: '' })
  const warn = (rule, why, match = '') => ({ rule, severity: 'warn', why, line: 1, match, text: '' })
  if (!fm) return [err('frontmatter-missing', 'A SKILL.md must open with a YAML frontmatter block.')]

  if (!fm.name) errs.push(err('frontmatter-name', 'Frontmatter needs a `name`.'))
  else {
    if (fm.name !== dirName)
      errs.push(err('frontmatter-name-mismatch', 'Spec: `name` must match the parent directory. Got "' + fm.name + '" in "' + dirName + '".', fm.name))
    if (fm.name.length > NAME_MAX)
      errs.push(err('spec-name-length', 'Spec: `name` must be 1-' + NAME_MAX + ' characters.', fm.name))
    if (!NAME_RE.test(fm.name))
      errs.push(err('spec-name-charset', 'Spec: `name` may hold only lowercase a-z, 0-9 and single hyphens -- no uppercase, no leading/trailing hyphen, no consecutive hyphens.', fm.name))
  }

  if (!fm.description) errs.push(err('frontmatter-description', 'Frontmatter needs a `description` -- it is how an agent decides to load the skill.'))
  else {
    if (fm.description.length > DESC_MAX)
      errs.push(err('spec-description-length', 'Spec: `description` must be 1-' + DESC_MAX + ' characters; this is ' + fm.description.length + '.', fm.description.slice(0, 60)))
    if (fm.description.length < 40)
      errs.push(warn('frontmatter-description-thin', 'A description under 40 chars rarely carries enough trigger signal.', fm.description))
  }

  // The whole body is loaded once a skill activates, so length is a context
  // cost paid by every user of it. The spec recommends splitting past this.
  const lines = body ? body.split(/\r?\n/).length : 0
  if (lines > BODY_MAX_LINES)
    errs.push(warn('spec-body-length', 'Spec recommends keeping SKILL.md under ' + BODY_MAX_LINES + ' lines (' + lines + ' here); move detail into references/.', String(lines)))

  return errs
}

// ---------------------------------------------------------------- manifests
// A malformed plugin.json or marketplace.json breaks installation for everyone
// while every skill in the repo still lints clean -- the skills are fine, the
// door is jammed. Pure function over parsed objects so it is testable without
// touching disk; `dirExists` is injected for the same reason.
export function checkManifests({ plugin, marketplace, dirExists = () => true }) {
  const out = []
  const err = (rule, why, match = '') => ({ rule, severity: 'error', why, line: 0, match, text: '' })
  const warn = (rule, why, match = '') => ({ rule, severity: 'warn', why, line: 0, match, text: '' })

  if (!plugin) out.push(err('manifest-plugin-missing', '.claude-plugin/plugin.json is missing or unparseable.'))
  else {
    if (!plugin.name) out.push(err('manifest-plugin-name', 'plugin.json needs a `name`.'))
    else if (!NAME_RE.test(plugin.name))
      out.push(err('manifest-plugin-name-case', 'Plugin `name` must be kebab-case (lowercase a-z0-9, single hyphens) -- other forms are rejected by downstream marketplace sync.', plugin.name))
    if (!plugin.description) out.push(warn('manifest-plugin-description', 'plugin.json has no `description`; installers show it.'))
  }

  if (!marketplace) out.push(err('manifest-marketplace-missing', '.claude-plugin/marketplace.json is missing or unparseable.'))
  else {
    if (!marketplace.name) out.push(err('manifest-marketplace-name', 'marketplace.json needs a `name`.'))
    else if (/^(org|org-provisioned|unknown)$/i.test(marketplace.name))
      out.push(err('manifest-marketplace-name-reserved', 'Marketplace name is reserved and causes the whole marketplace to be rejected by managed sync.', marketplace.name))
    if (!marketplace.owner?.name) out.push(err('manifest-marketplace-owner', 'marketplace.json needs `owner.name`.'))
    const plugins = marketplace.plugins
    if (!Array.isArray(plugins) || !plugins.length) {
      out.push(err('manifest-marketplace-plugins', 'marketplace.json needs a non-empty `plugins` array.'))
    } else {
      const seen = new Set()
      for (const [i, p] of plugins.entries()) {
        const at = 'plugins[' + i + ']'
        if (!p.name) { out.push(err('manifest-entry-name', at + ' needs a `name`.')); continue }
        if (seen.has(p.name)) out.push(err('manifest-entry-duplicate', 'Duplicate plugin name "' + p.name + '" in marketplace.', p.name))
        seen.add(p.name)
        if (typeof p.source === 'string') {
          if (p.source.includes('..'))
            out.push(err('manifest-entry-traversal', at + '.source must not contain ".." -- paths resolve from the marketplace root.', p.source))
          else if (!p.source.startsWith('./'))
            out.push(err('manifest-entry-relative', at + '.source is a relative path and must start with "./".', p.source))
          else if (!dirExists(p.source))
            out.push(err('manifest-entry-missing-dir', at + '.source points at "' + p.source + '", which does not exist in this repo.', p.source))
          // A root-sourced entry IS this plugin, so the two manifests must agree.
          if (p.source === './' && plugin?.name && p.name !== plugin.name)
            out.push(err('manifest-name-disagree', 'Entry name "' + p.name + '" must equal plugin.json name "' + plugin.name + '" when source is "./".', p.name))
        }
        if (p.version && plugin?.version && p.source === './' && p.version !== plugin.version)
          out.push(warn('manifest-version-drift', 'Entry version "' + p.version + '" disagrees with plugin.json "' + plugin.version + '".', p.version))
      }
    }
  }
  return out
}

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(md|mjs|js|py|sh|json|txt)$/i.test(entry)) out.push(p)
  }
  return out
}

/**
 * Every file this repo would ship: tracked AND untracked-but-not-ignored.
 *
 * Extracted so it can be tested. The untracked half is the whole point and is
 * exactly the kind of argument that gets "simplified" away later by someone who
 * reads `ls-files` and assumes it means what it usually means.
 */
export function repoFileList(root) {
  const list = (args) => execFileSync('git', ['ls-files', '-z', ...args], { cwd: root, maxBuffer: 1 << 28 })
    .toString().split('\0').filter(Boolean)
  // --exclude-standard keeps .gitignore honoured, so ignored trees (including
  // the gitignored codename denylist) stay out exactly as they did before.
  return [...new Set([...list([]), ...list(['--others', '--exclude-standard'])])]
}

// ---------------------------------------------------------------- self-test
// Every fixture runs THROUGH scanText -- the gate itself, never a restatement
// of it. Delete or neuter a rule and its MUST_FAIL case stops failing, which
// exits 2.

const MUST_FAIL = [
  ['abs-windows-path', 'Run `C:\\Users\\someone\\proj\\build.exe` to start.'],
  ['abs-windows-path', 'Stock clips live on T:\\Stock Video and are trimmed first.'],
  ['home-dir-path', 'Config is read from /Users/janedoe/.config/app.toml'],
  ['email-address', 'Ping realname@protonmail.com when the run finishes.'],
  ['localhost-port', 'Open http://127.0.0.1:7777 and confirm the health route.'],
  ['private-ip', 'The render box answers on 192.168.1.44 over SSH.'],
  ['credential-assignment', 'Set api_key = "abcd1234efgh5678ijkl" before launching.'],
  // Prefixed key names:  never fires between `_` and a letter, so every
  // one of these was invisible until 2026-08-21.
  ['credential-assignment', 'OPENAI_API_KEY = "abcd1234efgh5678ijkl"'],
  ['credential-assignment', 'ANTHROPIC_API_KEY: "abcd1234efgh5678ijkl"'],
  ['credential-assignment', 'MY_SECRET = "abcd1234efgh5678ijkl"'],
  ['known-token-shape', 'Export GH_TOKEN=ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'],
  ['base64-blob', 'payload: ' + 'QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVowMTIzNDU2Nzg5'.repeat(6)],
  ['reasoning-trace-marker', 'The manifest entry carried a "signature": field.'],
  ['memory-reference', 'See [[feedback_never_end_turn_broken]] before shipping.'],
  ['memory-reference', 'Read memory/project_some_thing.md for the ruling.'],
  ['workspace-doc-path', 'The contract lives in @specs/thing/plan.md and DOCKET.md.'],
  ['agent-specific', "Open that URL in Cursor's Browser and snapshot it."],
  ['agent-specific', 'Open the page in the Cursor IDE browser and take a snapshot.'],
  ['agent-specific', 'Claude Code discovers this from .claude/skills/ at startup.'],
  ['agent-specific', 'Add the rule to CLAUDE.md so every session picks it up.'],
  ['agent-specific', 'Ask ChatGPT to summarise the diff first.'],
  ['agent-specific', 'The .cursor-plugin directory carries the adapter manifest.'],
]

// Prose a portable skill legitimately contains. If any of these trip an error
// the gate is too noisy to be run -- and a gate nobody runs is no gate.
const MUST_PASS = [
  'Build the package, then open the dev server URL in a browser and screenshot it.',
  'Bind the service to a port of your choosing and read it from an env var.',
  'Store the key in an environment variable; never inline it in the skill.',
  'Read API_KEY from the environment rather than hardcoding it.',
  'The token budget is roughly 5000 for a body of this size.',
  'Run `node tools/lint.mjs` and `npm run build` from the repo root.',
  'Contact support@example.com for the schema.',
  'Use a ratio of 16:9 at 1920x1080 for every master.',
  'The 8GB card cannot hold two diffusion models at once; free one first.',
  'Reference `./scripts/setup.py` relative to the skill directory.',
  'Drive the editor over its scripting socket, then render and look at the result.',
  'Open the running app in a browser tool and capture a screenshot.',
  // Ordinary craft words that an over-broad vendor rule ate on 2026-08-21.
  // Every one of these is a real sentence a skill here might legitimately
  // contain; each pins one word the rule must NOT claim.
  'Place the cursor at the end of the line before inserting.',
  'A bare CR returns the cursor without advancing a line.',
  'Hide the mouse cursor during playback capture.',
  'The cursor blinks in the input field; assert it is focused.',
  'Use a windsurf-style board silhouette for the logo.',
  'The copilot seat is visible in the cockpit shot.',
  'Claude shadows fall across the frame at golden hour.',
  'Set the anthropic principle aside; this is about lighting.',
]

// Frontmatter cases run through checkFrontmatter -- the spec half of the gate,
// which scanText never touches. [expectedRule|null, frontmatter, dirName, body]
const FM_CASES = [
  ['spec-name-charset',      { name: 'UI-Validate', description: 'x'.repeat(60) }, 'UI-Validate', ''],
  ['spec-name-charset',      { name: 'ui--validate', description: 'x'.repeat(60) }, 'ui--validate', ''],
  ['spec-name-charset',      { name: '-ui-validate', description: 'x'.repeat(60) }, '-ui-validate', ''],
  ['spec-name-length',       { name: 'a'.repeat(65), description: 'x'.repeat(60) }, 'a'.repeat(65), ''],
  ['spec-description-length', { name: 'ok-skill', description: 'x'.repeat(1025) }, 'ok-skill', ''],
  ['frontmatter-name-mismatch', { name: 'ok-skill', description: 'x'.repeat(60) }, 'other-dir', ''],
  ['frontmatter-missing',    null, 'ok-skill', ''],
  ['frontmatter-description', { name: 'ok-skill' }, 'ok-skill', ''],
  // must produce NO error: a fully spec-conformant skill
  [null, { name: 'ui-validate', description: 'x'.repeat(200) }, 'ui-validate', '# body\n'],
  [null, { name: 'a', description: 'x'.repeat(60) }, 'a', ''],
  [null, { name: 'low-vram-video', description: 'x'.repeat(1024) }, 'low-vram-video', ''],
]

// Manifest cases run through checkManifests. [expectedRule|null, input]
const GOOD_PLUGIN = { name: 'craft', description: 'd', version: '0.1.0' }
const GOOD_MARKET = { name: 'mkt', owner: { name: 'o' }, plugins: [{ name: 'craft', source: './' }] }
const MANIFEST_CASES = [
  ['manifest-plugin-missing', { plugin: null, marketplace: GOOD_MARKET }],
  ['manifest-marketplace-missing', { plugin: GOOD_PLUGIN, marketplace: null }],
  ['manifest-plugin-name-case', { plugin: { ...GOOD_PLUGIN, name: 'Craft_Skills' }, marketplace: { ...GOOD_MARKET, plugins: [{ name: 'Craft_Skills', source: './' }] } }],
  ['manifest-marketplace-owner', { plugin: GOOD_PLUGIN, marketplace: { name: 'mkt', plugins: [{ name: 'craft', source: './' }] } }],
  ['manifest-marketplace-name-reserved', { plugin: GOOD_PLUGIN, marketplace: { ...GOOD_MARKET, name: 'org' } }],
  ['manifest-marketplace-plugins', { plugin: GOOD_PLUGIN, marketplace: { name: 'mkt', owner: { name: 'o' }, plugins: [] } }],
  ['manifest-entry-duplicate', { plugin: GOOD_PLUGIN, marketplace: { ...GOOD_MARKET, plugins: [{ name: 'craft', source: './' }, { name: 'craft', source: './' }] } }],
  ['manifest-entry-traversal', { plugin: GOOD_PLUGIN, marketplace: { ...GOOD_MARKET, plugins: [{ name: 'craft', source: '../elsewhere' }] } }],
  ['manifest-entry-relative', { plugin: GOOD_PLUGIN, marketplace: { ...GOOD_MARKET, plugins: [{ name: 'craft', source: 'plugins/craft' }] } }],
  ['manifest-entry-missing-dir', { plugin: GOOD_PLUGIN, marketplace: { ...GOOD_MARKET, plugins: [{ name: 'craft', source: './nope' }] }, dirExists: () => false }],
  ['manifest-name-disagree', { plugin: GOOD_PLUGIN, marketplace: { ...GOOD_MARKET, plugins: [{ name: 'other', source: './' }] } }],
  // must produce NO error
  [null, { plugin: GOOD_PLUGIN, marketplace: GOOD_MARKET }],
  [null, { plugin: GOOD_PLUGIN, marketplace: { ...GOOD_MARKET, plugins: [{ name: 'craft', source: './plugins/craft' }] } }],
]

// Rules that WARN rather than fail. MUST_FAIL asserts on errors only, so a
// warn rule would otherwise ship completely unexercised.
const WARN_CASES = [
  ['cross-skill-reference', 'See [`ui-validate`](../ui-validate/SKILL.md) for the loop.'],
  ['bare-port', 'The dev server answers on :5173 by default.'],
]
const WARN_CLEAN = [
  'Full catalog: [references/catalog.md](references/catalog.md).',
  'Run [the script](scripts/extract.py) against the export.',
]

// The inline allow, both directions. An allow that silences everything, or one
// that works without a reason, would be worse than no allow at all.
const ALLOW_CASES = [
  // [expectSilenced, text]
  [true, '<!-- skills-lint-allow reasoning-trace-marker: teaching the grep -->\ngrep -rlnE \'redacted_thinking\' .'],
  [true, 'grep for redacted_thinking <!-- skills-lint-allow reasoning-trace-marker: same line -->'],
  // no reason given -> not an allow
  [false, '<!-- skills-lint-allow reasoning-trace-marker -->\ngrep redacted_thinking .'],
  // Punctuation is not a reason. The original `\S` accepted every one of these,
  // so "a reason is REQUIRED" silenced rules for anyone who typed a colon.
  [false, '<!-- skills-lint-allow reasoning-trace-marker: -->\ngrep redacted_thinking .'],
  [false, '<!-- skills-lint-allow reasoning-trace-marker: - -->\ngrep redacted_thinking .'],
  [false, '<!-- skills-lint-allow reasoning-trace-marker: . -->\ngrep redacted_thinking .'],
  // allows one rule, must not silence a different one
  [false, '<!-- skills-lint-allow reasoning-trace-marker: only this -->\nSee C:\\Users\\bob\\x.txt'],
  // must not reach two lines down
  [false, '<!-- skills-lint-allow reasoning-trace-marker: too far -->\nfiller line\ngrep redacted_thinking .'],
]

// The denylist is loaded from a gitignored file, so these run against a
// synthetic list -- the boundary behaviour is what matters, not the terms.
// `\b` used to be the boundary, which never fires inside snake_case.
const DENY_CASES = [
  [true, 'project_alpha_sse_conn_exhaustion'],
  [true, 'see alpha-verify output'],
  [true, 'read gamma/src/main.rs'],
  [true, 'ALPHA in caps'],
  [false, 'the alphabet was printed on the post'],
  [false, 'multiple betas in the graph'],
  [false, 'whispered quietly'],
]

function selfTest() {
  let broken = 0
  const deny = [denylistRule(['alpha', 'beta', 'gamma'])]
  for (const [shouldCatch, text] of DENY_CASES) {
    const hit = scanText(text, { extraRules: deny }).some((f) => f.rule === 'private-codename')
    if (hit !== shouldCatch) {
      console.error('SELF-TEST BROKEN: denylist ' + (shouldCatch ? 'missed' : 'false-positived on') + ': ' + text)
      broken++
    }
  }
  for (const [expectSilenced, text] of ALLOW_CASES) {
    const errs = scanText(text).filter((f) => f.severity === 'error')
    const silenced = errs.length === 0
    if (silenced !== expectSilenced) {
      console.error(
        'SELF-TEST BROKEN: inline-allow ' + (expectSilenced ? 'failed to silence' : 'silenced too much') +
        ' -- ' + JSON.stringify(text.slice(0, 80))
      )
      broken++
    }
  }
  for (const [expectRule, text] of WARN_CASES) {
    const hits = scanText(text)
    if (!hits.some((h) => h.rule === expectRule && h.severity === 'warn')) {
      console.error('SELF-TEST BROKEN: warn rule "' + expectRule + '" did not fire on: ' + text.slice(0, 70))
      broken++
    }
    if (hits.some((h) => h.severity === 'error')) {
      console.error('SELF-TEST BROKEN: warn-level case escalated to an error: ' + text.slice(0, 70))
      broken++
    }
  }
  for (const text of WARN_CLEAN) {
    const hits = scanText(text).filter((h) => h.rule === 'cross-skill-reference')
    if (hits.length) {
      console.error('SELF-TEST BROKEN: same-directory link flagged as cross-skill: ' + text.slice(0, 70))
      broken++
    }
  }
  for (const [expectRule, input] of MANIFEST_CASES) {
    const hits = checkManifests(input).filter((f) => f.severity === 'error')
    if (expectRule === null) {
      if (hits.length) {
        console.error('SELF-TEST BROKEN: valid manifests rejected by ' + hits.map((h) => h.rule).join(', '))
        broken++
      }
    } else if (!hits.some((h) => h.rule === expectRule)) {
      console.error('SELF-TEST BROKEN: manifest rule "' + expectRule + '" did not fire')
      broken++
    }
  }
  for (const [expectRule, fm, dir, body] of FM_CASES) {
    const hits = checkFrontmatter(fm, dir, body).filter((f) => f.severity === 'error')
    if (expectRule === null) {
      if (hits.length) {
        console.error('SELF-TEST BROKEN: conformant frontmatter rejected by ' + hits.map((h) => h.rule).join(', ') + ': ' + JSON.stringify(fm).slice(0, 70))
        broken++
      }
    } else if (!hits.some((h) => h.rule === expectRule)) {
      console.error('SELF-TEST BROKEN: rule "' + expectRule + '" did not fire on: ' + JSON.stringify(fm).slice(0, 70))
      broken++
    }
  }
  for (const [expectRule, text] of MUST_FAIL) {
    const hits = scanText(text).filter((f) => f.severity === 'error')
    if (!hits.some((h) => h.rule === expectRule)) {
      console.error('SELF-TEST BROKEN: rule "' + expectRule + '" did not fire on known-bad input:\n    ' + text.slice(0, 90))
      broken++
    }
  }
  for (const text of MUST_PASS) {
    const hits = scanText(text).filter((f) => f.severity === 'error')
    if (hits.length) {
      console.error('SELF-TEST BROKEN: clean prose tripped ' + hits.map((h) => h.rule).join(', ') + ':\n    ' + text.slice(0, 90))
      broken++
    }
  }
  // The repo-wide file list must include files that are not yet tracked.
  //
  // This was a real hole: an identical file carrying a machine path, a
  // credential and an email produced 0 errors while untracked and 4 the moment
  // it was staged, so a new file's first lint run was worthless -- the gate
  // could only see it after you had already decided to commit. Fifty-five
  // freshly authored files were sitting untracked when it was found, and two of
  // them were leaking (a private codename and LAN addresses).
  //
  // Run against a throwaway repo rather than this one, so the case proves the
  // behaviour instead of restating today's working tree.
  {
    let dir
    try {
      dir = mkdtempSync(join(tmpdir(), 'lint-filelist-'))
      const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' })
      git('init', '-q')
      writeFileSync(join(dir, '.gitignore'), 'ignored.md\n')
      writeFileSync(join(dir, 'tracked.md'), 'x\n')
      writeFileSync(join(dir, 'untracked.md'), 'x\n')
      writeFileSync(join(dir, 'ignored.md'), 'x\n')
      git('add', 'tracked.md', '.gitignore')
      const files = repoFileList(dir)
      const want = [
        ['tracked.md', true, 'a tracked file'],
        ['untracked.md', true, 'an UNTRACKED file -- the whole point of this list'],
        ['ignored.md', false, 'a gitignored file'],
      ]
      for (const [name, expected, what] of want) {
        if (files.includes(name) !== expected) {
          console.error(`SELF-TEST BROKEN: repoFileList ${expected ? 'omitted' : 'included'} ${what} (${name})`)
          broken++
        }
      }
    } catch (e) {
      // A machine with no usable git cannot run this case. Say so loudly rather
      // than passing quietly: a check that could not run is not a check that
      // passed.
      console.error('SELF-TEST BROKEN: could not exercise repoFileList (' + e.message.slice(0, 80) + ')')
      broken++
    }
  }

  if (broken) {
    console.error('\nself-test: ' + broken + ' failure(s) -- the gate is not measuring what it claims.')
    process.exit(2)
  }
  console.log(
    'self-test: ' + MUST_FAIL.length + ' known-bad caught, ' + MUST_PASS.length +
    ' clean samples passed, ' + FM_CASES.length + ' spec-conformance, ' +
    MANIFEST_CASES.length + ' manifest, ' + ALLOW_CASES.length +
    ' inline-allow and ' + DENY_CASES.length + ' denylist-boundary cases correct, ' +
    'repo file list covers tracked + untracked. Gate is live.'
  )
  process.exit(0)
}

// ---------------------------------------------------------------- main

function main() {
  const args = process.argv.slice(2)
  if (args.includes('--self-test')) return selfTest()
  const asJson = args.includes('--json')

  const deny = denylistRule(loadDenylist())
  const extraRules = deny ? [deny] : []

  if (!existsSync(SKILLS_DIR)) {
    console.error('no skills/ directory at ' + SKILLS_DIR)
    process.exit(2)
  }

  const skillDirs = readdirSync(SKILLS_DIR).filter((d) => statSync(join(SKILLS_DIR, d)).isDirectory())
  const report = []

  for (const dir of skillDirs) {
    const skillMd = join(SKILLS_DIR, dir, 'SKILL.md')
    if (!existsSync(skillMd)) {
      report.push({
        file: 'skills/' + dir,
        findings: [{ rule: 'skill-md-missing', severity: 'error', why: 'Every skill directory needs a SKILL.md.', line: 0, match: '', text: '' }],
      })
      continue
    }
    for (const file of walk(join(SKILLS_DIR, dir))) {
      const text = readFileSync(file, 'utf8')
      const findings = scanText(text, { extraRules })
      if (basename(file) === 'SKILL.md') findings.push(...checkFrontmatter(parseFrontmatter(text), dir, text))
      if (findings.length) report.push({ file: relative(ROOT, file).replace(/\\/g, '/'), findings })
    }
  }

  // EVERY OTHER COMMITTED FILE. Scanning only skills/ was a real hole: a
  // codename reached the published CHANGELOG.md, written there by a changeset
  // that quoted an identifier as an example, and nothing looked. Anything this
  // repo ships can leak, not just the skills.
  //
  // The rule split is deliberate. Privacy rules -- codenames, credentials,
  // machine paths, emails -- apply everywhere, because none of those may ship
  // under any circumstances. `agent-specific` and `cross-skill-reference` stay
  // scoped to skill BODIES, because README and AGENTS.md legitimately name
  // vendors: they document which client the plugin packaging targets, and that
  // is the one place a vendor name is the correct thing to write.
  const SKILL_ONLY = new Set(['agent-specific', 'cross-skill-reference'])
  const repoWideRules = RULES.filter((r) => !SKILL_ONLY.has(r.id))

  // This file necessarily contains every pattern it hunts -- that is what a
  // known-bad corpus IS -- so the pattern rules cannot apply to it. The
  // DENYLIST still does, and deliberately: a real codename hid in this file's
  // own comments and self-test data until the repo-wide scan was added, so the
  // one rule that must never be waived here is the one about codenames.
  const SELF = 'tools/lint.mjs'
  const selfRules = [] // no pattern rules; denylist comes through extraRules
  // TRACKED **AND UNTRACKED**. Listing only tracked files meant a brand-new file
  // was invisible to this gate until after it had been staged -- so the run that
  // could still have stopped it saw nothing, and the first honest reading came
  // once you had already decided to commit.
  //
  // Measured, not theorised: one file carrying a machine path, a credential and
  // an email produced 0 errors while untracked and 4 the moment it entered the
  // index. Fifty-five new trigger sets were sitting untracked when this was
  // found, all of them reported clean by a run that had never opened them.
  //
  // `--exclude-standard` keeps .gitignore honoured, so ignored trees (and the
  // gitignored codename denylist) stay out exactly as before.
  let tracked = []
  try {
    tracked = repoFileList(ROOT)
  } catch {
    report.push({ file: '(repo)', findings: [{ rule: 'repo-scan-unavailable', severity: 'warn', why: 'git ls-files failed, so only skills/ was scanned; committed files outside it were NOT checked.', line: 0, match: '', text: '' }] })
  }
  const SCANNABLE = /\.(md|mjs|js|json|txt|ya?ml)$/i
  for (const rel of tracked) {
    if (rel.startsWith('skills/')) continue // already scanned above, with every rule
    if (!SCANNABLE.test(rel)) continue
    const p = join(ROOT, rel)
    if (!existsSync(p)) continue
    const rules = rel === SELF ? selfRules : repoWideRules
    const findings = scanText(readFileSync(p, 'utf8'), { rules, extraRules })
    if (findings.length) report.push({ file: rel, findings })
  }

  // Manifests: the door the skills ship through.
  const readJson = (rel) => {
    const p = join(ROOT, rel)
    if (!existsSync(p)) return null
    try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null }
  }
  const manifestFindings = checkManifests({
    plugin: readJson('.claude-plugin/plugin.json'),
    marketplace: readJson('.claude-plugin/marketplace.json'),
    dirExists: (src) => existsSync(join(ROOT, src.replace(/^\.\//, '') || '.')),
  })
  if (manifestFindings.length) report.push({ file: '.claude-plugin/', findings: manifestFindings })

  const errors = report.flatMap((r) => r.findings.filter((f) => f.severity === 'error'))
  const warns = report.flatMap((r) => r.findings.filter((f) => f.severity === 'warn'))

  if (asJson) {
    console.log(JSON.stringify({ skills: skillDirs.length, errors: errors.length, warnings: warns.length, report }, null, 2))
  } else {
    for (const { file, findings } of report) {
      console.log('\n' + file)
      for (const f of findings) {
        const tag = f.severity === 'error' ? 'ERROR' : 'warn '
        console.log('  ' + tag + ' ' + (f.line ? 'L' + f.line : '   ') + ' [' + f.rule + '] ' + (f.match ? '"' + f.match + '"' : ''))
        console.log('        ' + f.why)
      }
    }
    console.log('\n' + skillDirs.length + ' skill(s) scanned -- ' + errors.length + ' error(s), ' + warns.length + ' warning(s)')
    if (!errors.length) console.log('clean: no machine paths, credentials, or private references.')
  }
  process.exit(errors.length ? 1 : 0)
}

if (process.argv[1] && /lint\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) main()
