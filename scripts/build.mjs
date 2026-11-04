// Splice the vendored portable stylesheet into the client bundle.
//
// The runtime has no build step: client.js is committed and loaded directly by
// the DSH Client module loader. This script only exists so `styles/statusbar.css`
// stays the editable source of truth instead of living as a 22 kB string literal
// buried in client.js.
//
// Run: node scripts/build.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PLACEHOLDER = '__SB_CSS__'

const css = readFileSync(join(root, 'styles', 'statusbar.css'), 'utf8')
const source = readFileSync(join(root, 'client.src.js'), 'utf8')

if (!source.includes(PLACEHOLDER)) {
  throw new Error(`client.src.js has no ${PLACEHOLDER} placeholder to splice into`)
}

// JSON.stringify is the whole trick: it produces a valid double-quoted JS
// string literal. Serializing the CSS any other way (PowerShell's ConvertTo-Json
// among them) can wrap it as {"value": "..."}, which turns the stylesheet into
// "[object Object]" at runtime and silently drops every rule.
const output = source.replace(PLACEHOLDER, JSON.stringify(css))

writeFileSync(join(root, 'client.js'), output)
console.log(`client.js written — ${output.length} chars, ${css.length} chars of CSS spliced`)
