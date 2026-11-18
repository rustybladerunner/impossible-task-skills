// Tests for tools/lint.mjs, run by `node --test`.
//
// Bad inputs are assembled from fragments at runtime. lint.mjs scans every
// tracked .mjs file (this one included) with its privacy rules, so a literal
// machine path or vendor name here would fail the very gate under test.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { scanText, checkFrontmatter, parseFrontmatter, checkManifests } from './lint.mjs'

const LINT = join(dirname(fileURLToPath(import.meta.url)), 'lint.mjs')
const DESC = 'Use when a build keeps failing and you need a method for narrowing the cause.'

const VENDOR = ['Run this in ', 'Claude', ' ', 'Code', ' and wait.'].join('')
const DRIVE = ['Open ', 'C', ':\\', 'Users', '\\someone', '\\notes.txt', ' first.'].join('')
const EMAIL = ['Ask ', 'jane.doe', '@', 'protonmail', '.com', ' for access.'].join('')
const TOKEN = ['Export GH_TOKEN=', 'ghp', '_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'].join('')

const errorRules = (text) => scanText(text).filter((f) => f.severity === 'error').map((f) => f.rule)

test('scanText flags vendor names, machine paths, emails and tokens', () => {
  assert.ok(errorRules(VENDOR).includes('agent-specific'))
  assert.ok(errorRules(DRIVE).includes('abs-windows-path'))
  assert.ok(errorRules(EMAIL).includes('email-address'))
  assert.ok(errorRules(TOKEN).includes('known-token-shape'))
})

test('scanText passes ordinary portable prose', () => {
  assert.deepEqual(errorRules('Place the cursor at the end of the line, then open a browser tool.'), [])
  assert.deepEqual(errorRules('Contact support@example.com for the schema.'), [])
})

test('inline allow needs a real reason', () => {
  const quoted = 'grep redacted_' + 'thinking .'
  assert.deepEqual(errorRules('<!-- skills-lint-allow reasoning-trace-marker: teaching the grep -->\n' + quoted), [])
  assert.ok(errorRules('<!-- skills-lint-allow reasoning-trace-marker: -->\n' + quoted).includes('reasoning-trace-marker'))
})

test('frontmatter: malformed or missing is an error, conformant is clean', () => {
  const rules = (fm, dir) => checkFrontmatter(fm, dir, '').filter((f) => f.severity === 'error').map((f) => f.rule)
  assert.deepEqual(rules(null, 'a-skill'), ['frontmatter-missing'])
  assert.ok(rules({ description: DESC }, 'a-skill').includes('frontmatter-name'))
  assert.ok(rules({ name: 'a-skill' }, 'a-skill').includes('frontmatter-description'))
  assert.ok(rules({ name: 'Bad_Name', description: DESC }, 'Bad_Name').includes('spec-name-charset'))
  assert.ok(rules({ name: 'a-skill', description: DESC }, 'other-dir').includes('frontmatter-name-mismatch'))
  assert.deepEqual(rules({ name: 'a-skill', description: DESC }, 'a-skill'), [])
})

test('parseFrontmatter reads a block and rejects text without one', () => {
  assert.deepEqual(parseFrontmatter('---\nname: x\ndescription: y\n---\nbody'), { name: 'x', description: 'y' })
  assert.equal(parseFrontmatter('no frontmatter here'), null)
})

test('checkManifests: good passes, reserved name and traversal fail', () => {
  const plugin = { name: 'craft', description: 'd' }
  const market = { name: 'mkt', owner: { name: 'o' }, plugins: [{ name: 'craft', source: './' }] }
  const errs = (i) => checkManifests(i).filter((f) => f.severity === 'error').map((f) => f.rule)
  assert.deepEqual(errs({ plugin, marketplace: market }), [])
  assert.ok(errs({ plugin, marketplace: { ...market, name: 'org' } }).includes('manifest-marketplace-name-reserved'))
  assert.ok(errs({ plugin, marketplace: { ...market, plugins: [{ name: 'craft', source: '../x' }] } }).includes('manifest-entry-traversal'))
})

// End to end: the real CLI against throwaway repos. lint.mjs derives its root
// from its own location, so it is copied next to the fixture skills.
function runLint(skills) {
  const dir = mkdtempSync(join(tmpdir(), 'skills-lint-e2e-'))
  try {
    // lint.mjs fails closed when it cannot list the repo's files, so the
    // fixture has to be a real repository, not just a folder.
    const init = spawnSync('git', ['init', '-q'], { cwd: dir, encoding: 'utf8' })
    assert.equal(init.status, 0, init.stderr)
    mkdirSync(join(dir, 'tools'))
    copyFileSync(LINT, join(dir, 'tools', 'lint.mjs'))
    mkdirSync(join(dir, '.claude-plugin'))
    writeFileSync(join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'craft', description: 'd' }))
    writeFileSync(join(dir, '.claude-plugin', 'marketplace.json'),
      JSON.stringify({ name: 'mkt', owner: { name: 'o' }, plugins: [{ name: 'craft', source: './' }] }))
    for (const [name, content] of Object.entries(skills)) {
      mkdirSync(join(dir, 'skills', name), { recursive: true })
      writeFileSync(join(dir, 'skills', name, 'SKILL.md'), content)
    }
    return spawnSync(process.execPath, [join(dir, 'tools', 'lint.mjs')], { cwd: dir, encoding: 'utf8' })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

const skillMd = (name, body) => `---\nname: ${name}\ndescription: ${DESC}\n---\n# ${name}\n\n${body}\n`

test('CLI exits 0 on a clean skill', () => {
  const r = runLint({ 'clean-skill': skillMd('clean-skill', 'Name the capability, not the product.') })
  assert.equal(r.status, 0, r.stdout + r.stderr)
})

test('CLI exits 1 when a SKILL.md names a vendor product', () => {
  const r = runLint({ 'vendor-skill': skillMd('vendor-skill', VENDOR) })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stdout, /agent-specific/)
})

test('CLI exits 1 on a leaked machine path', () => {
  const r = runLint({ 'path-skill': skillMd('path-skill', DRIVE) })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stdout, /abs-windows-path/)
})

test('CLI exits 1 on malformed frontmatter', () => {
  const r = runLint({ 'broken-skill': '# no frontmatter at all\n\nbody\n' })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stdout, /frontmatter-missing/)
})

test('CLI exits 1 when the name does not match its directory', () => {
  const r = runLint({ 'dir-name': skillMd('other-name', 'Fine body.') })
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stdout, /frontmatter-name-mismatch/)
})
