import { FlatCompat } from "@eslint/eslintrc"

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Datasets and API payloads legitimately use `any`-ish shapes in a
      // couple of scripts; Next's default is enough elsewhere.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // Maintenance scripts are plain CommonJS Node programs run directly
    // with node - ESM imports and TS types don't apply there.
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
]

export default eslintConfig
