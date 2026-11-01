// Linting setup. Next.js 16 removed `next lint`, so we run the ESLint CLI
// directly (`npm run lint`) with Next's recommended rule set, which also
// covers React and React Hooks mistakes.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', '.vercel/**']),
]);

export default eslintConfig;
