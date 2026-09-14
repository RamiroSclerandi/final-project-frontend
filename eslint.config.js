import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const supabaseImportRestriction = {
  name: '@supabase/supabase-js',
  message:
    'Import the Supabase client only from shared/api/supabase.ts or a feature infrastructure module.',
}

const componentLayerRestriction = {
  patterns: [
    {
      group: ['../infrastructure', '../infrastructure/*'],
      message:
        'Presentational components must not import infrastructure directly.',
    },
    {
      group: ['../application', '../application/*'],
      message:
        'Presentational components must not import application hooks directly; use a container.',
    },
  ],
}

export default tseslint.config(
  { ignores: ['dist', '.supabase-backend'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // D-1: Supabase access is confined to shared/api and feature infrastructure.
      'no-restricted-imports': [
        'error',
        { paths: [supabaseImportRestriction] },
      ],
    },
  },
  {
    // The one place allowed to hold the Supabase client, plus each feature's
    // infrastructure layer (matched by directory name, features don't exist yet),
    // plus integration tests (D-6), which build their own throwaway
    // service-role/anon clients against the real local stack.
    files: [
      'src/shared/api/**/*.{ts,tsx}',
      'src/features/*/infrastructure/**/*.{ts,tsx}',
      'tests/integration/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    // Presentational components take props only: no infrastructure or
    // application-layer imports (D-1's container/presentational boundary).
    files: ['src/features/*/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', componentLayerRestriction],
    },
  },
)
