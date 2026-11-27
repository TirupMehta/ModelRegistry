/**
 * scripts/lib/ts-load.js
 * Loads the registry's TypeScript data and library modules from a plain Node
 * script, without a build step. Resolves "@/..." and relative imports, transpiles
 * on demand, and caches modules. Only for pure modules (data and lib): anything
 * that imports Next or React is out of scope and throws.
 */
const fs = require("fs")
const path = require("path")
const vm = require("vm")
const ts = require("typescript")

const ROOT = path.resolve(__dirname, "..", "..")
const cache = new Map()

function resolve(from, spec) {
  const base = spec.startsWith("@/") ? path.join(ROOT, spec.slice(2)) : path.resolve(path.dirname(from), spec)
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  }
  throw new Error(`ts-load: cannot resolve "${spec}" from ${path.relative(ROOT, from)}`)
}

function loadFile(file) {
  const key = path.normalize(file)
  if (cache.has(key)) return cache.get(key).exports
  const source = fs.readFileSync(key, "utf8")
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const module_ = { exports: {} }
  cache.set(key, module_)
  const localRequire = (spec) => {
    if (spec.startsWith("@/") || spec.startsWith(".")) return loadFile(resolve(key, spec))
    throw new Error(`ts-load: ${path.relative(ROOT, key)} imports "${spec}", which a pure data or library module must not`)
  }
  vm.runInNewContext(
    output,
    {
      module: module_,
      exports: module_.exports,
      require: localRequire,
      console,
      process,
      // Web globals the libraries legitimately use. Without these, a vm context
      // has the language intrinsics only, and `new URL(...)` throws.
      URL,
      URLSearchParams,
      TextEncoder,
      TextDecoder,
      structuredClone,
    },
    { filename: key },
  )
  return module_.exports
}

/** Loads a module by its path relative to the repository root, e.g. load("data/models.ts"). */
function load(relative) {
  return loadFile(path.join(ROOT, relative))
}

module.exports = { load, ROOT }
