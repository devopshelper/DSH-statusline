// Register or unregister a bundle in a DSH profile manifest.
//
// `dsh plugin --profile <p> add <pkg>` only manages the profile's dependencies
// (it forwards to pnpm). A profile activates a plugin bundle through
// `dsh.profile.bundles` in the same package.json, so installing a bundle is
// two steps and this is the second one.
//
// Usage: node scripts/register.mjs <profileDir> <packageName> add|remove

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [profileDir, packageName, action] = process.argv.slice(2)

if (!profileDir || !packageName || (action !== 'add' && action !== 'remove')) {
  console.error('usage: node scripts/register.mjs <profileDir> <packageName> add|remove')
  process.exit(2)
}

const manifestPath = join(profileDir, 'package.json')
const raw = readFileSync(manifestPath, 'utf8')
// Tolerate a UTF-8 BOM: Windows editors and PowerShell's Set-Content can add
// one, and JSON.parse rejects it as an unexpected token.
const manifest = JSON.parse(raw.replace(/^\uFEFF/, ''))

manifest.dsh = manifest.dsh ?? {}
manifest.dsh.profile = manifest.dsh.profile ?? {}

const bundles = Array.isArray(manifest.dsh.profile.bundles) ? manifest.dsh.profile.bundles : []
const registered = bundles.includes(packageName)

if (action === 'add' && registered) {
  console.log(`already registered: ${packageName}`)
  process.exit(0)
}
if (action === 'remove' && !registered) {
  console.log(`not registered: ${packageName}`)
  process.exit(0)
}

manifest.dsh.profile.bundles = action === 'add'
  ? [...bundles, packageName]
  : bundles.filter((name) => name !== packageName)

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`${action === 'add' ? 'registered' : 'unregistered'}: ${packageName}`)
